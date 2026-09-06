import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { supabase } from '@/lib/supabaseClient';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { hotel, destination, travellers, days, checkInDate, checkOutDate } = body;

    if (!hotel || !travellers || !days) {
      return NextResponse.json({ error: 'Missing required trip details' }, { status: 400 });
    }

    // Security Check: Recalculate cost on server
    const pricePerNight = hotel.price || hotel.price_per_night || 0;
    const accommodationCost = pricePerNight * Math.ceil(travellers / 2) * days;
    const amountInPaise = Math.round(accommodationCost * 100);

    if (amountInPaise <= 0) {
      return NextResponse.json({ error: 'Invalid accommodation cost' }, { status: 400 });
    }

    // 1. Create a Draft in Supabase
    const { data: bookingDraft, error: dbError } = await supabase
      .from('protected_bookings')
      .insert({
        hotel_id: hotel.id,
        hotel_snapshot: hotel,
        destination,
        travellers,
        nights: days,
        rooms: Math.ceil(travellers / 2),
        amount_paise: amountInPaise,
        currency: 'INR',
        status: 'PAYMENT_PENDING',
        check_in_date: checkInDate || null,
        check_out_date: checkOutDate || null,
      })
      .select('id')
      .single();

    if (dbError || !bookingDraft) {
      console.error('Database Error:', dbError);
      return NextResponse.json({ error: 'Failed to create booking draft' }, { status: 500 });
    }

    // 2. Create Razorpay Test Order
    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_${bookingDraft.id}`,
    };

    const order = await razorpay.orders.create(options);

    if (!order || !order.id) {
      return NextResponse.json({ error: 'Failed to create Razorpay order' }, { status: 500 });
    }

    // 3. Update Supabase with Razorpay Order ID
    await supabase
      .from('protected_bookings')
      .update({ razorpay_order_id: order.id })
      .eq('id', bookingDraft.id);

    return NextResponse.json({
      success: true,
      booking_id: bookingDraft.id,
      razorpay_order_id: order.id,
      amount_paise: amountInPaise,
      currency: 'INR'
    });

  } catch (error: any) {
    console.error('Create Order Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

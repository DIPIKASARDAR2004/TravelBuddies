import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, booking_id } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !booking_id) {
      return NextResponse.json({ error: 'Missing payment verification details' }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET || '';

    // Verify HMAC Signature as per Razorpay docs
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      console.error('Signature mismatch');
      
      // Update DB to PAYMENT_FAILED
      await supabase
        .from('protected_bookings')
        .update({ status: 'PAYMENT_FAILED' })
        .eq('id', booking_id);
        
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    // Signature matches, mark as PROTECTED
    const { error: updateError } = await supabase
      .from('protected_bookings')
      .update({ 
        status: 'PROTECTED',
        razorpay_payment_id: razorpay_payment_id
      })
      .eq('id', booking_id)
      .eq('razorpay_order_id', razorpay_order_id);

    if (updateError) {
      console.error('Database update error:', updateError);
      return NextResponse.json({ error: 'Failed to update booking status' }, { status: 500 });
    }

    return NextResponse.json({ success: true, status: 'PROTECTED' });

  } catch (error: any) {
    console.error('Verification Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const bookingId = params.id;

    if (!bookingId) {
      return NextResponse.json({ error: 'Missing booking ID' }, { status: 400 });
    }

    // Check if the booking is currently PROTECTED
    const { data: booking, error: fetchError } = await supabase
      .from('protected_bookings')
      .select('status')
      .eq('id', bookingId)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.status !== 'PROTECTED') {
      return NextResponse.json({ error: 'Only PROTECTED bookings can be released' }, { status: 400 });
    }

    // Simulate the release by updating the DB status
    const { error: updateError } = await supabase
      .from('protected_bookings')
      .update({ status: 'RELEASED' })
      .eq('id', bookingId);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to release booking' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      status: 'RELEASED',
      message: 'Payment Released — Simulated' 
    });

  } catch (error: any) {
    console.error('Release Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

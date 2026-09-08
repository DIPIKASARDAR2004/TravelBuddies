import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: bookingId } = await params;
    
    // Attempt to parse the dispute reason from the request body
    let disputeReason = 'DENIED_ENTRY';
    try {
      const body = await request.json();
      if (body.reason) {
        disputeReason = body.reason;
      }
    } catch {
      // Ignore JSON parse errors, default reason applies
    }

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
      return NextResponse.json({ error: 'Only PROTECTED bookings can be disputed' }, { status: 400 });
    }

    // Update the booking status to DISPUTED to freeze settlement
    const { error: updateError } = await supabase
      .from('protected_bookings')
      .update({ 
        status: 'DISPUTED',
        dispute_reason: disputeReason
      })
      .eq('id', bookingId);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update booking status to disputed' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      status: 'DISPUTED',
      message: 'Booking marked as disputed. Payout frozen.' 
    });

  } catch (error: any) {
    console.error('Dispute Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/utils/errorUtils";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { razorpayClient as razorpay } from "@/lib/services/razorpay";
import { createSimulatedRefundId } from "@/lib/checkout/serverUtils";
import { ProtectedBookingStatus } from "@/types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface CancellationBookingRow {
  status: ProtectedBookingStatus;
  razorpay_payment_id: string | null;
  amount_paise: number;
}

export async function POST(_request: Request, { params }: RouteContext) {
  try {
    const { id: bookingId } = await params;
    const supabase = await createSupabaseServerClient();

    if (!bookingId) {
      return NextResponse.json({ error: "Missing booking ID" }, { status: 400 });
    }

    const { data: booking, error: fetchError } = await supabase
      .from("protected_bookings")
      .select("status, razorpay_payment_id, amount_paise")
      .eq("id", bookingId)
      .single<CancellationBookingRow>();

    if (fetchError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.status !== "PROTECTED") {
      return NextResponse.json({ error: "Only PROTECTED bookings can be cancelled and refunded" }, { status: 400 });
    }

    await supabase.from("protected_bookings").update({ status: "CANCELLED" }).eq("id", bookingId);
    await supabase.from("protected_bookings").update({ status: "REFUND_PENDING" }).eq("id", bookingId);

    let refundId: string | null = null;

    if (booking.razorpay_payment_id) {
      try {
        const refund = await razorpay.payments.refund(booking.razorpay_payment_id, {
          amount: booking.amount_paise,
          speed: "optimum",
        });
        refundId = refund?.id || createSimulatedRefundId();
      } catch (refundError) {
        console.error("Razorpay Refund API Error:", refundError);
        console.log("Falling back to simulated refund...");
        refundId = createSimulatedRefundId();
      }
    } else {
      refundId = createSimulatedRefundId();
    }

    const { error: updateError } = await supabase
      .from("protected_bookings")
      .update({
        status: "REFUNDED" satisfies ProtectedBookingStatus,
        razorpay_refund_id: refundId,
      })
      .eq("id", bookingId);

    if (updateError) {
      return NextResponse.json({ error: "Failed to update booking refund status" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      status: "REFUNDED" satisfies ProtectedBookingStatus,
      refund_id: refundId,
      message: "Test refund completed.",
    });
  } catch (error) {
    console.error("Cancel Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

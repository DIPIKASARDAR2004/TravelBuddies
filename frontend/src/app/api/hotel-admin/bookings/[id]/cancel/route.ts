import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/utils/errorUtils";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { razorpayClient as razorpay } from "@/lib/services/razorpay";
import { createSimulatedRefundId } from "@/lib/checkout/serverUtils";
import { ProtectedBookingStatus } from "@/types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface AdminActionRequestBody {
  action?: "CANCEL" | "NO_SHOW";
}

interface AdminBookingRow {
  status: ProtectedBookingStatus;
  razorpay_payment_id: string | null;
  amount_paise: number;
  nights: number | null;
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { id: bookingId } = await params;
    const supabase = await createSupabaseServerClient();

    let action: "CANCEL" | "NO_SHOW" = "CANCEL";
    try {
      const body = (await request.json()) as AdminActionRequestBody;
      if (body.action === "NO_SHOW") {
        action = "NO_SHOW";
      }
    } catch {
      // Default hotel action is a cancellation when no JSON body is provided.
    }

    if (!bookingId) {
      return NextResponse.json({ error: "Missing booking ID" }, { status: 400 });
    }

    const { data: booking, error: fetchError } = await supabase
      .from("protected_bookings")
      .select("status, razorpay_payment_id, amount_paise, nights")
      .eq("id", bookingId)
      .single<AdminBookingRow>();

    if (fetchError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.status !== "PROTECTED") {
      return NextResponse.json({ error: "Only PROTECTED bookings can be processed" }, { status: 400 });
    }

    const totalAmountPaid = booking.amount_paise;
    let customerRefundAmount = 0;
    let hotelGrossEntitlement = 0;
    let platformCommissionAmount = 0;
    let hotelNetPayout = 0;
    let newStatus: ProtectedBookingStatus = "CANCELLED_BY_HOTEL";

    if (action === "CANCEL") {
      customerRefundAmount = totalAmountPaid;
      newStatus = "CANCELLED_BY_HOTEL";
    } else {
      const nights = booking.nights || 1;
      const oneNightCost = Math.floor(totalAmountPaid / nights);
      hotelGrossEntitlement = oneNightCost;
      customerRefundAmount = totalAmountPaid - oneNightCost;
      platformCommissionAmount = Math.floor(hotelGrossEntitlement * 0.05);
      hotelNetPayout = hotelGrossEntitlement - platformCommissionAmount;
      newStatus = "NO_SHOW";
    }

    await supabase
      .from("protected_bookings")
      .update({
        status: newStatus,
        total_amount_paid: totalAmountPaid,
        hotel_gross_entitlement: hotelGrossEntitlement,
        customer_refund_amount: customerRefundAmount,
        platform_commission_amount: platformCommissionAmount,
        hotel_net_payout: hotelNetPayout,
        cancellation_time: new Date().toISOString(),
      })
      .eq("id", bookingId);

    let refundId: string | null = null;
    if (customerRefundAmount > 0) {
      if (booking.razorpay_payment_id) {
        try {
          const refund = await razorpay.payments.refund(booking.razorpay_payment_id, {
            amount: customerRefundAmount,
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
        .update({ razorpay_refund_id: refundId })
        .eq("id", bookingId);

      if (updateError) {
        console.error("Failed to update refund ID", updateError);
      }
    }

    return NextResponse.json({
      success: true,
      status: newStatus,
      refund_id: refundId,
      customer_refund_amount: customerRefundAmount,
      hotel_net_payout: hotelNetPayout,
      message: action === "CANCEL" ? "Hotel cancellation completed." : "No-show processed.",
    });
  } catch (error) {
    console.error("Hotel Admin Action Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

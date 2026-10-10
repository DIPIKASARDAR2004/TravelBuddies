import { NextResponse } from "next/server";
import type { BookingRow } from "./paymentContracts";

export function refundResponse(booking: BookingRow) {
  const pending = booking.status === "REFUND_PENDING";
  return NextResponse.json(
    {
      success: true,
      status: booking.status,
      refund_id: booking.razorpay_refund_id,
      // Never describe an unconfirmed amount as already refunded.
      ...(pending
        ? {}
        : { customer_refund_amount: booking.customer_refund_amount }),
      message: pending
        ? "Refund awaits provider confirmation or manual review. No completed refund has been recorded."
        : "Test refund outcome confirmed. No bank payout was executed.",
    },
    { status: pending ? 202 : 200 },
  );
}

import { NextResponse } from "next/server";
import { withPayment } from "@/lib/checkout/paymentServer";
import { parseCreateOrder } from "@/lib/checkout/paymentContracts";
import { parseJson } from "@/lib/services/apiHandler";
import { createBookingOrder } from "@/lib/checkout/bookingPayments";

export const POST = withPayment(async ({ request, user, db, config }) => {
  const input = parseCreateOrder(
    await parseJson(request),
    request.headers.get("Idempotency-Key"),
  );
  const booking = await createBookingOrder(db, user.id, config, input);
  return NextResponse.json({
    success: true,
    booking_id: booking.id,
    razorpay_order_id: booking.razorpay_order_id,
    amount_paise: booking.amount_paise,
    currency: booking.currency,
  });
});

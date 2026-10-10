import { NextResponse } from "next/server";
import { withPayment } from "@/lib/checkout/paymentServer";
import { transitionProtectedBooking } from "@/lib/checkout/bookingPayments";

export const POST = withPayment(async ({ params, user, db, config }) => {
  await transitionProtectedBooking(db, user.id, config, params.id, "RELEASED");
  return NextResponse.json({
    success: true,
    status: "RELEASED",
    message: "Test checkout recorded. No bank payout was executed.",
  });
});

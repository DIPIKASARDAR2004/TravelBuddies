import { NextResponse } from "next/server";
import { withPayment } from "@/lib/checkout/paymentServer";
import { parseVerification } from "@/lib/checkout/paymentContracts";
import { parseJson } from "@/lib/services/apiHandler";
import { verifyBookingPayment } from "@/lib/checkout/bookingPayments";

export const POST = withPayment(async ({ request, user, db, config }) => {
  await verifyBookingPayment(
    db,
    user.id,
    config,
    parseVerification(await parseJson(request)),
  );
  return NextResponse.json({ success: true, status: "PROTECTED" });
});

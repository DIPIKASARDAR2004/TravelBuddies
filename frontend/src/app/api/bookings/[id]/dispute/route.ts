import { NextResponse } from "next/server";
import { withPayment } from "@/lib/checkout/paymentServer";
import { transitionProtectedBooking } from "@/lib/checkout/bookingPayments";
import { PaymentError, record } from "@/lib/checkout/paymentContracts";

export const POST = withPayment(
  async ({ request, params, user, db, config }) => {
    const text = await request.text();
    let reason = "DENIED_ENTRY";
    if (text.trim()) {
      let body: Record<string, unknown>;
      try {
        body = record(JSON.parse(text));
      } catch {
        throw new PaymentError("Invalid dispute details.");
      }
      if (
        typeof body.reason !== "string" ||
        !body.reason.trim() ||
        body.reason.trim().length > 1000
      )
        throw new PaymentError("A dispute reason must be 1–1000 characters.");
      reason = body.reason.trim();
    }
    await transitionProtectedBooking(
      db,
      user.id,
      config,
      params.id,
      "DISPUTED",
      reason,
    );
    return NextResponse.json({
      success: true,
      status: "DISPUTED",
      message: "Dispute recorded; further settlement actions are locked.",
    });
  },
);

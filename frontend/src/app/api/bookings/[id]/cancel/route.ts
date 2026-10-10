import { withPayment } from "@/lib/checkout/paymentServer";
import { refundBooking } from "@/lib/checkout/bookingPayments";
import { refundResponse } from "@/lib/checkout/refundResponse";

export const POST = withPayment(async ({ params, user, db, config }) => {
  return refundResponse(
    await refundBooking(db, user.id, config, params.id, "TRAVELLER_CANCEL"),
  );
});

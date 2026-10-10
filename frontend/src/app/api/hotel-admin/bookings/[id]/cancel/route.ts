import { withPayment } from "@/lib/checkout/paymentServer";
import { refundBooking } from "@/lib/checkout/bookingPayments";
import { refundResponse } from "@/lib/checkout/refundResponse";
import { PaymentError, record } from "@/lib/checkout/paymentContracts";
import { parseJson } from "@/lib/services/apiHandler";

// This legacy URL is a test-only owner simulator, NOT a hotel-admin role.
export const POST = withPayment(
  async ({ request, params, user, db, config }) => {
    if (process.env.HOTEL_SIMULATOR_ENABLED !== "true")
      throw new PaymentError("The hotel simulator is disabled.", 403);
    const body = record(await parseJson(request));
    if (body.action !== "CANCEL" && body.action !== "NO_SHOW")
      throw new PaymentError("Choose CANCEL or NO_SHOW.");
    return refundResponse(
      await refundBooking(
        db,
        user.id,
        config,
        params.id,
        body.action === "CANCEL" ? "HOTEL_CANCEL" : "NO_SHOW",
      ),
    );
  },
);

import "server-only";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { withAuth, type ApiHandlerContext } from "@/lib/services/apiHandler";
import { PaymentError } from "./paymentContracts";

export function getPaymentConfig() {
  const keyId = process.env.RAZORPAY_KEY_ID ?? "";
  const keySecret = process.env.RAZORPAY_KEY_SECRET ?? "";
  if (
    process.env.PAYMENTS_TEST_MODE_ENABLED !== "true" ||
    !/^rzp_test_[a-zA-Z0-9]+$/.test(keyId) ||
    !keySecret.trim() ||
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID !== keyId
  )
    throw new PaymentError(
      "Test payments are not configured. No new provider operation was requested.",
      503,
    );
  return { keyId, keySecret };
}
export type PaymentConfig = ReturnType<typeof getPaymentConfig>;
export function createBookingAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secret)
    throw new PaymentError("The booking service is not configured.", 503);
  // Dedicated server client: never attach a browser cookie/session token.
  return createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) =>
        fetch(input, { ...init, signal: AbortSignal.timeout(15000) }),
    },
  });
}
export type BookingDatabase = ReturnType<typeof createBookingAdminClient>;
type PaymentContext = ApiHandlerContext & {
  db: BookingDatabase;
  config: PaymentConfig;
};
export function withPayment(
  handler: (context: PaymentContext) => Promise<NextResponse>,
) {
  return withAuth(async (context) => {
    try {
      const origin = context.request.headers.get("Origin");
      if (origin && origin !== new URL(context.request.url).origin)
        throw new PaymentError(
          "Cross-origin payment requests are not allowed.",
          403,
        );
      const config = getPaymentConfig();
      const db = createBookingAdminClient();
      return await handler({ ...context, config, db });
    } catch (error) {
      if (error instanceof PaymentError)
        return NextResponse.json(
          { error: error.message },
          { status: error.status },
        );
      // Provider objects can contain credentials/authorization headers.
      console.error("Booking operation failed unexpectedly.");
      return NextResponse.json(
        { error: "The booking operation could not be completed." },
        { status: 500 },
      );
    }
  }, "The booking operation could not be completed.");
}

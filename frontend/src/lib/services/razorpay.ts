import "server-only";
import {
  PaymentError,
  orderIdPattern,
  paymentIdPattern,
  refundIdPattern,
  record,
} from "@/lib/checkout/paymentContracts";
import type { PaymentConfig } from "@/lib/checkout/paymentServer";

async function providerRequest(
  config: PaymentConfig,
  path: string,
  method = "GET",
  body?: unknown,
  extraHeaders?: Record<string, string>,
): Promise<Record<string, unknown>> {
  try {
    const response = await fetch(`https://api.razorpay.com/v1${path}`, {
      method,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(15000),
      headers: {
        Authorization: `Basic ${Buffer.from(`${config.keyId}:${config.keySecret}`).toString("base64")}`,
        "Content-Type": "application/json",
        ...extraHeaders,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!response.ok) throw new Error("Provider rejected request");
    return record(await response.json());
  } catch {
    throw new PaymentError(
      "The payment provider could not confirm this operation. Retry only through this booking.",
      502,
    );
  }
}
export async function createTestOrder(
  config: PaymentConfig,
  amount: number,
  receipt: string,
) {
  const order = await providerRequest(config, "/orders", "POST", {
    amount,
    currency: "INR",
    receipt,
  });
  if (
    typeof order.id !== "string" ||
    !orderIdPattern.test(order.id) ||
    order.amount !== amount ||
    order.currency !== "INR" ||
    order.receipt !== receipt ||
    order.status !== "created"
  )
    throw new PaymentError(
      "The provider returned inconsistent order details.",
      502,
    );
  return { id: order.id };
}
export async function fetchTestPayment(config: PaymentConfig, id: string) {
  if (!paymentIdPattern.test(id)) throw new PaymentError("Invalid payment ID.");
  const payment = await providerRequest(config, `/payments/${id}`);
  if (
    payment.id !== id ||
    typeof payment.order_id !== "string" ||
    !orderIdPattern.test(payment.order_id) ||
    typeof payment.amount !== "number" ||
    !Number.isSafeInteger(payment.amount) ||
    payment.currency !== "INR" ||
    typeof payment.status !== "string" ||
    typeof payment.amount_refunded !== "number"
  )
    throw new PaymentError(
      "The provider returned inconsistent payment details.",
      502,
    );
  return payment;
}
export async function confirmTestRefund(
  config: PaymentConfig,
  paymentId: string,
  amount: number,
  key: string,
  existingId: string | null,
) {
  if (!paymentIdPattern.test(paymentId))
    throw new PaymentError("Invalid stored payment ID.", 409);
  if (existingId && !refundIdPattern.test(existingId))
    throw new PaymentError("Invalid stored refund ID.", 409);
  const refund = existingId
    ? await providerRequest(config, `/refunds/${existingId}`)
    : await providerRequest(
        config,
        `/payments/${paymentId}/refund`,
        "POST",
        { amount, speed: "normal" },
        { "X-Refund-Idempotency": key },
      );
  if (
    typeof refund.id !== "string" ||
    !refundIdPattern.test(refund.id) ||
    (existingId && refund.id !== existingId) ||
    refund.payment_id !== paymentId ||
    refund.amount !== amount ||
    refund.currency !== "INR" ||
    !["pending", "processed", "failed"].includes(String(refund.status))
  )
    throw new PaymentError(
      "The provider returned inconsistent refund details.",
      502,
    );
  return {
    id: refund.id,
    status: refund.status as "pending" | "processed" | "failed",
  };
}

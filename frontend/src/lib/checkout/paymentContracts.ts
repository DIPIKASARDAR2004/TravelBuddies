import type { ProtectedBookingStatus } from "@/types";
import { isDateOnly } from "@/lib/dateOnly";

export class PaymentError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
  }
}
export const bookingIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const orderIdPattern = /^order_[a-zA-Z0-9]{1,100}$/;
export const paymentIdPattern = /^pay_[a-zA-Z0-9]{1,100}$/;
export const refundIdPattern = /^rfnd_[a-zA-Z0-9]{1,100}$/;

export function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new PaymentError("Invalid payment request.");
  return value as Record<string, unknown>;
}
export function requireBookingId(id: unknown): string {
  if (typeof id !== "string" || !bookingIdPattern.test(id))
    throw new PaymentError("Invalid booking ID.");
  return id;
}
export function parseBookingDate(value: unknown): string {
  if (!isDateOnly(value))
    throw new PaymentError("Valid check-in and check-out dates are required.");
  return value;
}
export function parseCreateOrder(
  input: unknown,
  idempotencyKey: string | null,
) {
  const body = record(input);
  const hotel = record(body.hotel);
  if (!idempotencyKey || !bookingIdPattern.test(idempotencyKey))
    throw new PaymentError("A valid Idempotency-Key is required.");
  const hotelName = typeof hotel.name === "string" ? hotel.name.trim() : "";
  const destination =
    typeof body.destination === "string" ? body.destination.trim() : "";
  const travellers = body.travellers;
  const nights = body.days;
  if (
    !hotelName ||
    hotelName.length > 200 ||
    !destination ||
    destination.length > 200
  )
    throw new PaymentError("A valid hotel and destination are required.");
  if (
    typeof travellers !== "number" ||
    !Number.isSafeInteger(travellers) ||
    travellers < 1 ||
    travellers > 100 ||
    typeof nights !== "number" ||
    !Number.isSafeInteger(nights) ||
    nights < 1 ||
    nights > 365
  )
    throw new PaymentError("Choose 1–100 travellers and 1–365 nights.");
  const checkIn = parseBookingDate(body.checkInDate);
  const checkOut = parseBookingDate(body.checkOutDate);
  if ((Date.parse(checkOut) - Date.parse(checkIn)) / 86400000 !== nights)
    throw new PaymentError("Stay length must match the selected dates.");
  return {
    hotelName,
    destination,
    travellers,
    nights,
    checkIn,
    checkOut,
    idempotencyKey,
  };
}
export function accommodationPaise(
  price: unknown,
  travellers: number,
  nights: number,
): number {
  if (typeof price !== "number" || !Number.isFinite(price) || price <= 0)
    throw new PaymentError("This hotel has no valid catalog price.", 409);
  const nightlyPaise = Math.round(price * 100);
  if (Math.abs(price * 100 - nightlyPaise) > 0.000001)
    throw new PaymentError("The catalog price must use whole paise.", 409);
  const amount = nightlyPaise * Math.ceil(travellers / 2) * nights;
  if (!Number.isSafeInteger(amount) || amount < 100 || amount > 2147483647)
    throw new PaymentError(
      "The booking amount is outside the supported range.",
    );
  return amount;
}
export function parseVerification(input: unknown) {
  const body = record(input);
  const bookingId = requireBookingId(body.booking_id);
  if (
    typeof body.razorpay_order_id !== "string" ||
    !orderIdPattern.test(body.razorpay_order_id) ||
    typeof body.razorpay_payment_id !== "string" ||
    !paymentIdPattern.test(body.razorpay_payment_id) ||
    typeof body.razorpay_signature !== "string" ||
    !/^[0-9a-f]{64}$/i.test(body.razorpay_signature)
  )
    throw new PaymentError("Invalid payment verification details.");
  return {
    bookingId,
    orderId: body.razorpay_order_id,
    paymentId: body.razorpay_payment_id,
    signature: body.razorpay_signature,
  };
}
export type RefundAction = "TRAVELLER_CANCEL" | "HOTEL_CANCEL" | "NO_SHOW";
export type BookingRow = {
  id: string;
  user_id: string | null;
  status: ProtectedBookingStatus;
  hotel_snapshot: Record<string, unknown>;
  destination: string;
  travellers: number;
  rooms: number;
  nights: number;
  amount_paise: number;
  currency: string;
  check_in_date: string;
  check_out_date: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  razorpay_refund_id: string | null;
  payment_key_id: string | null;
  order_creation_state: "LEGACY" | "CREATING" | "READY" | "RECONCILE";
  request_fingerprint: string | null;
  idempotency_key: string | null;
  refund_action: RefundAction | null;
  refund_target_status: ProtectedBookingStatus | null;
  refund_idempotency_key: string | null;
  customer_refund_amount: number | null;
  hotel_net_payout: number | null;
};

export function settlementAmounts(amount: number, refund: number) {
  if (
    !Number.isSafeInteger(amount) ||
    amount <= 0 ||
    !Number.isSafeInteger(refund) ||
    refund < 0 ||
    refund > amount
  )
    throw new PaymentError("Invalid settlement amounts.", 409);
  const hotelGross = amount - refund;
  const commission = Math.floor((hotelGross * 5) / 100);
  return {
    total_amount_paid: amount,
    customer_refund_amount: refund,
    hotel_gross_entitlement: hotelGross,
    platform_commission_amount: commission,
    hotel_net_payout: hotelGross - commission,
  };
}

/** Prototype check-in is midnight UTC until property-local check-in data exists. */
export function refundBreakdown(
  booking: Pick<BookingRow, "amount_paise" | "nights" | "check_in_date">,
  action: RefundAction,
  now: Date,
) {
  const amount = booking.amount_paise;
  if (
    !Number.isSafeInteger(amount) ||
    amount <= 0 ||
    !Number.isSafeInteger(booking.nights) ||
    booking.nights < 1
  )
    throw new PaymentError("Invalid stored booking amount.", 409);
  const hoursBefore =
    (Date.parse(`${parseBookingDate(booking.check_in_date)}T00:00:00.000Z`) -
      now.getTime()) /
    3600000;
  let refund: number;
  let status: ProtectedBookingStatus;
  if (action === "HOTEL_CANCEL") {
    refund = amount;
    status = "CANCELLED_BY_HOTEL";
  } else if (action === "NO_SHOW") {
    if (hoursBefore > 0)
      throw new PaymentError(
        "A no-show cannot be recorded before check-in.",
        409,
      );
    refund = amount - Math.floor(amount / booking.nights);
    status = "NO_SHOW";
  } else {
    refund =
      hoursBefore >= 72
        ? amount
        : Math.floor((amount * (hoursBefore >= 24 ? 80 : 50)) / 100);
    status = "CANCELLED_BY_USER";
  }
  return { ...settlementAmounts(amount, refund), refund_target_status: status };
}

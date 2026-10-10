import "server-only";
import {
  createHash,
  createHmac,
  timingSafeEqual,
  randomUUID,
} from "node:crypto";
import {
  createTestOrder,
  fetchTestPayment,
  confirmTestRefund,
} from "@/lib/services/razorpay";
import type { BookingDatabase, PaymentConfig } from "./paymentServer";
import {
  PaymentError,
  accommodationPaise,
  parseCreateOrder,
  parseVerification,
  requireBookingId,
  refundBreakdown,
  settlementAmounts,
  type BookingRow,
  type RefundAction,
} from "./paymentContracts";

export async function ownedBooking(
  db: BookingDatabase,
  userId: string,
  id: string,
): Promise<BookingRow> {
  requireBookingId(id);
  const { data, error } = await db
    .from("protected_bookings")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle<BookingRow>();
  if (error) throw new PaymentError("Unable to load this booking.", 500);
  if (!data || data.user_id !== userId)
    throw new PaymentError("Booking not found.", 404);
  return data;
}

function managedBooking(booking: BookingRow, config: PaymentConfig) {
  if (
    booking.payment_key_id !== config.keyId ||
    booking.order_creation_state !== "READY" ||
    !booking.razorpay_order_id ||
    booking.currency !== "INR" ||
    !Number.isSafeInteger(booking.amount_paise) ||
    booking.amount_paise <= 0
  )
    throw new PaymentError(
      "This booking needs payment reconciliation before further actions.",
      409,
    );
}

export async function createBookingOrder(
  db: BookingDatabase,
  userId: string,
  config: PaymentConfig,
  input: ReturnType<typeof parseCreateOrder>,
) {
  const fingerprint = createHash("sha256")
    .update(
      JSON.stringify({
        ...input,
        idempotencyKey: undefined,
        keyId: config.keyId,
      }),
    )
    .digest("hex");
  const existing = async () => {
    const { data, error } = await db
      .from("protected_bookings")
      .select("*")
      .eq("user_id", userId)
      .eq("idempotency_key", input.idempotencyKey)
      .maybeSingle<BookingRow>();
    if (error)
      throw new PaymentError("Unable to check the booking request.", 500);
    if (!data) return null;
    if (data.request_fingerprint !== fingerprint)
      throw new PaymentError(
        "This request key belongs to different trip details.",
        409,
      );
    managedBooking(data, config);
    return data;
  };
  const previous = await existing();
  if (previous) return previous;

  // Names and destinations identify a catalog row; browser prices are never used.
  // Reject ambiguous matches instead of silently choosing a different property.
  const destinationPattern = input.destination.replace(/[\\%_]/g, "\\$&");
  const { data: hotels, error: hotelError } = await db
    .from("Hotels")
    .select("hotel_name, destination, price_per_night, rating")
    .eq("hotel_name", input.hotelName)
    .ilike("destination", destinationPattern)
    .limit(2);
  if (hotelError)
    throw new PaymentError("Unable to check the hotel catalog.", 500);
  if (!Array.isArray(hotels) || hotels.length !== 1)
    throw new PaymentError(
      "Choose an unambiguous hotel from the current catalog.",
      409,
    );
  const hotel = hotels[0];
  if (
    typeof hotel.hotel_name !== "string" ||
    typeof hotel.destination !== "string" ||
    typeof hotel.rating !== "number" ||
    !Number.isFinite(hotel.rating) ||
    hotel.rating < 3.5 ||
    hotel.rating > 5
  )
    throw new PaymentError("This hotel is not eligible for booking.", 409);
  const amount = accommodationPaise(
    hotel.price_per_night,
    input.travellers,
    input.nights,
  );
  const { data: draft, error: insertError } = await db
    .from("protected_bookings")
    .insert({
      user_id: userId,
      hotel_snapshot: {
        name: hotel.hotel_name,
        location: hotel.destination,
        price_per_night: hotel.price_per_night,
        rating: hotel.rating,
      },
      destination: hotel.destination,
      travellers: input.travellers,
      nights: input.nights,
      rooms: Math.ceil(input.travellers / 2),
      amount_paise: amount,
      currency: "INR",
      status: "PAYMENT_PENDING",
      check_in_date: input.checkIn,
      check_out_date: input.checkOut,
      payment_key_id: config.keyId,
      order_creation_state: "CREATING",
      idempotency_key: input.idempotencyKey,
      request_fingerprint: fingerprint,
    })
    .select("*")
    .single<BookingRow>();
  if (insertError?.code === "23505") {
    const concurrent = await existing();
    if (concurrent) return concurrent;
    throw new PaymentError(
      "This booking request is already being processed.",
      409,
    );
  }
  if (insertError || !draft)
    throw new PaymentError("Unable to create the booking draft.", 500);

  try {
    const order = await createTestOrder(config, amount, draft.id); // UUID receipt is under the provider's 40-character limit.
    const { data, error } = await db
      .from("protected_bookings")
      .update({ razorpay_order_id: order.id, order_creation_state: "READY" })
      .eq("id", draft.id)
      .eq("user_id", userId)
      .eq("order_creation_state", "CREATING")
      .eq("status", "PAYMENT_PENDING")
      .select("*")
      .maybeSingle<BookingRow>();
    if (error || !data)
      throw new PaymentError(
        "The order needs reconciliation. Do not create another payment attempt.",
        503,
      );
    return data;
  } catch (error) {
    // An unknown provider outcome must never be retried as a brand-new order.
    await db
      .from("protected_bookings")
      .update({ order_creation_state: "RECONCILE" })
      .eq("id", draft.id)
      .eq("user_id", userId)
      .eq("order_creation_state", "CREATING");
    throw error;
  }
}

export async function verifyBookingPayment(
  db: BookingDatabase,
  userId: string,
  config: PaymentConfig,
  input: ReturnType<typeof parseVerification>,
) {
  const booking = await ownedBooking(db, userId, input.bookingId);
  managedBooking(booking, config);
  if (input.orderId !== booking.razorpay_order_id)
    throw new PaymentError("Payment order does not match this booking.", 409);
  const expected = createHmac("sha256", config.keySecret)
    .update(`${booking.razorpay_order_id}|${input.paymentId}`)
    .digest();
  const signature = Buffer.from(input.signature, "hex");
  if (
    signature.length !== expected.length ||
    !timingSafeEqual(signature, expected)
  )
    throw new PaymentError("Invalid payment signature.");
  // Exact replay is idempotent; a closed/disputed/refunding booking is never reopened.
  if (
    booking.status === "PROTECTED" &&
    booking.razorpay_payment_id === input.paymentId
  )
    return;
  if (booking.status !== "PAYMENT_PENDING" || booking.razorpay_payment_id)
    throw new PaymentError(
      "This booking cannot accept a payment verification.",
      409,
    );
  const payment = await fetchTestPayment(config, input.paymentId);
  if (
    payment.order_id !== booking.razorpay_order_id ||
    payment.amount !== booking.amount_paise ||
    payment.currency !== booking.currency ||
    payment.status !== "captured" ||
    payment.captured !== true ||
    payment.amount_refunded !== 0
  )
    throw new PaymentError(
      "The provider has not confirmed the expected captured payment.",
      409,
    );
  const { data, error } = await db
    .from("protected_bookings")
    .update({ status: "PROTECTED", razorpay_payment_id: input.paymentId })
    .eq("id", booking.id)
    .eq("user_id", userId)
    .eq("razorpay_order_id", booking.razorpay_order_id)
    .eq("status", "PAYMENT_PENDING")
    .is("razorpay_payment_id", null)
    .select("id")
    .maybeSingle();
  if (error)
    throw new PaymentError(
      "Payment verification could not be saved.",
      error.code === "23505" ? 409 : 500,
    );
  if (!data) {
    const current = await ownedBooking(db, userId, booking.id);
    if (
      current.status !== "PROTECTED" ||
      current.razorpay_payment_id !== input.paymentId
    )
      throw new PaymentError(
        "The booking changed during verification. Reload it before retrying.",
        409,
      );
  }
}

export async function transitionProtectedBooking(
  db: BookingDatabase,
  userId: string,
  config: PaymentConfig,
  id: string,
  target: "RELEASED" | "DISPUTED",
  reason?: string,
) {
  const booking = await ownedBooking(db, userId, id);
  managedBooking(booking, config);
  if (booking.status === target) return;
  if (booking.status !== "PROTECTED")
    throw new PaymentError(
      "Only a protected booking can perform this action.",
      409,
    );
  const { data, error } = await db
    .from("protected_bookings")
    .update({
      status: target,
      ...(target === "RELEASED"
        ? settlementAmounts(booking.amount_paise, 0)
        : {}),
      ...(reason ? { dispute_reason: reason } : {}),
    })
    .eq("id", id)
    .eq("user_id", userId)
    .eq("status", "PROTECTED")
    .select("id")
    .maybeSingle();
  if (error)
    throw new PaymentError("The booking update could not be saved.", 500);
  if (!data)
    throw new PaymentError("The booking changed. Reload before retrying.", 409);
}

export async function refundBooking(
  db: BookingDatabase,
  userId: string,
  config: PaymentConfig,
  id: string,
  action?: RefundAction,
) {
  let booking = await ownedBooking(db, userId, id);
  managedBooking(booking, config);
  if (
    action &&
    booking.refund_action === action &&
    booking.status === booking.refund_target_status
  )
    return booking;
  if (booking.status === "PROTECTED" && action) {
    const breakdown = refundBreakdown(booking, action, new Date());
    const { data, error } = await db
      .from("protected_bookings")
      .update({
        ...breakdown,
        status: "REFUND_PENDING",
        refund_action: action,
        refund_idempotency_key: randomUUID(),
        cancellation_time: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", userId)
      .eq("status", "PROTECTED")
      .select("*")
      .maybeSingle<BookingRow>();
    if (error)
      throw new PaymentError("Unable to record the refund request.", 500);
    booking = data ?? (await ownedBooking(db, userId, id));
  }
  if (
    booking.status !== "REFUND_PENDING" ||
    (action && booking.refund_action !== action) ||
    !booking.refund_idempotency_key ||
    !booking.refund_target_status ||
    !booking.razorpay_payment_id ||
    !Number.isSafeInteger(booking.customer_refund_amount) ||
    booking.customer_refund_amount! < 0 ||
    booking.customer_refund_amount! > booking.amount_paise
  )
    throw new PaymentError(
      "This booking cannot perform that refund action.",
      409,
    );
  const amount = booking.customer_refund_amount!;
  let refundId = booking.razorpay_refund_id;
  let processed = amount === 0;
  if (amount > 0) {
    // A durable key and unchanged payload make concurrent retries provider-idempotent.
    let refund;
    try {
      refund = await confirmTestRefund(
        config,
        booking.razorpay_payment_id,
        amount,
        booking.refund_idempotency_key,
        refundId,
      );
    } catch (error) {
      if (error instanceof PaymentError && error.status === 502) return booking;
      throw error;
    }
    refundId = refund.id;
    processed = refund.status === "processed";
    // Failed/pending refunds stay pending; never invent a simulated success.
  }
  const { data, error } = await db
    .from("protected_bookings")
    .update({
      razorpay_refund_id: refundId,
      status: processed ? booking.refund_target_status : "REFUND_PENDING",
    })
    .eq("id", id)
    .eq("user_id", userId)
    .eq("status", "REFUND_PENDING")
    .eq("refund_idempotency_key", booking.refund_idempotency_key)
    .select("*")
    .maybeSingle<BookingRow>();
  if (error)
    throw new PaymentError(
      "The refund needs reconciliation before another action.",
      503,
    );
  if (!data) {
    const current = await ownedBooking(db, userId, id);
    if (
      current.refund_idempotency_key === booking.refund_idempotency_key &&
      current.status === booking.refund_target_status
    )
      return current;
    throw new PaymentError(
      "The booking changed during the refund. Reload it.",
      409,
    );
  }
  return data;
}

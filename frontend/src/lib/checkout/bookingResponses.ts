import type { ProtectedBooking } from "@/types";
import { isBookingStatus } from "./bookingStatus";
import { record, parseBookingDate } from "./paymentContracts";

export function readProtectedBooking(
  value: unknown,
  expectedId: string,
): ProtectedBooking {
  const invalid = () =>
    new Error("The server returned invalid booking details.");
  try {
    const data = record(value);
    if (
      data.id !== expectedId ||
      !isBookingStatus(data.status) ||
      data.currency !== "INR" ||
      typeof data.destination !== "string"
    )
      throw invalid();
    for (const field of [
      "travellers",
      "nights",
      "rooms",
      "amount_paise",
    ] as const) {
      if (
        typeof data[field] !== "number" ||
        !Number.isSafeInteger(data[field]) ||
        data[field] <= 0
      )
        throw invalid();
    }
    const checkIn =
      data.check_in_date === null ? null : parseBookingDate(data.check_in_date);
    const checkOut =
      data.check_out_date === null
        ? null
        : parseBookingDate(data.check_out_date);
    if (
      checkIn &&
      checkOut &&
      (Date.parse(checkOut) - Date.parse(checkIn)) / 86400000 !== data.nights
    )
      throw invalid();
    if (
      data.razorpay_order_id !== null &&
      typeof data.razorpay_order_id !== "string"
    )
      throw invalid();
    const snapshot =
      data.hotel_snapshot === null ? null : record(data.hotel_snapshot);
    if (
      snapshot &&
      (typeof snapshot.name !== "string" ||
        (snapshot.location !== undefined &&
          typeof snapshot.location !== "string"))
    )
      throw invalid();
    return {
      id: expectedId,
      status: data.status,
      destination: data.destination,
      currency: "INR",
      travellers: data.travellers as number,
      nights: data.nights as number,
      rooms: data.rooms as number,
      amount_paise: data.amount_paise as number,
      check_in_date: checkIn,
      check_out_date: checkOut,
      razorpay_order_id: data.razorpay_order_id as string | null,
      hotel_snapshot: snapshot
        ? {
            name: snapshot.name as string,
            location: snapshot.location as string | undefined,
          }
        : null,
    };
  } catch {
    throw invalid();
  }
}

export function readBookingAction(value: unknown) {
  const data = record(value);
  if (
    data.success !== true ||
    !isBookingStatus(data.status) ||
    (data.message !== undefined && typeof data.message !== "string") ||
    (data.customer_refund_amount !== undefined &&
      (typeof data.customer_refund_amount !== "number" ||
        !Number.isSafeInteger(data.customer_refund_amount) ||
        data.customer_refund_amount < 0))
  )
    throw new Error("The server did not confirm a valid booking update.");
  return {
    status: data.status,
    message: data.message as string | undefined,
    customer_refund_amount: data.customer_refund_amount as number | undefined,
  };
}

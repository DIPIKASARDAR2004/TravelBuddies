import { supabaseBrowser } from "@/lib/supabaseBrowserClient";
import { readProtectedBooking, readBookingAction } from "./bookingResponses";
import { requireBookingId } from "./paymentContracts";
import type { ProtectedBooking } from "@/types";

export type CheckoutAction =
  "release" | "cancel" | "dispute" | "refund" | "hotel_cancel" | "no_show";
export class CheckoutRequestError extends Error {
  constructor(
    message: string,
    readonly uncertain = true,
  ) {
    super(message);
  }
}
export const CHECKOUT_WAIT_MS = 15000;

/** Covers response bodies and adapters that ignore cancellation, within this feature. */
export async function waitForCheckout<T>(
  signal: AbortSignal,
  work: (signal: AbortSignal) => PromiseLike<T>,
): Promise<T> {
  const deadline = new AbortController();
  const combined = AbortSignal.any([signal, deadline.signal]);
  combined.throwIfAborted();
  let stop: (() => void) | undefined;
  const timer = setTimeout(() => deadline.abort(), CHECKOUT_WAIT_MS);
  try {
    const aborted = new Promise<never>((_, reject) => {
      stop = () =>
        reject(
          new CheckoutRequestError(
            "The checkout request timed out or was interrupted.",
          ),
        );
      combined.addEventListener("abort", stop, { once: true });
    });
    return await Promise.race([work(combined), aborted]);
  } finally {
    clearTimeout(timer);
    if (stop) combined.removeEventListener("abort", stop);
    deadline.abort();
  }
}

export async function loadCheckoutBooking(id: string, signal: AbortSignal) {
  requireBookingId(id);
  return waitForCheckout(signal, async (bounded) => {
    const { data, error } = await supabaseBrowser
      .from("protected_bookings")
      .select("*")
      .eq("id", id)
      .abortSignal(bounded)
      .single();
    if (error || !data)
      throw new Error(
        "Booking unavailable. Check your access and try loading again.",
      );
    return readProtectedBooking(data, id);
  });
}

const outcomes: Record<CheckoutAction, readonly string[]> = {
  release: ["RELEASED"],
  dispute: ["DISPUTED"],
  cancel: ["REFUND_PENDING", "CANCELLED_BY_USER"],
  hotel_cancel: ["REFUND_PENDING", "CANCELLED_BY_HOTEL"],
  no_show: ["REFUND_PENDING", "NO_SHOW"],
  refund: [
    "REFUND_PENDING",
    "CANCELLED_BY_USER",
    "CANCELLED_BY_HOTEL",
    "NO_SHOW",
  ],
};

export function checkedCheckoutAction(
  value: unknown,
  booking: ProtectedBooking,
  action: CheckoutAction,
) {
  const result = readBookingAction(value);
  if (
    !outcomes[action].includes(result.status) ||
    (result.customer_refund_amount !== undefined &&
      (result.customer_refund_amount > booking.amount_paise ||
        result.status === "REFUND_PENDING" ||
        action === "release" ||
        action === "dispute"))
  )
    throw new CheckoutRequestError(
      "The server did not confirm a valid booking update.",
    );
  return result;
}

export function performCheckoutAction(
  booking: ProtectedBooking,
  action: CheckoutAction,
  signal: AbortSignal,
) {
  requireBookingId(booking.id);
  if (booking.status !== (action === "refund" ? "REFUND_PENDING" : "PROTECTED"))
    throw new CheckoutRequestError(
      "Refresh the booking before choosing this action.",
      false,
    );
  const hotel = action === "hotel_cancel" || action === "no_show";
  const url = hotel
    ? `/api/hotel-admin/bookings/${booking.id}/cancel`
    : `/api/bookings/${booking.id}/${action}`;
  return waitForCheckout(signal, async (bounded) => {
    const response = await fetch(url, {
      method: "POST",
      signal: bounded,
      credentials: "same-origin",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: hotel
        ? JSON.stringify({
            action: action === "hotel_cancel" ? "CANCEL" : "NO_SHOW",
          })
        : undefined,
    });
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new CheckoutRequestError(
        "The server did not confirm a valid booking update.",
      );
    }
    if (!response.ok) {
      const data =
        body && typeof body === "object"
          ? (body as Record<string, unknown>)
          : {};
      const rejected = [401, 403, 404].includes(response.status);
      const message =
        rejected && typeof data.error === "string" && data.error.length <= 500
          ? data.error
          : "The booking update could not be confirmed. Refresh and review before another action.";
      throw new CheckoutRequestError(message, !rejected);
    }
    return checkedCheckoutAction(body, booking, action);
  });
}

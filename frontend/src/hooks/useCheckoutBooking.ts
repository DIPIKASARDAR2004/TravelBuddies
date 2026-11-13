"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ProtectedBooking } from "@/types";
import {
  CheckoutRequestError,
  loadCheckoutBooking,
  performCheckoutAction,
  type CheckoutAction,
} from "@/lib/checkout/checkoutClient";
import { formatBookingAmount } from "@/lib/checkout/bookingStatus";

/**
 * Mounted for one booking ID; the route keys the owning checkout view so an old
 * booking's response cannot become the newly selected booking's state. Aborting
 * on departure stops local waiting, not a mutation already accepted by a server.
 * These guards belong to this mounted view; they are not durable reconciliation.
 */
export function useCheckoutBooking(bookingId: string) {
  const [booking, setBooking] = useState<ProtectedBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [isActing, setIsActing] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [uncertain, setUncertain] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const [paymentUncertain, setPaymentUncertain] = useState(false);
  const alive = useRef(false);
  // React state updates are scheduled: two clicks can arrive before a disabled
  // button renders. Claim the request synchronously, and compare its identity on
  // completion so a stale request cannot publish state or release a newer lock.
  const active = useRef<AbortController | null>(null);
  const blocked = useRef(false);
  const currentBooking = useRef(booking);
  currentBooking.current = booking;

  const refresh = useCallback(async () => {
    if (!alive.current || active.current) return;
    const controller = new AbortController();
    active.current = controller;
    setLoading(true);
    setReviewed(false);
    setSuccessMessage("");
    try {
      const result = await loadCheckoutBooking(bookingId, controller.signal);
      if (!alive.current || active.current !== controller) return;
      currentBooking.current = result;
      setBooking(result);
      setError("");
      setReviewed(true);
    } catch (cause) {
      if (!alive.current || active.current !== controller) return;
      setError(cause instanceof Error ? cause.message : "Booking unavailable.");
      setBooking(null);
      currentBooking.current = null;
    } finally {
      if (alive.current && active.current === controller) {
        active.current = null;
        setLoading(false);
      }
    }
  }, [bookingId]);

  useEffect(() => {
    alive.current = true;
    void refresh();
    return () => {
      alive.current = false;
      active.current?.abort();
      active.current = null;
    };
  }, [refresh]);

  const act = async (action: CheckoutAction) => {
    const previous = currentBooking.current;
    if (!alive.current || active.current || blocked.current || !previous)
      return;
    const controller = new AbortController();
    active.current = controller;
    setIsActing(true);
    setError("");
    setSuccessMessage("");
    try {
      const result = await performCheckoutAction(
        previous,
        action,
        controller.signal,
      );
      if (!alive.current || active.current !== controller) return;
      const next = { ...previous, status: result.status };
      currentBooking.current = next;
      setBooking(next);
      let message = result.message || "Booking updated successfully.";
      if (result.customer_refund_amount !== undefined)
        message += ` Refunded ${formatBookingAmount(result.customer_refund_amount, previous.currency)}.`;
      setSuccessMessage(message);
    } catch (cause) {
      if (!alive.current || active.current !== controller) return;
      const unknown =
        !(cause instanceof CheckoutRequestError) || cause.uncertain;
      blocked.current = unknown;
      setUncertain(unknown);
      setReviewed(false);
      setError(
        cause instanceof Error
          ? cause.message
          : "The booking update could not be confirmed.",
      );
    } finally {
      if (alive.current && active.current === controller) {
        active.current = null;
        setIsActing(false);
      }
    }
  };

  const paymentSucceeded = (message: string) => {
    if (!alive.current || currentBooking.current?.status !== "PAYMENT_PENDING")
      return;
    const next = { ...currentBooking.current, status: "PROTECTED" as const };
    currentBooking.current = next;
    setBooking(next);
    setSuccessMessage(message);
  };
  const paymentError = (message: string, unknown = false) => {
    if (!alive.current) return;
    setError(message);
    if (unknown) {
      blocked.current = true;
      setUncertain(true);
      setPaymentUncertain(true);
      setReviewed(false);
    }
  };
  const acknowledge = () => {
    // PAYMENT_PENDING describes our booking row, not the provider's charge state.
    // After uncertain verification, even a fresh read of that row cannot prove
    // no money moved. A local acknowledgement must never authorize another charge.
    if (
      !reviewed ||
      active.current ||
      (paymentUncertain && booking?.status === "PAYMENT_PENDING")
    )
      return;
    blocked.current = false;
    setUncertain(false);
    setError("");
  };
  return {
    booking,
    loading,
    isActing,
    error,
    successMessage,
    uncertain,
    reviewed,
    paymentUncertain,
    refresh,
    act,
    acknowledge,
    paymentSucceeded,
    paymentError,
  };
}

"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import type { HotelOption, TripDetails } from "@/types";
import { apiClient } from "@/lib/services/apiClient";
import { bookingIdPattern } from "@/lib/checkout/paymentContracts";

/** The customizer selects a draft; only the server may authorize and price it. */
export function useBookingDraft(hotel: HotelOption | null, trip: TripDetails) {
  const router = useRouter();
  const [isBooking, setIsBooking] = useState(false);
  const attempt = useRef<{ payload: string; key: string } | null>(null);

  const createBooking = async () => {
    if (isBooking) return;
    if (!hotel) {
      toast.error("Select a hotel before continuing to checkout.");
      return;
    }
    if (!trip.dates?.startDate || !trip.dates?.endDate) {
      toast.error(
        "Select check-in and check-out dates before continuing to checkout.",
      );
      return;
    }
    setIsBooking(true);
    try {
      const payload = JSON.stringify({
        hotel: { name: hotel.name },
        destination: hotel.destination ?? trip.destination,
        travellers: trip.travellers,
        days: trip.days,
        checkInDate: trip.dates.startDate,
        checkOutDate: trip.dates.endDate,
      });
      // Reuse the same key after a lost response, including a page reload.
      // Storage failure still preserves retries for this mounted component.
      if (!attempt.current || attempt.current.payload !== payload) {
        let saved: unknown;
        try {
          saved = JSON.parse(
            sessionStorage.getItem("booking-draft-attempt") ?? "null",
          );
        } catch {}
        const previous =
          saved && typeof saved === "object"
            ? (saved as Record<string, unknown>)
            : {};
        attempt.current = {
          payload,
          key:
            previous.payload === payload &&
            typeof previous.key === "string" &&
            bookingIdPattern.test(previous.key)
              ? previous.key
              : crypto.randomUUID(),
        };
        try {
          sessionStorage.setItem(
            "booking-draft-attempt",
            JSON.stringify(attempt.current),
          );
        } catch {}
      }
      const response = await apiClient("/api/payments/create-order", {
        method: "POST",
        headers: { "Idempotency-Key": attempt.current.key },
        body: payload,
      });
      const data =
        response && typeof response === "object"
          ? (response as Record<string, unknown>)
          : {};
      if (
        data.success === true &&
        typeof data.booking_id === "string" &&
        bookingIdPattern.test(data.booking_id)
      ) {
        router.push(`/plan/checkout/${data.booking_id}`);
      } else {
        toast.error(
          typeof data.error === "string"
            ? data.error
            : "The server did not return a valid booking draft.",
        );
      }
    } catch {
      // apiClient owns the one error notification for a failed request.
    } finally {
      setIsBooking(false);
    }
  };

  return { isBooking, createBooking };
}

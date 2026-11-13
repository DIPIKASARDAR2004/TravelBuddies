import { useEffect, useRef, useState } from "react";
import { ProtectedBooking } from "@/types";
import { requestJson } from "@/lib/client/requestJson";
import { waitForCheckout } from "@/lib/checkout/checkoutClient";
import {
  loadRazorpayCheckout,
  checkoutLoadError,
} from "@/lib/client/razorpayCheckout";

interface RazorpayPaymentSuccess {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayPaymentFailure {
  error: {
    description?: string;
  };
}

interface RazorpayInstance {
  on: (
    event: "payment.failed",
    handler: (response: RazorpayPaymentFailure) => void,
  ) => void;
  open: () => void;
  close?: () => void;
}

interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayPaymentSuccess) => Promise<void>;
  prefill: {
    name: string;
    email: string;
  };
  theme: {
    color: string;
  };
  modal: { ondismiss: () => void };
}

interface RazorpayWindow extends Window {
  Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayInstance;
}

interface RazorpayOptions {
  bookingId: string;
  booking: ProtectedBooking | null;
  onSuccess: (message: string) => void;
  onError: (error: string, uncertain?: boolean) => void;
}

export function useRazorpay({
  bookingId,
  booking,
  onSuccess,
  onError,
}: RazorpayOptions) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCheckoutReady, setIsCheckoutReady] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const active = useRef<{
    controller: AbortController;
    verifying: boolean;
    instance?: RazorpayInstance;
  } | null>(null);

  useEffect(
    () => () => {
      const attempt = active.current;
      active.current = null;
      attempt?.controller.abort();
      try {
        attempt?.instance?.close?.();
      } catch {
        /* Provider cleanup is best effort. */
      }
    },
    [bookingId],
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadRazorpayCheckout(controller.signal)
      .then(() => {
        if (!controller.signal.aborted) setIsCheckoutReady(true);
      })
      .catch(() => {
        if (!controller.signal.aborted) setCheckoutError(checkoutLoadError);
      });
    return () => controller.abort();
  }, []);

  const handlePayment = async (checkIn: string, checkOut: string) => {
    if (active.current || booking?.status !== "PAYMENT_PENDING") return;
    onError("");

    if (!booking) {
      onError("Booking details are not ready yet.");
      return;
    }

    if (!checkIn || !checkOut) {
      onError(
        "This booking is missing travel dates, so checkout cannot start yet.",
      );
      return;
    }

    if (!booking.razorpay_order_id) {
      onError(
        "Missing secure payment order. Create a new booking draft and try again.",
      );
      return;
    }

    const checkoutWindow = window as RazorpayWindow;

    if (!checkoutWindow.Razorpay) {
      onError(
        "Secure checkout is still loading. Please wait a moment and try again.",
      );
      return;
    }

    setIsProcessing(true);
    const attempt = {
      controller: new AbortController(),
      verifying: false,
      instance: undefined as RazorpayInstance | undefined,
    };
    active.current = attempt;
    const current = () =>
      active.current === attempt && !attempt.controller.signal.aborted;
    const finish = () => {
      if (!current()) return;
      active.current = null;
      attempt.controller.abort();
      setIsProcessing(false);
    };

    try {
      const options: RazorpayCheckoutOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_placeholder",
        amount: booking.amount_paise,
        currency: booking.currency,
        name: "Journey Pilot",
        description: `Protected Booking: ${booking.hotel_snapshot?.name || "Hotel"}`,
        order_id: booking.razorpay_order_id,
        handler: async (response) => {
          if (!current() || attempt.verifying) return;
          attempt.verifying = true;
          try {
            if (
              response.razorpay_order_id !== booking.razorpay_order_id ||
              typeof response.razorpay_payment_id !== "string" ||
              !response.razorpay_payment_id ||
              typeof response.razorpay_signature !== "string" ||
              !response.razorpay_signature
            ) {
              throw new Error("Invalid checkout response.");
            }
            const verifyData = await waitForCheckout(
              attempt.controller.signal,
              (signal) =>
                requestJson("/api/payments/verify", {
                  method: "POST",
                  signal,
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    booking_id: bookingId,
                  }),
                }),
            );
            if (!current()) return;

            if (
              verifyData &&
              typeof verifyData === "object" &&
              "success" in verifyData &&
              verifyData.success === true &&
              "status" in verifyData &&
              verifyData.status === "PROTECTED"
            ) {
              onSuccess("Payment successful. Your booking is now protected.");
            } else {
              onError(
                "Payment verification failed. Refresh the booking before continuing; do not pay again.",
                true,
              );
            }
          } catch {
            if (current())
              onError(
                "Payment verification request failed. Refresh the booking before continuing; do not pay again.",
                true,
              );
          } finally {
            finish();
          }
        },
        prefill: {
          name: "Test User",
          email: "test@journeypilot.com",
        },
        theme: {
          color: "#0f766e",
        },
        modal: {
          ondismiss: () => {
            if (!attempt.verifying) finish();
          },
        },
      };

      const razorpay = new checkoutWindow.Razorpay(options);
      attempt.instance = razorpay;
      razorpay.on("payment.failed", () => {
        if (!current() || attempt.verifying) return;
        onError(
          "The payment provider reported a failure. Check the booking and payment status before another attempt; do not pay again.",
          true,
        );
        finish();
      });
      razorpay.open();
    } catch {
      onError(
        "The gateway could not finish opening. Check the booking and payment status before another attempt; do not pay again.",
        true,
      );
      finish();
    }
  };

  return {
    isCheckoutReady,
    checkoutError,
    isProcessing,
    handlePayment,
  };
}

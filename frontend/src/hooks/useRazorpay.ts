import { useEffect, useState } from "react";
import { ProtectedBooking } from "@/types";
import { requestJson } from "@/lib/client/requestJson";
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
  onError: (error: string) => void;
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
    if (isProcessing) return;
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

    try {
      let verifying = false;
      const options: RazorpayCheckoutOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_placeholder",
        amount: booking.amount_paise,
        currency: booking.currency,
        name: "Journey Pilot",
        description: `Protected Booking: ${booking.hotel_snapshot?.name || "Hotel"}`,
        order_id: booking.razorpay_order_id,
        handler: async (response) => {
          verifying = true;
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
            const verifyData = await requestJson("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                booking_id: bookingId,
              }),
            });

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
              onError("Payment verification failed.");
            }
          } catch {
            onError("Payment verification request failed.");
          } finally {
            verifying = false;
            setIsProcessing(false);
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
            if (!verifying) setIsProcessing(false);
          },
        },
      };

      const razorpay = new checkoutWindow.Razorpay(options);
      razorpay.on("payment.failed", (response) => {
        onError(
          `Payment failed: ${response?.error?.description || "Unknown Razorpay error."}`,
        );
        setIsProcessing(false);
      });
      razorpay.open();
    } catch {
      onError("Failed to initiate payment.");
      setIsProcessing(false);
    }
  };

  return {
    isCheckoutReady,
    checkoutError,
    isProcessing,
    handlePayment,
    setIsProcessing,
  };
}

import { useEffect, useState } from "react";
import { ApiResponse, ProtectedBooking } from "@/types";

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
  on: (event: "payment.failed", handler: (response: RazorpayPaymentFailure) => void) => void;
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

const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

export function useRazorpay({ bookingId, booking, onSuccess, onError }: RazorpayOptions) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCheckoutReady, setIsCheckoutReady] = useState(false);

  useEffect(() => {
    const checkoutWindow = window as RazorpayWindow;

    const handleLoad = () => setIsCheckoutReady(true);
    const handleError = () => {
      setIsCheckoutReady(false);
      onError("Secure checkout could not be loaded. Please refresh and try again.");
    };

    const existingScript = document.querySelector(`script[src="${RAZORPAY_SCRIPT_URL}"]`);

    if (checkoutWindow.Razorpay) {
      setIsCheckoutReady(true);
      return;
    }

    if (existingScript instanceof HTMLScriptElement) {
      existingScript.addEventListener("load", handleLoad);
      existingScript.addEventListener("error", handleError);

      return () => {
        existingScript.removeEventListener("load", handleLoad);
        existingScript.removeEventListener("error", handleError);
      };
    }

    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.addEventListener("load", handleLoad);
    script.addEventListener("error", handleError);
    document.body.appendChild(script);

    return () => {
      script.removeEventListener("load", handleLoad);
      script.removeEventListener("error", handleError);
    };
  }, [onError]);

  const handlePayment = async (checkIn: string, checkOut: string) => {
    onError("");

    if (!booking) {
      onError("Booking details are not ready yet.");
      return;
    }

    if (!checkIn || !checkOut) {
      onError("This booking is missing travel dates, so checkout cannot start yet.");
      return;
    }

    if (!booking.razorpay_order_id) {
      onError("Missing secure payment order. Create a new booking draft and try again.");
      return;
    }

    const checkoutWindow = window as RazorpayWindow;

    if (!checkoutWindow.Razorpay) {
      onError("Secure checkout is still loading. Please wait a moment and try again.");
      return;
    }

    setIsProcessing(true);

    try {
      const options: RazorpayCheckoutOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_placeholder",
        amount: booking.amount_paise,
        currency: booking.currency,
        name: "Journey Pilot",
        description: `Protected Booking: ${booking.hotel_snapshot?.name || "Hotel"}`,
        order_id: booking.razorpay_order_id,
        handler: async (response) => {
          try {
            const verifyResponse = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                booking_id: bookingId,
              }),
            });

            const verifyData = (await verifyResponse.json()) as ApiResponse;

            if (verifyResponse.ok && verifyData.success) {
              onSuccess("Payment successful. Your booking is now protected.");
            } else {
              onError(verifyData.error || "Payment verification failed.");
            }
          } catch {
            onError("Payment verification request failed.");
          } finally {
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
      };

      const razorpay = new checkoutWindow.Razorpay(options);
      razorpay.on("payment.failed", (response) => {
        onError(`Payment failed: ${response.error.description || "Unknown Razorpay error."}`);
        setIsProcessing(false);
      });
      razorpay.open();
    } catch {
      onError("Failed to initiate payment.");
      setIsProcessing(false);
    }
  };

  return { isCheckoutReady, isProcessing, handlePayment, setIsProcessing };
}

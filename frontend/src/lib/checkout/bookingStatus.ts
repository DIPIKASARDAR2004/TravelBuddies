import { ProtectedBookingStatus } from "@/types";

export type CheckoutStepState = "active" | "complete" | "idle" | "attention";

interface CheckoutStatusMeta {
  label: string;
  detail: string;
  tone: "default" | "danger" | "warning" | "success";
  badgeClassName: string;
}

interface CheckoutTimelineStep {
  id: string;
  label: string;
  description: string;
  state: CheckoutStepState;
}

const CLOSED_BOOKING_STATUSES: ProtectedBookingStatus[] = [
  "RELEASED",
  "REFUNDED",
  "CANCELLED",
  "CANCELLED_BY_USER",
  "CANCELLED_BY_HOTEL",
  "CANCELLED_NO_REFUND",
  "NO_SHOW",
  "DISPUTED",
];

const STATUS_META: Record<ProtectedBookingStatus, CheckoutStatusMeta> = {
  PAYMENT_PENDING: {
    label: "Awaiting payment",
    detail: "This draft booking is ready. Complete the test payment to place the stay amount in protected mode.",
    tone: "default",
    badgeClassName:
      "border border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800/50 dark:bg-sky-950/30 dark:text-sky-200",
  },
  PAYMENT_FAILED: {
    label: "Payment failed",
    detail: "Verification did not complete, so the booking was not protected. Start a fresh booking draft before retrying.",
    tone: "danger",
    badgeClassName:
      "border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800/50 dark:bg-rose-950/30 dark:text-rose-200",
  },
  PROTECTED: {
    label: "Funds protected",
    detail: "The stay amount is being held in protected mode until checkout, cancellation, or a dispute outcome is recorded.",
    tone: "success",
    badgeClassName:
      "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/30 dark:text-emerald-200",
  },
  REFUND_PENDING: {
    label: "Refund in progress",
    detail: "A refund is being processed from the protected amount. The booking will close once the prototype refund flow is recorded.",
    tone: "warning",
    badgeClassName:
      "border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-200",
  },
  RELEASED: {
    label: "Released after checkout",
    detail: "The protected amount has been released to the hotel after a successful stay completion in this test flow.",
    tone: "success",
    badgeClassName:
      "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/30 dark:text-emerald-200",
  },
  REFUNDED: {
    label: "Refund issued",
    detail: "The booking was refunded from the protected pool. The checkout flow is now closed.",
    tone: "warning",
    badgeClassName:
      "border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-200",
  },
  CANCELLED: {
    label: "Booking cancelled",
    detail: "The booking was cancelled and the protected flow is now closed.",
    tone: "warning",
    badgeClassName:
      "border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-200",
  },
  CANCELLED_BY_USER: {
    label: "Cancelled by traveler",
    detail: "The traveler cancelled this booking. Refund handling has already been applied in the prototype flow.",
    tone: "warning",
    badgeClassName:
      "border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-200",
  },
  CANCELLED_BY_HOTEL: {
    label: "Cancelled by hotel",
    detail: "The hotel cancelled this stay, so the booking moved into a refund path and is no longer actionable.",
    tone: "warning",
    badgeClassName:
      "border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-200",
  },
  CANCELLED_NO_REFUND: {
    label: "Cancelled without refund",
    detail: "The booking was closed without refund under the current prototype policy.",
    tone: "warning",
    badgeClassName:
      "border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-200",
  },
  NO_SHOW: {
    label: "No-show logged",
    detail: "The stay was marked as a no-show, and the protected flow has been settled according to the current prototype rules.",
    tone: "warning",
    badgeClassName:
      "border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-200",
  },
  DISPUTED: {
    label: "Dispute opened",
    detail: "A dispute is active, so payout stays frozen while the prototype case is reviewed.",
    tone: "warning",
    badgeClassName:
      "border border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-800/50 dark:bg-orange-950/30 dark:text-orange-200",
  },
};

export function formatBookingAmount(amountPaise: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amountPaise / 100);
}

export function isBookingClosed(status: ProtectedBookingStatus) {
  return CLOSED_BOOKING_STATUSES.includes(status);
}

export function getBookingStatusMeta(status: ProtectedBookingStatus) {
  return STATUS_META[status];
}

export function getCheckoutTimeline(status: ProtectedBookingStatus): CheckoutTimelineStep[] {
  const paymentState: CheckoutStepState =
    status === "PAYMENT_FAILED" ? "attention" : status === "PAYMENT_PENDING" ? "active" : "complete";

  const protectedState: CheckoutStepState =
    status === "PROTECTED" || status === "REFUND_PENDING"
      ? "active"
      : status === "PAYMENT_PENDING" || status === "PAYMENT_FAILED"
        ? "idle"
        : "complete";

  const outcomeState: CheckoutStepState = isBookingClosed(status) ? "active" : "idle";

  return [
    {
      id: "payment",
      label: "Payment stage",
      description:
        status === "PAYMENT_FAILED"
          ? "The payment verification failed, so this booking did not move into protected mode."
          : "A draft reservation has been created and is ready for payment collection.",
      state: paymentState,
    },
    {
      id: "protected",
      label: "Protected hold",
      description: "After payment, the amount stays protected until checkout, cancellation, or a dispute decision.",
      state: protectedState,
    },
    {
      id: "outcome",
      label: "Outcome handling",
      description: STATUS_META[status].detail,
      state: outcomeState,
    },
  ];
}

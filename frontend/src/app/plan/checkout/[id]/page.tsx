"use client";

import { use } from "react";
import { useCheckoutBooking } from "@/hooks/useCheckoutBooking";
import { useRouter } from "next/navigation";
import CheckoutActions from "../components/CheckoutActions";
import CheckoutSummary from "../components/CheckoutSummary";
import { Input } from "@/components/ui/Input";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatusBanner } from "@/components/ui/StatusBanner";
import {
  formatBookingAmount,
  getBookingStatusMeta,
  getCheckoutTimeline,
} from "@/lib/checkout/bookingStatus";
import { useRazorpay } from "@/hooks/useRazorpay";

const stepToneClasses = {
  active:
    "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-950",
  complete:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/30 dark:text-emerald-200",
  idle: "border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-400",
  attention:
    "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800/50 dark:bg-rose-950/30 dark:text-rose-200",
} as const;

export default function CheckoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <CheckoutSession key={id} bookingId={id} />;
}

function CheckoutSession({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const checkout = useCheckoutBooking(bookingId);
  const { booking, loading, error, successMessage } = checkout;
  const checkIn = booking?.check_in_date || "";
  const checkOut = booking?.check_out_date || "";
  const { isCheckoutReady, checkoutError, isProcessing, handlePayment } =
    useRazorpay({
      bookingId,
      booking,
      onSuccess: checkout.paymentSucceeded,
      onError: checkout.paymentError,
    });
  const handleDemoAction = (
    action: "release" | "cancel" | "dispute" | "refund",
  ) => {
    void checkout.act(action);
  };
  const handleAdminAction = (action: "CANCEL" | "NO_SHOW") => {
    void checkout.act(action === "CANCEL" ? "hotel_cancel" : "no_show");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(20,184,166,0.14),_transparent_30%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-4 py-24 dark:bg-[radial-gradient(circle_at_top,_rgba(20,184,166,0.18),_transparent_26%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)]">
        <div className="mx-auto max-w-6xl animate-pulse space-y-6">
          <div className="h-10 w-56 rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="grid gap-6 lg:grid-cols-[1.05fr,0.95fr]">
            <div className="h-[440px] rounded-[2rem] bg-white/80 dark:bg-slate-900/70" />
            <div className="h-[440px] rounded-[2rem] bg-white/80 dark:bg-slate-900/70" />
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(20,184,166,0.14),_transparent_30%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-4 py-24 dark:bg-[radial-gradient(circle_at_top,_rgba(20,184,166,0.18),_transparent_26%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)]">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-slate-200 bg-white/95 p-8 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.4)] dark:border-slate-800 dark:bg-slate-950/85">
          <StatusBanner tone="danger" title="Checkout unavailable">
            {error || "This booking could not be loaded."}
          </StatusBanner>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void checkout.refresh()}
              className="rounded-full border px-5 py-3"
            >
              Reload booking
            </button>
            <button
              type="button"
              onClick={() => router.push("/plan")}
              className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              Return to planner
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statusMeta = getBookingStatusMeta(booking.status);
  const timeline = getCheckoutTimeline(booking.status);
  const dateMissing = !checkIn || !checkOut;
  const canStartPayment = booking.status === "PAYMENT_PENDING";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(20,184,166,0.14),_transparent_30%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-4 py-20 dark:bg-[radial-gradient(circle_at_top,_rgba(20,184,166,0.18),_transparent_26%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)]">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/80 md:p-10">
          <SectionHeader
            eyebrow="Protected stay"
            title="Checkout and payout control"
            description="Review the booking, complete test-mode payment protection, and simulate post-stay outcomes from one guided screen."
            actions={
              <button
                type="button"
                onClick={() => router.push("/plan")}
                className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                Back to planner
              </button>
            }
          />

          <div className="mt-8 flex flex-wrap gap-3">
            <div
              className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold ${statusMeta.badgeClassName}`}
            >
              {statusMeta.label}
            </div>
            <div className="inline-flex items-center rounded-full border border-slate-200 bg-white/85 px-4 py-2 text-sm font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
              Test-mode prototype
            </div>
            <div className="inline-flex items-center rounded-full border border-slate-200 bg-white/85 px-4 py-2 text-sm font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
              {formatBookingAmount(booking.amount_paise, booking.currency)}
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {timeline.map((step, index) => (
              <div
                key={step.id}
                className={`rounded-2xl border px-4 py-4 ${stepToneClasses[step.state]}`}
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.22em]">
                  Step {index + 1}
                </p>
                <p className="mt-2 text-lg font-bold">{step.label}</p>
                <p className="mt-2 text-sm opacity-85">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {error ? (
          <StatusBanner tone="danger" title="Checkout update failed">
            {error}
          </StatusBanner>
        ) : null}

        {checkout.uncertain && (
          <StatusBanner tone="warning" title="Booking outcome unconfirmed">
            <p>
              The last request may already have taken effect. Refresh and review
              the current booking before another action. Refreshing does not
              cancel or reconcile a provider operation.
            </p>
            <button
              type="button"
              className="mt-3 rounded border px-4 py-2"
              disabled={isProcessing || checkout.isActing}
              onClick={() => void checkout.refresh()}
            >
              Refresh booking status
            </button>
            {checkout.reviewed &&
              !(
                checkout.paymentUncertain &&
                booking.status === "PAYMENT_PENDING"
              ) && (
                <button
                  type="button"
                  className="ml-2 mt-3 rounded border px-4 py-2"
                  onClick={checkout.acknowledge}
                >
                  I've reviewed — enable actions
                </button>
              )}
            {checkout.paymentUncertain &&
              booking.status === "PAYMENT_PENDING" && (
                <p className="mt-3">
                  Payment is still unconfirmed. Do not pay again; provider
                  reconciliation is required if the booking does not update.
                </p>
              )}
          </StatusBanner>
        )}

        {successMessage ? (
          <StatusBanner tone="success" title="Checkout updated">
            {successMessage}
          </StatusBanner>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1.05fr,0.95fr]">
          <CheckoutSummary booking={booking} />

          <section className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200/80 bg-white/95 p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-slate-950/80 md:p-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
                  Travel dates
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
                  Locked itinerary window
                </h2>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Input
                  type="date"
                  value={checkIn}
                  readOnly
                  label="Check-in"
                  className="cursor-not-allowed bg-slate-50 dark:bg-slate-900"
                />
                <Input
                  type="date"
                  value={checkOut}
                  readOnly
                  label="Check-out"
                  className="cursor-not-allowed bg-slate-50 dark:bg-slate-900"
                />
              </div>

              <div className="mt-5 space-y-4">
                {checkoutError && canStartPayment ? (
                  <StatusBanner
                    tone="danger"
                    title="Secure checkout unavailable"
                  >
                    {checkoutError}
                  </StatusBanner>
                ) : null}
                <StatusBanner tone={statusMeta.tone} title={statusMeta.label}>
                  {statusMeta.detail}
                </StatusBanner>

                {dateMissing ? (
                  <StatusBanner tone="warning" title="Missing trip dates">
                    This booking draft does not include both check-in and
                    check-out yet, so secure checkout cannot begin.
                  </StatusBanner>
                ) : null}

                {canStartPayment ? (
                  <button
                    type="button"
                    onClick={() => void handlePayment(checkIn, checkOut)}
                    disabled={
                      isProcessing ||
                      checkout.uncertain ||
                      !isCheckoutReady ||
                      dateMissing
                    }
                    className="w-full rounded-[1.5rem] bg-slate-950 px-5 py-4 text-base font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                  >
                    {isProcessing
                      ? "Processing payment..."
                      : checkoutError
                        ? "Secure checkout unavailable"
                        : !isCheckoutReady
                          ? "Loading secure checkout..."
                          : "Pay securely in test mode"}
                  </button>
                ) : null}
              </div>
            </div>

            <CheckoutActions
              booking={booking}
              handleDemoAction={handleDemoAction}
              handleAdminAction={handleAdminAction}
              isProcessing={
                isProcessing || checkout.isActing || checkout.uncertain
              }
            />
          </section>
        </div>
      </div>
    </div>
  );
}

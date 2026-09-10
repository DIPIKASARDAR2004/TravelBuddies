import React from "react";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { formatBookingAmount } from "@/lib/checkout/bookingStatus";
import { ProtectedBooking } from "@/types";

interface CheckoutSummaryProps {
  booking: ProtectedBooking;
}

const coverageItems = [
  "Payment stays protected until the trip outcome is recorded.",
  "Traveler and hotel actions are grouped into one guided review flow.",
  "This is a prototype flow, so live hotel inventory is not confirmed here.",
];

export default function CheckoutSummary({ booking }: CheckoutSummaryProps) {
  const hotelName = booking.hotel_snapshot?.name || "Selected hotel";
  const hotelLocation = booking.hotel_snapshot?.location || booking.destination;
  const perNightAmount = booking.nights > 0 ? booking.amount_paise / booking.nights : booking.amount_paise;

  return (
    <section className="space-y-5 rounded-[2rem] border border-slate-200/80 bg-white/95 p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-slate-950/80 md:p-8">
      <div className="space-y-4">
        <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          Booking Summary
        </div>

        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white">{hotelName}</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{hotelLocation}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/70">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Travelers</p>
          <p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{booking.travellers}</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Auto-arranged into {booking.rooms} room{booking.rooms === 1 ? "" : "s"}.
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/70">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Stay Length</p>
          <p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
            {booking.nights} night{booking.nights === 1 ? "" : "s"}
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Destination: {booking.destination}</p>
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-900/70">
        <div className="flex items-end justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Protected amount</p>
            <p className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
              {formatBookingAmount(booking.amount_paise, booking.currency)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Per night</p>
            <p className="mt-2 text-lg font-bold text-slate-700 dark:text-slate-200">
              {formatBookingAmount(perNightAmount, booking.currency)}
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {coverageItems.map((item) => (
            <div key={item} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
              <span className="mt-1 h-2.5 w-2.5 rounded-full bg-teal-500" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      <StatusBanner title="Prototype note">
        This reservation is for product validation only. Payment actions here simulate the protected booking flow without confirming
        live inventory or moving real traveler funds.
      </StatusBanner>
    </section>
  );
}

"use client";

import Link from "next/link";
import { FaArrowRight } from "react-icons/fa";

export default function EscrowBanner() {
  return (
    <section className="mx-auto mt-16 w-full max-w-6xl px-6 pb-16">
      <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white/90 px-8 py-10 shadow-[0_28px_90px_-48px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/80 md:px-10">
        <div className="absolute -right-14 top-1/2 h-52 w-52 -translate-y-1/2 rounded-full bg-sky-100 blur-3xl dark:bg-sky-950/30" />
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Protected checkout</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white md:text-4xl">
              Your payment stays protected until the trip starts to become real.
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              The escrow layer is now presented as part of a cleaner product promise instead of a detached footer block.
            </p>
          </div>

          <Link
            href="/policies"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition-colors hover:text-sky-600 dark:text-slate-200 dark:hover:text-sky-400"
          >
            Learn how protected checkout works
            <FaArrowRight className="text-xs" />
          </Link>
        </div>
      </div>
    </section>
  );
}

import React from "react";
import { FiArrowRight, FiCheckCircle } from "react-icons/fi";
import Link from "next/link";
import TransportSearchForm from "@/components/transport/TransportSearchForm";
import TransportFooter from "@/components/transport/TransportFooter";
import { SectionHeader } from "@/components/ui/SectionHeader";

interface OfferCard {
  image: string;
  title: string;
  description: string;
}

interface TransportLandingProps {
  title: string;
  subtitle: string;
  logoSrc: string;
  transportLabel: string;
  accent: "sky" | "amber";
  offers: OfferCard[];
  footerTitle: string;
  footerSections: Array<{ title: string; body: string }>;
}

export function TransportLanding({
  title,
  subtitle,
  logoSrc,
  transportLabel,
  accent,
  offers,
  footerTitle,
  footerSections,
}: TransportLandingProps) {
  const accentClass =
    accent === "amber"
      ? "bg-[radial-gradient(circle_at_top,#fde68a,transparent_26%),linear-gradient(180deg,#fffaf0_0%,#fff 100%)] dark:bg-[radial-gradient(circle_at_top,#78350f,transparent_24%),linear-gradient(180deg,#020617_0%,#111827_100%)]"
      : "bg-[radial-gradient(circle_at_top,#dbeafe,transparent_26%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] dark:bg-[radial-gradient(circle_at_top,#082f49,transparent_24%),linear-gradient(180deg,#020617_0%,#111827_100%)]";

  const heroGradient =
    accent === "amber"
      ? "from-amber-500 via-orange-500 to-amber-700"
      : "from-sky-600 via-blue-600 to-indigo-700";

  return (
    <main className={`min-h-screen ${accentClass}`}>
      <section className="px-4 pb-12 pt-24 sm:px-6 lg:px-8">
        <div className={`mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-gradient-to-br ${heroGradient} p-8 text-white shadow-[0_28px_90px_-48px_rgba(15,23,42,0.9)] md:p-10`}>
          <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-end">
            <div className="space-y-5">
              <div className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-bold uppercase tracking-[0.22em] text-white/95">
                {transportLabel} discovery
              </div>
              <h1 className="max-w-2xl text-4xl font-black tracking-tight md:text-5xl">{title}</h1>
              <p className="max-w-2xl text-sm leading-7 text-white/90 md:text-base">{subtitle}</p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/plan"
                  className="inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-slate-100"
                >
                  Move into trip planner
                  <FiArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link
                  href="/safety"
                  className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-white/20"
                >
                  Safety mode
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                "Cleaner booking flow",
                "Route preview summary",
                "Shared design system",
                "Future-ready transport API seam",
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                  <FiCheckCircle className="h-5 w-5" />
                  <p className="mt-3 text-sm font-semibold">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6 lg:px-8">
        <TransportSearchForm title={`Book ${transportLabel} tickets`} logoSrc={logoSrc} transportLabel={transportLabel} />
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Featured options"
          title={`${transportLabel} picks worth noticing`}
          description="These cards keep the page useful today while giving us a cleaner, maintainable structure to plug real booking data into later."
        />

        <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {offers.map((offer) => (
            <article
              key={offer.title}
              className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white/90 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-950/75"
            >
              <div className="relative h-52 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent" />
                <img src={offer.image} alt={offer.title} className="h-full w-full object-cover" />
              </div>
              <div className="space-y-3 p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">Special pick</p>
                <h3 className="text-lg font-black tracking-tight text-slate-950 dark:text-white">{offer.title}</h3>
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{offer.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <TransportFooter title={footerTitle} sections={footerSections} />
    </main>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FiArrowRight, FiCompass, FiShield, FiStar } from "react-icons/fi";
import HotelSearchForm from "./components/HotelSearchForm";
import HotelCard from "./components/HotelCard";
import { hotels } from "@/data/mockHotels";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { Button } from "@/components/ui/Button";

export default function ExplorePage() {
  const [query, setQuery] = useState("");
  const [guests, setGuests] = useState("2");
  const [searchTerm, setSearchTerm] = useState("");

  const normalized = searchTerm.trim().toLowerCase();
  const filteredHotels = !normalized
    ? hotels
    : hotels.filter((hotel) =>
        `${hotel.name} ${hotel.location}`.toLowerCase().includes(normalized),
      );

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#e0f2fe,transparent_28%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] dark:bg-[radial-gradient(circle_at_top,#082f49,transparent_24%),linear-gradient(180deg,#020617_0%,#111827_100%)]">
      <section className="relative overflow-hidden px-4 pb-20 pt-24 sm:px-6 lg:px-8">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?q=80&w=2000&auto=format&fit=crop"
            alt="Luxury hotel exterior"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.35)_0%,rgba(2,6,23,0.72)_100%)]" />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-bold uppercase tracking-[0.22em] text-white backdrop-blur">
              Curated stay discovery
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white md:text-6xl">
              Explore stays that are easier to turn into a full trip plan
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-100 md:text-base">
              Browse premium inventory, narrow the shortlist quickly, then jump directly into planning and safer booking flows when something fits.
            </p>
          </div>

          <HotelSearchForm
            query={query}
            guests={guests}
            onQueryChange={setQuery}
            onGuestsChange={setGuests}
            onSearch={() => setSearchTerm(query)}
          />

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/plan${query.trim() ? `?destination=${encodeURIComponent(query.trim())}&travellers=${encodeURIComponent(guests)}` : ""}`}
              className="inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-slate-100"
            >
              Start planning this trip
              <FiArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href="/safety"
              className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur transition-colors hover:bg-white/20"
            >
              Open safety mode
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <div className="space-y-8">
            <SectionHeader
              eyebrow="Handpicked inventory"
              title={searchTerm ? `Results for "${searchTerm}"` : "Exceptional stays worth shortlisting"}
              description="This browse view is lighter-weight than the planner, but now it uses the same product language and smoother handoff into the main travel flow."
            />

            {filteredHotels.length === 0 ? (
              <StatusBanner tone="warning" title="No matching stays">
                Try another destination keyword or go directly to the planner for package-based recommendations.
              </StatusBanner>
            ) : null}

            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {filteredHotels.map((hotel) => (
                <HotelCard key={hotel.id} hotel={hotel} />
              ))}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-[1.75rem] border border-slate-200 bg-white/85 p-6 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/75">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Why this page changed</p>
              <div className="mt-5 space-y-4">
                {[
                  { icon: FiCompass, title: "Better route into planning", body: "Search results now hand off cleanly into the planner instead of acting like a dead-end gallery." },
                  { icon: FiShield, title: "Safer travel context", body: "Users can jump into safety mode without losing the trip-discovery thread." },
                  { icon: FiStar, title: "Consistent visual system", body: "Cards, headings, and banners now align with the rest of the redesign." },
                ].map((item) => (
                  <div key={item.title} className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
                    <item.icon className="h-5 w-5 text-sky-500" />
                    <p className="mt-3 text-sm font-bold text-slate-950 dark:text-white">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>

            <Button fullWidth size="lg" className="py-4" onClick={() => setSearchTerm(query)}>
              Refresh results
            </Button>
          </aside>
        </div>
      </section>
    </main>
  );
}

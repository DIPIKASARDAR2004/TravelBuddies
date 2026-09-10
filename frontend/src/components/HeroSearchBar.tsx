"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaCalendarAlt, FaMapMarkerAlt, FaUser } from "react-icons/fa";

interface HeroSearchBarProps {
  destinationDefault?: string;
  travellersDefault?: string;
}

export default function HeroSearchBar({
  destinationDefault = "",
  travellersDefault = "2",
}: HeroSearchBarProps) {
  const router = useRouter();
  const [destination, setDestination] = useState(destinationDefault);
  const [travellers, setTravellers] = useState(travellersDefault);

  const handleExplore = () => {
    const params = new URLSearchParams();
    if (destination.trim()) params.set("destination", destination.trim());
    if (travellers.trim()) params.set("travellers", travellers.trim());
    router.push(`/plan${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <div className="w-full max-w-5xl mx-auto rounded-[2rem] border border-white/30 bg-white/95 p-3 shadow-[0_32px_90px_-48px_rgba(15,23,42,0.8)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <div className="grid gap-2 md:grid-cols-[1.4fr_0.9fr_0.9fr_1fr]">
        <label className="flex items-center gap-3 rounded-[1.5rem] px-5 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/80">
          <FaMapMarkerAlt className="text-slate-400 text-lg" />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Where to?</span>
            <input
              type="text"
              placeholder="Search destination"
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              className="bg-transparent pt-1 text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-200"
            />
          </div>
        </label>

        <div className="flex items-center gap-3 rounded-[1.5rem] px-5 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/80">
          <FaCalendarAlt className="text-slate-400 text-lg" />
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Trip planning</span>
            <span className="pt-1 text-sm text-slate-600 dark:text-slate-300">Pick dates in the planner</span>
          </div>
        </div>

        <label className="flex items-center gap-3 rounded-[1.5rem] px-5 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/80">
          <FaUser className="text-slate-400 text-lg" />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Travellers</span>
            <input
              type="number"
              min="1"
              value={travellers}
              onChange={(event) => setTravellers(event.target.value)}
              className="bg-transparent pt-1 text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-200"
            />
          </div>
        </label>

        <button
          onClick={handleExplore}
          className="rounded-[1.5rem] bg-slate-950 px-6 py-4 text-sm font-bold text-white transition-all hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
        >
          Start planning
        </button>
      </div>
    </div>
  );
}

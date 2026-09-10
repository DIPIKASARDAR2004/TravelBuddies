"use client";

import React, { useState } from "react";
import { FaClock, FaLandmark, FaMapMarkedAlt, FaRoute, FaTree } from "react-icons/fa";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatusBanner } from "@/components/ui/StatusBanner";

interface RouteOption {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  duration?: string;
  toneClassName: string;
}

const routes: RouteOption[] = [
  {
    id: 1,
    title: "Scenic route",
    description: "Bias toward rivers, hills, and open viewpoints when the journey matters as much as the destination.",
    icon: <FaTree className="text-xl" />,
    duration: "2-3 hrs",
    toneClassName:
      "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/30 dark:text-emerald-200",
  },
  {
    id: 2,
    title: "Cultural trail",
    description: "Prioritize temples, museums, markets, and other historical anchors along the way.",
    icon: <FaLandmark className="text-xl" />,
    duration: "3-4 hrs",
    toneClassName:
      "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-200",
  },
  {
    id: 3,
    title: "Quick route",
    description: "Optimize for time efficiency when the plan needs tighter transit windows or earlier returns.",
    icon: <FaClock className="text-xl" />,
    duration: "1 hr",
    toneClassName:
      "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-800/50 dark:bg-sky-950/30 dark:text-sky-200",
  },
  {
    id: 4,
    title: "Hidden gems",
    description: "Surface lower-traffic stops and side quests when you want the route to feel less obvious.",
    icon: <FaMapMarkedAlt className="text-xl" />,
    toneClassName:
      "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-800/50 dark:bg-violet-950/30 dark:text-violet-200",
  },
];

export default function ExploreRoutes() {
  const [selectedRoute, setSelectedRoute] = useState<RouteOption>(routes[0]);

  return (
    <section className="space-y-6 rounded-[2rem] border border-slate-200/80 bg-white/90 p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.3)] dark:border-slate-800 dark:bg-slate-950/75 md:p-8">
      <SectionHeader
        eyebrow="Route ideas"
        title="Try a different trip lens"
        description="These route modes help you quickly reframe the day before committing to one map-first itinerary."
        actions={
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            <FaRoute className="text-slate-400" />
            4 route styles
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.15fr,0.85fr]">
        <div className="grid gap-3">
          {routes.map((route) => {
            const isActive = selectedRoute.id === route.id;

            return (
              <button
                key={route.id}
                type="button"
                onClick={() => setSelectedRoute(route)}
                className={`rounded-[1.5rem] border px-5 py-5 text-left transition ${
                  isActive
                    ? "border-slate-900 bg-slate-900 text-white shadow-[0_24px_45px_-32px_rgba(15,23,42,0.75)] dark:border-white dark:bg-white dark:text-slate-950"
                    : "border-slate-200 bg-slate-50/80 text-slate-700 hover:border-slate-300 hover:bg-white dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-900"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${
                        isActive
                          ? "border-white/15 bg-white/10 text-white dark:border-slate-200 dark:bg-slate-100 dark:text-slate-950"
                          : route.toneClassName
                      }`}
                    >
                      {route.icon}
                    </div>
                    <div>
                      <p className="text-lg font-bold">{route.title}</p>
                      <p className={`mt-2 text-sm leading-6 ${isActive ? "text-white/85 dark:text-slate-700" : "text-slate-500 dark:text-slate-400"}`}>
                        {route.description}
                      </p>
                    </div>
                  </div>

                  {route.duration ? (
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] ${
                        isActive
                          ? "bg-white/12 text-white dark:bg-slate-100 dark:text-slate-950"
                          : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      {route.duration}
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>

        <div className="space-y-4 rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-900/70">
          <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] ${selectedRoute.toneClassName}`}>
            {selectedRoute.icon}
            Active route
          </div>

          <div>
            <h3 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">{selectedRoute.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{selectedRoute.description}</p>
          </div>

          <div className="rounded-[1.25rem] border border-dashed border-slate-300 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-950/60">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">Best for</p>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {selectedRoute.title === "Quick route"
                ? "Trips with tighter daylight windows, quicker transfers, or a stronger focus on punctual arrivals."
                : selectedRoute.title === "Scenic route"
                  ? "Relaxed travel days where the route itself should feel like part of the experience."
                  : selectedRoute.title === "Cultural trail"
                    ? "First-time visits where context and landmark density matter more than speed."
                    : "Repeat visits and curious travelers who want a less crowded, less predictable plan."}
            </p>
          </div>

          <StatusBanner title="Prototype behavior">
            Route modes currently act as planning prompts. They do not yet re-compute the Google map automatically, but they help frame which itinerary style to refine next.
          </StatusBanner>
        </div>
      </div>
    </section>
  );
}

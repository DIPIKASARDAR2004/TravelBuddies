"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import ExploreRoutes from "./exploreRoutes";
import GoogleTripMap from "./GoogleTripMap";
import DayWiseItinerary from "./DayWiseItinerary";
import { usePlanStore } from "@/store/usePlanStore";
import { FaArrowLeft } from "react-icons/fa";
import { EnrichedItineraryDay } from "@/types";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatusBanner } from "@/components/ui/StatusBanner";
import {
  DRAFT_ACTIVITIES_PER_DAY,
  getItineraryActivities,
} from "@/lib/itinerary/buildDayItinerary";

export default function MapPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [showExplore, setShowExplore] = useState(false);
  const { customizedPlan, tripDetails } = usePlanStore();
  const [enrichedItinerary, setEnrichedItinerary] = useState<
    EnrichedItineraryDay[]
  >([]);
  const unscheduled = getItineraryActivities(customizedPlan).slice(
    tripDetails.days * DRAFT_ACTIVITIES_PER_DAY,
  );

  if (!mounted)
    return (
      <p role="status" className="p-8">
        Loading your selected trip…
      </p>
    );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#dbeafe,transparent_26%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] pt-28 pb-12 px-4 dark:bg-[radial-gradient(circle_at_top,#082f49,transparent_24%),linear-gradient(180deg,#020617_0%,#111827_100%)] sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <Link
          href={tripDetails.isSafetyTrip ? "/safety" : "/plan"}
          className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 font-medium transition-colors mb-6 bg-white dark:bg-slate-900 px-4 py-2 rounded-full shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md"
        >
          <FaArrowLeft className="text-sm" />
          Back to Trip Planner
        </Link>

        <div className="mb-8 rounded-[2rem] border border-slate-200 bg-white/85 p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/75 md:p-8">
          <SectionHeader
            eyebrow="Map preview"
            title="Interactive trip map"
            description="See how the selected stay and experiences flow together before checkout, including estimated route legs and late-return guidance."
            actions={
              <button
                onClick={() => setShowExplore(!showExplore)}
                className="rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-sky-700"
              >
                {showExplore ? "Hide nearby routes" : "Explore nearby routes"}
              </button>
            }
          />

          {!customizedPlan ? (
            <div className="mt-6">
              <StatusBanner title="No plan selected">
                Finish the package selection step first, then come back here to
                preview the route-aware itinerary.
              </StatusBanner>
            </div>
          ) : null}
        </div>

        {showExplore && (
          <div className="mb-8 p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
            <ExploreRoutes />
          </div>
        )}

        <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800 bg-slate-200 dark:bg-slate-800 flex flex-col mb-10">
          <div className="bg-white/90 dark:bg-slate-900/90 px-4 py-3 shadow-sm border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              Trip map preview
            </h2>
          </div>
          <div className="flex-1 min-h-[200px]">
            <GoogleTripMap
              plan={customizedPlan}
              days={tripDetails.days}
              onEnrichedItineraryReady={setEnrichedItinerary}
            />
          </div>
        </div>

        {unscheduled.length > 0 && (
          <StatusBanner
            tone="warning"
            title="Activities outside this draft preview"
          >
            The current preview includes at most {DRAFT_ACTIVITIES_PER_DAY}{" "}
            activities per day. These selections remain in your plan and budget,
            but are not scheduled or routed here:{" "}
            {unscheduled.map((activity) => activity.activity_name).join(", ")}.
            This prototype limit does not confirm that the other activities fit.
          </StatusBanner>
        )}
        <DayWiseItinerary itinerary={enrichedItinerary} />
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import ExploreRoutes from "./exploreRoutes";
import GoogleTripMap from "./GoogleTripMap";
import DayWiseItinerary from "./DayWiseItinerary";
import { usePlanStore } from "@/store/usePlanStore";
import { useRouter } from "next/navigation";
import { FaArrowLeft } from "react-icons/fa";
import { EnrichedItineraryDay } from "@/types";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatusBanner } from "@/components/ui/StatusBanner";

export default function MapPage() {
  const router = useRouter();
  const [showExplore, setShowExplore] = useState(false);
  const { customizedPlan, tripDetails } = usePlanStore();
  const [enrichedItinerary, setEnrichedItinerary] = useState<EnrichedItineraryDay[]>([]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#dbeafe,transparent_26%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] pt-28 pb-12 px-4 dark:bg-[radial-gradient(circle_at_top,#082f49,transparent_24%),linear-gradient(180deg,#020617_0%,#111827_100%)] sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <button 
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 font-medium transition-colors mb-6 bg-white dark:bg-slate-900 px-4 py-2 rounded-full shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md"
        >
          <FaArrowLeft className="text-sm" />
          Back to Trip Planner
        </button>

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
                Finish the package selection step first, then come back here to preview the route-aware itinerary.
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
              Live Trip Map
            </h2>
          </div>
          <div className="flex-1 h-[60vh] min-h-[500px] dark:contrast-125 dark:saturate-50 dark:brightness-75 dark:invert dark:hue-rotate-[180deg] [&_img]:transition-all">
            <GoogleTripMap 
              plan={customizedPlan} 
              days={tripDetails.days}
              onEnrichedItineraryReady={(itinerary) => setEnrichedItinerary(itinerary)}
            />
          </div>
        </div>

        <DayWiseItinerary itinerary={enrichedItinerary} />
      </div>
    </div>
  );
}

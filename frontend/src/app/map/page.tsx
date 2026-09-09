"use client";

import React, { useState } from "react";
import ExploreRoutes from "./exploreRoutes";
import GoogleTripMap from "./GoogleTripMap";
import { usePlanStore } from "@/store/usePlanStore";


export default function MapPage() {
  const [showExplore, setShowExplore] = useState(false);
  const { customizedPlan } = usePlanStore();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-28 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Interactive Trip <span className="text-blue-600 dark:text-blue-400">Map</span></h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">View your custom itinerary and explore nearby routes.</p>
          </div>
          
          <button
            onClick={() => setShowExplore(!showExplore)}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl shadow-md hover:bg-blue-700 hover:shadow-lg transition-all"
          >
            {showExplore ? "Hide Routes" : "Explore Routes"}
          </button>
        </div>

        {showExplore && (
          <div className="mb-8 p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
            <ExploreRoutes />
          </div>
        )}
        
        <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800 bg-slate-200 dark:bg-slate-800 flex flex-col">
          <div className="bg-white/90 dark:bg-slate-900/90 px-4 py-3 shadow-sm border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              Live Trip Map
            </h2>
          </div>
          {/* Apply CSS filters for dark mode map rendering */}
          <div className="flex-1 h-[60vh] min-h-[500px] dark:contrast-125 dark:saturate-50 dark:brightness-75 dark:invert dark:hue-rotate-[180deg] [&_img]:transition-all">
            <GoogleTripMap plan={customizedPlan} />
          </div>
        </div>
      </div>
    </div>
  );
}

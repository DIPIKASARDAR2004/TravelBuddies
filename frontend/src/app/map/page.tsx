"use client";

import React, { useState } from "react";
import ExploreRoutes from "./exploreRoutes";
import GoogleTripMap from "./GoogleTripMap";
import { usePlanStore } from "@/store/usePlanStore";


export default function MapPage() {
  const [showExplore, setShowExplore] = useState(false);
  const { customizedPlan } = usePlanStore();

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Map</h1>

      <button
        onClick={() => setShowExplore(!showExplore)}
        className="mb-6 px-6 py-3 bg-blue-500 text-white rounded-full shadow hover:bg-blue-600 transition"
      >
        {showExplore ? "Hide Routes" : "Explore Routes"}
      </button>

      {showExplore && <ExploreRoutes />}
      
      <div className="mb-10">
        <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">Trip Map</h2>
        <GoogleTripMap plan={customizedPlan} />
      </div>
    </div>
  );
}

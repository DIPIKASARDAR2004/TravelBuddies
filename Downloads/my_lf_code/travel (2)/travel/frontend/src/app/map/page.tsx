"use client";

import React, { useState } from "react";
import ExploreRoutes from "./exploreRoutes";

export default function MapPage() {
  const [showExplore, setShowExplore] = useState(false);

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
    </div>
  );
}

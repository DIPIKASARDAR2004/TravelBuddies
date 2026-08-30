"use client";

import React from "react";
import { usePlanStore } from "@/store/usePlanStore";

import PlanForm from "./components/PlanForm";
import TierSelector from "./components/TierSelector";
import TripCustomizer from "./components/TripCustomizer";
import SwapModal from "./components/SwapModal";

export default function PlanPage() {
  const { view } = usePlanStore();

  return (
    <div className="min-h-screen">
      <main className="max-w-6xl mx-auto px-4 py-8 pt-24">
        {view === "FORM" && <PlanForm />}
        {view === "TIERS" && <TierSelector />}
        {view === "CUSTOMIZE" && <TripCustomizer />}
      </main>
      <SwapModal />
    </div>
  );
}

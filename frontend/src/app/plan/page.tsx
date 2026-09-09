"use client";

import React, { useState, useEffect } from "react";
import { usePlanStore } from "@/store/usePlanStore";

import PlanForm from "./components/PlanForm";
import TierSelector from "./components/TierSelector";
import TripCustomizer from "./components/TripCustomizer";
import SwapModal from "./components/SwapModal";

export default function PlanPage() {
  const { view } = usePlanStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <main className="max-w-6xl mx-auto px-4 py-8">
        {view === "FORM" && <PlanForm />}
        {view === "TIERS" && <TierSelector />}
        {view === "CUSTOMIZE" && <TripCustomizer />}
      </main>
      <SwapModal />
    </div>
  );
}

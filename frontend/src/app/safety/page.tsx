"use client";

import React, { useEffect, useState } from "react";
import { usePlanStore } from "@/store/usePlanStore";
import { motion } from "framer-motion";
import { FiShield, FiInfo, FiAlertTriangle } from "react-icons/fi";

// Planner Components
import PlanForm from "../plan/components/PlanForm";
import TierSelector from "../plan/components/TierSelector";
import TripCustomizer from "../plan/components/TripCustomizer";
import SwapModal from "../plan/components/SwapModal";
import TrustedContacts from "@/components/safety/trustedcontacts";
import SOSButton from "@/components/safety/sosbutton";
import LocationTracking from "@/components/safety/locationtracker";
import NearbySafetyServices from "@/components/safety/nearbyservices";
import SafeStay from "@/components/safety/safestay";

export default function WomenSafetyPage() {
  const { view, resetStore } = usePlanStore();
  const [mounted, setMounted] = useState(false);

  // Reset the store when mounting this page so it doesn't carry over standard trips
  // BUT don't reset if we are just returning from the map for an active safety trip
  useEffect(() => {
    if (usePlanStore.getState().tripDetails.isSafetyTrip !== true) {
      resetStore();
    }
    setMounted(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Section 1: Women Safety Introduction */}
      <section className="bg-gradient-to-r from-rose-500 to-pink-600 dark:from-rose-900 dark:to-pink-950 text-white py-12 px-6 rounded-b-[40px] shadow-sm mb-12">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 flex items-center justify-center gap-3">
            <FiShield className="text-4xl md:text-5xl" />
            Women Safety Planner
          </h1>
          <p className="text-rose-100 max-w-2xl mx-auto text-sm md:text-base leading-relaxed bg-black/10 p-3 rounded-lg backdrop-blur-sm">
            <FiInfo className="inline mb-1 mr-1" />
            Plan your trip with confidence. All hotels recommended here are strictly verified as women-friendly. 
            Journey Pilot provides this information to help you make informed decisions, but it does not guarantee absolute safety.
          </p>
        </div>
      </section>

      {/* Section 2: Women-Friendly Trip Planner */}
      <div className="max-w-6xl mx-auto px-4 mb-16">
        {view === "FORM" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            {/* Pass womenOnly={true} to force the backend to filter hotels */}
            <PlanForm womenOnly={true} />
          </motion.div>
        )}
        
        {view === "TIERS" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <TierSelector />
          </motion.div>
        )}
        
        {view === "CUSTOMIZE" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <TripCustomizer />
          </motion.div>
        )}
      </div>

      {/* Section 3: Safety Actions */}
      <div className="max-w-4xl mx-auto px-4 space-y-8 pt-12 border-t border-slate-200 dark:border-slate-800">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center justify-center gap-2">
            <FiShield className="text-rose-500" />
            Safety Actions & Help
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Essential safety tools and contacts available at any time.</p>
        </div>

        <TrustedContacts />

        <SOSButton />
        <LocationTracking />

        <SafeStay />

        <NearbySafetyServices />

        {/* Late Return Notice */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-5 flex gap-4 items-start">
          <FiAlertTriangle className="text-amber-500 text-xl flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-800 dark:text-amber-400">Late Return Notice</h3>
            <p className="text-sm text-amber-700/80 dark:text-amber-400/80 mt-1">
              Consider arranging trusted transport in advance if you plan to return to your hotel late.
            </p>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-center text-slate-400 dark:text-slate-500 mt-8 px-4">
          <strong>Disclaimer:</strong> Journey Pilot does not guarantee that any hotel, area, or route is completely safe. Always exercise caution, rely on official authorities, and use your personal judgment while traveling.
        </p>
      </div>

      <SwapModal />
    </main>
  );
}

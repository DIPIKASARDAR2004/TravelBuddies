"use client";

import { useEffect } from "react";
import { usePlanStore } from "@/store/usePlanStore";
import { motion } from "framer-motion";
import { FiShield, FiInfo, FiPhoneCall, FiShare2, FiUsers, FiAlertTriangle } from "react-icons/fi";
import { MdLocalPolice, MdLocalHospital } from "react-icons/md";

// Planner Components
import PlanForm from "../plan/components/PlanForm";
import TierSelector from "../plan/components/TierSelector";
import TripCustomizer from "../plan/components/TripCustomizer";
import SwapModal from "../plan/components/SwapModal";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function WomenSafetyPage() {
  const { view, resetStore } = usePlanStore();

  // Reset the store when mounting this page so it doesn't carry over standard trips
  useEffect(() => {
    resetStore();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

        {/* SOS & Emergency Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button variant="danger" size="lg" className="col-span-2 md:col-span-1 flex flex-col items-center gap-2 h-auto py-6 relative overflow-hidden group bg-red-600 hover:bg-red-700 shadow-md shadow-red-500/20">
            <FiAlertTriangle className="text-3xl animate-pulse group-hover:scale-110 transition-transform text-white" />
            <span className="font-bold text-white">Emergency SOS</span>
            <div className="absolute top-2 right-2 text-[9px] font-bold tracking-wider bg-white/20 px-1.5 py-0.5 rounded uppercase text-white">Demo</div>
          </Button>

          <Button variant="danger" size="lg" className="col-span-2 md:col-span-1 flex flex-col items-center gap-2 h-auto py-6 relative overflow-hidden group">
            <FiPhoneCall className="text-2xl group-hover:scale-110 transition-transform" />
            <span>Emergency Help</span>
            <div className="absolute top-2 right-2 text-[9px] font-bold tracking-wider bg-white/20 px-1.5 py-0.5 rounded uppercase text-white">Demo</div>
          </Button>
          
          <Button variant="outline" size="lg" className="col-span-2 md:col-span-1 flex flex-col items-center gap-2 h-auto py-6 relative group border-slate-200 dark:border-slate-700">
            <FiShare2 className="text-2xl group-hover:scale-110 transition-transform" />
            <span>Share Trip</span>
            <div className="absolute top-2 right-2 text-[9px] font-bold tracking-wider bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded uppercase">Demo</div>
          </Button>
          
          <Button variant="outline" size="lg" className="col-span-2 md:col-span-1 flex flex-col items-center gap-2 h-auto py-6 relative group border-slate-200 dark:border-slate-700">
            <FiUsers className="text-2xl group-hover:scale-110 transition-transform" />
            <span>Trusted Contact</span>
            <div className="absolute top-2 right-2 text-[9px] font-bold tracking-wider bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded uppercase">Demo</div>
          </Button>
        </div>

        {/* Nearby Help UI */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-start gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <MdLocalPolice className="text-2xl" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 dark:text-white">Nearest Police Station</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Distance: ~1.2 km</p>
              <span className="inline-block mt-2 text-[10px] font-bold tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-1 rounded-md uppercase">Prototype / Demo</span>
            </div>
          </Card>

          <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-start gap-4">
            <div className="p-3 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl">
              <MdLocalHospital className="text-2xl" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 dark:text-white">General Hospital</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Distance: ~3.5 km</p>
              <span className="inline-block mt-2 text-[10px] font-bold tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-1 rounded-md uppercase">Prototype / Demo</span>
            </div>
          </Card>
        </div>

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

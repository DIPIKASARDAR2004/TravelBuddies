"use client";

import React from "react";
import { motion } from "framer-motion";
import { usePlanStore } from "@/store/usePlanStore";
import { PlannerView } from "@/types";
import PlanForm from "@/app/plan/components/PlanForm";
import TierSelector from "@/app/plan/components/TierSelector";
import TripCustomizer from "@/app/plan/components/TripCustomizer";
import SwapModal from "@/app/plan/components/SwapModal";
import { SectionHeader } from "@/components/ui/SectionHeader";

const VIEW_ORDER: PlannerView[] = ["FORM", "TIERS", "CUSTOMIZE"];

interface PlannerExperienceProps {
  mode?: "standard" | "safety";
  eyebrow: string;
  title: string;
  description: string;
  accentClassName?: string;
}

const motionProps = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35 },
};

export function PlannerExperience({
  mode = "standard",
  eyebrow,
  title,
  description,
  accentClassName = "from-sky-500/20 via-cyan-500/10 to-transparent",
}: PlannerExperienceProps) {
  const view = usePlanStore((state) => state.view);

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/90 p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/80 md:p-10">
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-r ${accentClassName}`} />

      <div className="relative space-y-8">
        <SectionHeader eyebrow={eyebrow} title={title} description={description} />

        <div className="grid gap-3 md:grid-cols-3">
          {VIEW_ORDER.map((step, index) => {
            const isActive = step === view;
            const isComplete = VIEW_ORDER.indexOf(view) > index;

            return (
              <div
                key={step}
                className={`rounded-2xl border px-4 py-4 transition-colors ${
                  isActive
                    ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-950"
                    : isComplete
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200"
                      : "border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400"
                }`}
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.22em]">Step {index + 1}</p>
                <p className="mt-2 text-lg font-bold">
                  {step === "FORM" ? "Trip basics" : step === "TIERS" ? "Pick a package" : "Tune the plan"}
                </p>
              </div>
            );
          })}
        </div>

        <motion.div {...motionProps}>
          {view === "FORM" ? <PlanForm womenOnly={mode === "safety"} /> : null}
          {view === "TIERS" ? <TierSelector /> : null}
          {view === "CUSTOMIZE" ? <TripCustomizer /> : null}
        </motion.div>
      </div>

      <SwapModal />
    </section>
  );
}

"use client";

import React from "react";
import { PlannerExperience } from "@/components/planner/PlannerExperience";
import { usePlannerInitialization } from "@/hooks/usePlannerInitialization";

export default function PlanPage() {
  const mounted = usePlannerInitialization(false);

  if (!mounted) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#e0f2fe,transparent_28%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-4 pb-16 pt-10 dark:bg-[radial-gradient(circle_at_top,#082f49,transparent_24%),linear-gradient(180deg,#020617_0%,#0f172a_100%)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <PlannerExperience
          eyebrow="Signature trip planning"
          title="Design a trip that already feels organized before you leave"
          description="Set the basics, compare curated packages, then fine-tune your stay, dining, activities, and budget from one consistent workspace."
        />
      </div>
    </main>
  );
}

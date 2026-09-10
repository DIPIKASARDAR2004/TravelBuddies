"use client";

import React from "react";
import { FiShield, FiInfo, FiAlertTriangle } from "react-icons/fi";
import { PlannerExperience } from "@/components/planner/PlannerExperience";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { usePlannerInitialization } from "@/hooks/usePlannerInitialization";
import TrustedContacts from "@/components/safety/trustedcontacts";
import SOSButton from "@/components/safety/sosbutton";
import LocationTracking from "@/components/safety/locationtracker";
import NearbySafetyServices from "@/components/safety/nearbyservices";
import SafeStay from "@/components/safety/safestay";

export default function WomenSafetyPage() {
  const mounted = usePlannerInitialization(true);

  if (!mounted) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-rose-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#ffe4e6,transparent_26%),linear-gradient(180deg,#fff7f8_0%,#fff 100%)] pb-20 dark:bg-[radial-gradient(circle_at_top,#4c0519,transparent_24%),linear-gradient(180deg,#020617_0%,#111827_100%)]">
      <section className="px-4 pb-8 pt-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="rounded-[2rem] bg-[linear-gradient(135deg,#be123c_0%,#e11d48_55%,#fb7185_100%)] px-6 py-10 text-white shadow-[0_30px_80px_-45px_rgba(190,24,93,0.85)] md:px-10">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-bold uppercase tracking-[0.22em] text-rose-50">
                <FiShield />
                Women safety mode
              </div>
              <h1 className="text-4xl font-black tracking-tight md:text-5xl">Plan with stronger guardrails from the first decision</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-rose-50/90 md:text-base">
                Verified women-friendly stays, safer budgeting, and emergency support tools stay in one workflow so you can plan confidently without context switching.
              </p>
            </div>
          </div>

          <StatusBanner tone="warning" title="Safety note">
            <span className="inline-flex items-center gap-2">
              <FiInfo />
              JourneyPilot helps surface safer options and planning tools, but it does not guarantee absolute safety. Always rely on trusted transport, local authorities, and personal judgment.
            </span>
          </StatusBanner>

          <PlannerExperience
            mode="safety"
            eyebrow="Safer trip planning"
            title="Build a trip with verified stays and a clearer safety budget"
            description="Use the same planner workflow, but keep the recommendations filtered for women-friendly stays and the cost breakdown aligned with safer travel decisions."
            accentClassName="from-rose-500/20 via-pink-500/10 to-transparent"
          />
        </div>
      </section>

      <section className="mx-auto max-w-4xl space-y-8 px-4 pt-8 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Always available"
          title="Safety actions and trip support"
          description="Keep emergency communication, stay reminders, live location sharing, and nearby services within easy reach."
        />
        <TrustedContacts />
        <SOSButton />
        <LocationTracking />
        <SafeStay />
        <NearbySafetyServices />

        <StatusBanner tone="warning" title="Late return planning">
          <span className="inline-flex items-center gap-2">
            <FiAlertTriangle />
            Arrange trusted transport in advance whenever your itinerary suggests a late hotel return.
          </span>
        </StatusBanner>
      </section>
    </main>
  );
}

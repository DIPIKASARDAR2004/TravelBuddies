import React from "react";
import { FiArrowLeft, FiCheck, FiStar } from "react-icons/fi";
import { usePlanStore } from "@/store/usePlanStore";
import { PlannerPackage } from "@/types";
import { selectPlannerPackage } from "@/lib/planner/planUtils";
import { formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatusBanner } from "@/components/ui/StatusBanner";

const tierTheme = {
  "Best Value": {
    ring: "ring-emerald-500/30 border-emerald-200 dark:border-emerald-900/50",
    badge: "from-emerald-500 to-teal-500",
    icon: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300",
    button: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30",
  },
  "Premium Upgrade": {
    ring: "ring-fuchsia-500/30 border-fuchsia-200 dark:border-fuchsia-900/50",
    badge: "from-fuchsia-500 to-rose-500",
    icon: "bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-950/40 dark:text-fuchsia-300",
    button: "bg-fuchsia-600 hover:bg-fuchsia-700 shadow-fuchsia-500/30",
  },
  default: {
    ring: "ring-sky-500/30 border-sky-200 dark:border-sky-900/50",
    badge: "from-sky-500 to-indigo-500",
    icon: "bg-sky-100 text-sky-600 dark:bg-sky-950/40 dark:text-sky-300",
    button: "bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 shadow-slate-900/20",
  },
} as const;

export default function TierSelector() {
  const { apiResponse, setView, setTripDetails, setCustomizedPlan } = usePlanStore();

  if (!apiResponse || !apiResponse.withinBudget) return null;

  const handleSelectTier = (plan: PlannerPackage) => {
    const nextSelection = selectPlannerPackage(plan, apiResponse.totalBudget);
    setTripDetails({ budget: nextSelection.budget });
    setCustomizedPlan(nextSelection.plan);
    setView("CUSTOMIZE");
  };

  const packageCount = apiResponse.withinBudget.length + apiResponse.upgrades.length;

  return (
    <div className="space-y-10">
      <button
        onClick={() => setView("FORM")}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
      >
        <FiArrowLeft />
        Back to trip details
      </button>

      <SectionHeader
        eyebrow="Compare packages"
        title={`Choose from ${packageCount} curated trip option${packageCount === 1 ? "" : "s"}`}
        description={`We found options for ${apiResponse.destination} that balance stay quality, dining, transport, and experiences within or just above your current budget.`}
      />

      <StatusBanner tone="default" title="Budget framing">
        Your current total budget is <strong>{formatINR(apiResponse.totalBudget)}</strong>. Remaining budget figures already include the emergency reserve shown on each card.
      </StatusBanner>

      <div className="grid gap-6 xl:grid-cols-3">
        {apiResponse.withinBudget.map((plan) => {
          const theme = tierTheme[plan.name as keyof typeof tierTheme] ?? tierTheme.default;
          const activitySummary =
            plan.selectedActivities.length > 0
              ? plan.selectedActivities.map((item) => item.activity_name).join(", ")
              : plan.selectedActivity?.activity_name || "No activity selected";

          return (
            <article
              key={`${plan.name}-${plan.selectedHotel?.name ?? "hotel"}`}
              className={`relative flex h-full flex-col rounded-[2rem] border bg-white/85 p-7 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.45)] ring-1 backdrop-blur dark:bg-slate-950/70 ${theme.ring}`}
            >
              <div className={`absolute left-6 top-0 -translate-y-1/2 rounded-full bg-gradient-to-r px-4 py-1 text-xs font-bold uppercase tracking-[0.2em] text-white ${theme.badge}`}>
                {plan.name}
              </div>

              <div className="mt-6 flex flex-1 flex-col gap-6">
                <div className="border-b border-slate-200 pb-6 dark:border-slate-800">
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Trip cost</p>
                  <p className="mt-3 text-4xl font-black tracking-tight text-slate-950 dark:text-white">
                    {formatINR(plan.tripCost)}
                  </p>
                  {plan.tagline ? (
                    <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{plan.tagline}</p>
                  ) : null}
                </div>

                <div className="space-y-4">
                  {[
                    { label: "Stay", value: plan.selectedHotel?.name || "N/A" },
                    { label: "Dining", value: plan.selectedRestaurant?.restaurant_name || "N/A" },
                    { label: "Experience", value: activitySummary },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-3">
                      <div className={`mt-0.5 rounded-xl p-2 ${theme.icon}`}>
                        <FiStar className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
                          {item.label}
                        </p>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4 dark:border-slate-800 dark:bg-slate-900/70">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
                    Remaining budget
                  </p>
                  <p
                    className={`mt-2 text-2xl font-black ${
                      (plan.remainingSpendableBudget ?? plan.remainingBudget) >= 0
                        ? "text-emerald-500"
                        : "text-rose-500"
                    }`}
                  >
                    {formatINR(plan.remainingSpendableBudget ?? plan.remainingBudget)}
                  </p>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Includes an emergency reserve of {formatINR(plan.emergencyReserve)}.
                  </p>
                </div>

                <Button
                  onClick={() => handleSelectTier(plan)}
                  className={`mt-auto w-full py-4 text-base text-white shadow-lg ${theme.button}`}
                >
                  Select and customize
                </Button>
              </div>
            </article>
          );
        })}
      </div>

      {apiResponse.upgrades.length > 0 ? (
        <div className="space-y-6 border-t border-slate-200 pt-10 dark:border-slate-800">
          <SectionHeader
            eyebrow="Stretch options"
            title="Upgrades worth considering"
            description="These packages need a bit more budget, but the trade-offs are explicit so you can decide if the jump is worth it."
          />

          <div className="grid gap-6 xl:grid-cols-3">
            {apiResponse.upgrades.map((plan) => (
              <article
                key={`${plan.name}-${plan.recommendedBudget}-${plan.selectedHotel?.name ?? "hotel"}`}
                className="flex h-full flex-col rounded-[2rem] border border-amber-200 bg-white/85 p-7 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.45)] ring-1 ring-amber-500/20 backdrop-blur dark:border-amber-900/40 dark:bg-slate-950/70"
              >
                <div className="inline-flex w-fit rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-1 text-xs font-bold uppercase tracking-[0.2em] text-white">
                  {plan.name}
                </div>

                <div className="mt-6 flex flex-1 flex-col gap-6">
                  <div className="border-b border-slate-200 pb-6 dark:border-slate-800">
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Recommended budget</p>
                    <p className="mt-3 text-4xl font-black tracking-tight text-slate-950 dark:text-white">
                      {formatINR(plan.recommendedBudget ?? 0)}
                    </p>
                    <p className="mt-3 inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                      +{formatINR(plan.extraNeeded ?? 0)} needed
                    </p>
                  </div>

                  <div className="space-y-3 rounded-2xl bg-amber-50/80 p-4 dark:bg-amber-950/20">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-700 dark:text-amber-300">
                      Upgrade highlights
                    </p>
                    {(plan.upgradeHighlights ?? []).map((highlight) => (
                      <div key={highlight} className="flex gap-2 text-sm text-slate-700 dark:text-slate-200">
                        <FiCheck className="mt-0.5 shrink-0 text-amber-500" />
                        <span>{highlight}</span>
                      </div>
                    ))}
                  </div>

                  <Button onClick={() => handleSelectTier(plan)} className="mt-auto w-full py-4 text-base">
                    Explore this upgrade
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

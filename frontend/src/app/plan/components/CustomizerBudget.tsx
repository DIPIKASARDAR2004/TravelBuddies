import React from "react";
import type { PlannerPackage } from "@/types";
import { formatINR } from "@/lib/utils";
import { SectionHeader } from "@/components/ui/SectionHeader";

export function CustomizerBudget({
  plan,
  budget,
  onBudgetChange,
}: {
  plan: PlannerPackage;
  budget: number;
  onBudgetChange: (value: string) => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_48%,#1d4ed8_100%)] p-8 text-white shadow-[0_30px_90px_-45px_rgba(15,23,42,0.9)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(125,211,252,0.3),transparent_22%),radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.18),transparent_24%)]" />
      <div className="relative space-y-8">
        <SectionHeader
          eyebrow="Live budget control"
          title="Customize the plan without losing budget clarity"
          description="Every swap, add-on, and reserve update is recalculated immediately so you can make trade-offs with confidence."
        />

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-100">
              Total budget
            </p>
            <div className="mt-3 flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/20 px-4 py-3">
              <span className="text-2xl font-black">Rs</span>
              <input
                type="number"
                aria-label="Total trip budget"
                value={budget}
                min="0"
                onChange={(event) => onBudgetChange(event.target.value)}
                className="w-full bg-transparent text-3xl font-black outline-none"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-100">
              Trip cost
            </p>
            <p className="mt-4 text-4xl font-black">
              {formatINR(plan.tripCost)}
            </p>
            <p className="mt-2 text-sm text-slate-200">
              Includes {(plan.extraItems ?? []).length} add-on
              {(plan.extraItems ?? []).length === 1 ? "" : "s"}.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-100">
              Remaining budget
            </p>
            <p
              className={`mt-4 text-4xl font-black ${
                plan.remainingBudget >= 0 ? "text-emerald-300" : "text-rose-300"
              }`}
            >
              {formatINR(plan.remainingBudget)}
            </p>
            <p className="mt-2 text-sm text-slate-200">
              Spendable after reserve:{" "}
              {formatINR(plan.remainingSpendableBudget ?? 0)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

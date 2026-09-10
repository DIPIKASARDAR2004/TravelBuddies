import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { FiCalendar, FiCompass, FiShield } from "react-icons/fi";
import { usePlanStore } from "@/store/usePlanStore";
import { PlannerApiResponse } from "@/types";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { apiClient } from "@/lib/services/apiClient";

interface FormState {
  destination: string;
  budget: string;
  travellers: string;
  startDate: string;
  endDate: string;
}

type FieldErrors = Partial<Record<keyof FormState, string>>;

const INITIAL_FORM: FormState = {
  destination: "",
  budget: "",
  travellers: "2",
  startDate: "",
  endDate: "",
};

export default function PlanForm({ womenOnly = false }: { womenOnly?: boolean }) {
  const searchParams = useSearchParams();
  const { setTripDetails, setApiResponse, setLoading, setView, loading } = usePlanStore();
  const [form, setForm] = useState<FormState>({
    ...INITIAL_FORM,
    destination: searchParams.get("destination") ?? "",
    travellers: searchParams.get("travellers") ?? INITIAL_FORM.travellers,
  });
  const [errors, setErrors] = useState<FieldErrors>({});

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const validate = () => {
    const nextErrors: FieldErrors = {};
    const budgetValue = Number(form.budget);
    const travellersValue = Number(form.travellers);

    if (!form.destination.trim()) nextErrors.destination = "Choose a destination to continue.";
    if (!form.startDate) nextErrors.startDate = "Select a check-in date.";
    if (!form.endDate) nextErrors.endDate = "Select a check-out date.";
    if (!form.budget || Number.isNaN(budgetValue) || budgetValue < 1000) {
      nextErrors.budget = "Enter a total budget of at least Rs 1,000.";
    }
    if (!form.travellers || Number.isNaN(travellersValue) || travellersValue < 1) {
      nextErrors.travellers = "Add at least one traveller.";
    }
    if (form.startDate && form.endDate && new Date(form.endDate) <= new Date(form.startDate)) {
      nextErrors.endDate = "Check-out must be after check-in.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    const calculatedDays = Math.max(
      1,
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
    );
    const destination = form.destination.trim();
    const budget = Number(form.budget);
    const travellers = Number(form.travellers);

    setLoading(true);
    setApiResponse(null);
    setTripDetails({
      destination,
      budget,
      travellers,
      days: calculatedDays,
      dates: { startDate: form.startDate, endDate: form.endDate },
      isSafetyTrip: womenOnly,
    });

    try {
      const plannerResult = await apiClient<PlannerApiResponse>("/api/plan", {
        method: "POST",
        body: JSON.stringify({
          destination,
          totalBudget: budget,
          travellers,
          days: calculatedDays,
          womenOnly,
        }),
      });
      setApiResponse(plannerResult);

      if (plannerResult.isTripPossible && plannerResult.withinBudget.length > 0) {
        setView("TIERS");
      } else {
        toast.error(
          "No complete package fits that budget yet. Increase the budget or try a different destination.",
        );
      }
    } catch (error) {
      console.error("Error connecting to planning API:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mx-auto max-w-4xl border border-white/30 p-8 md:p-10">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1 text-xs font-bold uppercase tracking-[0.22em] text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            {womenOnly ? <FiShield className="text-rose-500" /> : <FiCompass className="text-sky-500" />}
            {womenOnly ? "Protected stay filter" : "Smart package setup"}
          </div>
          <div>
            <h3 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white">
              {womenOnly ? "Build a safer trip shortlist" : "Start with the trip basics"}
            </h3>
            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              Enter the trip essentials once and let JourneyPilot shape package options, map previews, and a clearer budget breakdown for you.
            </p>
          </div>

          <div className="grid gap-3">
            <StatusBanner tone="default" title="What happens next">
              We compare stays, food, transport, and activities, then move you straight into curated package choices.
            </StatusBanner>
            {womenOnly ? (
              <StatusBanner tone="warning" title="Safety mode enabled">
                Stays are filtered to women-friendly listings before recommendations are assembled.
              </StatusBanner>
            ) : null}
          </div>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <Input
            label="Destination"
            name="destination"
            placeholder="e.g. Darjeeling"
            value={form.destination}
            onChange={(event) => updateField("destination", event.target.value)}
            error={errors.destination}
            required
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Total budget"
              type="number"
              name="budget"
              placeholder="15000"
              min="1000"
              value={form.budget}
              onChange={(event) => updateField("budget", event.target.value)}
              error={errors.budget}
              required
            />

            <Input
              label="Travellers"
              type="number"
              name="travellers"
              placeholder="2"
              min="1"
              value={form.travellers}
              onChange={(event) => updateField("travellers", event.target.value)}
              error={errors.travellers}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Check-in" hint="Arrival" htmlFor="start-date" error={errors.startDate}>
              <div className="relative">
                <FiCalendar className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="start-date"
                  type="date"
                  value={form.startDate}
                  onChange={(event) => updateField("startDate", event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-slate-900 outline-none transition-all focus:ring-4 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-blue-500/30"
                  required
                />
              </div>
            </Field>

            <Field label="Check-out" hint="Departure" htmlFor="end-date" error={errors.endDate}>
              <div className="relative">
                <FiCalendar className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="end-date"
                  type="date"
                  value={form.endDate}
                  min={form.startDate}
                  onChange={(event) => updateField("endDate", event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-slate-900 outline-none transition-all focus:ring-4 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-blue-500/30"
                  required
                />
              </div>
            </Field>
          </div>

          <Button type="submit" disabled={loading} fullWidth size="lg" className="mt-2 py-4 text-base">
            {loading ? "Finding the best options..." : "See curated packages"}
          </Button>
        </form>
      </div>
    </Card>
  );
}

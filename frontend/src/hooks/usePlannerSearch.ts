"use client";

import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { requestJson } from "@/lib/client/requestJson";
import { readPlanRequest, type PlanRequest } from "@/lib/planner/planRequest";
import { readPlannerResponse } from "@/lib/planner/planResponses";
import { usePlanStore } from "@/store/usePlanStore";
import type { TripDetails } from "@/types";

/** One active search; stale/unmounted results cannot overwrite a later trip. */
export function usePlannerSearch() {
  const active = useRef<AbortController | null>(null);
  const loading = usePlanStore((state) => state.loading);
  useEffect(
    () => () => {
      if (active.current) {
        active.current.abort();
        active.current = null;
        usePlanStore.getState().setLoading(false);
      }
    },
    [],
  );

  const search = async (input: PlanRequest, dates: TripDetails["dates"]) => {
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    const store = usePlanStore.getState();
    store.setLoading(true);
    try {
      const request = readPlanRequest(input);
      const response = readPlannerResponse(
        await requestJson("/api/plan", {
          method: "POST",
          body: JSON.stringify(request),
          signal: AbortSignal.any([
            controller.signal,
            AbortSignal.timeout(15000),
          ]),
        }),
        request,
      );
      if (controller.signal.aborted) return;
      store.setTripDetails({
        destination: request.destination,
        budget: request.totalBudget,
        travellers: request.travellers,
        days: request.days,
        dates,
        isSafetyTrip: request.womenOnly,
      });
      store.setCustomizedPlan(null);
      store.setApiResponse(response);
      if (response.isTripPossible) store.setView("TIERS");
      else
        toast.error(
          "No complete package fits that budget yet. Increase the budget or try a different destination.",
        );
    } catch (error) {
      if (controller.signal.aborted) return;
      toast.error(
        error instanceof TypeError
          ? "Network error. Please check your connection."
          : error instanceof Error
            ? error.message
            : "Unable to build a trip plan.",
      );
    } finally {
      if (active.current === controller) {
        active.current = null;
        store.setLoading(false);
      }
    }
  };
  return { loading, search };
}

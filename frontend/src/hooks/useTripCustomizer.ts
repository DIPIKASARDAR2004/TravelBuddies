"use client";

import toast from "react-hot-toast";
import { usePlanStore } from "@/store/usePlanStore";
import {
  removeExtraItem,
  updateEmergencyReserve,
  updatePlanBudget,
} from "@/lib/planner/planUtils";
import type { PlannerItemType, PlannerModalMode } from "@/types";
import { useBookingDraft } from "./useBookingDraft";

/** Customizer actions compose existing pure rules and the booking boundary. */
export function useTripCustomizer() {
  const store = usePlanStore();
  const { customizedPlan: plan, tripDetails } = store;
  const booking = useBookingDraft(plan?.selectedHotel ?? null, tripDetails);
  const openAdjustment = (
    type: PlannerItemType,
    mode: PlannerModalMode = "swap",
  ) => {
    store.setItemToSwap(type);
    store.setModalMode(mode);
    store.setModalError("");
    store.setSwapModalOpen(true);
  };
  const changeBudget = (value: string) => {
    if (!plan) return;
    const budget = Number(value);
    if (!Number.isFinite(budget) || budget < 0) return;
    store.setTripDetails({ budget });
    store.setCustomizedPlan(updatePlanBudget(plan, budget));
  };
  const changeReserve = (value: string) => {
    if (!plan) return;
    const reserve = Number(value);
    if (!Number.isFinite(reserve) || reserve < 0) return;
    store.setCustomizedPlan(
      updateEmergencyReserve(plan, reserve, tripDetails.budget),
    );
  };
  const removeExtra = (index: number) => {
    const item = plan?.extraItems?.[index];
    if (!plan || !item) return;
    store.setCustomizedPlan(removeExtraItem(plan, index, tripDetails.budget));
    toast.success(`Removed ${item.name}`);
  };
  return {
    plan,
    tripDetails,
    setView: store.setView,
    openAdjustment,
    changeBudget,
    changeReserve,
    removeExtra,
    ...booking,
  };
}

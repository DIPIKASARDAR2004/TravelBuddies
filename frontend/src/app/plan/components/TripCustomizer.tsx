import React, { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  FiArrowLeft,
  FiCoffee,
  FiHome,
  FiMap,
  FiMapPin,
  FiPlus,
  FiShield,
  FiTrash2,
  FiTruck,
} from "react-icons/fi";
import { usePlanStore } from "@/store/usePlanStore";
import { PlannerItemType } from "@/types";
import {
  removeExtraItem,
  updateEmergencyReserve,
  updatePlanBudget,
} from "@/lib/planner/planUtils";
import { formatINR } from "@/lib/utils";
import { apiClient } from "@/lib/services/apiClient";
import { CustomizerCard } from "@/components/ui/CustomizerCard";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatusBanner } from "@/components/ui/StatusBanner";

interface CreateOrderResponse {
  success: boolean;
  booking_id?: string;
  error?: string;
}

const cardConfigs: Array<{
  type: PlannerItemType;
  title: string;
  icon: React.ElementType;
  tone: "sky" | "amber" | "emerald" | "violet";
  costKey: "accommodationCost" | "foodCost" | "activityCost" | "transportCost";
}> = [
  { type: "hotel", title: "Accommodation", icon: FiHome, tone: "sky", costKey: "accommodationCost" },
  { type: "restaurant", title: "Dining", icon: FiCoffee, tone: "amber", costKey: "foodCost" },
  { type: "activity", title: "Activities", icon: FiMap, tone: "emerald", costKey: "activityCost" },
  { type: "transport", title: "Transport", icon: FiTruck, tone: "violet", costKey: "transportCost" },
];

export default function TripCustomizer() {
  const {
    customizedPlan,
    tripDetails,
    setView,
    setItemToSwap,
    setModalMode,
    setModalError,
    setSwapModalOpen,
    setCustomizedPlan,
    setTripDetails,
  } = usePlanStore();
  const router = useRouter();
  const [isBooking, setIsBooking] = useState(false);

  if (!customizedPlan) return null;

  const openSwapModal = (type: PlannerItemType, mode: "swap" | "add" = "swap") => {
    setItemToSwap(type);
    setModalMode(mode);
    setModalError("");
    setSwapModalOpen(true);
  };

  const handleBudgetChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newBudget = Number(event.target.value);
    setTripDetails({ budget: newBudget });
    setCustomizedPlan(updatePlanBudget(customizedPlan, newBudget));
  };

  const handleReserveChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newReserve = Number(event.target.value);
    setCustomizedPlan(updateEmergencyReserve(customizedPlan, newReserve, tripDetails.budget));
  };

  const handleDeleteCustomItem = (idx: number) => {
    const item = customizedPlan.extraItems?.[idx];
    if (!item) return;
    setCustomizedPlan(removeExtraItem(customizedPlan, idx, tripDetails.budget));
    toast.success(`Removed ${item.name}`);
  };

  const handleBooking = async () => {
    if (!customizedPlan.selectedHotel) {
      toast.error("Select a hotel before continuing to checkout.");
      return;
    }

    setIsBooking(true);

    try {
      const response = await apiClient<CreateOrderResponse>("/api/payments/create-order", {
        method: "POST",
        body: JSON.stringify({
          hotel: customizedPlan.selectedHotel,
          destination: tripDetails.destination,
          travellers: tripDetails.travellers,
          days: tripDetails.days,
        }),
      });

      const data = response as CreateOrderResponse;
      if (data.success && data.booking_id) {
        router.push(`/plan/checkout/${data.booking_id}`);
        return;
      }

      toast.error(data.error || "Failed to create the booking.");
    } catch (error) {
      console.error("Error creating booking:", error);
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="space-y-8">
      <button
        onClick={() => setView("TIERS")}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
      >
        <FiArrowLeft />
        Back to packages
      </button>

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
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-100">Total budget</p>
              <div className="mt-3 flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/20 px-4 py-3">
                <span className="text-2xl font-black">Rs</span>
                <input
                  type="number"
                  value={tripDetails.budget}
                  onChange={handleBudgetChange}
                  className="w-full bg-transparent text-3xl font-black outline-none"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-100">Trip cost</p>
              <p className="mt-4 text-4xl font-black">{formatINR(customizedPlan.tripCost)}</p>
              <p className="mt-2 text-sm text-slate-200">
                Includes {(customizedPlan.extraItems ?? []).length} add-on
                {(customizedPlan.extraItems ?? []).length === 1 ? "" : "s"}.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-100">Remaining budget</p>
              <p
                className={`mt-4 text-4xl font-black ${
                  customizedPlan.remainingBudget >= 0 ? "text-emerald-300" : "text-rose-300"
                }`}
              >
                {formatINR(customizedPlan.remainingBudget)}
              </p>
              <p className="mt-2 text-sm text-slate-200">
                Spendable after reserve: {formatINR(customizedPlan.remainingSpendableBudget ?? 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {customizedPlan.remainingBudget < 0 ? (
        <StatusBanner tone="danger" title="Budget exceeded">
          Reduce extras, choose a cheaper option, or raise the total budget before checkout.
        </StatusBanner>
      ) : null}

      <SectionHeader
        eyebrow="Plan controls"
        title="Adjust each part of the trip"
        description="Swap individual selections or add parallel options while keeping the whole package budget-aware."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {cardConfigs.map((config) => (
          <CustomizerCard
            key={config.type}
            type={config.type}
            title={config.title}
            cost={customizedPlan[config.costKey]}
            itemName={
              config.type === "hotel"
                ? customizedPlan.selectedHotel?.name
                : config.type === "restaurant"
                  ? customizedPlan.selectedRestaurant?.restaurant_name
                  : config.type === "activity"
                    ? customizedPlan.selectedActivity?.activity_name
                    : customizedPlan.selectedTransport?.transport_mode
            }
            itemDetails={
              config.type === "hotel"
                ? `Price per night: ${formatINR(customizedPlan.selectedHotel?.price)}`
                : config.type === "restaurant"
                  ? `Average meal cost: ${formatINR(customizedPlan.selectedRestaurant?.cost_per_meal)}`
                  : config.type === "activity"
                    ? `Cost per person: ${formatINR(customizedPlan.selectedActivity?.cost_per_person)}`
                    : `Cost per person: ${formatINR(customizedPlan.selectedTransport?.cost_per_person)}`
            }
            onSwap={() => openSwapModal(config.type)}
            onAdd={() => openSwapModal(config.type, "add")}
            icon={config.icon}
            colorClass={config.tone}
          />
        ))}

        <div className="lg:col-span-2 rounded-[2rem] border border-amber-200 bg-amber-50/80 p-6 dark:border-amber-900/40 dark:bg-amber-950/20">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-amber-100 p-3 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                <FiShield className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-700 dark:text-amber-300">
                  Emergency reserve
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
                  Keep a dedicated safety buffer for unexpected transport, stay, or support costs.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-white px-4 py-3 dark:border-amber-900/40 dark:bg-slate-950">
              <span className="text-lg font-bold text-slate-400">Rs</span>
              <input
                type="number"
                value={customizedPlan.emergencyReserve}
                onChange={handleReserveChange}
                className="w-28 bg-transparent text-2xl font-black text-slate-950 outline-none dark:text-white"
              />
            </div>
          </div>
        </div>

        {(customizedPlan.extraItems ?? []).length > 0 ? (
          <div className="lg:col-span-2 rounded-[2rem] border border-dashed border-slate-300 bg-white/80 p-6 dark:border-slate-700 dark:bg-slate-950/60">
            <div className="mb-5 flex items-center gap-2">
              <FiPlus className="text-sky-500" />
              <h4 className="text-lg font-bold text-slate-950 dark:text-white">Custom add-ons</h4>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {customizedPlan.extraItems?.map((item, idx) => (
                <div
                  key={`${item.type}-${item.name}-${idx}`}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/80"
                >
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleDeleteCustomItem(idx)}
                      className="rounded-full bg-rose-50 p-2 text-rose-500 transition-colors hover:bg-rose-100 hover:text-rose-600 dark:bg-rose-950/30 dark:hover:bg-rose-950/50"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">{item.type}</p>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{item.name}</p>
                    </div>
                  </div>
                  <p className="font-black text-slate-950 dark:text-white">{formatINR(item.price)}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="mx-auto flex max-w-md flex-col gap-4">
        <Button
          onClick={handleBooking}
          disabled={isBooking || !customizedPlan.selectedHotel || customizedPlan.remainingBudget < 0}
          className="w-full py-5 text-lg"
        >
          {isBooking ? "Securing booking..." : "Continue to protected checkout"}
        </Button>

        <Button variant="ghost" onClick={() => router.push("/map")} className="w-full py-4 text-base">
          <FiMapPin className="mr-2 h-4 w-4" />
          Preview itinerary on the map
        </Button>
      </div>
    </div>
  );
}

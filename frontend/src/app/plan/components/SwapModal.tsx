import React from "react";
import { Button } from "@/components/ui/Button";
import { formatINR } from "@/lib/utils";
import { applyAlternativeSelection } from "@/lib/planner/planUtils";
import { usePlanStore } from "@/store/usePlanStore";

export default function SwapModal() {
  const {
    swapModalOpen,
    setSwapModalOpen,
    itemToSwap,
    modalMode,
    modalError,
    setModalError,
    apiResponse,
    customizedPlan,
    setCustomizedPlan,
    tripDetails,
  } = usePlanStore();

  if (!swapModalOpen || !itemToSwap || !apiResponse || !customizedPlan) return null;

  const options = apiResponse.alternatives[itemToSwap] ?? [];

  const describeOption = (item: (typeof options)[number]) => {
    if (itemToSwap === "hotel") {
      return {
        title: "hotel_name" in item ? item.hotel_name : "Hotel",
        subtitle: `${formatINR("price_per_night" in item ? item.price_per_night : 0)} / night`,
      };
    }
    if (itemToSwap === "restaurant") {
      return {
        title: "restaurant_name" in item ? item.restaurant_name : "Restaurant",
        subtitle: `${formatINR("cost_per_meal" in item ? item.cost_per_meal : 0)} / meal`,
      };
    }
    if (itemToSwap === "activity") {
      return {
        title: "activity_name" in item ? item.activity_name : "Activity",
        subtitle: `${formatINR("cost_per_person" in item ? item.cost_per_person : 0)} / person`,
      };
    }
    return {
      title: "transport_mode" in item ? item.transport_mode : "Transport",
      subtitle: `${formatINR("cost_per_person" in item ? item.cost_per_person : 0)} / person`,
    };
  };

  const handleSelect = (item: (typeof options)[number]) => {
    const result = applyAlternativeSelection({
      currentPlan: customizedPlan,
      itemType: itemToSwap,
      mode: modalMode,
      item,
      tripDetails,
    });

    if (!result.plan) {
      setModalError(result.error || "Unable to apply this change.");
      return;
    }

    setCustomizedPlan(result.plan);
    setModalError("");
    setSwapModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-5 dark:border-slate-800 dark:bg-slate-900">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Plan adjustments</p>
            <h3 className="mt-1 text-2xl font-black capitalize text-slate-950 dark:text-white">
              {modalMode === "add" ? "Add" : "Swap"} {itemToSwap}
            </h3>
          </div>
          <button
            onClick={() => setSwapModalOpen(false)}
            className="text-3xl leading-none text-slate-400 transition-colors hover:text-slate-700 dark:hover:text-slate-200"
          >
            &times;
          </button>
        </div>

        <div className="space-y-4 p-6">
          {modalError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">
              {modalError}
            </div>
          ) : null}

          <div className="max-h-[65vh] space-y-3 overflow-y-auto pr-1">
            {options.map((item, idx) => {
              const content = describeOption(item);

              return (
                <div
                  key={`${content.title}-${idx}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelect(item)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleSelect(item);
                    }
                  }}
                  className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-sky-300 hover:bg-sky-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-sky-800 dark:hover:bg-sky-950/20"
                >
                  <div>
                    <h4 className="font-bold text-slate-950 dark:text-white">{content.title}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{content.subtitle}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleSelect(item);
                    }}
                  >
                    {modalMode === "add" ? "Add" : "Select"}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

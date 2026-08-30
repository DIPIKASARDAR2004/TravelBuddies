import React from "react";
import { usePlanStore } from "@/store/usePlanStore";
import { formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export default function SwapModal() {
  const { 
    swapModalOpen, 
    setSwapModalOpen, 
    itemToSwap, 
    modalError, 
    setModalError, 
    apiResponse,
    customizedPlan,
    setCustomizedPlan,
    tripDetails
  } = usePlanStore();

  if (!swapModalOpen || !itemToSwap) return null;

  const handleSwapItem = (newItem: any) => {
    if (!customizedPlan) return;
    
    let updatedPlan = { ...customizedPlan };
    let newCost = 0;
    let oldCost = 0;
    
    if (itemToSwap === 'hotel') {
      oldCost = updatedPlan.accommodationCost;
      newCost = newItem.price_per_night * Math.ceil(tripDetails.travellers / 2) * tripDetails.days;
    } else if (itemToSwap === 'restaurant') {
      oldCost = updatedPlan.foodCost;
      newCost = newItem.cost_per_meal * 3 * tripDetails.travellers * tripDetails.days;
    } else if (itemToSwap === 'activity') {
      oldCost = updatedPlan.activityCost;
      newCost = newItem.cost_per_person * tripDetails.travellers;
    } else if (itemToSwap === 'transport') {
      oldCost = updatedPlan.transportCost;
      newCost = newItem.cost_per_person * tripDetails.travellers;
    }

    const costDifference = newCost - oldCost;
    const newRemainingBudget = updatedPlan.remainingBudget - costDifference;
    
    if (newRemainingBudget < 0) {
      setModalError(`Cannot swap! This exceeds your total budget by ${formatINR(Math.abs(newRemainingBudget))}`);
      return;
    }

    if (itemToSwap === 'hotel') {
      updatedPlan.selectedHotel = {
        name: newItem.hotel_name,
        price: newItem.price_per_night,
        rating: newItem.rating,
        is_women_friendly: newItem.is_women_friendly
      };
      updatedPlan.accommodationCost = newCost;
    } else if (itemToSwap === 'restaurant') {
      updatedPlan.selectedRestaurant = newItem;
      updatedPlan.foodCost = newCost;
    } else if (itemToSwap === 'activity') {
      updatedPlan.selectedActivity = newItem;
      updatedPlan.activityCost = newCost;
    } else if (itemToSwap === 'transport') {
      updatedPlan.selectedTransport = newItem;
      updatedPlan.transportCost = newCost;
    }

    updatedPlan.tripCost = updatedPlan.accommodationCost + updatedPlan.foodCost + updatedPlan.activityCost + updatedPlan.transportCost;
    updatedPlan.totalAllocated = Math.round((updatedPlan.tripCost + updatedPlan.emergencyReserve) * 100) / 100;
    updatedPlan.remainingBudget = Math.round((tripDetails.budget - updatedPlan.totalAllocated) * 100) / 100;

    setCustomizedPlan(updatedPlan);
    setSwapModalOpen(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-900">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white capitalize">Swap {itemToSwap}</h3>
          <button onClick={() => setSwapModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none">&times;</button>
        </div>
        
        <div className="p-6">
          {modalError && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/50 rounded-xl text-sm font-medium">
              {modalError}
            </div>
          )}
          
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {apiResponse?.alternatives?.[itemToSwap]?.map((item: any, idx: number) => {
              let title = "";
              let subtitle = "";
              if (itemToSwap === 'hotel') {
                title = item.hotel_name;
                subtitle = `${formatINR(item.price_per_night)} / night`;
              } else if (itemToSwap === 'restaurant') {
                title = item.restaurant_name;
                subtitle = `${formatINR(item.cost_per_meal)} / meal`;
              } else if (itemToSwap === 'activity') {
                title = item.activity_name;
                subtitle = `${formatINR(item.cost_per_person)} / person`;
              } else if (itemToSwap === 'transport') {
                title = item.transport_mode;
                subtitle = `${formatINR(item.cost_per_person)} / person`;
              }

              return (
                <div key={idx} className="border border-gray-200 dark:border-slate-700 rounded-xl p-4 flex justify-between items-center hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition cursor-pointer"
                     onClick={() => handleSwapItem(item)}>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">{title}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{subtitle}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleSwapItem(item); }}>
                    Select
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

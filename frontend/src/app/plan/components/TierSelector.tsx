import React from "react";
import { usePlanStore } from "@/store/usePlanStore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatINR } from "@/lib/utils";

export default function TierSelector() {
  const { apiResponse, setView, setTripDetails, setCustomizedPlan } = usePlanStore();

  if (!apiResponse || !apiResponse.withinBudget) return null;

  const handleSelectTier = (plan: any) => {
    const customized = JSON.parse(JSON.stringify(plan));
    
    if (customized.recommendedBudget) {
      const selectedUpgradeBudget = customized.recommendedBudget;
      const emergencyReserve = Math.round((selectedUpgradeBudget * 0.10) * 100) / 100;
      const tripSpendingLimit = Math.round((selectedUpgradeBudget - emergencyReserve) * 100) / 100;
      const remainingSpendableBudget = Math.round((tripSpendingLimit - customized.tripCost) * 100) / 100;

      customized.totalBudget = selectedUpgradeBudget;
      customized.emergencyReserve = emergencyReserve;
      customized.tripSpendingLimit = tripSpendingLimit;
      customized.remainingSpendableBudget = remainingSpendableBudget;
      customized.remainingBudget = remainingSpendableBudget;
      customized.totalAllocated = Math.round((customized.tripCost + emergencyReserve) * 100) / 100;

      setTripDetails({ budget: selectedUpgradeBudget });
    } else {
      if (apiResponse && apiResponse.totalBudget) {
        setTripDetails({ budget: apiResponse.totalBudget });
      }
    }

    setCustomizedPlan(customized);
    setView("CUSTOMIZE");
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Button 
        variant="ghost" 
        onClick={() => setView("FORM")}
        className="mb-8 gap-2 rounded-full"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        Back to Search
      </Button>

      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 mb-4 pb-2 drop-shadow-sm">
          Recommended Packages for {apiResponse.destination}
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300 font-medium max-w-2xl mx-auto">
          Select a base plan to customize. Your total budget is <span className="font-bold text-indigo-600 dark:text-indigo-400">{formatINR(apiResponse.totalBudget)}</span>.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
        {apiResponse.withinBudget.map((plan: any, idx: number) => {
          const isPremium = plan.name === 'Premium Upgrade';
          const isBudget = plan.name === 'Best Value';
          
          return (
            <Card key={idx} hoverable className={`relative p-6 transition flex flex-col !overflow-visible 
              ${isPremium ? 'border-purple-200 shadow-purple-100 dark:border-purple-800' : isBudget ? 'border-green-200 shadow-green-100 dark:border-green-800' : 'border-blue-200 shadow-blue-100 dark:border-blue-800'}`}>
              
              <div className={`absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-sm font-bold text-white
                ${isPremium ? 'bg-purple-500' : isBudget ? 'bg-green-500' : 'bg-blue-500'}`}>
                {plan.name}
              </div>

              <div className="mt-4 mb-6 flex-grow">
                <div className="flex justify-between items-end mb-4 border-b border-gray-200 dark:border-slate-700 pb-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Trip Cost</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatINR(plan.tripCost)}</p>
                  </div>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Hotel:</span> <span className="font-medium text-right dark:text-gray-200">{plan.selectedHotel?.name || "N/A"}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Food:</span> <span className="font-medium text-right dark:text-gray-200">{plan.selectedRestaurant?.restaurant_name || "N/A"}</span></div>
                  <div className="flex justify-between gap-2"><span className="text-gray-500 dark:text-gray-400 whitespace-nowrap">{plan.selectedActivities?.length > 1 ? 'Activities:' : 'Activity:'}</span> <span className="font-medium text-right break-words dark:text-gray-200">{plan.selectedActivities?.length > 0 ? plan.selectedActivities.map((a: any) => a.activity_name).join(', ') : (plan.selectedActivity?.activity_name || "N/A")}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Transport:</span> <span className="font-medium text-right dark:text-gray-200">{plan.selectedTransport?.transport_mode || "N/A"}</span></div>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 p-3 rounded-lg mb-3 text-center">
                <p className="text-xs text-amber-700 dark:text-amber-500 font-medium">
                  {formatINR(plan.emergencyReserve)} protected separately as emergency reserve
                  <span className="block text-amber-600 dark:text-amber-600/70">(not included in Trip Cost)</span>
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-slate-800/50 p-3 rounded-lg mb-4 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide">Remaining Spendable Budget</p>
                <p className={`text-lg font-bold ${(plan.remainingSpendableBudget ?? plan.remainingBudget) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-orange-500 dark:text-orange-400'}`}>
                  {formatINR(plan.remainingSpendableBudget ?? plan.remainingBudget)}
                </p>
              </div>

              <Button 
                onClick={() => handleSelectTier(plan)}
                fullWidth
                className={`text-white
                  ${isPremium ? 'bg-purple-600 hover:bg-purple-700' : isBudget ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                Customize {plan.name}
              </Button>
            </Card>
          );
        })}
      </div>
      
      {/* UPGRADES SECTION */}
      {apiResponse?.upgrades && apiResponse.upgrades.length > 0 && (
        <div className="mt-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Want to Upgrade?</h2>
            <p className="text-gray-500 dark:text-gray-400">These plans exceed your budget but offer meaningful improvements.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-90 pt-6">
            {apiResponse.upgrades.map((plan: any, idx: number) => (
              <Card key={idx} hoverable className="relative p-6 border-orange-200 dark:border-orange-800 shadow-orange-100 flex flex-col !overflow-visible">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-sm font-bold text-white bg-orange-500 whitespace-nowrap">
                  {plan.name}
                </div>

                <div className="mt-4 mb-6 flex-grow">
                  <div className="flex justify-between items-end mb-4 border-b border-gray-200 dark:border-slate-700 pb-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Recommended Budget</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatINR(plan.recommendedBudget)}</p>
                      <p className="text-sm font-bold text-orange-500 mt-1">Extra Needed: {formatINR(plan.extraNeeded)}</p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Highlights</p>
                    <ul className="space-y-1">
                      {plan.upgradeHighlights?.map((hl: string, i: number) => (
                        <li key={i} className="text-sm text-green-700 dark:text-green-400 flex items-center">
                          <span className="mr-2">✨</span> {hl}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Hotel:</span> <span className="font-medium text-right dark:text-gray-200">{plan.selectedHotel?.name || "N/A"}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Food:</span> <span className="font-medium text-right dark:text-gray-200">{plan.selectedRestaurant?.restaurant_name || "N/A"}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Activity:</span> <span className="font-medium text-right dark:text-gray-200">{plan.selectedActivity?.activity_name || "N/A"}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Transport:</span> <span className="font-medium text-right dark:text-gray-200">{plan.selectedTransport?.transport_mode || "N/A"}</span></div>
                  </div>
                </div>

                <Button 
                  onClick={() => handleSelectTier(plan)}
                  fullWidth
                  className="bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-500 text-white"
                >
                  Select Upgrade
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

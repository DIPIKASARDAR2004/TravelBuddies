import React from "react";
import { usePlanStore } from "@/store/usePlanStore";
import { Button } from "@/components/ui/Button";
import { formatINR } from "@/lib/utils";
import { FiArrowLeft, FiCheck, FiStar } from "react-icons/fi";

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
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto px-4">
      <button 
        onClick={() => setView("FORM")}
        className="mb-8 flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
      >
        <FiArrowLeft /> Back to Search
      </button>

      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 mb-4 tracking-tight">
          Curated Packages
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
          We found amazing options for <span className="font-bold text-slate-900 dark:text-white">{apiResponse.destination}</span>. 
          Your budget is <span className="font-bold text-blue-600 dark:text-blue-400">{formatINR(apiResponse.totalBudget)}</span>.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {apiResponse.withinBudget.map((plan: any, idx: number) => {
          const isPremium = plan.name === 'Premium Upgrade';
          const isBudget = plan.name === 'Best Value';
          
          return (
            <div key={idx} className={`relative glass-panel premium-shadow hover-lift rounded-3xl p-8 flex flex-col transition-all duration-300
              ${isPremium ? 'ring-2 ring-purple-500/50' : isBudget ? 'ring-2 ring-emerald-500/50' : 'ring-2 ring-blue-500/50 scale-105 z-10 bg-white/80 dark:bg-slate-800/80'}`}>
              
              <div className={`absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-full text-sm font-bold text-white shadow-lg
                ${isPremium ? 'bg-gradient-to-r from-purple-500 to-pink-500' : isBudget ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`}>
                {plan.name}
              </div>

              <div className="mt-6 mb-8 flex-grow">
                <div className="text-center mb-8 pb-8 border-b border-slate-200 dark:border-slate-700/50">
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-2">Trip Cost</p>
                  <p className="text-4xl font-black text-slate-900 dark:text-white">{formatINR(plan.tripCost)}</p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg shrink-0 mt-0.5"><FiStar className="w-3.5 h-3.5" /></div>
                    <div>
                      <span className="text-xs text-slate-500 uppercase font-bold tracking-wider block">Stay</span> 
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{plan.selectedHotel?.name || "N/A"}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg shrink-0 mt-0.5"><FiStar className="w-3.5 h-3.5" /></div>
                    <div>
                      <span className="text-xs text-slate-500 uppercase font-bold tracking-wider block">Dining</span> 
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{plan.selectedRestaurant?.restaurant_name || "N/A"}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg shrink-0 mt-0.5"><FiStar className="w-3.5 h-3.5" /></div>
                    <div>
                      <span className="text-xs text-slate-500 uppercase font-bold tracking-wider block">Experience</span> 
                      <span className="font-semibold text-slate-800 dark:text-slate-200 break-words">{plan.selectedActivities?.length > 0 ? plan.selectedActivities.map((a: any) => a.activity_name).join(', ') : (plan.selectedActivity?.activity_name || "N/A")}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50/80 dark:bg-slate-900/50 p-4 rounded-2xl mb-6 text-center border border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Remaining Budget</p>
                <p className={`text-xl font-black ${(plan.remainingSpendableBudget ?? plan.remainingBudget) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {formatINR(plan.remainingSpendableBudget ?? plan.remainingBudget)}
                </p>
                <p className="text-[10px] text-slate-400 font-medium mt-2">
                  *Includes {formatINR(plan.emergencyReserve)} safe reserve
                </p>
              </div>

              <button 
                onClick={() => handleSelectTier(plan)}
                className={`w-full py-4 rounded-xl font-bold text-white transition-all shadow-lg
                  ${isPremium ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/30' : isBudget ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30'}`}
              >
                Select & Customize
              </button>
            </div>
          );
        })}
      </div>
      
      {/* UPGRADES SECTION */}
      {apiResponse?.upgrades && apiResponse.upgrades.length > 0 && (
        <div className="mt-24 pt-12 border-t border-slate-200 dark:border-slate-800">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">Luxury Upgrades</h2>
            <p className="text-slate-500">Exceptional experiences slightly above your current budget.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {apiResponse.upgrades.map((plan: any, idx: number) => (
              <div key={idx} className="relative glass-panel hover-lift rounded-3xl p-8 flex flex-col border border-orange-200/50 dark:border-orange-900/50 ring-1 ring-orange-500/20">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-full text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 shadow-lg shadow-orange-500/30 whitespace-nowrap">
                  {plan.name}
                </div>

                <div className="mt-6 mb-8 flex-grow">
                  <div className="text-center mb-8 pb-8 border-b border-slate-200 dark:border-slate-700/50">
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-2">Required Budget</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white">{formatINR(plan.recommendedBudget)}</p>
                    <p className="text-sm font-bold text-orange-500 mt-2 bg-orange-50 dark:bg-orange-900/20 inline-block px-3 py-1 rounded-full">+{formatINR(plan.extraNeeded)} needed</p>
                  </div>
                  
                  <div className="mb-6 bg-orange-50/50 dark:bg-orange-900/10 p-4 rounded-2xl">
                    <p className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider mb-3">Highlights</p>
                    <ul className="space-y-2">
                      {plan.upgradeHighlights?.map((hl: string, i: number) => (
                        <li key={i} className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2 font-medium">
                          <FiCheck className="text-orange-500 mt-0.5 shrink-0" /> {hl}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg shrink-0 mt-0.5"><FiStar className="w-3.5 h-3.5" /></div>
                      <div>
                        <span className="text-xs text-slate-500 uppercase font-bold tracking-wider block">Stay</span> 
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{plan.selectedHotel?.name || "N/A"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => handleSelectTier(plan)}
                  className="w-full py-4 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 transition-all shadow-lg hover-lift"
                >
                  Unlock Upgrade
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

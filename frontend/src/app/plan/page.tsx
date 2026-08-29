"use client";

import React, { useState } from "react";
import Link from "next/link";

type ViewState = "FORM" | "TIERS" | "CUSTOMIZE";

const formatINR = (value: number | string | null | undefined) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));




export default function PlanPage() {
  const [view, setView] = useState<ViewState>("FORM");
  
  // API Response & Form Data State
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [tripDetails, setTripDetails] = useState({ budget: 0, travellers: 0, days: 0, destination: "" });
  
  // Customization State
  const [customizedPlan, setCustomizedPlan] = useState<any>(null);
  
  // Modal State
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [itemToSwap, setItemToSwap] = useState<'hotel' | 'restaurant' | 'activity' | 'transport' | null>(null);
  const [modalError, setModalError] = useState("");

  // ==============================
  // VIEW 1: FORM SUBMISSION
  // ==============================
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setApiResponse(null);

    const formData = new FormData(e.currentTarget);
    const destination = formData.get("destination") as string;
    const budget = Number(formData.get("budget"));
    const travellers = Number(formData.get("travellers"));
    const days = Number(formData.get("days"));

    setTripDetails({ destination, budget, travellers, days });

    const data = { destination, totalBudget: budget, travellers, days };

    try {
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      setApiResponse(result);
      
      if (result.isTripPossible && result.withinBudget && result.withinBudget.length > 0) {
        setView("TIERS");
      } else {
        alert(result.error || "Trip not possible with this budget! Try increasing your budget.");
      }
    } catch (error) {
      console.error("Error connecting to API:", error);
      alert("Failed to connect to backend");
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // VIEW 2: TIER SELECTION
  // ==============================
  const handleSelectTier = (plan: any) => {
    // Deep clone the selected plan into our customization state
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

      setTripDetails(prev => ({
        ...prev,
        budget: selectedUpgradeBudget
      }));
    } else {
      if (apiResponse && apiResponse.totalBudget) {
        setTripDetails(prev => ({
          ...prev,
          budget: apiResponse.totalBudget
        }));
      }
    }

    setCustomizedPlan(customized);
    setView("CUSTOMIZE");
  };

  // ==============================
  // VIEW 3: CUSTOMIZATION LOGIC
  // ==============================
  const openSwapModal = (type: 'hotel' | 'restaurant' | 'activity' | 'transport') => {
    setItemToSwap(type);
    setModalError("");
    setSwapModalOpen(true);
  };

  const handleSwapItem = (newItem: any) => {
    if (!customizedPlan) return;
    
    let updatedPlan = { ...customizedPlan };
    let newCost = 0;
    let oldCost = 0;
    
    // Calculate new cost based on formulas from API
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

    // Check budget constraint
    const costDifference = newCost - oldCost;
    const newRemainingBudget = updatedPlan.remainingBudget - costDifference;
    
    if (newRemainingBudget < 0) {
      setModalError(`Cannot swap! This exceeds your total budget by ${formatINR(Math.abs(newRemainingBudget))}`);
      return;
    }

    // Apply the swap
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

    // Recalculate totals
    updatedPlan.tripCost = updatedPlan.accommodationCost + updatedPlan.foodCost + updatedPlan.activityCost + updatedPlan.transportCost;
    updatedPlan.totalAllocated = Math.round((updatedPlan.tripCost + updatedPlan.emergencyReserve) * 100) / 100;
    updatedPlan.remainingBudget = Math.round((tripDetails.budget - updatedPlan.totalAllocated) * 100) / 100;

    setCustomizedPlan(updatedPlan);
    setSwapModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      
      {/* Main Content (Pushed down slightly to account for global navbar) */}
      <main className="max-w-6xl mx-auto px-4 py-8 pt-24">
        
        {/* ================================================== */}
        {/* VIEW 1: INPUT FORM */}
        {/* ================================================== */}
        {view === "FORM" && (
          <div className="max-w-xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Plan Your Dream Trip</h2>
              <p className="text-gray-500">Enter your details and let our recommendation engine build your packages.</p>
            </div>
            
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Destination</label>
                <input type="text" name="destination" placeholder="e.g. Digha" required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition" />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Total Budget (Max Limit)</label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-gray-500 font-medium">₹</span>
                  <input type="number" name="budget" placeholder="15000" min="1000" required
                    className="w-full pl-8 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Travellers</label>
                  <input type="number" name="travellers" placeholder="2" min="1" required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Days</label>
                  <input type="number" name="days" placeholder="3" min="1" required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition" />
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition shadow-lg shadow-indigo-200 disabled:opacity-50">
                {loading ? "Generating Magic..." : "Generate Trip Packages"}
              </button>
            </form>
          </div>
        )}

        {/* ================================================== */}
        {/* VIEW 2: TIERS / RECOMMENDATIONS */}
        {/* ================================================== */}
        {view === "TIERS" && apiResponse?.withinBudget && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button 
              onClick={() => setView("FORM")} 
              className="mb-8 flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors w-max"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Back to Search
            </button>
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-4 pb-2 drop-shadow-sm">
                Recommended Packages for {apiResponse.destination}
              </h2>
              <p className="text-lg text-gray-600 font-medium max-w-2xl mx-auto">
                Select a base plan to customize. Your total budget is <span className="font-bold text-indigo-600">{formatINR(apiResponse.totalBudget)}</span>.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {apiResponse.withinBudget.map((plan: any, idx: number) => {
                const isPremium = plan.name === 'Premium Upgrade';
                const isBudget = plan.name === 'Best Value';
                
                return (
                  <div key={idx} className={`relative bg-white rounded-2xl p-6 border-2 transition hover:shadow-xl flex flex-col 
                    ${isPremium ? 'border-purple-200 shadow-purple-100' : isBudget ? 'border-green-200 shadow-green-100' : 'border-blue-200 shadow-blue-100'}`}>
                    
                    {/* Badge */}
                    <div className={`absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-sm font-bold text-white
                      ${isPremium ? 'bg-purple-500' : isBudget ? 'bg-green-500' : 'bg-blue-500'}`}>
                      {plan.name}
                    </div>

                    <div className="mt-4 mb-6 flex-grow">
                      <div className="flex justify-between items-end mb-4 border-b pb-4">
                        <div>
                          <p className="text-sm text-gray-500 font-medium">Trip Cost</p>
                          <p className="text-3xl font-bold text-gray-900">{formatINR(plan.tripCost)}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between"><span className="text-gray-500">Hotel:</span> <span className="font-medium text-right">{plan.selectedHotel?.name || "N/A"}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Food:</span> <span className="font-medium text-right">{plan.selectedRestaurant?.restaurant_name || "N/A"}</span></div>
                        <div className="flex justify-between gap-2"><span className="text-gray-500 whitespace-nowrap">{plan.selectedActivities?.length > 1 ? 'Activities:' : 'Activity:'}</span> <span className="font-medium text-right break-words">{plan.selectedActivities?.length > 0 ? plan.selectedActivities.map((a: any) => a.activity_name).join(', ') : (plan.selectedActivity?.activity_name || "N/A")}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Transport:</span> <span className="font-medium text-right">{plan.selectedTransport?.transport_mode || "N/A"}</span></div>
                      </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg mb-3 text-center">
                      <p className="text-xs text-amber-700 font-medium">
                        {formatINR(plan.emergencyReserve)} protected separately as emergency reserve
                        <span className="block text-amber-600">(not included in Trip Cost)</span>
                      </p>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg mb-4 text-center">
                      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Remaining Spendable Budget</p>
                      <p className={`text-lg font-bold ${(plan.remainingSpendableBudget ?? plan.remainingBudget) >= 0 ? 'text-green-600' : 'text-orange-500'}`}>
                        {formatINR(plan.remainingSpendableBudget ?? plan.remainingBudget)}
                      </p>
                    </div>

                    <button 
                      onClick={() => handleSelectTier(plan)}
                      className={`w-full py-3 rounded-xl font-bold text-white transition shadow-md
                        ${isPremium ? 'bg-purple-600 hover:bg-purple-700' : isBudget ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                      Customize {plan.name}
                    </button>
                  </div>
                );
              })}
            </div>
            
            {/* UPGRADES SECTION */}
            {apiResponse?.upgrades && apiResponse.upgrades.length > 0 && (
              <div className="mt-16">
                <div className="text-center mb-10">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Want to Upgrade?</h2>
                  <p className="text-gray-500">These plans exceed your budget but offer meaningful improvements.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-90">
                  {apiResponse.upgrades.map((plan: any, idx: number) => (
                    <div key={idx} className="relative bg-white rounded-2xl p-6 border-2 border-orange-200 shadow-orange-100 transition hover:shadow-xl flex flex-col">
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-sm font-bold text-white bg-orange-500 whitespace-nowrap">
                        {plan.name}
                      </div>

                      <div className="mt-4 mb-6 flex-grow">
                        <div className="flex justify-between items-end mb-4 border-b pb-4">
                          <div>
                            <p className="text-sm text-gray-500 font-medium">Recommended Budget</p>
                            <p className="text-3xl font-bold text-gray-900">{formatINR(plan.recommendedBudget)}</p>
                            <p className="text-sm font-bold text-orange-500 mt-1">Extra Needed: {formatINR(plan.extraNeeded)}</p>
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Highlights</p>
                          <ul className="space-y-1">
                            {plan.upgradeHighlights?.map((hl: string, i: number) => (
                              <li key={i} className="text-sm text-green-700 flex items-center">
                                <span className="mr-2">✨</span> {hl}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between"><span className="text-gray-500">Hotel:</span> <span className="font-medium text-right">{plan.selectedHotel?.name || "N/A"}</span></div>
                          <div className="flex justify-between"><span className="text-gray-500">Food:</span> <span className="font-medium text-right">{plan.selectedRestaurant?.restaurant_name || "N/A"}</span></div>
                          <div className="flex justify-between"><span className="text-gray-500">Activity:</span> <span className="font-medium text-right">{plan.selectedActivity?.activity_name || "N/A"}</span></div>
                          <div className="flex justify-between"><span className="text-gray-500">Transport:</span> <span className="font-medium text-right">{plan.selectedTransport?.transport_mode || "N/A"}</span></div>
                        </div>
                      </div>

                      <button 
                        onClick={() => handleSelectTier(plan)}
                        className="w-full py-3 rounded-xl font-bold text-white transition shadow-md bg-orange-500 hover:bg-orange-600"
                      >
                        Select Upgrade
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================== */}
        {/* VIEW 3: CUSTOMIZATION DASHBOARD */}
        {/* ================================================== */}
        {view === "CUSTOMIZE" && customizedPlan && (
          <div className="animate-in fade-in zoom-in-95 duration-300">
            
            <button 
              onClick={() => setView("TIERS")} 
              className="mb-8 flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors w-max"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Back to Packages
            </button>

            {/* Real-Time Math Section */}
            <div className="bg-gradient-to-br from-indigo-900 to-indigo-700 rounded-3xl p-6 text-white shadow-xl mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-indigo-500/50">
                <div className="pt-4 md:pt-0">
                  <p className="text-indigo-200 text-sm font-medium uppercase tracking-wider mb-1">Total Budget</p>
                  <p className="text-4xl font-bold">{formatINR(tripDetails.budget)}</p>
                </div>
                <div className="pt-4 md:pt-0">
                  <p className="text-indigo-200 text-sm font-medium uppercase tracking-wider mb-1">Trip Cost</p>
                  <p className="text-4xl font-bold text-amber-300">{formatINR(customizedPlan.tripCost)}</p>
                  <p className="text-indigo-300 text-xs mt-1">{formatINR(customizedPlan.emergencyReserve)} reserve protected separately</p>
                </div>
                <div className="pt-4 md:pt-0">
                  <p className="text-indigo-200 text-sm font-medium uppercase tracking-wider mb-1">Remaining Spendable Budget</p>
                  <p className={`text-4xl font-bold ${customizedPlan.remainingBudget >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatINR(customizedPlan.remainingBudget)}
                  </p>
                </div>
              </div>
            </div>

            {/* Itinerary / Swapping Grid */}
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Customize Your Selections</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              
              {/* Hotel Card */}
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide">Accommodation</span>
                    <span className="font-bold text-gray-900">{formatINR(customizedPlan.accommodationCost)} <span className="text-xs text-gray-400 font-normal">total</span></span>
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-1">{customizedPlan.selectedHotel?.name || "No Hotel Selected"}</h4>
                  <p className="text-sm text-gray-500 mb-4">Price per night: {formatINR(customizedPlan.selectedHotel?.price)}</p>
                </div>
                <button onClick={() => openSwapModal('hotel')} className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-indigo-600 font-semibold rounded-lg transition border border-gray-200">
                  Swap Hotel
                </button>
              </div>

              {/* Food Card */}
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide">Food & Dining</span>
                    <span className="font-bold text-gray-900">{formatINR(customizedPlan.foodCost)} <span className="text-xs text-gray-400 font-normal">total</span></span>
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-1">{customizedPlan.selectedRestaurant?.restaurant_name || "No Dining Selected"}</h4>
                  <p className="text-sm text-gray-500 mb-4">Cost per meal: {formatINR(customizedPlan.selectedRestaurant?.cost_per_meal)}</p>
                </div>
                <button onClick={() => openSwapModal('restaurant')} className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-indigo-600 font-semibold rounded-lg transition border border-gray-200">
                  Swap Dining
                </button>
              </div>

              {/* Activity Card */}
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide">Activities</span>
                    <span className="font-bold text-gray-900">{formatINR(customizedPlan.activityCost)} <span className="text-xs text-gray-400 font-normal">total</span></span>
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-1">{customizedPlan.selectedActivity?.activity_name || "No Activity Selected"}</h4>
                  <p className="text-sm text-gray-500 mb-4">Cost per person: {formatINR(customizedPlan.selectedActivity?.cost_per_person)}</p>
                </div>
                <button onClick={() => openSwapModal('activity')} className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-indigo-600 font-semibold rounded-lg transition border border-gray-200">
                  Swap Activity
                </button>
              </div>

              {/* Transport Card */}
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide">Transport</span>
                    <span className="font-bold text-gray-900">{formatINR(customizedPlan.transportCost)} <span className="text-xs text-gray-400 font-normal">total</span></span>
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-1">{customizedPlan.selectedTransport?.transport_mode || "No Transport Selected"}</h4>
                  <p className="text-sm text-gray-500 mb-4">Cost per person: {formatINR(customizedPlan.selectedTransport?.cost_per_person)}</p>
                </div>
                <button onClick={() => openSwapModal('transport')} className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-indigo-600 font-semibold rounded-lg transition border border-gray-200">
                  Swap Transport
                </button>
              </div>

              {/* Buffer Card */}
              <div className="bg-gray-100 p-5 rounded-2xl border border-gray-200 md:col-span-2 flex items-center justify-between">
                <div>
                  <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide mb-2 inline-block">Emergency Buffer</span>
                  <p className="text-sm text-gray-600">Reserved funds for unexpected costs (10% of total budget)</p>
                </div>
                <span className="font-bold text-xl text-gray-900">{formatINR(customizedPlan.emergencyReserve)}</span>
              </div>

            </div>

            {/* Confirm Button */}
            <div className="text-center pb-20">
              <button className="bg-green-600 hover:bg-green-700 text-white text-xl font-bold py-4 px-12 rounded-full shadow-lg shadow-green-200 transition transform hover:scale-105">
                Confirm & Book Trip
              </button>
            </div>
          </div>
        )}

      </main>

      {/* ================================================== */}
      {/* SWAP MODAL */}
      {/* ================================================== */}
      {swapModalOpen && itemToSwap && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-900 capitalize">Swap {itemToSwap}</h3>
              <button onClick={() => setSwapModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            
            <div className="p-6">
              {modalError && (
                <div className="mb-4 p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm font-medium">
                  {modalError}
                </div>
              )}
              
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                {apiResponse?.alternatives?.[itemToSwap]?.map((item: any, idx: number) => {
                  // Determine display values based on type
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
                    <div key={idx} className="border border-gray-200 rounded-xl p-4 flex justify-between items-center hover:border-indigo-300 hover:bg-indigo-50 transition cursor-pointer"
                         onClick={() => handleSwapItem(item)}>
                      <div>
                        <h4 className="font-bold text-gray-900">{title}</h4>
                        <p className="text-sm text-gray-500 font-medium">{subtitle}</p>
                      </div>
                      <button className="px-4 py-2 bg-white border border-gray-200 shadow-sm rounded-lg text-sm font-bold text-indigo-600 hover:bg-indigo-50">
                        Select
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}

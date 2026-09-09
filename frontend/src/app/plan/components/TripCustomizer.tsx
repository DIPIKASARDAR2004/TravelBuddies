import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { usePlanStore } from "@/store/usePlanStore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatINR } from "@/lib/utils";

import toast from "react-hot-toast";

export default function TripCustomizer() {
  const { customizedPlan, tripDetails, setView, setItemToSwap, setModalMode, setModalError, setSwapModalOpen, setCustomizedPlan, setTripDetails } = usePlanStore();
  const router = useRouter();
  const [isBooking, setIsBooking] = useState(false);

  if (!customizedPlan) return null;

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newBudget = Number(e.target.value);
    setTripDetails({ budget: newBudget });
    
    // Recalculate remaining budget
    const updatedPlan = { ...customizedPlan };
    updatedPlan.remainingBudget = newBudget - updatedPlan.emergencyReserve - updatedPlan.tripCost;
    setCustomizedPlan(updatedPlan);
  };

  const handleReserveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newReserve = Number(e.target.value);
    const updatedPlan = { ...customizedPlan };
    updatedPlan.emergencyReserve = newReserve;
    updatedPlan.remainingBudget = tripDetails.budget - newReserve - updatedPlan.tripCost;
    setCustomizedPlan(updatedPlan);
  };

  const handleDeleteCustomItem = (idx: number) => {
    const updatedPlan = { ...customizedPlan };
    const item = updatedPlan.extraItems[idx];
    updatedPlan.tripCost -= item.price;
    updatedPlan.extraItems.splice(idx, 1);
    
    // Recalculate
    updatedPlan.totalAllocated = Math.round((updatedPlan.tripCost + updatedPlan.emergencyReserve) * 100) / 100;
    updatedPlan.remainingBudget = Math.round((tripDetails.budget - updatedPlan.totalAllocated) * 100) / 100;
    setCustomizedPlan(updatedPlan);
    toast.success(`Removed ${item.name}`);
  };

  const openSwapModal = (type: 'hotel' | 'restaurant' | 'activity' | 'transport', mode: 'swap' | 'add' = 'swap') => {
    setItemToSwap(type);
    setModalMode(mode);
    setModalError("");
    setSwapModalOpen(true);
  };

  return (
    <div className="animate-in fade-in zoom-in-95 duration-300">
      
      <Button 
        variant="ghost" 
        onClick={() => setView("TIERS")}
        className="mb-8 gap-2 rounded-full"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        Back to Packages
      </Button>

      {/* Real-Time Math Section */}
      <div className="bg-gradient-to-br from-indigo-900 to-indigo-700 rounded-3xl p-6 text-white shadow-xl mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-indigo-500/50">
          <div className="pt-4 md:pt-0">
            <p className="text-indigo-200 text-sm font-medium uppercase tracking-wider mb-1">Total Budget</p>
            <div className="flex items-center justify-center gap-1">
              <span className="text-2xl font-bold">₹</span>
              <input 
                type="number" 
                value={tripDetails.budget} 
                onChange={handleBudgetChange}
                className="text-4xl font-bold bg-transparent border-b border-indigo-400/30 focus:border-white focus:outline-none w-32 text-center"
              />
            </div>
          </div>
          <div className="pt-4 md:pt-0">
            <p className="text-indigo-200 text-sm font-medium uppercase tracking-wider mb-1">Trip Cost</p>
            <p className="text-4xl font-bold text-amber-300">{formatINR(customizedPlan.tripCost)}</p>
            <p className="text-indigo-300 text-xs mt-1">Includes all base items + {customizedPlan.extraItems?.length || 0} custom items</p>
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
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Customize Your Selections</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        
        <Card hoverable className="p-5 flex flex-col justify-between border-white/20 dark:border-gray-700">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide">Accommodation</span>
              <span className="font-bold text-gray-900 dark:text-white">{formatINR(customizedPlan.accommodationCost)} <span className="text-xs text-gray-400 font-normal">total</span></span>
            </div>
            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{customizedPlan.selectedHotel?.name || "No Hotel Selected"}</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Price per night: {formatINR(customizedPlan.selectedHotel?.price)}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => openSwapModal('hotel')} className="flex-1">
              Swap
            </Button>
            <Button variant="outline" onClick={() => openSwapModal('hotel', 'add')} className="px-3">
              +
            </Button>
          </div>
        </Card>

        <Card hoverable className="p-5 flex flex-col justify-between border-white/20 dark:border-gray-700">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide">Food & Dining</span>
              <span className="font-bold text-gray-900 dark:text-white">{formatINR(customizedPlan.foodCost)} <span className="text-xs text-gray-400 font-normal">total</span></span>
            </div>
            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{customizedPlan.selectedRestaurant?.restaurant_name || "No Dining Selected"}</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Cost per meal: {formatINR(customizedPlan.selectedRestaurant?.cost_per_meal)}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => openSwapModal('restaurant')} className="flex-1">
              Swap
            </Button>
            <Button variant="outline" onClick={() => openSwapModal('restaurant', 'add')} className="px-3">
              +
            </Button>
          </div>
        </Card>

        <Card hoverable className="p-5 flex flex-col justify-between border-white/20 dark:border-gray-700">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide">Activities</span>
              <span className="font-bold text-gray-900 dark:text-white">{formatINR(customizedPlan.activityCost)} <span className="text-xs text-gray-400 font-normal">total</span></span>
            </div>
            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{customizedPlan.selectedActivity?.activity_name || "No Activity Selected"}</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Cost per person: {formatINR(customizedPlan.selectedActivity?.cost_per_person)}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => openSwapModal('activity')} className="flex-1">
              Swap
            </Button>
            <Button variant="outline" onClick={() => openSwapModal('activity', 'add')} className="px-3">
              +
            </Button>
          </div>
        </Card>

        <Card hoverable className="p-5 flex flex-col justify-between border-white/20 dark:border-gray-700">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide">Transport</span>
              <span className="font-bold text-gray-900 dark:text-white">{formatINR(customizedPlan.transportCost)} <span className="text-xs text-gray-400 font-normal">total</span></span>
            </div>
            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{customizedPlan.selectedTransport?.transport_mode || "No Transport Selected"}</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Cost per person: {formatINR(customizedPlan.selectedTransport?.cost_per_person)}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => openSwapModal('transport')} className="flex-1">
              Swap
            </Button>
            <Button variant="outline" onClick={() => openSwapModal('transport', 'add')} className="px-3">
              +
            </Button>
          </div>
        </Card>

        {/* Extra Items Card */}
        {customizedPlan.extraItems && customizedPlan.extraItems.length > 0 && (
          <Card className="p-5 md:col-span-2 border-dashed border-blue-300 dark:border-blue-800">
            <h4 className="font-bold text-gray-900 dark:text-white mb-4">Custom Additions</h4>
            <div className="space-y-3">
              {customizedPlan.extraItems.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center bg-gray-50 dark:bg-slate-800 p-3 rounded-lg">
                  <div className="flex items-center">
                    <button 
                      onClick={() => handleDeleteCustomItem(idx)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-full mr-3 transition-colors"
                      title="Remove item"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                    <div>
                      <span className="text-xs font-bold uppercase text-gray-500 mr-2">{item.type}</span>
                      <span className="font-medium dark:text-gray-200">{item.name}</span>
                    </div>
                  </div>
                  <span className="font-bold dark:text-gray-200">{formatINR(item.price)}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Buffer Card */}
        <div className="bg-gray-100 dark:bg-slate-800/80 p-5 rounded-2xl border border-gray-200 dark:border-slate-700 md:col-span-2 flex items-center justify-between">
          <div>
            <span className="bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide mb-2 inline-block">Emergency Buffer</span>
            <p className="text-sm text-gray-600 dark:text-gray-400">Reserved funds for unexpected costs (editable)</p>
          </div>
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-600">
            <span className="text-gray-500 font-bold">₹</span>
            <input 
              type="number"
              value={customizedPlan.emergencyReserve}
              onChange={handleReserveChange}
              className="w-24 bg-transparent outline-none font-bold text-xl text-gray-900 dark:text-white"
            />
          </div>
        </div>

      </div>

      {/* Confirm Button */}
      <div className="text-center pb-20 space-y-4 flex flex-col items-center">
        <Button 
          size="lg"
          onClick={async () => {
            setIsBooking(true);
            try {
              const res = await fetch('/api/payments/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  hotel: customizedPlan.selectedHotel,
                  destination: tripDetails.destination,
                  travellers: tripDetails.travellers,
                  days: tripDetails.days
                })
              });
              const data = await res.json();
              if (data.success) {
                router.push(`/plan/checkout/${data.booking_id}`);
              } else {
                alert(data.error || 'Failed to create booking');
              }
            } catch (err) {
              alert('Error creating booking');
            } finally {
              setIsBooking(false);
            }
          }}
          disabled={isBooking || !customizedPlan.selectedHotel}
          className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white text-xl py-4 px-12 rounded-full shadow-lg shadow-blue-200 dark:shadow-blue-900 transition transform hover:scale-105 disabled:opacity-50 flex items-center gap-2"
        >
          {isBooking ? (
            <span className="animate-pulse">Securing Booking...</span>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              Proceed to Protected Booking
            </>
          )}
        </Button>
        <p className="text-xs text-gray-500 font-medium">Secured by Razorpay • Test Mode</p>
        
        <Button 
          variant="outline" 
          size="lg" 
          onClick={() => router.push("/map")}
          className="mt-4 text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-900 dark:hover:bg-blue-900/30 rounded-full px-8 flex items-center gap-2 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
          View Trip on Map
        </Button>
      </div>
    </div>
  );
}

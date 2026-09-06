import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { usePlanStore } from "@/store/usePlanStore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatINR } from "@/lib/utils";

export default function TripCustomizer() {
  const { customizedPlan, tripDetails, setView, setItemToSwap, setModalError, setSwapModalOpen } = usePlanStore();
  const router = useRouter();
  const [isBooking, setIsBooking] = useState(false);

  if (!customizedPlan) return null;

  const openSwapModal = (type: 'hotel' | 'restaurant' | 'activity' | 'transport') => {
    setItemToSwap(type);
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
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Customize Your Selections</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        
        {/* Hotel Card */}
        <Card hoverable className="p-5 flex flex-col justify-between border-white/20 dark:border-gray-700">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide">Accommodation</span>
              <span className="font-bold text-gray-900 dark:text-white">{formatINR(customizedPlan.accommodationCost)} <span className="text-xs text-gray-400 font-normal">total</span></span>
            </div>
            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{customizedPlan.selectedHotel?.name || "No Hotel Selected"}</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Price per night: {formatINR(customizedPlan.selectedHotel?.price)}</p>

            {customizedPlan.selectedHotel?.is_women_friendly && (
              <div className="mt-2 mb-4 bg-rose-50 dark:bg-rose-950/30 p-3 rounded-lg border border-rose-100 dark:border-rose-900/50">
                <div className="mb-2">
                  <span className="bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide border border-rose-200 dark:border-rose-800">
                    Women-Friendly — Prototype Data
                  </span>
                </div>
                <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">Why Journey Pilot Recommends This Stay</h5>
                <ul className="text-xs space-y-1.5 text-slate-600 dark:text-slate-400">
                  {[
                    { label: "24×7 reception available", value: true },
                    { label: "Secure room locks", value: true },
                    { label: "CCTV in permitted common areas", value: true },
                    { label: "Emergency-contact procedure", value: true },
                    { label: "Women staff available", value: false },
                    { label: "Late-night transport assistance", value: true }
                  ].map((feature, idx) => feature.value ? (
                    <li key={idx} className="flex gap-1.5">
                      <span className="text-emerald-500 font-bold">✓</span> {feature.label}
                    </li>
                  ) : null)}
                </ul>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-3 italic leading-tight">
                  Based on prototype information. Please confirm these facilities with the property before booking.
                </p>
              </div>
            )}
          </div>
          <Button variant="secondary" onClick={() => openSwapModal('hotel')} fullWidth>
            Swap Hotel
          </Button>
        </Card>

        {/* Food Card */}
        <Card hoverable className="p-5 flex flex-col justify-between border-white/20 dark:border-gray-700">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide">Food & Dining</span>
              <span className="font-bold text-gray-900 dark:text-white">{formatINR(customizedPlan.foodCost)} <span className="text-xs text-gray-400 font-normal">total</span></span>
            </div>
            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{customizedPlan.selectedRestaurant?.restaurant_name || "No Dining Selected"}</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Cost per meal: {formatINR(customizedPlan.selectedRestaurant?.cost_per_meal)}</p>
          </div>
          <Button variant="secondary" onClick={() => openSwapModal('restaurant')} fullWidth>
            Swap Dining
          </Button>
        </Card>

        {/* Activity Card */}
        <Card hoverable className="p-5 flex flex-col justify-between border-white/20 dark:border-gray-700">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide">Activities</span>
              <span className="font-bold text-gray-900 dark:text-white">{formatINR(customizedPlan.activityCost)} <span className="text-xs text-gray-400 font-normal">total</span></span>
            </div>
            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{customizedPlan.selectedActivity?.activity_name || "No Activity Selected"}</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Cost per person: {formatINR(customizedPlan.selectedActivity?.cost_per_person)}</p>
          </div>
          <Button variant="secondary" onClick={() => openSwapModal('activity')} fullWidth>
            Swap Activity
          </Button>
        </Card>

        {/* Transport Card */}
        <Card hoverable className="p-5 flex flex-col justify-between border-white/20 dark:border-gray-700">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide">Transport</span>
              <span className="font-bold text-gray-900 dark:text-white">{formatINR(customizedPlan.transportCost)} <span className="text-xs text-gray-400 font-normal">total</span></span>
            </div>
            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{customizedPlan.selectedTransport?.transport_mode || "No Transport Selected"}</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Cost per person: {formatINR(customizedPlan.selectedTransport?.cost_per_person)}</p>
          </div>
          <Button variant="secondary" onClick={() => openSwapModal('transport')} fullWidth>
            Swap Transport
          </Button>
        </Card>

        {/* Buffer Card */}
        <div className="bg-gray-100 dark:bg-slate-800/80 p-5 rounded-2xl border border-gray-200 dark:border-slate-700 md:col-span-2 flex items-center justify-between">
          <div>
            <span className="bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide mb-2 inline-block">Emergency Buffer</span>
            <p className="text-sm text-gray-600 dark:text-gray-400">Reserved funds for unexpected costs (10% of total budget)</p>
          </div>
          <span className="font-bold text-xl text-gray-900 dark:text-white">{formatINR(customizedPlan.emergencyReserve)}</span>
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
      </div>
    </div>
  );
}

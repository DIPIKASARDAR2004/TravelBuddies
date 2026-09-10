import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { usePlanStore } from "@/store/usePlanStore";
import { formatINR } from "@/lib/utils";
import { FiArrowLeft, FiHome, FiCoffee, FiMap, FiTruck, FiPlus, FiTrash2, FiShield } from "react-icons/fi";
import toast from "react-hot-toast";

export default function TripCustomizer() {
  const { customizedPlan, tripDetails, setView, setItemToSwap, setModalMode, setModalError, setSwapModalOpen, setCustomizedPlan, setTripDetails } = usePlanStore();
  const router = useRouter();
  const [isBooking, setIsBooking] = useState(false);

  if (!customizedPlan) return null;

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newBudget = Number(e.target.value);
    setTripDetails({ budget: newBudget });
    
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

  const CustomizerCard = ({ type, title, cost, itemName, itemDetails, onSwap, onAdd, icon: Icon, colorClass }: any) => (
    <div className="glass-panel premium-shadow rounded-3xl p-6 flex flex-col justify-between hover-lift group border-t-4" style={{ borderColor: `var(--${colorClass}-500, #3b82f6)` }}>
      <div>
        <div className="flex justify-between items-start mb-4">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-${colorClass}-100 dark:bg-${colorClass}-900/30 text-${colorClass}-700 dark:text-${colorClass}-400`}>
            <Icon className="w-3.5 h-3.5" /> {title}
          </span>
          <div className="text-right">
            <span className="font-black text-xl text-slate-900 dark:text-white block">{formatINR(cost)}</span>
            <span className="text-[10px] uppercase font-bold text-slate-400">Total</span>
          </div>
        </div>
        <h4 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1 leading-tight">{itemName || `No ${title} Selected`}</h4>
        <p className="text-sm font-medium text-slate-500 mb-6">{itemDetails}</p>
      </div>
      <div className="flex gap-3">
        <button 
          onClick={onSwap} 
          className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition-colors"
        >
          Swap Option
        </button>
        <button 
          onClick={onAdd} 
          className="w-12 h-10 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition-colors"
          title="Add another"
        >
          <FiPlus className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="animate-in fade-in zoom-in-95 duration-500 max-w-6xl mx-auto px-4 pb-24">
      
      <button 
        onClick={() => setView("TIERS")}
        className="mb-8 flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
      >
        <FiArrowLeft /> Back to Packages
      </button>

      {/* Real-Time Dashboard */}
      <div className="bg-slate-900 dark:bg-black rounded-[2rem] p-8 md:p-10 shadow-2xl shadow-slate-900/20 mb-12 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>
        
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-slate-700/50">
          <div className="pt-4 md:pt-0">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3">Total Budget</p>
            <div className="flex items-center justify-center gap-1 bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 w-max mx-auto">
              <span className="text-2xl font-black text-white">₹</span>
              <input 
                type="number" 
                value={tripDetails.budget} 
                onChange={handleBudgetChange}
                className="text-3xl font-black bg-transparent text-white outline-none w-32 text-center"
              />
            </div>
          </div>
          <div className="pt-8 md:pt-0">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3">Estimated Trip Cost</p>
            <p className="text-4xl font-black text-white">{formatINR(customizedPlan.tripCost)}</p>
            <p className="text-slate-500 font-medium text-xs mt-2">Includes {customizedPlan.extraItems?.length || 0} custom items</p>
          </div>
          <div className="pt-8 md:pt-0">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3">Leftover Funds</p>
            <p className={`text-5xl font-black ${customizedPlan.remainingBudget >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatINR(customizedPlan.remainingBudget)}
            </p>
          </div>
        </div>
      </div>

      <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-8 tracking-tight">Fine-Tune Your Experience</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        
        <CustomizerCard 
          type="hotel" title="Accommodation" cost={customizedPlan.accommodationCost}
          itemName={customizedPlan.selectedHotel?.name}
          itemDetails={`Price per night: ${formatINR(customizedPlan.selectedHotel?.price)}`}
          onSwap={() => openSwapModal('hotel')} onAdd={() => openSwapModal('hotel', 'add')}
          icon={FiHome} colorClass="blue"
        />

        <CustomizerCard 
          type="restaurant" title="Food & Dining" cost={customizedPlan.foodCost}
          itemName={customizedPlan.selectedRestaurant?.restaurant_name}
          itemDetails={`Avg meal cost: ${formatINR(customizedPlan.selectedRestaurant?.cost_per_meal)}`}
          onSwap={() => openSwapModal('restaurant')} onAdd={() => openSwapModal('restaurant', 'add')}
          icon={FiCoffee} colorClass="orange"
        />

        <CustomizerCard 
          type="activity" title="Activities" cost={customizedPlan.activityCost}
          itemName={customizedPlan.selectedActivity?.activity_name}
          itemDetails={`Cost per person: ${formatINR(customizedPlan.selectedActivity?.cost_per_person)}`}
          onSwap={() => openSwapModal('activity')} onAdd={() => openSwapModal('activity', 'add')}
          icon={FiMap} colorClass="emerald"
        />

        <CustomizerCard 
          type="transport" title="Transport" cost={customizedPlan.transportCost}
          itemName={customizedPlan.selectedTransport?.transport_mode}
          itemDetails={`Cost per person: ${formatINR(customizedPlan.selectedTransport?.cost_per_person)}`}
          onSwap={() => openSwapModal('transport')} onAdd={() => openSwapModal('transport', 'add')}
          icon={FiTruck} colorClass="purple"
        />

        {/* Custom Items */}
        {customizedPlan.extraItems && customizedPlan.extraItems.length > 0 && (
          <div className="lg:col-span-2 glass-panel p-8 rounded-3xl border-2 border-dashed border-blue-200 dark:border-blue-800/50">
            <h4 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <FiPlus className="text-blue-500" /> Custom Add-ons
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customizedPlan.extraItems.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center bg-white/50 dark:bg-slate-800/50 p-4 rounded-2xl shadow-sm hover-lift">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => handleDeleteCustomItem(idx)}
                      className="text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 p-2 rounded-full transition-colors"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">{item.type}</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{item.name}</span>
                    </div>
                  </div>
                  <span className="font-black text-slate-900 dark:text-white">{formatINR(item.price)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Emergency Buffer */}
        <div className="lg:col-span-2 glass-panel p-8 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 ring-1 ring-amber-500/30 bg-amber-50/30 dark:bg-amber-900/10">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-2xl">
              <FiShield className="w-6 h-6" />
            </div>
            <div>
              <span className="text-sm font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 block mb-1">Safety & Emergency Buffer</span>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Reserved funds for unexpected costs (editable)</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-4 py-3 rounded-2xl shadow-inner border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 font-bold text-xl">₹</span>
            <input 
              type="number"
              value={customizedPlan.emergencyReserve}
              onChange={handleReserveChange}
              className="w-28 bg-transparent outline-none font-black text-2xl text-slate-900 dark:text-white text-center"
            />
          </div>
        </div>

      </div>

      {/* Action Footer */}
      <div className="text-center space-y-6 flex flex-col items-center max-w-sm mx-auto">
        <button 
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
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xl py-5 px-8 rounded-2xl shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 transition-all hover-lift disabled:opacity-50 disabled:hover:transform-none flex items-center justify-center gap-3"
        >
          {isBooking ? (
            <span className="animate-pulse">Securing Booking...</span>
          ) : (
            <>Secure Booking</>
          )}
        </button>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Secured by Razorpay • Test Mode</p>
        
        <button 
          onClick={() => router.push("/map")}
          className="w-full py-4 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors"
        >
          Preview on Map
        </button>
      </div>
    </div>
  );
}

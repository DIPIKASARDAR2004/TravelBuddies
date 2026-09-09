import React, { useState } from "react";
import { usePlanStore } from "@/store/usePlanStore";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FiShield } from "react-icons/fi";
import { apiClient } from "@/lib/services/apiClient";
import toast from "react-hot-toast";

export default function PlanForm({ womenOnly = false }: { womenOnly?: boolean }) {
  const { setTripDetails, setApiResponse, setLoading, setView, loading } = usePlanStore();
  
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      alert("Please select travel dates.");
      return;
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (end <= start) {
      alert("Check-out date must be after check-in date.");
      return;
    }
    
    setLoading(true);
    setApiResponse(null);

    const formData = new FormData(e.currentTarget);
    const destination = formData.get("destination") as string;
    const budget = Number(formData.get("budget"));
    const travellers = Number(formData.get("travellers"));
    
    const calculatedDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

    setTripDetails({ 
      destination, 
      budget, 
      travellers, 
      days: calculatedDays,
      dates: { startDate, endDate },
      isSafetyTrip: womenOnly
    });

    const data = { destination, totalBudget: budget, travellers, days: calculatedDays, womenOnly };

    try {
      const result = await apiClient("/api/plan", {
        method: "POST",
        body: JSON.stringify(data),
      });

      setApiResponse(result);
      
      if (result.isTripPossible && result.withinBudget && result.withinBudget.length > 0) {
        setView("TIERS");
      } else {
        toast.error(result.error || "Trip not possible with this budget! Try increasing your budget.");
      }
    } catch (error) {
      console.error("Error connecting to API:", error);
      // apiClient already handles toast.error for network issues
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-xl mx-auto p-8 border border-white/20 dark:border-gray-700">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center gap-2">
          {womenOnly && <FiShield className="text-rose-500" />}
          Plan Your {womenOnly ? "Safe" : "Dream"} Trip
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          {womenOnly 
            ? "Recommendations will be strictly filtered for verified women-friendly stays."
            : "Enter your details and let our recommendation engine build your packages."}
        </p>
      </div>
      
      <form className="space-y-6" onSubmit={handleSubmit}>
        <Input 
          label="Destination" 
          name="destination" 
          placeholder="e.g. Digha" 
          required 
        />
        
        <Input 
          label="Total Budget (Max Limit) ₹" 
          type="number" 
          name="budget" 
          placeholder="15000" 
          min="1000" 
          required 
        />

        <div className="grid grid-cols-2 gap-4">
          <Input 
            label="Travellers" 
            type="number" 
            name="travellers" 
            placeholder="2" 
            min="1" 
            required 
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Check-in</label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Check-out</label>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              required
            />
          </div>
        </div>

        <Button 
          type="submit" 
          disabled={loading} 
          fullWidth 
          size="lg"
          className={`py-4 text-lg hover:-translate-y-1 ${
            womenOnly 
              ? "bg-rose-600 hover:bg-rose-700 shadow-rose-200 dark:shadow-rose-900/40" 
              : "shadow-indigo-200 dark:shadow-indigo-900/40"
          }`}
        >
          {loading ? "Generating Magic..." : "Generate Trip Packages"}
        </Button>
      </form>
    </Card>
  );
}

import React from "react";
import { usePlanStore } from "@/store/usePlanStore";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function PlanForm({ womenOnly = false }: { womenOnly?: boolean }) {
  const { setTripDetails, setApiResponse, setLoading, setView, loading } = usePlanStore();

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

    const data = { destination, totalBudget: budget, travellers, days, womenOnly };

    try {
      // TODO: Move to dedicated API service file later
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

  return (
    <Card className="max-w-xl mx-auto p-8 border border-white/20 dark:border-gray-700">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Plan Your Dream Trip</h2>
        <p className="text-gray-500 dark:text-gray-400">Enter your details and let our recommendation engine build your packages.</p>
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
          <Input 
            label="Days" 
            type="number" 
            name="days" 
            placeholder="3" 
            min="1" 
            required 
          />
        </div>

        <Button 
          type="submit" 
          disabled={loading} 
          fullWidth 
          size="lg"
          className="py-4 text-lg shadow-indigo-200 dark:shadow-indigo-900/40 hover:-translate-y-1"
        >
          {loading ? "Generating Magic..." : "Generate Trip Packages"}
        </Button>
      </form>
    </Card>
  );
}

"use client";
import { useState } from "react";

export default function AIExpense() {
  const [destination, setDestination] = useState("Bangkok");
  const [days, setDays] = useState(5);
  const [suggestion, setSuggestion] = useState(0);

  const suggestDailyBudget = () => {
    const cityAvg: any = { Bangkok: 60, Paris: 120, Delhi: 40 };
    const total = cityAvg[destination] ? cityAvg[destination] * days : 50 * days;
    setSuggestion(total);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <h2 className="text-2xl font-bold mb-4">🤖 AI Expense Suggestion</h2>
      <input
        type="text"
        className="border p-2 rounded mb-2 w-48 text-center"
        value={destination}
        onChange={(e) => setDestination(e.target.value)}
        placeholder="Destination"
      />
      <input
        type="number"
        className="border p-2 rounded mb-2 w-48 text-center"
        value={days}
        onChange={(e) => setDays(Number(e.target.value))}
        placeholder="Number of days"
      />
      <button
        className="bg-purple-500 text-white px-4 py-2 rounded"
        onClick={suggestDailyBudget}
      >
        Suggest Budget
      </button>
      {suggestion > 0 && (
        <p className="mt-4 text-lg font-semibold">
          Suggested Total Budget: ${suggestion}
        </p>
      )}
    </div>
  );
}

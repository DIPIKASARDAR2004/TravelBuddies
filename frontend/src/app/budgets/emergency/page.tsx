"use client";
import { useState } from "react";

export default function EmergencyBuffer() {
  const [budget, setBudget] = useState(1000);
  const [spent, setSpent] = useState(0);
  const buffer = budget * 0.1; // 10% emergency buffer
  const remaining = budget - spent;
  const available = remaining < 0 ? buffer + remaining : remaining;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <h2 className="text-2xl font-bold mb-4">🛡️ Emergency Buffer</h2>
      <input
        type="number"
        className="border p-2 rounded mb-2 w-48 text-center"
        value={budget}
        onChange={(e) => setBudget(Number(e.target.value))}
        placeholder="Total Budget"
      />
      <input
        type="number"
        className="border p-2 rounded mb-2 w-48 text-center"
        value={spent}
        onChange={(e) => setSpent(Number(e.target.value))}
        placeholder="Amount Spent"
      />
      <p className={`mt-4 text-lg font-semibold ${available < 0 ? "text-red-600" : "text-green-600"}`}>
        {available < 0
          ? `⚠️ Over budget! Emergency buffer used: $${Math.abs(available)}`
          : `✅ Remaining including buffer: $${available}`}
      </p>
    </div>
  );
}

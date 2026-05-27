"use client";
import { useState } from "react";

export default function SplitShare() {
  const [amount, setAmount] = useState(0);
  const [people, setPeople] = useState(1);
  const [split, setSplit] = useState<number[]>([]);

  const handleSplit = () => {
    const arr = Array(people).fill(Number((amount / people).toFixed(2)));
    setSplit(arr);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <h2 className="text-2xl font-bold mb-4">👥 Split & Share</h2>
      <input
        type="number"
        className="border p-2 rounded mb-2 w-48 text-center"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
        placeholder="Expense Amount"
      />
      <input
        type="number"
        className="border p-2 rounded mb-2 w-48 text-center"
        value={people}
        onChange={(e) => setPeople(Number(e.target.value))}
        placeholder="Number of People"
      />
      <button
        className="bg-yellow-500 text-white px-4 py-2 rounded"
        onClick={handleSplit}
      >
        Split
      </button>
      {split.length > 0 && (
        <p className="mt-4 text-lg font-semibold">
          Each Person Pays: {split.join(", $")}
        </p>
      )}
    </div>
  );
}

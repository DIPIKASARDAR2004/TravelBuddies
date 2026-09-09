"use client";

import { useState, useEffect } from "react";

type Stay = {
  id: number;
  name: string;
  location: string;
  type: string;
  price: number;
};

const stays: Stay[] = [
  { id: 1, name: "Safe Nest Hostel", location: "Digha", type: "Women-only Hostels", price: 1200 },
  { id: 2, name: "Comfort Hotel", location: "Digha", type: "Family-friendly Hotels", price: 2500 },
  { id: 3, name: "Seaside Hostel", location: "Puri", type: "Women-only Hostels", price: 1500 },
  { id: 4, name: "Queens Stay", location: "Puri", type: "Family-friendly Hotels", price: 3000 },
];

export default function BudgetCalculator({ selectedType }: { selectedType: string | null }) {
  const [place, setPlace] = useState("");
  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [results, setResults] = useState<Stay[]>([]);

  const handleSearch = () => {
    const min = Number(minBudget) || 0;
    const max = Number(maxBudget) || Infinity;

    const filtered = stays.filter(
      (stay) =>
        stay.location.toLowerCase().includes(place.toLowerCase()) &&
        (!selectedType || stay.type === selectedType) &&
        stay.price >= min &&
        stay.price <= max
    );

    setResults(filtered);
  };

  // Auto-update results if SafeStay filter changes
  useEffect(() => {
    if (selectedType) {
      handleSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedType]);

  return (
    <div className="p-6 glass-panel rounded-xl shadow-lg max-w-lg mx-auto">
      <h2 className="text-2xl font-bold text-purple-800 dark:text-purple-300 mb-4">💰 Budget Calculator</h2>

      {/* Place Input */}
      <input
        type="text"
        placeholder="Enter Location (e.g., Digha)"
        value={place}
        onChange={(e) => setPlace(e.target.value)}
        className="w-full px-3 py-2 mb-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-400 dark:text-white"
      />

      {/* Budget Inputs */}
      <div className="flex gap-3 mb-3">
        <input
          type="number"
          placeholder="Min Budget ₹"
          value={minBudget}
          onChange={(e) => setMinBudget(e.target.value)}
          className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-400 dark:text-white"
        />
        <input
          type="number"
          placeholder="Max Budget ₹"
          value={maxBudget}
          onChange={(e) => setMaxBudget(e.target.value)}
          className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-400 dark:text-white"
        />
      </div>

      {/* Search Button */}
      <button
        onClick={handleSearch}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white dark:bg-purple-700 dark:hover:bg-purple-600 py-2 rounded-lg font-semibold hover:bg-purple-700 transition"
      >
        Get Suggestions
      </button>

      {/* Results */}
      <div className="mt-5">
        {results.length > 0 ? (
          <ul className="space-y-2">
            {results.map((stay) => (
              <li
                key={stay.id}
                className="p-3 glass-panel rounded-lg shadow flex justify-between"
              >
                <span>
                  <strong>{stay.name}</strong> - {stay.type} ({stay.location})
                </span>
                <span className="font-bold text-purple-700 dark:text-purple-300">₹{stay.price}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 mt-3 text-sm">
            🔍 No results found. Try adjusting your filters.
          </p>
        )}
      </div>
    </div>
  );
}

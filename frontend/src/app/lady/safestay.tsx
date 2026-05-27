"use client";

import { useState } from "react";

type SafeStayProps = {
  onFilterSelect: (filter: string) => void;
};

export default function SafeStay({ onFilterSelect }: SafeStayProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const filters = [
    "Women-only Hostels",
    "Family-friendly Hotels",
    "Safe Neighborhoods",
    "24/7 Reception",
  ];

  const handleClick = (filter: string) => {
    setSelected(filter);
    onFilterSelect(filter); // send filter to parent
  };

  return (
    <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl shadow-md">
      <h2 className="text-xl font-bold text-green-800 mb-4">🏨 Safe Stays</h2>
      <p className="text-sm text-gray-700 mb-3">
        Find verified and women-friendly accommodations with trusted reviews
        and safety features.
      </p>

      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => handleClick(filter)}
            className={`px-3 py-1 rounded-lg text-sm font-medium shadow ${
              selected === filter
                ? "bg-green-600 text-white"
                : "bg-white text-green-700 border border-green-300 hover:bg-green-50"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {selected && (
        <p className="mt-4 text-xs text-gray-600">
          ✅ Showing stays filtered by: <strong>{selected}</strong>
        </p>
      )}
    </div>
  );
}

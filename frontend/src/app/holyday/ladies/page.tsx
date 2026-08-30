"use client";

import { useState } from "react";

type Stay = {
  id: number;
  name: string;
  type: string;
  location: string;
  safety: string;
};

const stays: Stay[] = [
  {
    id: 1,
    name: "Safe Nest Hostel",
    type: "Women-only Dorm",
    location: "Mumbai",
    safety: "CCTV, Female staff, Secure locks",
  },
  {
    id: 2,
    name: "Family Comfort Hotel",
    type: "Family-friendly",
    location: "Delhi",
    safety: "24/7 Reception, Verified ID hosts",
  },
];

export default function SafeStay() {
  const [filter, setFilter] = useState<string>("all");

  const filteredStays =
    filter === "all" ? stays : stays.filter((stay) => stay.type.includes(filter));

  return (
    <section className="p-6 border rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4">👩‍🦰 Safe Spaces to Stay</h1>

      {/* Filter Dropdown */}
      <select
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="border p-2 rounded mb-4"
      >
        <option value="all">All</option>
        <option value="Women-only">Women-only</option>
        <option value="Family-friendly">Family-friendly</option>
      </select>

      {/* Stay Cards */}
      <div className="grid gap-4">
        {filteredStays.map((stay) => (
          <div key={stay.id} className="border p-4 rounded-lg bg-white dark:bg-slate-800">
            <h2 className="text-xl font-semibold">{stay.name}</h2>
            <p>{stay.type}</p>
            <p>📍 {stay.location}</p>
            <p>🔒 {stay.safety}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

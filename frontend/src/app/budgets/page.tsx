"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaMapMarkerAlt,
  FaDollarSign,
  FaGlobe,
  FaRobot,
  FaUsers,
  FaShieldAlt,
} from "react-icons/fa";

export default function BudgetPage() {
  const router = useRouter();

  const [location, setLocation] = useState("");
  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [option, setOption] = useState("full");
  const [result, setResult] = useState<string[] | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const allPackages = [
      { name: "Hotel A", type: "hotel", location: "Digha", price: 2000 },
      { name: "Hotel B", type: "hotel", location: "Kolkata", price: 3500 },
      { name: "Train 1", type: "train", location: "Digha", price: 800 },
      { name: "Train 2", type: "train", location: "Kolkata", price: 1200 },
      { name: "Restaurant X", type: "restaurant", location: "Digha", price: 500 },
      { name: "Restaurant Y", type: "restaurant", location: "Kolkata", price: 900 },
    ];

    const filtered = allPackages.filter((pkg) => {
      const matchLocation =
        location.trim() === "" ? true : pkg.location.toLowerCase() === location.toLowerCase();
      const matchBudget = pkg.price >= Number(minBudget) && pkg.price <= Number(maxBudget);
      const matchType = option === "full" ? true : pkg.type === option;
      return matchLocation && matchBudget && matchType;
    });

    const suggestions = filtered.map(
      (pkg) => `${pkg.name} - ₹${pkg.price} (${pkg.type}, ${pkg.location})`
    );

    setResult(suggestions.length ? suggestions : ["No suggestions found"]);
  };

  const features = [
    {
      icon: <FaGlobe className="text-4xl text-green-500 mx-auto" />,
      title: "Currency Converter",
      desc: "Get live rates and offline updates for international trips.",
      link: "/budgets/currency",
    },
    {
      icon: <FaRobot className="text-4xl text-purple-500 mx-auto" />,
      title: "AI Expense Suggestions",
      desc: "Predicts costs and alerts when overspending.",
      link: "/budgets/ai",
    },
    {
      icon: <FaUsers className="text-4xl text-yellow-500 mx-auto" />,
      title: "Split & Share",
      desc: "Easily divide group expenses and notify members.",
      link: "/budgets/split",
    },
    {
      icon: <FaShieldAlt className="text-4xl text-red-500 mx-auto" />,
      title: "Emergency Buffer",
      desc: "Reserve 5–10% of budget as a safety cushion.",
      link: "/budgets/emergency",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 p-6 flex flex-col items-center">
      {/* Budget Calculator */}
      <div className="bg-white shadow-2xl rounded-3xl p-8 max-w-xl w-full mt-10">
        <h1 className="text-3xl font-bold mb-6 text-center text-blue-700">
          Budget Packages
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Location */}
          <div className="relative">
            <FaMapMarkerAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500" />
            <input
              type="text"
              placeholder="Enter Location (e.g., Digha)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full border border-gray-300 p-3 pl-10 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
              required
            />
          </div>

          {/* Budget */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <FaDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500" />
              <input
                type="number"
                placeholder="Min Budget ₹"
                value={minBudget}
                onChange={(e) => setMinBudget(e.target.value)}
                className="w-full border border-gray-300 p-3 pl-10 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-transparent transition"
                required
              />
            </div>
            <div className="relative flex-1">
              <FaDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500" />
              <input
                type="number"
                placeholder="Max Budget ₹"
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value)}
                className="w-full border border-gray-300 p-3 pl-10 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-transparent transition"
                required
              />
            </div>
          </div>

          {/* Package Type */}
          <div className="relative">
            <select
              value={option}
              onChange={(e) => setOption(e.target.value)}
              className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent transition appearance-none"
            >
              <option value="full">Full Package (Hotel + Train + Restaurant)</option>
              <option value="hotel">Only Hotel</option>
              <option value="train">Only Train</option>
              <option value="restaurant">Only Restaurant</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:scale-105 transform transition"
          >
            Get Suggestions
          </button>
        </form>

        {/* Results */}
        {result && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-3">Suggestions:</h2>
            <ul className="list-disc pl-6 space-y-2">
              {result.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Budget Features */}
      <section className="py-10 bg-gray-50 mt-12 rounded-2xl w-full max-w-6xl">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          💡 Unique Budget Calculator Features
        </h1>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 px-6">
          {features.map((f, i) => (
            <div
              key={i}
              onClick={() => router.push(f.link)}
              className="bg-white rounded-2xl p-6 shadow hover:shadow-lg hover:scale-105 transition-transform cursor-pointer text-center"
            >
              {f.icon}
              <h2 className="mt-4 text-xl font-semibold">{f.title}</h2>
              <p className="mt-2 text-gray-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

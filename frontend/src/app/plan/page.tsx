"use client";

import React from "react";
import Link from "next/link";

export default function PlanPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-blue-50">
      <h1 className="text-4xl font-bold text-indigo-600 mb-4">Trip Planner</h1>
      <p className="text-xl text-gray-700 mb-8 max-w-2xl">
        Build your perfect itinerary, manage your budget, and invite your friends. This feature is coming soon!
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl w-full">
        <div className="bg-white p-6 rounded-xl shadow border border-gray-100 flex flex-col items-center">
          <div className="text-4xl mb-4">📅</div>
          <h3 className="text-xl font-bold mb-2">Smart Itinerary</h3>
          <p className="text-gray-600 text-sm">Automatically generate a day-by-day plan based on your preferences.</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow border border-gray-100 flex flex-col items-center">
          <div className="text-4xl mb-4">💰</div>
          <h3 className="text-xl font-bold mb-2">Budget Tracker</h3>
          <p className="text-gray-600 text-sm">Keep track of expenses and split bills with your travel buddies.</p>
        </div>
      </div>
      
      <div className="mt-12">
        <Link 
          href="/" 
          className="inline-block px-8 py-3 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 transition duration-300 font-medium shadow-md"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}

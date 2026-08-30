"use client";

import React from "react";
import Link from "next/link";

export default function ExplorePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-gray-50 dark:bg-slate-900">
      <h1 className="text-4xl font-bold text-blue-600 mb-4">Explore Destinations</h1>
      <p className="text-xl text-gray-700 dark:text-gray-300 mb-8 max-w-2xl">
        Discover new places, hidden gems, and popular tourist spots. This section is currently under construction.
      </p>
      
      <div className="p-6 glass-panel premium-shadow rounded-xl shadow-md border border-gray-100 max-w-md w-full">
        <h2 className="text-2xl font-semibold mb-3 dark:text-white">Coming Soon</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          We are working hard to bring you the best travel recommendations. Check back later!
        </p>
        
        <Link 
          href="/" 
          className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-300 font-medium shadow-sm hover:shadow-md"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
}

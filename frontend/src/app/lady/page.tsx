"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import SafeStay from "./safestay";
import BudgetCalculator from "./budgetcalculator";
import LocationTracking from "./locationtracker";
import SpyCameraDetection from "./spycameradetection";
import SOSButton from "./sosbutton";

export default function LadyPage() {
  const [selectedType, setSelectedType] = useState<string | null>(null);

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100">
      {/* Hero Banner */}
      <section className="text-center py-16 bg-gradient-to-r from-pink-500 to-pink-700 text-white rounded-b-[40px] shadow-lg">
        <h1 className="text-5xl font-extrabold mb-4">👩‍🦰 Women Safety Hub</h1>
        <p className="text-lg opacity-90 max-w-2xl mx-auto">
          One-stop solution for safe & stress-free travel — from secure stays to
          SOS help at your fingertips.
        </p>
      </section>

      {/* Features */}
      <div className="p-6 space-y-12 max-w-5xl mx-auto">
        {/* Safe Stay Feature */}
        <motion.section
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <h2 className="text-2xl font-bold text-pink-700 mb-4 flex items-center gap-2">
            🏨 Safe Stays
          </h2>
          <SafeStay onFilterSelect={setSelectedType} />
        </motion.section>

        {/* Budget Calculator */}
        <motion.section
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <h2 className="text-2xl font-bold text-pink-700 mb-4 flex items-center gap-2">
            💰 Budget Calculator
          </h2>
          <BudgetCalculator selectedType={selectedType} />
        </motion.section>

        {/* Location Tracking */}
        <motion.section
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <h2 className="text-2xl font-bold text-pink-700 mb-4 flex items-center gap-2">
            📍 Location Tracking
          </h2>
          <LocationTracking />
        </motion.section>

        {/* Spy Camera Detection */}
        <motion.section
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <h2 className="text-2xl font-bold text-pink-700 mb-4 flex items-center gap-2">
            🔍 Spy Camera Detection
          </h2>
          <SpyCameraDetection />
        </motion.section>

        {/* SOS Button */}
        <motion.section
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="bg-gradient-to-r from-red-500 to-pink-600 text-center rounded-2xl shadow-lg p-8"
        >
          <h2 className="text-2xl font-bold text-white mb-4">🚨 Emergency SOS</h2>
          <SOSButton />
        </motion.section>
      </div>
    </main>
  );
}

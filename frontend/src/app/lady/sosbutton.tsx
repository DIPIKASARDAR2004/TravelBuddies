"use client";

import { useState } from "react";

export default function SOSButton() {
  const [isSending, setIsSending] = useState(false);

  const handleSOS = () => {
    setIsSending(true);

    // Get live location (browser geolocation)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        // Mock sending alert
        console.log("🚨 SOS Alert Sent!");
        console.log(`Location: https://maps.google.com/?q=${latitude},${longitude}`);

        setTimeout(() => {
          setIsSending(false);
          alert("🚨 SOS Alert Sent to Trusted Contacts + Local Police!");
        }, 2000);
      },
      () => {
        alert("⚠️ Could not fetch location. Please enable GPS.");
        setIsSending(false);
      }
    );
  };

  return (
    <div className="flex justify-center mt-6">
      <button
        onClick={handleSOS}
        disabled={isSending}
        className={`px-6 py-3 rounded-full text-white font-bold text-lg shadow-lg transition transform hover:scale-105 ${
          isSending
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-red-600 hover:bg-red-700 dark:bg-red-800 dark:hover:bg-red-900 animate-pulse"
        }`}
      >
        {isSending ? "📡 Sending SOS..." : "🚨 SOS Emergency"}
      </button>
    </div>
  );
}

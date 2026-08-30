"use client";

import { useState } from "react";

export default function LocationTracking() {
  const [isSharing, setIsSharing] = useState(false);

  const toggleShare = () => {
    setIsSharing(!isSharing);
  };

  return (
    <div className="p-4 glass-panel rounded-xl shadow-md">
      <h2 className="text-xl font-bold text-blue-800 dark:text-blue-300 mb-4">
        📍 Live Location Tracking
      </h2>

      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
        Share your live location with trusted contacts. Your route is stored
        securely and can be retrieved in case of emergency.
      </p>

      <button
        onClick={toggleShare}
        className={`px-4 py-2 rounded-lg text-white font-semibold shadow transition ${
          isSharing ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700 dark:bg-indigo-600 dark:hover:bg-indigo-700"
        }`}
      >
        {isSharing ? "🛑 Stop Sharing" : "✅ Start Sharing"}
      </button>

      {isSharing && (
        <p className="mt-3 text-xs text-gray-600 dark:text-gray-400">
          📡 Location is being shared with your trusted contacts...
        </p>
      )}
    </div>
  );
}

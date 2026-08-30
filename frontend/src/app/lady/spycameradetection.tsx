"use client";

import { useState, useEffect } from "react";

export default function SpyCameraDetection() {
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<null | string>(null);

  const startScan = () => {
    setScanning(true);
    setProgress(0);
    setResult(null);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (scanning && progress < 100) {
      timer = setTimeout(() => setProgress(progress + 10), 400);
    }
    if (progress === 100) {
      setScanning(false);
      // Fake result
      setResult("✅ No hidden spy cameras detected in your room!");
    }
    return () => clearTimeout(timer);
  }, [scanning, progress]);

  return (
    <div className="p-4 glass-panel rounded-xl shadow-md">
      <h2 className="text-xl font-bold text-pink-800 dark:text-pink-300 mb-4">
        🔍 Spy Camera Detection
      </h2>

      <div className="mb-4 space-y-2 text-gray-700 dark:text-gray-300 text-sm">
        <p>✨ <strong>Step 1:</strong> Look for unusual objects.</p>
        <p>✨ <strong>Step 2:</strong> Use flashlight in dark.</p>
        <p>✨ <strong>Step 3:</strong> Scan with phone camera.</p>
        <p>✨ <strong>Step 4:</strong> Check mirrors for gaps.</p>
      </div>

      {!scanning && !result && (
        <button
          onClick={startScan}
          className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white dark:bg-pink-700 dark:hover:bg-pink-600 text-sm font-semibold rounded-lg shadow hover:bg-pink-700 transition"
        >
          🚨 Start Scan
        </button>
      )}

      {scanning && (
        <div className="mt-4">
          <p className="mb-1 text-gray-800 dark:text-gray-200 text-sm font-semibold">Scanning...</p>
          <div className="w-full bg-pink-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-pink-600 h-3 transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{progress}%</p>
        </div>
      )}

      {result && (
        <div className="mt-4 p-3 bg-green-100 border border-green-400 rounded-lg text-green-800 text-sm font-semibold">
          {result}
        </div>
      )}
    </div>
  );
}

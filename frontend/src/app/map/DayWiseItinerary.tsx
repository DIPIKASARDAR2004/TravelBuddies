import React, { useState } from 'react';
import { FiClock, FiMapPin, FiMoon, FiAlertTriangle, FiNavigation, FiCalendar, FiSun } from 'react-icons/fi';
import { formatTime, formatDuration } from "@/lib/utils";
import { DayCard } from "@/components/ui/DayCard";

const LATE_NIGHT_THRESHOLD_MINUTES = 23 * 60; // 11:00 PM

export default function DayWiseItinerary({ itinerary }: { itinerary: any[] }) {
  const [showDemoAlert, setShowDemoAlert] = useState(false);
  const [expandedDays, setExpandedDays] = useState<Record<number, boolean>>({});

  const toggleDay = (dayNum: number) => {
    setExpandedDays(prev => ({ ...prev, [dayNum]: !prev[dayNum] }));
  };

  if (!itinerary || itinerary.length === 0) return null;

  return (
    <div className="mt-12 space-y-8">
      <div className="flex justify-between items-end pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <FiCalendar className="text-blue-500" />
            Trip Itinerary
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Smart day-wise guide optimized for your travel</p>
        </div>
        <button 
          onClick={() => setShowDemoAlert(!showDemoAlert)}
          className="text-xs font-semibold px-4 py-2 bg-amber-100/50 hover:bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 dark:text-amber-200 rounded-full transition-colors border border-amber-200/50 dark:border-amber-700/30 shadow-sm flex items-center gap-2"
        >
          <FiAlertTriangle />
          {showDemoAlert ? "Hide Demo Alert" : "Test Alert"}
        </button>
      </div>

      {showDemoAlert && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border border-amber-200 dark:border-amber-800 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-full text-amber-600 dark:text-amber-400 shrink-0">
              <FiAlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-bold text-amber-900 dark:text-amber-300">Late-Night Travel Alert</h4>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-200 px-2 py-0.5 rounded-full">Demo Preview</span>
              </div>
              <p className="text-sm text-amber-800/80 dark:text-amber-200/80 mt-1">
                Your estimated return to the hotel is after 11:00 PM. Please ensure you have secure and reliable transportation arranged for the return trip.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {itinerary.map((day, idx) => {
          const isExpanded = expandedDays[day.dayNumber] !== false; // Default true
          const hasLateReturn = day.hotelReturnTime && day.hotelReturnTime > LATE_NIGHT_THRESHOLD_MINUTES;

          return (
            <DayCard 
              key={idx}
              day={day}
              idx={idx}
              isExpanded={isExpanded}
              toggleDay={toggleDay}
            />
          );
        })}
      </div>
    </div>
  );
}

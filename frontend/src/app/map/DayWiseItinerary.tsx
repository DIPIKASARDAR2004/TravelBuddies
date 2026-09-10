import React, { useState } from "react";
import { FiCalendar } from "react-icons/fi";
import { DayCard } from "@/components/ui/DayCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { EnrichedItineraryDay } from "@/types";

export default function DayWiseItinerary({ itinerary }: { itinerary: EnrichedItineraryDay[] }) {
  const [expandedDays, setExpandedDays] = useState<Record<number, boolean>>({});

  const toggleDay = (dayNum: number) => {
    setExpandedDays((prev) => ({ ...prev, [dayNum]: !prev[dayNum] }));
  };

  if (!itinerary || itinerary.length === 0) {
    return (
      <div className="mt-12">
        <StatusBanner title="Itinerary preview unavailable">
          Add a hotel and at least one mappable activity to generate the day-wise route preview.
        </StatusBanner>
      </div>
    );
  }

  const lateReturnDays = itinerary.filter((day) => (day.hotelReturnTime ?? 0) > 23 * 60).length;

  return (
    <div className="mt-12 space-y-8">
      <SectionHeader
        eyebrow="Route-aware timeline"
        title="Day-wise itinerary"
        description="Review each day with estimated drive legs, activity timing, and return-to-hotel guidance."
        actions={
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            <FiCalendar className="text-sky-500" />
            {itinerary.length} day{itinerary.length === 1 ? "" : "s"}
          </div>
        }
      />

      {lateReturnDays > 0 ? (
        <StatusBanner tone="warning" title="Late-return guidance">
          {lateReturnDays} day{lateReturnDays === 1 ? "" : "s"} currently end after 11:00 PM. Consider locking in transport before you travel.
        </StatusBanner>
      ) : null}

      <div className="space-y-6">
        {itinerary.map((day) => {
          const isExpanded = expandedDays[day.dayNumber] !== false;

          return (
            <DayCard
              key={day.dayNumber}
              day={day}
              isExpanded={isExpanded}
              toggleDay={toggleDay}
            />
          );
        })}
      </div>
    </div>
  );
}

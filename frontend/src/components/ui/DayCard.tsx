import React from "react";
import { FiAlertTriangle, FiClock, FiMapPin, FiMoon, FiNavigation, FiSun } from "react-icons/fi";
import { EnrichedItineraryDay } from "@/types";
import { formatDuration, formatTime } from "@/lib/utils";

const LATE_NIGHT_THRESHOLD_MINUTES = 23 * 60;

interface DayCardProps {
  day: EnrichedItineraryDay;
  isExpanded: boolean;
  toggleDay: (dayNumber: number) => void;
}

export const DayCard: React.FC<DayCardProps> = ({ day, isExpanded, toggleDay }) => {
  const hasLateReturn = (day.hotelReturnTime ?? 0) > LATE_NIGHT_THRESHOLD_MINUTES;
  const lastLeg = day.routeLegs[day.routeLegs.length - 1];

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white/85 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.45)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/75">
      <button
        onClick={() => toggleDay(day.dayNumber)}
        className="flex w-full items-center justify-between bg-white/70 p-6 text-left transition-colors hover:bg-slate-50 dark:bg-slate-900/60 dark:hover:bg-slate-900"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 flex-col items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0284c7_0%,#4f46e5_100%)] text-white shadow-lg">
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] opacity-80">Day</span>
            <span className="text-2xl font-black leading-none">{day.dayNumber}</span>
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-950 dark:text-white">
              {day.activities.length === 0 ? "Open day" : "Exploration day"}
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm font-medium text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1">
                <FiNavigation className="h-3.5 w-3.5" />
                {day.totalDrivingDistanceKm.toFixed(1)} km
              </span>
              <span className="inline-flex items-center gap-1">
                <FiClock className="h-3.5 w-3.5" />
                {formatDuration(day.totalDrivingDurationMins)} driving
              </span>
            </div>
          </div>
        </div>

        <div
          className={`rounded-full bg-slate-100 p-2 text-slate-500 transition-transform dark:bg-slate-800 ${isExpanded ? "rotate-180" : ""}`}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      <div className={`overflow-hidden transition-all duration-500 ${isExpanded ? "max-h-[2200px] opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="space-y-6 border-t border-slate-100 p-6 dark:border-slate-800">
          {day.error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">
              Travel time unavailable: {day.error}
            </div>
          ) : null}

          {hasLateReturn ? (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/90 p-4 dark:border-amber-800/40 dark:bg-amber-950/20">
              <div className="rounded-full bg-amber-100 p-2 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300">
                <FiAlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-900 dark:text-amber-300">Late-night travel alert</h4>
                <p className="mt-1 text-sm text-amber-800/80 dark:text-amber-200/80">
                  Estimated return is {formatTime(day.hotelReturnTime ?? 0)}. Secure a trusted ride before the final leg.
                </p>
              </div>
            </div>
          ) : null}

          {day.activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-slate-200 py-12 text-slate-400 dark:border-slate-700">
              <FiSun className="mb-3 h-12 w-12 opacity-20" />
              <p className="text-lg font-semibold text-slate-500 dark:text-slate-300">No activities scheduled</p>
              <p className="mt-1 text-sm">Keep this day flexible for rest, food, or local discoveries.</p>
            </div>
          ) : (
            <div className="relative pl-4 md:pl-8">
              <div className="absolute left-[27px] top-6 bottom-6 w-0.5 rounded-full bg-slate-200 dark:bg-slate-700 md:left-[43px]" />

              <div className="space-y-8">
                <div className="relative flex items-start gap-4 md:gap-6">
                  <div className="relative z-10 rounded-full border-4 border-white bg-sky-100 p-2.5 text-sky-600 shadow-sm dark:border-slate-950 dark:bg-sky-950/40 dark:text-sky-300">
                    <FiSun className="h-4 w-4 md:h-5 md:w-5" />
                  </div>
                  <div className="flex-1 rounded-[1.25rem] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
                    <h4 className="text-base font-bold text-slate-950 dark:text-white md:text-lg">Hotel departure</h4>
                    <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-sky-600 dark:text-sky-300">
                      <FiClock className="h-3.5 w-3.5" />
                      {formatTime(day.hotelDepartureTime)}
                    </p>
                  </div>
                </div>

                {day.activities.map((activity, index) => {
                  const leg = day.routeLegs[index];

                  return (
                    <React.Fragment key={`${activity.activity_name}-${index}`}>
                      {leg ? (
                        <div className="relative flex items-center gap-4 md:gap-6 py-1">
                          <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-slate-200 bg-slate-50 shadow-sm dark:border-slate-700 dark:bg-slate-900 md:h-11 md:w-11">
                            <FiNavigation className="h-4 w-4 text-slate-400" />
                          </div>
                          <div className="flex-1 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-2 dark:border-slate-800 dark:bg-slate-900/60">
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 md:text-sm">
                              Drive {formatDuration(leg.durationMins)} • {leg.distanceKm.toFixed(1)} km
                            </p>
                          </div>
                        </div>
                      ) : null}

                      <div className="relative flex items-start gap-4 md:gap-6">
                        <div className="relative z-10 rounded-full border-4 border-white bg-rose-100 p-2.5 text-rose-600 shadow-sm dark:border-slate-950 dark:bg-rose-950/40 dark:text-rose-300">
                          <FiMapPin className="h-4 w-4 md:h-5 md:w-5" />
                        </div>
                        <div className="flex-1 rounded-[1.25rem] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
                          <h4 className="text-base font-bold text-slate-950 transition-colors dark:text-white md:text-lg">
                            {activity.activity_name || "Activity"}
                          </h4>
                          <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">
                            <FiClock className="h-3.5 w-3.5" />
                            {activity.estimatedStartTime != null ? formatTime(activity.estimatedStartTime) : "--:--"} -{" "}
                            {activity.estimatedEndTime != null ? formatTime(activity.estimatedEndTime) : "--:--"}
                          </p>
                          {activity.description ? (
                            <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-950/70 dark:text-slate-300">
                              {activity.description}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}

                {day.routeLegs.length > day.activities.length && lastLeg ? (
                  <div className="relative flex items-center gap-4 md:gap-6 py-1">
                    <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-slate-200 bg-slate-50 shadow-sm dark:border-slate-700 dark:bg-slate-900 md:h-11 md:w-11">
                      <FiNavigation className="h-4 w-4 text-slate-400" />
                    </div>
                    <div className="flex-1 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-2 dark:border-slate-800 dark:bg-slate-900/60">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 md:text-sm">
                        Return drive {formatDuration(lastLeg.durationMins)} • {lastLeg.distanceKm.toFixed(1)} km
                      </p>
                    </div>
                  </div>
                ) : null}

                <div className="relative flex items-start gap-4 md:gap-6">
                  <div className="relative z-10 rounded-full border-4 border-white bg-indigo-100 p-2.5 text-indigo-600 shadow-sm dark:border-slate-950 dark:bg-indigo-950/40 dark:text-indigo-300">
                    <FiMoon className="h-4 w-4 md:h-5 md:w-5" />
                  </div>
                  <div className="flex-1 rounded-[1.25rem] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
                    <h4 className="text-base font-bold text-slate-950 dark:text-white md:text-lg">Return to hotel</h4>
                    <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 dark:text-indigo-300">
                      <FiClock className="h-3.5 w-3.5" />
                      {day.hotelReturnTime != null ? formatTime(day.hotelReturnTime) : "--:--"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

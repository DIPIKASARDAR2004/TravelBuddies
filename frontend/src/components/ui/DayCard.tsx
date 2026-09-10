import React from "react";
import { FiClock, FiMapPin, FiNavigation, FiSun, FiMoon, FiAlertTriangle } from "react-icons/fi";
import { formatTime, formatDuration } from "@/lib/utils";

const LATE_NIGHT_THRESHOLD_MINUTES = 23 * 60; // 11:00 PM

interface DayCardProps {
  day: any;
  idx: number;
  isExpanded: boolean;
  toggleDay: (dayNumber: number) => void;
}

export const DayCard: React.FC<DayCardProps> = ({ day, idx, isExpanded, toggleDay }) => {
  const hasLateReturn = day.hotelReturnTime && day.hotelReturnTime > LATE_NIGHT_THRESHOLD_MINUTES;

  return (
    <div className="glass-panel premium-shadow rounded-2xl overflow-hidden transition-all duration-300">
      {/* Day Header */}
      <button 
        onClick={() => toggleDay(day.dayNumber)}
        className="w-full flex items-center justify-between p-6 bg-white/50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
      >
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md">
            <span className="text-xs font-bold uppercase tracking-widest opacity-80">Day</span>
            <span className="text-2xl font-black leading-none">{day.dayNumber}</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">
              {(!day.activities || day.activities.length === 0) ? 'Leisure Day' : 'Exploration Day'}
            </h3>
            <div className="text-sm text-slate-500 font-medium flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1"><FiNavigation className="w-3.5 h-3.5" /> {day.totalDrivingDistanceKm?.toFixed(1) || 0} km</span>
              <span className="flex items-center gap-1"><FiClock className="w-3.5 h-3.5" /> {formatDuration(day.totalDrivingDurationMins || 0)} driving</span>
            </div>
          </div>
        </div>
        <div className={`p-2 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </div>
      </button>

      {/* Day Content (Timeline) */}
      <div className={`transition-all duration-500 overflow-hidden ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="p-6 pt-2 border-t border-slate-100 dark:border-slate-800/50">
          
          {day.error && (
            <div className="p-3 mb-6 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-100 flex items-center gap-2">
              <FiAlertTriangle /> Travel time unavailable: {day.error}
            </div>
          )}

          {hasLateReturn && (
            <div className="mb-8 p-4 rounded-xl bg-amber-50/80 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 flex items-start gap-3">
              <div className="p-1.5 bg-amber-100 dark:bg-amber-800 rounded-full text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                <FiAlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-amber-900 dark:text-amber-400 text-sm">Late-Night Travel Alert</h4>
                <p className="text-sm text-amber-800/80 dark:text-amber-300/80 mt-0.5">
                  Estimated return is {formatTime(day.hotelReturnTime)}. Please ensure safe transport arrangements.
                </p>
              </div>
            </div>
          )}

          {(!day.activities || day.activities.length === 0) ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <FiSun className="w-12 h-12 mb-3 opacity-20" />
              <p className="font-medium text-lg text-slate-500 dark:text-slate-400">No activities scheduled</p>
              <p className="text-sm mt-1">Enjoy a relaxing day at your own pace.</p>
            </div>
          ) : (
            <div className="relative pl-4 md:pl-8 py-4">
              {/* Timeline Line */}
              <div className="absolute left-[27px] md:left-[43px] top-6 bottom-6 w-0.5 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
              
              <div className="space-y-8">
                {/* Start: Hotel Departure */}
                <div className="relative flex items-start gap-4 md:gap-6 group">
                  <div className="absolute top-8 left-10 w-0 h-full -ml-[1px] border-l-2 border-dashed border-blue-200 dark:border-blue-900/50 group-last:hidden z-0"></div>
                  <div className="relative z-10 p-2.5 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full border-4 border-white dark:border-slate-900 shadow-sm mt-1">
                    <FiSun className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  <div className="flex-1 bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-shadow">
                    <h4 className="font-bold text-slate-900 dark:text-white text-base md:text-lg">Hotel Departure</h4>
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold mt-1 flex items-center gap-1.5">
                      <FiClock className="w-3.5 h-3.5" /> {formatTime(day.hotelDepartureTime)}
                    </p>
                  </div>
                </div>

                {/* Activities */}
                {day.activities.map((act: any, actIdx: number) => {
                  const leg = day.routeLegs?.[actIdx];
                  
                  return (
                    <React.Fragment key={`act-${actIdx}`}>
                      {/* Drive Leg */}
                      {leg && (
                        <div className="relative flex items-center gap-4 md:gap-6 py-2">
                          <div className="relative z-10 flex items-center justify-center w-9 h-9 md:w-11 md:h-11 bg-slate-50 dark:bg-slate-800/80 rounded-full border-2 border-slate-200 dark:border-slate-700 shadow-sm ml-0.5">
                            <FiNavigation className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400" />
                          </div>
                          <div className="flex-1 py-2 px-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100/50 dark:border-slate-700/30">
                            <p className="text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                              Drive {formatDuration(leg.durationMins)} <span className="w-1 h-1 rounded-full bg-slate-300"></span> {leg.distanceKm.toFixed(1)} km
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Activity Item */}
                      <div className="relative flex items-start gap-4 md:gap-6">
                        <div className="relative z-10 p-2.5 bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded-full border-4 border-white dark:border-slate-900 shadow-sm mt-1">
                          <FiMapPin className="w-4 h-4 md:w-5 md:h-5" />
                        </div>
                        <div className="flex-1 bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-shadow group">
                          <h4 className="font-bold text-slate-900 dark:text-white text-base md:text-lg group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                            {act.activity_name || act.title || "Activity"}
                          </h4>
                          <p className="text-sm text-slate-500 font-medium mt-1 flex items-center gap-1.5">
                            <FiClock className="w-3.5 h-3.5" /> 
                            {act.estimatedStartTime ? formatTime(act.estimatedStartTime) : '--:--'} - {act.estimatedEndTime ? formatTime(act.estimatedEndTime) : '--:--'}
                          </p>
                          {act.description && (
                            <p className="text-sm text-slate-600 dark:text-slate-300 mt-3 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl">
                              {act.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}

                {/* Final Return Drive */}
                {day.routeLegs && day.routeLegs.length > day.activities.length && (
                  <div className="relative flex items-center gap-4 md:gap-6 py-2">
                    <div className="relative z-10 flex items-center justify-center w-9 h-9 md:w-11 md:h-11 bg-slate-50 dark:bg-slate-800/80 rounded-full border-2 border-slate-200 dark:border-slate-700 shadow-sm ml-0.5">
                      <FiNavigation className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400" />
                    </div>
                    <div className="flex-1 py-2 px-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100/50 dark:border-slate-700/30">
                      <p className="text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        Return drive {formatDuration(day.routeLegs[day.routeLegs.length - 1].durationMins)} <span className="w-1 h-1 rounded-full bg-slate-300"></span> {day.routeLegs[day.routeLegs.length - 1].distanceKm.toFixed(1)} km
                      </p>
                    </div>
                  </div>
                )}

                {/* End: Hotel Return */}
                <div className="relative flex items-start gap-4 md:gap-6">
                  <div className="relative z-10 p-2.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-full border-4 border-white dark:border-slate-900 shadow-sm mt-1">
                    <FiMoon className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  <div className="flex-1 bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-shadow">
                    <h4 className="font-bold text-slate-900 dark:text-white text-base md:text-lg">Return to Hotel</h4>
                    <p className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold mt-1 flex items-center gap-1.5">
                      <FiClock className="w-3.5 h-3.5" /> {day.hotelReturnTime ? formatTime(day.hotelReturnTime) : '--:--'}
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

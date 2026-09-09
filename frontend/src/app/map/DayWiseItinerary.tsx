import React, { useState } from 'react';

const LATE_NIGHT_THRESHOLD_MINUTES = 23 * 60; // 11:00 PM

function formatTime(minutesFromMidnight: number): string {
  const m = Math.round(minutesFromMidnight);
  const hours24 = Math.floor(m / 60) % 24;
  const mins = m % 60;
  const ampm = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${mins.toString().padStart(2, '0')} ${ampm}`;
}

function formatDuration(minutes: number): string {
  const m = Math.round(minutes);
  const hrs = Math.floor(m / 60);
  const mins = m % 60;
  if (hrs > 0) return `${hrs} hr ${mins} min`;
  return `${mins} min`;
}

export default function DayWiseItinerary({ itinerary }: { itinerary: any[] }) {
  const [showDemoAlert, setShowDemoAlert] = useState(false);

  if (!itinerary || itinerary.length === 0) return null;

  return (
    <div className="mt-8 space-y-6">
      <div className="flex justify-between items-end">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Smart Day-Wise Guide</h2>
        <button 
          onClick={() => setShowDemoAlert(!showDemoAlert)}
          className="text-xs font-semibold px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-900/50 dark:hover:bg-amber-900/70 dark:text-amber-200 rounded-md transition-colors border border-amber-200 dark:border-amber-700/50 shadow-sm"
        >
          {showDemoAlert ? "Hide Demo Alert" : "Demo: Preview Late-Night Alert"}
        </button>
      </div>

      {showDemoAlert && (
        <div className="mb-2 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/30 border-2 border-dashed border-amber-300 dark:border-amber-700/70">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-600 dark:text-amber-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-bold text-amber-800 dark:text-amber-400 text-sm">Late-Night Travel Alert</h4>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-200 px-1.5 py-0.5 rounded">Demo Preview</span>
              </div>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Your estimated return to the hotel is after 11:00 PM. Please ensure you have secure and reliable transportation arranged for the return trip.
              </p>
              <p className="text-xs text-amber-600/70 dark:text-amber-500/70 italic mt-2">
                (Simulated scenario: This does not affect actual itinerary times)
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {itinerary.map((day, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-gray-100 dark:border-slate-700 p-5 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400">Day {day.dayNumber}</h3>
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">Estimated Itinerary</span>
            </div>

            {day.error && (
               <div className="text-red-500 text-sm mb-4 font-medium">Travel time unavailable: {day.error}</div>
            )}

            {day.hotelReturnTime && day.hotelReturnTime > LATE_NIGHT_THRESHOLD_MINUTES && (
              <div className="mb-4 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-amber-600 dark:text-amber-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  <div>
                    <h4 className="font-bold text-amber-800 dark:text-amber-400 text-sm">Late-Night Travel Alert</h4>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      Your estimated return to the hotel is after 11:00 PM. Please ensure you have secure and reliable transportation arranged for the return trip.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {(!day.activities || day.activities.length === 0) ? (
              <div className="flex-1 flex items-center justify-center text-gray-500 italic py-8">
                Free day / No activity selected
              </div>
            ) : (
              <div className="relative border-l-2 border-blue-100 dark:border-blue-900 ml-3 pl-6 space-y-6">
                
                {/* Hotel Departure */}
                <div className="relative">
                  <div className="absolute -left-[31px] bg-blue-500 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800"></div>
                  <div className="text-sm font-bold text-gray-900 dark:text-white">Hotel Departure</div>
                  <div className="text-xs text-gray-500">{formatTime(day.hotelDepartureTime)}</div>
                </div>

                {/* Activities loop */}
                {day.activities.map((act: any, actIdx: number) => {
                  const leg = day.routeLegs?.[actIdx];
                  
                  return (
                    <React.Fragment key={actIdx}>
                      {/* Travel Leg */}
                      {leg && (
                        <div className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-2 -ml-2 py-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                          Drive {formatDuration(leg.durationMins)} ({leg.distanceKm.toFixed(1)} km)
                        </div>
                      )}

                      {/* Activity */}
                      <div className="relative">
                        <div className="absolute -left-[31px] bg-red-500 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800"></div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">{act.activity_name || "Activity"}</div>
                        <div className="text-xs text-gray-500">
                          {act.estimatedStartTime ? formatTime(act.estimatedStartTime) : '--:--'} - {act.estimatedEndTime ? formatTime(act.estimatedEndTime) : '--:--'}
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}

                {/* Final Return Leg */}
                {day.routeLegs && day.routeLegs.length > day.activities.length && (
                  <div className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-2 -ml-2 py-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                    Return drive {formatDuration(day.routeLegs[day.routeLegs.length - 1].durationMins)} ({day.routeLegs[day.routeLegs.length - 1].distanceKm.toFixed(1)} km)
                  </div>
                )}

                {/* Hotel Return */}
                <div className="relative">
                  <div className="absolute -left-[31px] bg-blue-500 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800"></div>
                  <div className="text-sm font-bold text-gray-900 dark:text-white">Hotel Return</div>
                  <div className="text-xs text-gray-500">{day.hotelReturnTime ? formatTime(day.hotelReturnTime) : '--:--'}</div>
                </div>

              </div>
            )}
            
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700 flex justify-between text-xs text-gray-500 font-medium">
              <span>Daily driving: {day.totalDrivingDistanceKm?.toFixed(1) || 0} km</span>
              <span>{formatDuration(day.totalDrivingDurationMins || 0)} total driving</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

'use client';
import React, { useEffect, useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { buildDayItinerary } from '@/lib/itinerary/buildDayItinerary';

const DEFAULT_ACTIVITY_DURATION_MINUTES = 90;
const DEFAULT_DAY_START_MINUTES = 9 * 60; // 9:00 AM

function TripDirections({ 
  plan, 
  days,
  onEnrichedItineraryReady 
}: { 
  plan?: any,
  days?: number,
  onEnrichedItineraryReady?: (itinerary: any[], totalDist: number, totalDur: number) => void 
}) {
  const map = useMap();
  const routesLibrary = useMapsLibrary('routes');
  
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [durationMins, setDurationMins] = useState<number | null>(null);

  useEffect(() => {
    if (!map || !routesLibrary || !plan || !days) return;

    let polylines: any[] = [];
    let isCancelled = false;

    const hotelLat = plan.selectedHotel?.latitude;
    const hotelLng = plan.selectedHotel?.longitude;
    
    if (!hotelLat || !hotelLng) {
      if (onEnrichedItineraryReady) onEnrichedItineraryReady([], 0, 0);
      return;
    }

    const isValidCoord = (val: any) => {
      const num = Number(val);
      return isFinite(num) && num >= -90 && num <= 90; // rough check, lng is -180 to 180
    };

    if (!isValidCoord(hotelLat) || !isValidCoord(hotelLng)) {
      if (onEnrichedItineraryReady) onEnrichedItineraryReady([], 0, 0);
      return;
    }

    const hotelLoc = new google.maps.LatLng(Number(hotelLat), Number(hotelLng));
    const baseItinerary = buildDayItinerary(plan, days);

    const calculateRoutes = async () => {
      const Route = (routesLibrary as any).Route;
      if (!Route || !Route.computeRoutes) return;

      let totalOverallDistance = 0;
      let totalOverallDuration = 0;

      const enrichedPromises = baseItinerary.map(async (day) => {
        const enrichedDay: any = {
          dayNumber: day.dayNumber,
          activities: day.activities,
          hotelDepartureTime: DEFAULT_DAY_START_MINUTES,
          hotelReturnTime: null,
          routeLegs: [],
          totalDrivingDistanceKm: 0,
          totalDrivingDurationMins: 0,
          error: null
        };

        const validActivities = day.activities.filter(a => {
          const lat = Number(a.latitude);
          const lng = Number(a.longitude);
          return isFinite(lat) && isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
        });

        if (validActivities.length === 0) {
          return enrichedDay;
        }

        const intermediates = validActivities.map(a => ({
          location: new google.maps.LatLng(Number(a.latitude), Number(a.longitude))
        }));

        const request = {
          origin: hotelLoc,
          destination: hotelLoc,
          travelMode: 'DRIVING',
          fields: ['path', 'legs', 'distanceMeters', 'durationMillis']
        };

        if (intermediates.length > 0) {
          (request as any).intermediates = intermediates;
        }

        try {
          const response = await Route.computeRoutes(request);
          if (isCancelled) return null;

          if (response && response.routes && response.routes.length > 0) {
            const route = response.routes[0];
            
            if (route.path) {
              const polyline = new google.maps.Polyline({
                path: route.path,
                map: map,
                strokeColor: '#3b82f6',
                strokeWeight: 6,
                strokeOpacity: 0.7,
              });
              polylines.push(polyline);
            }

            if (route.legs) {
              route.legs.forEach((leg: any) => {
                const distKm = (leg.distanceMeters || 0) / 1000;
                const durMins = Math.round((leg.durationMillis || 0) / 60000);
                enrichedDay.routeLegs.push({ durationMins: durMins, distanceKm: distKm });
                enrichedDay.totalDrivingDistanceKm += distKm;
                enrichedDay.totalDrivingDurationMins += durMins;
              });
            }

            let currentTime = enrichedDay.hotelDepartureTime;
            route.legs.forEach((leg: any, idx: number) => {
              const durMins = Math.round((leg.durationMillis || 0) / 60000);
              currentTime += durMins;
              
              if (idx < validActivities.length) {
                const act = validActivities[idx];
                act.estimatedStartTime = currentTime;
                const actDur = act.duration_minutes && act.duration_minutes > 0 
                  ? act.duration_minutes 
                  : DEFAULT_ACTIVITY_DURATION_MINUTES;
                currentTime += actDur;
                act.estimatedEndTime = currentTime;
              }
            });
            enrichedDay.hotelReturnTime = currentTime;
            
          } else {
            enrichedDay.error = "No route available";
          }
        } catch (err) {
          if (isCancelled) return null;
          console.error(`Routing error for day ${day.dayNumber}:`, err);
          enrichedDay.error = "Failed to compute route";
        }
        
        return enrichedDay;
      });

      const results = await Promise.allSettled(enrichedPromises);
      if (isCancelled) return;

      const finalItinerary = results
        .map(r => r.status === 'fulfilled' ? r.value : null)
        .filter(Boolean);

      finalItinerary.forEach(day => {
        totalOverallDistance += day.totalDrivingDistanceKm;
        totalOverallDuration += day.totalDrivingDurationMins;
      });

      setDistanceKm(totalOverallDistance);
      setDurationMins(totalOverallDuration);

      if (onEnrichedItineraryReady) {
        onEnrichedItineraryReady(finalItinerary, totalOverallDistance, totalOverallDuration);
      }

      // Fit bounds to hotel and activities
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(hotelLoc);
      let hasValidActCoords = false;
      baseItinerary.forEach(day => {
        day.activities.forEach(a => {
          const actLat = Number(a.latitude);
          const actLng = Number(a.longitude);
          if (isFinite(actLat) && isFinite(actLng) && actLat >= -90 && actLat <= 90 && actLng >= -180 && actLng <= 180) {
             bounds.extend(new google.maps.LatLng(actLat, actLng));
             hasValidActCoords = true;
          }
        });
      });
      if (hasValidActCoords) {
        map.fitBounds(bounds, { padding: 40 });
      }
    };

    calculateRoutes();

    return () => {
      isCancelled = true;
      polylines.forEach(p => p.setMap(null));
      polylines = [];
    };
  }, [map, routesLibrary, plan, days]);

  if (distanceKm !== null && durationMins !== null && distanceKm > 0) {
    const hours = Math.floor(durationMins / 60);
    const mins = durationMins % 60;
    const timeString = hours > 0 ? `${hours}h ${mins}m` : `${mins} mins`;

    return (
      <div className="absolute top-4 left-4 z-10 bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-100 px-5 py-3 rounded-xl shadow-lg font-bold text-sm backdrop-blur-md border border-slate-200 dark:border-slate-800 flex flex-col gap-1">
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
          Total Scheduled Driving
        </div>
        <div className="text-lg">{distanceKm.toFixed(1)} km • {timeString}</div>
      </div>
    );
  }

  return null;
}

export default function GoogleTripMap({ 
  plan, 
  days,
  onEnrichedItineraryReady 
}: { 
  plan?: any,
  days?: number,
  onEnrichedItineraryReady?: (itinerary: any[], totalDist: number, totalDur: number) => void 
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  const defaultCenter = { lat: 27.037, lng: 88.261 };
  const hotelLat = plan?.selectedHotel?.latitude;
  const hotelLng = plan?.selectedHotel?.longitude;
  const center = (hotelLat && hotelLng) ? { lat: Number(hotelLat), lng: Number(hotelLng) } : defaultCenter;

  return (
    <div className="relative w-full h-[500px] rounded-xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800">
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={center}
          defaultZoom={13}
          gestureHandling={'greedy'}
          disableDefaultUI={false}
          mapId="DEMO_MAP_ID"
        >
          {/* Hotel Marker */}
          {hotelLat && hotelLng && (
            <AdvancedMarker position={{ lat: Number(hotelLat), lng: Number(hotelLng) }} title={plan.selectedHotel.name}>
              <Pin background={'#3b82f6'} borderColor={'#1d4ed8'} glyphColor={'#ffffff'} />
            </AdvancedMarker>
          )}

          {/* Activities Markers */}
          {plan?.selectedActivities?.map((activity: any, idx: number) => {
            if (activity.latitude && activity.longitude) {
              return (
                <AdvancedMarker key={idx} position={{ lat: Number(activity.latitude), lng: Number(activity.longitude) }} title={activity.activity_name}>
                  <Pin background={'#ef4444'} borderColor={'#b91c1c'} glyphColor={'#ffffff'} />
                </AdvancedMarker>
              );
            }
            return null;
          })}

          <TripDirections 
            plan={plan} 
            days={days} 
            onEnrichedItineraryReady={onEnrichedItineraryReady} 
          />
        </Map>
      </APIProvider>
    </div>
  );
}

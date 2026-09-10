'use client';

import React, { useEffect, useState } from 'react';
import {
  APIProvider,
  AdvancedMarker,
  Map,
  Pin,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import {
  ActivityOption,
  EnrichedItineraryDay,
  PlannerPackage,
} from '@/types';
import { buildDayItinerary } from '@/lib/itinerary/buildDayItinerary';

const DEFAULT_ACTIVITY_DURATION_MINUTES = 90;
const DEFAULT_DAY_START_MINUTES = 9 * 60;

type ItineraryReadyHandler = (
  itinerary: EnrichedItineraryDay[],
  totalDist: number,
  totalDur: number,
) => void;

interface RouteLegResponse {
  distanceMeters?: number;
  durationMillis?: number;
}

interface RouteResponse {
  path?: google.maps.LatLngLiteral[];
  legs?: RouteLegResponse[];
}

interface ComputeRoutesResponse {
  routes?: RouteResponse[];
}

interface RoutesLibraryLike {
  Route?: {
    computeRoutes?: (request: unknown) => Promise<ComputeRoutesResponse>;
  };
}

function isValidLatitude(value: number) {
  return Number.isFinite(value) && value >= -90 && value <= 90;
}

function isValidLongitude(value: number) {
  return Number.isFinite(value) && value >= -180 && value <= 180;
}

function hasValidCoordinates(activity: ActivityOption) {
  const lat = Number(activity.latitude);
  const lng = Number(activity.longitude);
  return isValidLatitude(lat) && isValidLongitude(lng);
}

function TripDirections({
  plan,
  days,
  onEnrichedItineraryReady,
}: {
  plan?: PlannerPackage | null;
  days?: number;
  onEnrichedItineraryReady?: ItineraryReadyHandler;
}) {
  const map = useMap();
  const routesLibrary = useMapsLibrary('routes');
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [durationMins, setDurationMins] = useState<number | null>(null);
  useEffect(() => {
    if (!map || !routesLibrary || !plan || !days) return;

    let polylines: google.maps.Polyline[] = [];
    let isCancelled = false;

    const hotelLat = Number(plan.selectedHotel?.latitude);
    const hotelLng = Number(plan.selectedHotel?.longitude);

    if (!isValidLatitude(hotelLat) || !isValidLongitude(hotelLng)) {
      onEnrichedItineraryReady?.([], 0, 0);
      return;
    }

    const hotelLoc = new google.maps.LatLng(hotelLat, hotelLng);
    const baseItinerary = buildDayItinerary(plan, days);

    const calculateRoutes = async () => {
      const Route = (routesLibrary as RoutesLibraryLike).Route;

      if (!Route?.computeRoutes) return;
      const computeRoutes = Route.computeRoutes;

      let totalOverallDistance = 0;
      let totalOverallDuration = 0;

      const enrichedPromises = baseItinerary.map(async (day) => {
        const activities = day.activities.map((activity) => ({ ...activity }));
        const enrichedDay: EnrichedItineraryDay = {
          dayNumber: day.dayNumber,
          activities,
          hotelDepartureTime: DEFAULT_DAY_START_MINUTES,
          hotelReturnTime: null,
          routeLegs: [],
          totalDrivingDistanceKm: 0,
          totalDrivingDurationMins: 0,
          error: null,
        };

        const validActivities = activities.filter(hasValidCoordinates);
        if (validActivities.length === 0) {
          return enrichedDay;
        }

        const request: {
          origin: google.maps.LatLng;
          destination: google.maps.LatLng;
          travelMode: string;
          fields: string[];
          intermediates?: { location: google.maps.LatLng }[];
        } = {
          origin: hotelLoc,
          destination: hotelLoc,
          travelMode: 'DRIVING',
          fields: ['path', 'legs', 'distanceMeters', 'durationMillis'],
          intermediates: validActivities.map((activity) => ({
            location: new google.maps.LatLng(Number(activity.latitude), Number(activity.longitude)),
          })),
        };

        try {
          const response = await computeRoutes(request);
          if (isCancelled) return null;

          if (response?.routes?.length) {
            const route = response.routes[0];

            if (route.path) {
              const polyline = new google.maps.Polyline({
                path: route.path,
                map,
                strokeColor: '#0ea5e9',
                strokeWeight: 6,
                strokeOpacity: 0.72,
              });
              polylines.push(polyline);
            }

            if (route.legs) {
              route.legs.forEach((leg: { distanceMeters?: number; durationMillis?: number }) => {
                const distKm = (leg.distanceMeters || 0) / 1000;
                const durMins = Math.round((leg.durationMillis || 0) / 60000);
                enrichedDay.routeLegs.push({ durationMins: durMins, distanceKm: distKm });
                enrichedDay.totalDrivingDistanceKm += distKm;
                enrichedDay.totalDrivingDurationMins += durMins;
              });
            }

            let currentTime = enrichedDay.hotelDepartureTime;
            route.legs?.forEach((leg: { durationMillis?: number }, idx: number) => {
              const durMins = Math.round((leg.durationMillis || 0) / 60000);
              currentTime += durMins;

              if (idx < validActivities.length) {
                const activity = validActivities[idx];
                activity.estimatedStartTime = currentTime;
                const activityDuration =
                  activity.duration_minutes && activity.duration_minutes > 0
                    ? activity.duration_minutes
                    : DEFAULT_ACTIVITY_DURATION_MINUTES;
                currentTime += activityDuration;
                activity.estimatedEndTime = currentTime;
              }
            });

            enrichedDay.hotelReturnTime = currentTime;
          } else {
            enrichedDay.error = 'No route available';
          }
        } catch (error) {
          if (isCancelled) return null;
          console.error(`Routing error for day ${day.dayNumber}:`, error);
          enrichedDay.error = 'Failed to compute route';
        }

        return enrichedDay;
      });

      const results = await Promise.allSettled(enrichedPromises);
      if (isCancelled) return;

      const finalItinerary = results
        .map((result) => (result.status === 'fulfilled' ? result.value : null))
        .filter((day): day is EnrichedItineraryDay => Boolean(day));

      finalItinerary.forEach((day) => {
        totalOverallDistance += day.totalDrivingDistanceKm;
        totalOverallDuration += day.totalDrivingDurationMins;
      });

      setDistanceKm(totalOverallDistance);
      setDurationMins(totalOverallDuration);
      onEnrichedItineraryReady?.(finalItinerary, totalOverallDistance, totalOverallDuration);

      const bounds = new google.maps.LatLngBounds();
      bounds.extend(hotelLoc);

      let hasValidActCoords = false;
      baseItinerary.forEach((day) => {
        day.activities.forEach((activity) => {
          if (!hasValidCoordinates(activity)) return;
          bounds.extend(
            new google.maps.LatLng(Number(activity.latitude), Number(activity.longitude)),
          );
          hasValidActCoords = true;
        });
      });

      if (hasValidActCoords) {
        map.fitBounds(bounds, 40);
      }
    };

    calculateRoutes();

    return () => {
      isCancelled = true;
      polylines.forEach((polyline) => polyline.setMap(null));
      polylines = [];
    };
  }, [days, map, onEnrichedItineraryReady, plan, routesLibrary]);

  if (distanceKm !== null && durationMins !== null && distanceKm > 0) {
    const hours = Math.floor(durationMins / 60);
    const mins = durationMins % 60;
    const timeString = hours > 0 ? `${hours}h ${mins}m` : `${mins} mins`;

    return (
      <div className="absolute left-4 top-4 z-10 flex flex-col gap-1 rounded-xl border border-slate-200 bg-white/92 px-5 py-3 text-sm font-bold text-slate-800 shadow-lg backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/92 dark:text-slate-100">
        <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          Total scheduled driving
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
  onEnrichedItineraryReady,
}: {
  plan?: PlannerPackage | null;
  days?: number;
  onEnrichedItineraryReady?: ItineraryReadyHandler;
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  const defaultCenter = { lat: 27.037, lng: 88.261 };
  const hotelLat = Number(plan?.selectedHotel?.latitude);
  const hotelLng = Number(plan?.selectedHotel?.longitude);
  const hasHotelCenter = isValidLatitude(hotelLat) && isValidLongitude(hotelLng);
  const center = hasHotelCenter ? { lat: hotelLat, lng: hotelLng } : defaultCenter;

  return (
    <div className="relative h-[500px] w-full overflow-hidden rounded-xl border border-slate-200 shadow-lg dark:border-slate-800">
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={center}
          defaultZoom={13}
          gestureHandling="greedy"
          disableDefaultUI={false}
          mapId="DEMO_MAP_ID"
        >
          {hasHotelCenter && plan?.selectedHotel ? (
            <AdvancedMarker position={{ lat: hotelLat, lng: hotelLng }} title={plan.selectedHotel.name}>
              <Pin background="#0ea5e9" borderColor="#0284c7" glyphColor="#ffffff" />
            </AdvancedMarker>
          ) : null}

          {plan?.selectedActivities?.map((activity, idx) => {
            const activityLat = Number(activity.latitude);
            const activityLng = Number(activity.longitude);

            if (!isValidLatitude(activityLat) || !isValidLongitude(activityLng)) {
              return null;
            }

            return (
              <AdvancedMarker
                key={`${activity.activity_name}-${idx}`}
                position={{ lat: activityLat, lng: activityLng }}
                title={activity.activity_name}
              >
                <Pin background="#f43f5e" borderColor="#be123c" glyphColor="#ffffff" />
              </AdvancedMarker>
            );
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

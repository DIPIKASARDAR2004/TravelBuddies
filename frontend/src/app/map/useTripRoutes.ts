"use client";

import { useEffect, useState } from "react";
import type { EnrichedItineraryDay, PlannerPackage } from "@/types";
import {
  calculateRoutePreview,
  unroutedPreview,
} from "@/lib/itinerary/routePreview";
import { readCoordinates, type Coordinates } from "@/lib/itinerary/coordinates";

/** Each calculation owns its polylines and ignores results after cleanup. */
export function useTripRoutes(
  map: google.maps.Map | null,
  library: unknown,
  plan: PlannerPackage,
  days: number,
  onReady: (itinerary: EnrichedItineraryDay[]) => void,
) {
  const [summary, setSummary] = useState<{
    distance: number;
    duration: number;
  } | null>(null);
  useEffect(() => {
    if (!map || !library) return;
    const controller = new AbortController();
    const polylines: google.maps.Polyline[] = [];
    setSummary(null);
    onReady(unroutedPreview(plan, days, "Calculating driving estimates…"));
    void calculateRoutePreview(plan, days, library, controller.signal)
      .then(({ itinerary, paths }) => {
        if (controller.signal.aborted) return;
        paths.forEach((path) =>
          polylines.push(
            new google.maps.Polyline({
              path,
              map,
              strokeColor: "#0ea5e9",
              strokeWeight: 6,
              strokeOpacity: 0.72,
            }),
          ),
        );
        const positions: Coordinates[] = paths.flat();
        const hotel = readCoordinates(plan.selectedHotel);
        if (hotel) positions.push(hotel);
        if (positions.length > 1) {
          const bounds = new google.maps.LatLngBounds();
          positions.forEach((position) => bounds.extend(position));
          map.fitBounds(bounds, 40);
        }
        setSummary({
          distance: itinerary.reduce(
            (sum, day) => sum + day.totalDrivingDistanceKm,
            0,
          ),
          duration: itinerary.reduce(
            (sum, day) => sum + day.totalDrivingDurationMins,
            0,
          ),
        });
        onReady(itinerary);
      })
      .catch(() => {
        polylines.splice(0).forEach((polyline) => polyline.setMap(null));
        if (!controller.signal.aborted)
          onReady(
            unroutedPreview(
              plan,
              days,
              "The route preview could not be displayed.",
            ),
          );
      });
    return () => {
      controller.abort();
      polylines.forEach((polyline) => polyline.setMap(null));
    };
  }, [map, library, plan, days, onReady]);
  return summary;
}

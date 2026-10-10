import type {
  EnrichedItineraryDay,
  ItineraryDay,
  PlannerPackage,
} from "@/types";
import { buildDayItinerary } from "./buildDayItinerary";
import { readCoordinates, type Coordinates } from "./coordinates";
import {
  computeDrivingRoute,
  type DrivingRoute,
} from "@/lib/client/googleRoutes";

export const DRAFT_DAY_START = 9 * 60;
export const DRAFT_ACTIVITY_DURATION = 90;

export function unrouteDay(
  day: ItineraryDay,
  error: string | null = null,
): EnrichedItineraryDay {
  return {
    dayNumber: day.dayNumber,
    activities: day.activities.map((activity) => {
      const clean = { ...activity };
      delete clean.estimatedStartTime;
      delete clean.estimatedEndTime;
      return clean;
    }),
    hotelDepartureTime: DRAFT_DAY_START,
    hotelReturnTime: null,
    routeLegs: [],
    totalDrivingDistanceKm: 0,
    totalDrivingDurationMins: 0,
    error,
  };
}

export function enrichRouteDay(
  day: ItineraryDay,
  route: DrivingRoute,
): EnrichedItineraryDay {
  if (route.legs.length !== day.activities.length + 1)
    throw new Error("Route legs do not match the day's activities.");
  const result = unrouteDay(day);
  result.routeLegs = route.legs;
  let time = DRAFT_DAY_START;
  route.legs.forEach((leg, index) => {
    time += leg.durationMins;
    result.totalDrivingDistanceKm += leg.distanceKm;
    result.totalDrivingDurationMins += leg.durationMins;
    const activity = result.activities[index];
    if (activity) {
      activity.estimatedStartTime = time;
      time +=
        typeof activity.duration_minutes === "number" &&
        Number.isFinite(activity.duration_minutes) &&
        activity.duration_minutes > 0
          ? activity.duration_minutes
          : DRAFT_ACTIVITY_DURATION;
      activity.estimatedEndTime = time;
    }
  });
  result.hotelReturnTime = time;
  return result;
}

export function unroutedPreview(
  plan: PlannerPackage | null | undefined,
  days: number | undefined,
  error: string,
) {
  if (!plan || !Number.isInteger(days) || !days || days < 1 || days > 365)
    return [];
  return buildDayItinerary(plan, days).map((day) =>
    unrouteDay(day, day.activities.length ? error : null),
  );
}

export async function calculateRoutePreview(
  plan: PlannerPackage,
  days: number,
  library: unknown,
  signal: AbortSignal,
): Promise<{ itinerary: EnrichedItineraryDay[]; paths: Coordinates[][] }> {
  const hotel = readCoordinates(plan.selectedHotel);
  const base = unroutedPreview(
    plan,
    days,
    "Driving estimates are not available yet.",
  );
  const results = await Promise.all(
    base.map(async (day) => {
      if (!day.activities.length) return { day: unrouteDay(day), path: [] };
      if (!hotel)
        return {
          day: unrouteDay(day, "The selected stay has no valid coordinates."),
          path: [],
        };
      const stops = day.activities.map(readCoordinates);
      // Never align a partial list of route legs with a full list of activities.
      if (stops.some((stop) => !stop))
        return {
          day: unrouteDay(
            day,
            "One or more activities have no valid coordinates; this day's route was not requested.",
          ),
          path: [],
        };
      try {
        const route = await computeDrivingRoute(
          library,
          hotel,
          stops as Coordinates[],
          signal,
        );
        return { day: enrichRouteDay(day, route), path: route.path };
      } catch (error) {
        if (signal.aborted) throw error;
        return {
          day: unrouteDay(
            day,
            error instanceof Error
              ? error.message
              : "Driving directions are unavailable.",
          ),
          path: [],
        };
      }
    }),
  );
  return {
    itinerary: results.map((result) => result.day),
    paths: results.map((result) => result.path).filter((path) => path.length),
  };
}

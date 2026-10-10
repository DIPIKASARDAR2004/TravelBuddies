import { readCoordinates, type Coordinates } from "@/lib/itinerary/coordinates";
import type { RouteLeg } from "@/types";

export interface DrivingRoute {
  path: Coordinates[];
  legs: RouteLeg[];
}
type RoutesLibrary = {
  Route?: {
    computeRoutes?: (
      request: google.maps.routes.ComputeRoutesRequest,
    ) => Promise<unknown>;
  };
};

function readDrivingRoute(value: unknown, expectedLegs: number): DrivingRoute {
  const invalid = () =>
    new Error("The map provider returned incomplete route details.");
  if (!value || typeof value !== "object") throw invalid();
  const routes = (value as { routes?: unknown }).routes;
  if (!Array.isArray(routes)) throw invalid();
  if (!routes.length)
    throw new Error("No driving route is available for this day.");
  const route = routes[0] as { path?: unknown; legs?: unknown } | null;
  if (
    !route ||
    !Array.isArray(route.path) ||
    !route.path.length ||
    !Array.isArray(route.legs) ||
    route.legs.length !== expectedLegs
  )
    throw invalid();
  const path = route.path.map((point: unknown) => {
    if (!point || typeof point !== "object") throw invalid();
    const data = point as { lat?: unknown; lng?: unknown };
    const position = readCoordinates({
      latitude: data.lat,
      longitude: data.lng,
    });
    if (!position) throw invalid();
    return position;
  });
  const legs = route.legs.map((value: unknown) => {
    if (!value || typeof value !== "object") throw invalid();
    const leg = value as { distanceMeters?: unknown; durationMillis?: unknown };
    if (
      typeof leg.distanceMeters !== "number" ||
      !Number.isFinite(leg.distanceMeters) ||
      leg.distanceMeters < 0 ||
      typeof leg.durationMillis !== "number" ||
      !Number.isFinite(leg.durationMillis) ||
      leg.durationMillis < 0
    )
      throw invalid();
    return {
      distanceKm: leg.distanceMeters / 1000,
      durationMins: Math.round(leg.durationMillis / 60000),
    };
  });
  return { path, legs };
}

/** Stops waiting on timeout/unmount. The Google SDK does not cancel its provider request. */
export async function computeDrivingRoute(
  library: unknown,
  hotel: Coordinates,
  stops: Coordinates[],
  signal: AbortSignal,
): Promise<DrivingRoute> {
  const routeClass = (library as RoutesLibrary | null)?.Route;
  if (typeof routeClass?.computeRoutes !== "function")
    throw new Error("The driving-route service is unavailable.");
  if (signal.aborted)
    throw new DOMException("Route preview cancelled.", "AbortError");
  const request: google.maps.routes.ComputeRoutesRequest = {
    origin: hotel,
    destination: hotel,
    travelMode: "DRIVING",
    fields: ["path", "legs.distanceMeters", "legs.durationMillis"],
    intermediates: stops.map((location) => ({ location })),
  };
  const result = await new Promise<unknown>((resolve, reject) => {
    const finish = (callback: () => void) => {
      clearTimeout(timer);
      signal.removeEventListener("abort", abort);
      callback();
    };
    const abort = () =>
      finish(() =>
        reject(new DOMException("Route preview cancelled.", "AbortError")),
      );
    const timer = setTimeout(
      () =>
        finish(() =>
          reject(
            new Error("The driving-route request timed out. Try again later."),
          ),
        ),
      15000,
    );
    signal.addEventListener("abort", abort, { once: true });
    // Calling through Route preserves the SDK method's receiver.
    Promise.resolve()
      .then(() => {
        if (signal.aborted)
          throw new DOMException("Route preview cancelled.", "AbortError");
        return routeClass.computeRoutes!(request);
      })
      .then(
        (value) => finish(() => resolve(value)),
        () =>
          finish(() =>
            reject(
              new Error(
                "Driving directions could not be loaded. Try again later.",
              ),
            ),
          ),
      );
  });
  return readDrivingRoute(result, stops.length + 1);
}

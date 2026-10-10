import { afterEach, expect, it, vi } from "vitest";
import { readCoordinates } from "@/lib/itinerary/coordinates";
import { computeDrivingRoute } from "@/lib/client/googleRoutes";
import {
  calculateRoutePreview,
  enrichRouteDay,
  unroutedPreview,
} from "@/lib/itinerary/routePreview";
import {
  buildDayItinerary,
  getItineraryActivities,
} from "@/lib/itinerary/buildDayItinerary";
import { buildPlannerResponse } from "@/lib/planner/buildResponse";
import { catalog, planInput } from "./support/plannerFixture";

const hotel = { lat: 27, lng: 88 };
const stops = [{ lat: 27.1, lng: 88.1 }];
const routeResult = {
  routes: [
    {
      path: [hotel, ...stops, hotel],
      legs: [
        { distanceMeters: 1500, durationMillis: 600000 },
        { distanceMeters: 2000, durationMillis: 900000 },
      ],
    },
  ],
};
const signal = () => new AbortController().signal;
const plan = () => {
  const value = buildPlannerResponse(planInput, catalog).withinBudget[0];
  value.selectedHotel = {
    ...value.selectedHotel!,
    latitude: hotel.lat,
    longitude: hotel.lng,
  };
  value.selectedActivities = [
    {
      activity_name: "Fixture visit",
      cost_per_person: 100,
      latitude: stops[0].lat,
      longitude: stops[0].lng,
    },
  ];
  return value;
};
afterEach(() => vi.useRealTimers());

it("rejects unknown coordinates without confusing them with valid zero degrees", () => {
  for (const bad of [null, undefined, "", " ", false, [], Infinity])
    expect(readCoordinates({ latitude: bad, longitude: 0 })).toBeNull();
  expect(readCoordinates({ latitude: 0, longitude: "0" })).toEqual({
    lat: 0,
    lng: 0,
  });
  expect(readCoordinates({ latitude: "27.1", longitude: "88.2" })).toEqual({
    lat: 27.1,
    lng: 88.2,
  });
  expect(readCoordinates({ latitude: 91, longitude: 0 })).toBeNull();
});

it("requests a driving round trip with explicit fields and validates every leg", async () => {
  const Route = {
    computeRoutes: vi.fn(function (this: unknown) {
      expect(this).toBe(Route);
      return Promise.resolve(routeResult);
    }),
  };
  const result = await computeDrivingRoute({ Route }, hotel, stops, signal());
  expect(Route.computeRoutes).toHaveBeenCalledWith({
    origin: hotel,
    destination: hotel,
    travelMode: "DRIVING",
    fields: ["path", "legs.distanceMeters", "legs.durationMillis"],
    intermediates: [{ location: stops[0] }],
  });
  expect(result.legs).toEqual([
    { distanceKm: 1.5, durationMins: 10 },
    { distanceKm: 2, durationMins: 15 },
  ]);
});

it("does not turn missing or malformed provider fields into zero-minute journeys", async () => {
  for (const result of [
    null,
    {},
    { routes: [] },
    { routes: [{ ...routeResult.routes[0], legs: [{}] }] },
    {
      routes: [{ ...routeResult.routes[0], path: [{ lat: null, lng: null }] }],
    },
    {
      routes: [
        {
          ...routeResult.routes[0],
          legs: [
            { durationMillis: Infinity, distanceMeters: 0 },
            routeResult.routes[0].legs[1],
          ],
        },
      ],
    },
  ]) {
    await expect(
      computeDrivingRoute(
        { Route: { computeRoutes: async () => result } },
        hotel,
        stops,
        signal(),
      ),
    ).rejects.toThrow();
  }
  await expect(computeDrivingRoute({}, hotel, stops, signal())).rejects.toThrow(
    /unavailable/,
  );
  await expect(
    computeDrivingRoute(
      {
        Route: {
          computeRoutes: async () => {
            throw new Error("private provider error");
          },
        },
      },
      hotel,
      stops,
      signal(),
    ),
  ).rejects.toThrow("Driving directions could not be loaded. Try again later.");
});

it("bounds stalled calls and ignores late resolution without leaking timers", async () => {
  vi.useFakeTimers();
  let resolve!: (value: unknown) => void;
  const result = computeDrivingRoute(
    {
      Route: {
        computeRoutes: () =>
          new Promise((done) => {
            resolve = done;
          }),
      },
    },
    hotel,
    stops,
    signal(),
  );
  const assertion = expect(result).rejects.toThrow(/timed out/);
  await vi.advanceTimersByTimeAsync(15000);
  await assertion;
  resolve(routeResult);
  await Promise.resolve();
  expect(vi.getTimerCount()).toBe(0);
});

it("cancels waiting promptly and does not call the vendor for an already-aborted view", async () => {
  vi.useFakeTimers();
  const controller = new AbortController();
  const computeRoutes = vi.fn(() => new Promise(() => {}));
  const pending = computeDrivingRoute(
    { Route: { computeRoutes } },
    hotel,
    stops,
    controller.signal,
  );
  const assertion = expect(pending).rejects.toMatchObject({
    name: "AbortError",
  });
  await Promise.resolve();
  controller.abort();
  await assertion;
  expect(vi.getTimerCount()).toBe(0);
  computeRoutes.mockClear();
  await expect(
    computeDrivingRoute(
      { Route: { computeRoutes } },
      hotel,
      stops,
      controller.signal,
    ),
  ).rejects.toMatchObject({ name: "AbortError" });
  expect(computeRoutes).not.toHaveBeenCalled();
});

it("keeps draft timing pure, includes the return leg and clears stale estimates", () => {
  const original = {
    dayNumber: 1,
    activities: [
      {
        ...plan().selectedActivities[0],
        estimatedStartTime: 999,
        estimatedEndTime: 1111,
      },
    ],
  };
  const result = enrichRouteDay(original, {
    path: [],
    legs: [
      { distanceKm: 1.5, durationMins: 10 },
      { distanceKm: 2, durationMins: 15 },
    ],
  });
  expect(result.activities[0]).toMatchObject({
    estimatedStartTime: 550,
    estimatedEndTime: 640,
  });
  expect(result.hotelReturnTime).toBe(655);
  expect(result.totalDrivingDurationMins).toBe(25);
  expect(original.activities[0].estimatedStartTime).toBe(999);
  expect(() => enrichRouteDay(original, { path: [], legs: [] })).toThrow(
    /match/,
  );
});

it("keeps missing-coordinate days untimed instead of misaligning partial route legs", async () => {
  const value = plan();
  value.selectedActivities.push({
    activity_name: "Unlocated fixture",
    cost_per_person: 0,
    latitude: null,
    longitude: null,
    estimatedStartTime: 800,
  });
  const computeRoutes = vi.fn(async () => routeResult);
  const result = await calculateRoutePreview(
    value,
    1,
    { Route: { computeRoutes } },
    signal(),
  );
  expect(computeRoutes).not.toHaveBeenCalled();
  expect(result.itinerary[0].activities).toHaveLength(2);
  expect(
    result.itinerary[0].activities.every(
      (activity) => activity.estimatedStartTime === undefined,
    ),
  ).toBe(true);
  expect(result.itinerary[0].error).toContain("no valid coordinates");
  expect(result.itinerary[0].routeLegs).toEqual([]);
});

it("keeps successful days when another route fails, without mutating the plan", async () => {
  const value = plan();
  value.selectedActivities.push({
    ...value.selectedActivities[0],
    activity_name: "Second fixture",
  });
  const before = structuredClone(value);
  const computeRoutes = vi
    .fn()
    .mockResolvedValueOnce(routeResult)
    .mockRejectedValueOnce(new Error("private quota detail"));
  const result = await calculateRoutePreview(
    value,
    2,
    { Route: { computeRoutes } },
    signal(),
  );
  expect(result.paths).toHaveLength(1);
  expect(result.itinerary[0].hotelReturnTime).toBe(655);
  expect(result.itinerary[1].hotelReturnTime).toBeNull();
  expect(result.itinerary[1].error).not.toContain("private");
  expect(value).toEqual(before);
});

it("preserves the existing two-per-day draft distribution and add-on deduplication", () => {
  const value = plan();
  value.extraItems = [
    {
      type: "activity",
      name: "Duplicate",
      price: 0,
      rawItem: value.selectedActivities[0],
    },
    {
      type: "activity",
      name: "Extra",
      price: 0,
      rawItem: { activity_name: "Extra", cost_per_person: 0 },
    },
  ];
  expect(
    buildDayItinerary(value, 2).map((day) =>
      day.activities.map((activity) => activity.activity_name),
    ),
  ).toEqual([["Fixture visit"], ["Extra"]]);
  expect(unroutedPreview(value, 0, "offline")).toEqual([]);
  expect(unroutedPreview(value, 2, "offline")[0].error).toBe("offline");
});

it("exposes overflow selections without changing the plan or existing daily cap", () => {
  const value = plan();
  value.selectedActivities = Array.from({ length: 5 }, (_, index) => ({
    activity_name: `Visit ${index}`,
    cost_per_person: 0,
  }));
  const before = structuredClone(value);
  expect(getItineraryActivities(value)).toHaveLength(5);
  expect(
    buildDayItinerary(value, 2).map((day) => day.activities.length),
  ).toEqual([2, 2]);
  expect(value).toEqual(before);
  for (const days of [-1, 0, 1.5, 366, Infinity, NaN])
    expect(buildDayItinerary(value, days)).toEqual([]);
});

it("does not request a route for an unknown stay and respects explicit activity duration", async () => {
  const value = plan();
  value.selectedHotel!.latitude = null;
  const computeRoutes = vi.fn(async () => routeResult);
  const result = await calculateRoutePreview(
    value,
    2,
    { Route: { computeRoutes } },
    signal(),
  );
  expect(computeRoutes).not.toHaveBeenCalled();
  expect(result.itinerary[0].hotelReturnTime).toBeNull();
  expect(result.itinerary[0].error).toContain("stay has no valid coordinates");
  expect(result.itinerary[1].error).toBeNull();
  const day = {
    dayNumber: 1,
    activities: [{ ...value.selectedActivities[0], duration_minutes: 30 }],
  };
  const routed = enrichRouteDay(day, {
    path: [],
    legs: [
      { distanceKm: 0, durationMins: 0 },
      { distanceKm: 1, durationMins: 10 },
    ],
  });
  expect(routed.activities[0].estimatedEndTime).toBe(570);
  expect(routed.hotelReturnTime).toBe(580);
});

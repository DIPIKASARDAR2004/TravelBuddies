import { expect, it, vi, afterEach } from "vitest";
import { readPlanRequest } from "@/lib/planner/planRequest";
import {
  readPlannerPackage,
  readPlannerResponse,
} from "@/lib/planner/planResponses";
import {
  readPlanSnapshot,
  plannerSessionStorage,
} from "@/lib/planner/planStorage";
import { buildPlannerResponse } from "@/lib/planner/buildResponse";
import { catalog, planInput } from "./support/plannerFixture";
import { isDateOnly } from "@/lib/dateOnly";
import {
  readTripRecord,
  readTripRecords,
  validateTripInput,
} from "@/lib/services/trips";

afterEach(() => vi.unstubAllGlobals());

it("accepts decimal legacy request strings without coercing arbitrary JSON", () => {
  expect(
    readPlanRequest({
      ...planInput,
      destination: " Fixture town ",
      totalBudget: "15000",
      travellers: "2",
      days: "2",
    }),
  ).toEqual(planInput);
});
it.each([
  null,
  [],
  { ...planInput, destination: {} },
  { ...planInput, destination: " " },
  { ...planInput, totalBudget: Infinity },
  { ...planInput, totalBudget: " " },
  { ...planInput, totalBudget: true },
  { ...planInput, travellers: 1.5 },
  { ...planInput, travellers: 101 },
  { ...planInput, days: 366 },
  { ...planInput, days: [2] },
  { ...planInput, womenOnly: "false" },
])("rejects invalid planner inputs (%#)", (input) => {
  expect(() => readPlanRequest(input)).toThrow();
});

it("reads existing computed packages without changing costs, reserve or source data", () => {
  const before = structuredClone(catalog);
  const response = readPlannerResponse(
    buildPlannerResponse(planInput, catalog),
    planInput,
  );
  expect(response.isTripPossible).toBe(true);
  expect(response.withinBudget[0]).toMatchObject({
    accommodationCost: 4000,
    foodCost: 2400,
    activityCost: 200,
    transportCost: 400,
    tripCost: 7000,
    emergencyReserve: 1500,
    tripSpendingLimit: 13500,
    remainingBudget: 6500,
  });
  expect(catalog).toEqual(before);
});

it("keeps zero-cost activities and distinguishes insufficient data from low budget", () => {
  const free = {
    ...catalog,
    activities: [{ activity_name: "Free fixture walk", cost_per_person: 0 }],
  };
  expect(
    buildPlannerResponse(planInput, free).withinBudget[0].activityCost,
  ).toBe(0);
  expect(
    readPlannerResponse(
      buildPlannerResponse({ ...planInput, totalBudget: 100 }, catalog),
    ),
  ).toMatchObject({ isTripPossible: false, withinBudget: [], upgrades: [] });
  expect(() =>
    buildPlannerResponse(planInput, { ...catalog, activities: [] }),
  ).toThrow(/Insufficient data/);
});

it("keeps safety alternatives filtered even when the budget is too low", () => {
  const mixed = {
    ...catalog,
    hotels: [
      ...catalog.hotels,
      {
        ...catalog.hotels[0],
        hotel_name: "Unflagged fixture stay",
        is_women_friendly: false,
      },
    ],
  };
  const response = buildPlannerResponse(
    { ...planInput, totalBudget: 100, womenOnly: true },
    mixed,
  );
  expect(response.isTripPossible).toBe(false);
  expect(response.alternatives.hotel.map((hotel) => hotel.hotel_name)).toEqual([
    "Fixture stay",
  ]);
  expect(
    buildPlannerResponse({ ...planInput, totalBudget: 100 }, mixed).alternatives
      .hotel,
  ).toHaveLength(2);
});

it("rejects malformed nested packages, mismatched results and non-finite money", () => {
  const response = buildPlannerResponse(planInput, catalog);
  const plan = response.withinBudget[0];
  for (const value of [
    null,
    [],
    { ...response, isTripPossible: "yes" },
    { ...response, alternatives: { hotel: [] } },
    { ...response, withinBudget: [{ ...plan, selectedActivities: {} }] },
    { ...response, withinBudget: [{ ...plan, tripCost: NaN }] },
    {
      ...response,
      withinBudget: [
        { ...plan, selectedHotel: { ...plan.selectedHotel, name: {} } },
      ],
    },
    {
      ...response,
      withinBudget: [
        {
          ...plan,
          selectedHotel: { ...plan.selectedHotel, latitude: "wrong" },
        },
      ],
    },
  ]) {
    expect(() => readPlannerResponse(value)).toThrow(/invalid trip plans/);
  }
  expect(() =>
    readPlannerResponse({ ...response, days: 3 }, planInput),
  ).toThrow();
  expect(
    readPlannerPackage({
      ...plan,
      remainingBudget: -100,
      remainingSpendableBudget: -100,
    }),
  ).toMatchObject({ remainingBudget: -100 });
});

it("validates extra-item types and their raw data, not just the visible name", () => {
  const plan = buildPlannerResponse(planInput, catalog).withinBudget[0];
  const extra = {
    type: "activity",
    name: "Free walk",
    price: 0,
    rawItem: { activity_name: "Free walk", cost_per_person: 0 },
  };
  expect(
    readPlannerPackage({ ...plan, extraItems: [extra] }).extraItems,
  ).toEqual([extra]);
  expect(() =>
    readPlannerPackage({
      ...plan,
      extraItems: [{ ...extra, rawItem: { hotel_name: "Not an activity" } }],
    }),
  ).toThrow();
});

it("restores only valid data fields and rejects broken/stale persistence", () => {
  const response = buildPlannerResponse(planInput, catalog);
  const snapshot = {
    view: "CUSTOMIZE",
    apiResponse: response,
    customizedPlan: response.withinBudget[0],
    tripDetails: {
      destination: "Fixture town",
      budget: 15000,
      travellers: 2,
      days: 2,
      dates: { startDate: "2026-10-12", endDate: "2026-10-14" },
    },
  };
  expect(
    readPlanSnapshot({
      ...snapshot,
      loading: true,
      setView: "poisoned",
      swapModalOpen: true,
    }),
  ).toEqual({
    ...snapshot,
    tripDetails: { ...snapshot.tripDetails, isSafetyTrip: false },
  });
  expect(
    readPlanSnapshot({
      ...snapshot,
      tripDetails: { ...snapshot.tripDetails, budget: 18000 },
    })?.tripDetails.budget,
  ).toBe(18000); // Customizer/upgrade budget may differ.
  for (const value of [
    null,
    [],
    { view: "garbage" },
    { ...snapshot, customizedPlan: null },
    { ...snapshot, tripDetails: { ...snapshot.tripDetails, days: 3 } },
    {
      ...snapshot,
      tripDetails: {
        ...snapshot.tripDetails,
        dates: { startDate: "2026-02-30", endDate: "2026-03-04" },
      },
    },
  ])
    expect(readPlanSnapshot(value)).toBeNull();
});

it("keeps storage-denied browsers functional in memory", () => {
  vi.stubGlobal("sessionStorage", {
    getItem() {
      throw new Error("denied");
    },
    setItem() {
      throw new Error("denied");
    },
    removeItem() {
      throw new Error("denied");
    },
  });
  expect(plannerSessionStorage.getItem("plan-storage")).toBeNull();
  expect(() =>
    plannerSessionStorage.setItem("plan-storage", "{}"),
  ).not.toThrow();
  expect(() => plannerSessionStorage.removeItem("plan-storage")).not.toThrow();
});

it("validates saved trips, retains same-day stays and strips private fields", () => {
  const trip = {
    id: "12345678-1234-4234-8234-123456789abc",
    title: "Fixture",
    destination: "Fixture town",
    start_date: "2026-10-12",
    end_date: "2026-10-12",
    sharing: false,
    created_at: "2026-10-10T00:00:00.123456+00:00",
    updated_at: "2026-10-10T00:00:00Z",
  };
  expect(readTripRecord({ ...trip, user_id: "private" })).toEqual(trip);
  expect(validateTripInput({ ...trip, sharing: undefined })).toMatchObject({
    valid: true,
    value: { sharing: false },
  });
  expect(isDateOnly("2024-02-29")).toBe(true);
  expect(isDateOnly("2026-02-29")).toBe(false);
  for (const value of [
    [],
    null,
    { ...trip, title: " " },
    { ...trip, sharing: "true" },
    { ...trip, end_date: "2026-10-11" },
  ])
    expect(validateTripInput(value).valid).toBe(false);
  expect(() =>
    readTripRecord({ ...trip, updated_at: "2026-02-30T00:00:00Z" }),
  ).toThrow();
  expect(() => readTripRecord(trip, "another-id")).toThrow();
  expect(() => readTripRecords([trip, trip])).toThrow(/duplicate/);
});

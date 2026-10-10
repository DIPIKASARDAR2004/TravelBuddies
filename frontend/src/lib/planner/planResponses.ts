import type {
  PlannerApiResponse,
  PlannerPackage,
  PlannerItemType,
} from "@/types";
import type { PlanRequest } from "./planRequest";

const invalid = () =>
  new Error("The server returned invalid trip plans. Please try again.");
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw invalid();
  return value as Record<string, unknown>;
}
function text(value: unknown) {
  if (typeof value !== "string" || !value.trim()) throw invalid();
}
function number(value: unknown, minimum = 0) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < minimum ||
    Math.abs(value) > Number.MAX_SAFE_INTEGER
  )
    throw invalid();
}
function list(value: unknown, read: (item: unknown) => unknown) {
  if (!Array.isArray(value)) throw invalid();
  value.forEach(read);
}
function item(value: unknown, kind: PlannerItemType, alternative = false) {
  const data = object(value);
  const name =
    kind === "hotel"
      ? alternative
        ? "hotel_name"
        : "name"
      : kind === "restaurant"
        ? "restaurant_name"
        : kind === "activity"
          ? "activity_name"
          : "transport_mode";
  const price =
    kind === "hotel"
      ? alternative
        ? "price_per_night"
        : "price"
      : kind === "restaurant"
        ? "cost_per_meal"
        : "cost_per_person";
  text(data[name]);
  number(data[price]);
  for (const key of [
    "rating",
    "comfort_level",
    "duration_minutes",
    "estimatedStartTime",
    "estimatedEndTime",
  ]) {
    if (data[key] !== undefined) number(data[key]);
  }
  if (typeof data.rating === "number" && data.rating > 5) throw invalid();
  for (const key of ["destination", "description"]) {
    if (data[key] !== undefined && typeof data[key] !== "string")
      throw invalid();
  }
  if (
    data.id !== undefined &&
    typeof data.id !== "string" &&
    !(typeof data.id === "number" && Number.isFinite(data.id))
  )
    throw invalid();
  if (
    data.is_women_friendly !== undefined &&
    typeof data.is_women_friendly !== "boolean"
  )
    throw invalid();
  for (const [key, bound] of [
    ["latitude", 90],
    ["longitude", 180],
  ] as const) {
    const coordinate = data[key];
    if (coordinate == null) continue;
    if (
      (typeof coordinate !== "number" && typeof coordinate !== "string") ||
      (typeof coordinate === "string" && !coordinate.trim()) ||
      !Number.isFinite(Number(coordinate)) ||
      Math.abs(Number(coordinate)) > bound
    )
      throw invalid();
  }
}

/** Shape/value validation only; this does not approve recommendation rankings. */
export function readPlannerPackage(value: unknown): PlannerPackage {
  const data = object(value);
  text(data.name);
  if (data.tagline !== undefined && typeof data.tagline !== "string")
    throw invalid();
  for (const key of [
    "accommodationCost",
    "foodCost",
    "activityCost",
    "transportCost",
    "tripCost",
    "emergencyReserve",
    "totalAllocated",
  ])
    number(data[key]);
  for (const key of ["remainingBudget", "tripSpendingLimit"])
    number(data[key], -Number.MAX_SAFE_INTEGER);
  if (data.remainingSpendableBudget !== undefined)
    number(data.remainingSpendableBudget, -Number.MAX_SAFE_INTEGER);
  for (const key of [
    "recommendedBudget",
    "recommendedEmergencyReserve",
    "recommendedTripSpendingLimit",
    "extraNeeded",
  ]) {
    if (data[key] !== undefined) number(data[key]);
  }
  for (const key of ["changedCategories", "upgradeHighlights"]) {
    if (data[key] !== undefined) list(data[key], text);
  }
  const selected = {
    selectedHotel: "hotel",
    selectedRestaurant: "restaurant",
    selectedActivity: "activity",
    selectedTransport: "transport",
  } as const;
  for (const [key, kind] of Object.entries(selected)) {
    if (data[key] !== null) item(data[key], kind);
  }
  list(data.selectedActivities, (entry) => item(entry, "activity"));
  if (data.extraItems !== undefined)
    list(data.extraItems, (entry) => {
      const extra = object(entry);
      if (
        !["hotel", "restaurant", "activity", "transport"].includes(
          extra.type as string,
        )
      )
        throw invalid();
      text(extra.name);
      number(extra.price);
      item(extra.rawItem, extra.type as PlannerItemType, true);
    });
  return data as unknown as PlannerPackage;
}

export function readPlannerResponse(
  value: unknown,
  expected?: PlanRequest,
): PlannerApiResponse {
  const data = object(value);
  text(data.destination);
  number(data.totalBudget, Number.MIN_VALUE);
  number(data.tripSpendingLimit);
  for (const [key, maximum] of [
    ["travellers", 100],
    ["days", 365],
  ] as const) {
    number(data[key], 1);
    if (!Number.isInteger(data[key]) || (data[key] as number) > maximum)
      throw invalid();
  }
  if (typeof data.isTripPossible !== "boolean") throw invalid();
  list(data.withinBudget, readPlannerPackage);
  list(data.upgrades, readPlannerPackage);
  if (data.isTripPossible !== (data.withinBudget as unknown[]).length > 0)
    throw invalid();
  const alternatives = object(data.alternatives);
  for (const kind of [
    "hotel",
    "restaurant",
    "activity",
    "transport",
  ] as const) {
    list(alternatives[kind], (entry) => item(entry, kind, true));
  }
  if (expected) {
    for (const key of [
      "destination",
      "totalBudget",
      "travellers",
      "days",
    ] as const) {
      if (data[key] !== expected[key]) throw invalid();
    }
  }
  return data as unknown as PlannerApiResponse;
}

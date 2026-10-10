import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  RecommendationActivity,
  RecommendationHotel,
  RecommendationRestaurant,
  RecommendationTransport,
} from "@/lib/recommendation/types";
import { PlannerError } from "./planRequest";

export interface PlannerCatalog {
  hotels: RecommendationHotel[];
  restaurants: RecommendationRestaurant[];
  activities: RecommendationActivity[];
  transport: RecommendationTransport[];
}

function catalogRows(
  data: unknown,
  nameKey: string,
  priceKey: string,
): Record<string, unknown>[] {
  const invalid = () =>
    new PlannerError(
      "The destination catalog contains invalid records. Please try another destination or contact support.",
      503,
      "CATALOG_UNAVAILABLE",
    );
  if (!Array.isArray(data)) throw invalid();
  return data.map((value) => {
    if (!value || typeof value !== "object" || Array.isArray(value))
      throw invalid();
    const row = value as Record<string, unknown>;
    if (
      typeof row[nameKey] !== "string" ||
      !(row[nameKey] as string).trim() ||
      typeof row[priceKey] !== "number" ||
      !Number.isFinite(row[priceKey]) ||
      (row[priceKey] as number) < 0
    )
      throw invalid();
    if (
      row.rating != null &&
      (typeof row.rating !== "number" ||
        !Number.isFinite(row.rating) ||
        row.rating < 0 ||
        row.rating > 5)
    )
      throw invalid();
    if (
      row.comfort_level != null &&
      (typeof row.comfort_level !== "number" ||
        !Number.isFinite(row.comfort_level) ||
        row.comfort_level < 0)
    )
      throw invalid();
    if (row.destination != null && typeof row.destination !== "string")
      throw invalid();
    if (
      row.is_women_friendly != null &&
      typeof row.is_women_friendly !== "boolean"
    )
      throw invalid();
    return row;
  });
}

/** Preserve price ordering and substring lookup; user wildcard characters are literal. */
export async function loadPlannerCatalog(
  supabase: SupabaseClient,
  destination: string,
): Promise<PlannerCatalog> {
  const pattern = `%${destination.replace(/[\\%_]/g, "\\$&")}%`;
  const signal = AbortSignal.timeout(15000);
  const queries = [
    supabase
      .from("Hotels")
      .select(
        "hotel_name, price_per_night, rating, comfort_level, is_women_friendly, destination, latitude, longitude",
      )
      .ilike("destination", pattern)
      .order("price_per_night", { ascending: true })
      .abortSignal(signal),
    supabase
      .from("restaurants")
      .select("restaurant_name, cost_per_meal, rating")
      .ilike("destination", pattern)
      .order("cost_per_meal", { ascending: true })
      .abortSignal(signal),
    supabase
      .from("activities")
      .select("activity_name, cost_per_person, rating, latitude, longitude")
      .ilike("destination", pattern)
      .order("cost_per_person", { ascending: true })
      .abortSignal(signal),
    supabase
      .from("transport")
      .select("transport_mode, cost_per_person, comfort_level")
      .ilike("destination", pattern)
      .order("cost_per_person", { ascending: true })
      .abortSignal(signal),
  ];
  let results;
  try {
    results = await Promise.all(queries);
  } catch {
    throw new PlannerError(
      "Unable to load the destination catalog. Please try again.",
      503,
      "CATALOG_UNAVAILABLE",
    );
  }
  if (results.some((result) => result.error))
    throw new PlannerError(
      "Unable to load the destination catalog. Please try again.",
      503,
      "CATALOG_UNAVAILABLE",
    );
  return {
    hotels: catalogRows(
      results[0].data,
      "hotel_name",
      "price_per_night",
    ) as unknown as RecommendationHotel[],
    restaurants: catalogRows(
      results[1].data,
      "restaurant_name",
      "cost_per_meal",
    ) as unknown as RecommendationRestaurant[],
    activities: catalogRows(
      results[2].data,
      "activity_name",
      "cost_per_person",
    ) as unknown as RecommendationActivity[],
    transport: catalogRows(
      results[3].data,
      "transport_mode",
      "cost_per_person",
    ) as unknown as RecommendationTransport[],
  };
}

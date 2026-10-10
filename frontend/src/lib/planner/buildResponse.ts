import { buildBasePlans } from "@/lib/recommendation/basePlanner";
import { buildUpgradePlans } from "@/lib/recommendation/upgradePlanner";
import {
  calcAccommodation,
  calcFood,
  calcActivity,
  calcTransport,
  formatOption,
  formatUpgrade,
  getBudgetItem,
} from "@/lib/recommendation/planService";
import {
  PlanParams,
  RecommendationActivity,
  RecommendationHotel,
  RecommendationRestaurant,
  RecommendationTransport,
} from "@/lib/recommendation/types";
import {
  ActivityAlternative,
  HotelAlternative,
  PlannerApiResponse,
  RestaurantAlternative,
  TransportAlternative,
} from "@/types";

import { PlannerError, type PlanRequest } from "./planRequest";
import type { PlannerCatalog } from "./catalog";

const normalizeHotelAlternative = (
  hotel: RecommendationHotel,
): HotelAlternative => ({
  hotel_name: hotel.hotel_name,
  destination: hotel.destination ?? undefined,
  price_per_night: hotel.price_per_night,
  rating: hotel.rating ?? undefined,
  is_women_friendly: hotel.is_women_friendly ?? undefined,
  latitude: hotel.latitude,
  longitude: hotel.longitude,
});

const normalizeRestaurantAlternative = (
  restaurant: RecommendationRestaurant,
): RestaurantAlternative => ({
  restaurant_name: restaurant.restaurant_name,
  cost_per_meal: restaurant.cost_per_meal,
  rating: restaurant.rating ?? undefined,
});

const normalizeActivityAlternative = (
  activity: RecommendationActivity,
): ActivityAlternative => ({
  activity_name: activity.activity_name,
  cost_per_person: activity.cost_per_person,
  rating: activity.rating ?? undefined,
  latitude: activity.latitude,
  longitude: activity.longitude,
});

const normalizeTransportAlternative = (
  transport: RecommendationTransport,
): TransportAlternative => ({
  transport_mode: transport.transport_mode,
  cost_per_person: transport.cost_per_person,
  comfort_level: transport.comfort_level ?? undefined,
});

/** Existing recommendation composition; scoring and selection remain unchanged. */
export function buildPlannerResponse(
  input: PlanRequest,
  catalog: PlannerCatalog,
): PlannerApiResponse {
  const {
    destination,
    totalBudget: budget,
    travellers: numTravellers,
    days: numDays,
    womenOnly,
  } = input;
  const {
    hotels: allHotels,
    restaurants: allRestaurants,
    activities: allActivities,
    transport: allTransport,
  } = catalog;
  const emergencyReserve = budget * 0.1;
  const tripSpendingLimit = budget - emergencyReserve;
  const alternatives = {
    hotel: (womenOnly
      ? allHotels.filter((hotel) => hotel.is_women_friendly === true)
      : allHotels
    ).map(normalizeHotelAlternative),
    restaurant: allRestaurants.map(normalizeRestaurantAlternative),
    activity: allActivities.map(normalizeActivityAlternative),
    transport: allTransport.map(normalizeTransportAlternative),
  };
  // Apply minimum quality filters (rating >= 3.5)
  let qualifiedHotels: RecommendationHotel[] = allHotels.filter(
    (hotel) => (hotel.rating || 0) >= 3.5,
  );
  if (womenOnly) {
    qualifiedHotels = qualifiedHotels.filter(
      (hotel) => hotel.is_women_friendly === true,
    );
  }
  const qualifiedRestaurants: RecommendationRestaurant[] =
    allRestaurants.filter((restaurant) => (restaurant.rating || 0) >= 3.5);
  const qualifiedActivities: RecommendationActivity[] = allActivities;
  const qualifiedTransport: RecommendationTransport[] = allTransport;

  if (
    !qualifiedHotels.length ||
    !qualifiedRestaurants.length ||
    !qualifiedActivities.length ||
    !qualifiedTransport.length
  ) {
    throw new PlannerError(
      "Insufficient data for this destination to build a complete plan.",
      400,
      "INSUFFICIENT_DATA",
    );
  }

  // Base minimums
  const minH = getBudgetItem(qualifiedHotels) as RecommendationHotel;
  const minR = getBudgetItem(qualifiedRestaurants) as RecommendationRestaurant;
  const minA = getBudgetItem(qualifiedActivities) as RecommendationActivity;
  const minT = getBudgetItem(qualifiedTransport) as RecommendationTransport;

  const minHotelCost = calcAccommodation(minH, numTravellers, numDays);
  const minFoodCost = calcFood(minR, numTravellers, numDays);
  const minActCost = calcActivity([minA], numTravellers);
  const minTransCost = calcTransport(minT, numTravellers);

  // If absolute minimum exceeds limit, trip is not possible within budget.
  if (
    minHotelCost + minFoodCost + minActCost + minTransCost >
    tripSpendingLimit
  ) {
    return {
      destination,
      totalBudget: budget,
      tripSpendingLimit,
      travellers: numTravellers,
      days: numDays,
      isTripPossible: false,
      withinBudget: [],
      upgrades: [],
      alternatives,
    };
  }

  // Wrap calculators for the planner algorithms to abstract away the numTravellers and numDays
  const params: PlanParams = {
    qualifiedHotels,
    qualifiedRestaurants,
    qualifiedActivities,
    qualifiedTransport,
    tripSpendingLimit,
    calcAccommodation: (hotel) =>
      calcAccommodation(hotel, numTravellers, numDays),
    calcFood: (restaurant) => calcFood(restaurant, numTravellers, numDays),
    calcActivity: (activities) => calcActivity(activities, numTravellers),
    calcTransport: (transport) => calcTransport(transport, numTravellers),
    days: numDays,
  };

  // Build Priority-Based Plans and Upgrades
  const withinBudget: PlannerApiResponse["withinBudget"] = [];
  const upgrades: PlannerApiResponse["upgrades"] = [];

  const { plans: basePlans, bestValuePlan } = buildBasePlans(params);

  basePlans.forEach((p) =>
    withinBudget.push(
      formatOption(
        p.plan,
        p.name,
        p.tagline,
        tripSpendingLimit,
        emergencyReserve,
        budget,
        numTravellers,
        numDays,
      ),
    ),
  );

  const upgradePlans = buildUpgradePlans(params, bestValuePlan, budget);

  upgradePlans.forEach((p) =>
    upgrades.push(
      formatUpgrade(
        p.plan,
        p.name,
        p.tagline,
        bestValuePlan,
        budget,
        tripSpendingLimit,
        emergencyReserve,
        numTravellers,
        numDays,
      ),
    ),
  );

  const isTripPossible = withinBudget.length > 0;

  const responseData: PlannerApiResponse = {
    destination,
    totalBudget: budget,
    tripSpendingLimit,
    travellers: numTravellers,
    days: numDays,
    isTripPossible,
    withinBudget,
    upgrades,
    alternatives,
  };

  return responseData;
}

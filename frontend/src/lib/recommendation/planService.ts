import { PlannerPackage } from "@/types";
import {
  RecommendationActivity,
  RecommendationHotel,
  RecommendationPackage,
  RecommendationPlanCandidate,
  RecommendationRestaurant,
  RecommendationTransport,
} from "./types";

export const calcAccommodation = (hotel: RecommendationHotel, numTravellers: number, numDays: number) =>
  hotel.price_per_night * Math.ceil(numTravellers / 2) * numDays;

export const calcFood = (restaurant: RecommendationRestaurant, numTravellers: number, numDays: number) =>
  restaurant.cost_per_meal * 3 * numTravellers * numDays;

export const calcActivity = (activities: RecommendationActivity[], numTravellers: number) =>
  activities.reduce((sum, activity) => sum + activity.cost_per_person * numTravellers, 0);

export const calcTransport = (transport: RecommendationTransport, numTravellers: number) =>
  transport.cost_per_person * numTravellers;

const formatHotel = (hotel: RecommendationHotel): PlannerPackage["selectedHotel"] => ({
  name: hotel.hotel_name,
  price: hotel.price_per_night,
  rating: hotel.rating ?? undefined,
  is_women_friendly: hotel.is_women_friendly ?? undefined,
  latitude: hotel.latitude,
  longitude: hotel.longitude,
});

const formatRestaurant = (restaurant: RecommendationRestaurant): PlannerPackage["selectedRestaurant"] => ({
  restaurant_name: restaurant.restaurant_name,
  cost_per_meal: restaurant.cost_per_meal,
  rating: restaurant.rating ?? undefined,
});

const formatActivity = (activity: RecommendationActivity): NonNullable<PlannerPackage["selectedActivity"]> => ({
  activity_name: activity.activity_name,
  cost_per_person: activity.cost_per_person,
  rating: activity.rating ?? undefined,
  latitude: activity.latitude,
  longitude: activity.longitude,
});

const formatTransport = (transport: RecommendationTransport): PlannerPackage["selectedTransport"] => ({
  transport_mode: transport.transport_mode,
  cost_per_person: transport.cost_per_person,
  comfort_level: transport.comfort_level ?? undefined,
});

export const formatOption = (
  plan: RecommendationPlanCandidate,
  name: string,
  tagline: string,
  tripSpendingLimit: number,
  emergencyReserve: number,
  budget: number,
  numTravellers: number,
  numDays: number,
): RecommendationPackage => {
  const tripCost = plan.tripCost;
  const remainingSpendableBudget = tripSpendingLimit - tripCost;

  return {
    name,
    tagline,
    accommodationCost: calcAccommodation(plan.h, numTravellers, numDays),
    foodCost: calcFood(plan.r, numTravellers, numDays),
    activityCost: calcActivity(plan.a, numTravellers),
    transportCost: calcTransport(plan.t, numTravellers),
    tripCost,
    emergencyReserve,
    tripSpendingLimit,
    remainingSpendableBudget,
    totalAllocated: tripCost + emergencyReserve,
    remainingBudget: budget - (tripCost + emergencyReserve),
    selectedHotel: formatHotel(plan.h),
    selectedRestaurant: formatRestaurant(plan.r),
    selectedActivity: plan.a.length > 0 ? formatActivity(plan.a[0]) : null,
    selectedActivities: plan.a.map(formatActivity),
    selectedTransport: formatTransport(plan.t),
  };
};

export const formatUpgrade = (
  plan: RecommendationPlanCandidate,
  name: string,
  tagline: string,
  bestValuePlan: RecommendationPlanCandidate | null,
  budget: number,
  tripSpendingLimit: number,
  emergencyReserve: number,
  numTravellers: number,
  numDays: number,
): RecommendationPackage => {
  const option = formatOption(
    plan,
    name,
    tagline,
    tripSpendingLimit,
    emergencyReserve,
    budget,
    numTravellers,
    numDays,
  );
  const recommendedBudget = Math.ceil(plan.tripCost / 0.9);
  const recommendedEmergencyReserve = recommendedBudget * 0.1;
  const recommendedTripSpendingLimit = recommendedBudget - recommendedEmergencyReserve;
  const extraNeeded = Math.max(0, recommendedBudget - budget);

  const changedCategories: string[] = [];
  const upgradeHighlights: string[] = [];

  if (bestValuePlan && bestValuePlan.tripCost <= tripSpendingLimit) {
    const oldHotelRating = Number(((bestValuePlan.h.rating || 3.5) as number).toFixed(1));
    const newHotelRating = Number(((plan.h.rating || 3.5) as number).toFixed(1));
    if (newHotelRating > oldHotelRating) {
      changedCategories.push("Hotel");
      upgradeHighlights.push(`Hotel rating improves from ${oldHotelRating.toFixed(1)}★ to ${newHotelRating.toFixed(1)}★`);
    }

    if ((plan.h.comfort_level || 0) > (bestValuePlan.h.comfort_level || 0)) {
      if (!changedCategories.includes("Hotel")) changedCategories.push("Hotel");
      upgradeHighlights.push(
        `Hotel comfort improves from level ${bestValuePlan.h.comfort_level || 0} to level ${plan.h.comfort_level || 0}`,
      );
    }

    const oldRestaurantRating = Number(((bestValuePlan.r.rating || 3.5) as number).toFixed(1));
    const newRestaurantRating = Number(((plan.r.rating || 3.5) as number).toFixed(1));
    if (newRestaurantRating > oldRestaurantRating) {
      changedCategories.push("Restaurant");
      upgradeHighlights.push(
        `Dining rating improves from ${oldRestaurantRating.toFixed(1)}★ to ${newRestaurantRating.toFixed(1)}★`,
      );
    }

    const oldActivityRatingRaw = bestValuePlan.a.length
      ? bestValuePlan.a.reduce((sum, activity) => sum + (activity.rating || 0), 0) / bestValuePlan.a.length
      : 0;
    const newActivityRatingRaw = plan.a.length
      ? plan.a.reduce((sum, activity) => sum + (activity.rating || 0), 0) / plan.a.length
      : 0;
    const oldActivityRating = Number(oldActivityRatingRaw.toFixed(1));
    const newActivityRating = Number(newActivityRatingRaw.toFixed(1));

    if (newActivityRating >= oldActivityRating + 0.1) {
      changedCategories.push("Activity");
      upgradeHighlights.push(
        `Activity average rating improves from ${oldActivityRating.toFixed(1)}★ to ${newActivityRating.toFixed(1)}★`,
      );
    }

    if ((plan.t.comfort_level || 0) > (bestValuePlan.t.comfort_level || 0)) {
      changedCategories.push("Transport");
      upgradeHighlights.push(
        `Transport comfort improves from level ${bestValuePlan.t.comfort_level || 0} to level ${plan.t.comfort_level || 0}`,
      );
    }
  }

  return {
    ...option,
    recommendedBudget,
    recommendedEmergencyReserve,
    recommendedTripSpendingLimit,
    extraNeeded,
    changedCategories,
    upgradeHighlights,
  };
};

export const getBudgetItem = <T,>(items: T[]): T | null => (items.length > 0 ? items[0] : null);

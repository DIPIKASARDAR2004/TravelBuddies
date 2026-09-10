import {
  ActivityAlternative,
  ActivityOption,
  HotelAlternative,
  HotelOption,
  PlannerExtraItem,
  PlannerItemType,
  PlannerModalMode,
  PlannerPackage,
  RestaurantAlternative,
  RestaurantOption,
  TransportAlternative,
  TransportOption,
  TripDetails,
} from "@/types";

type AlternativeItem =
  | HotelAlternative
  | RestaurantAlternative
  | ActivityAlternative
  | TransportAlternative;

const roundCurrency = (value: number) => Math.round(value * 100) / 100;

const formatCurrency = (value: number) =>
  value.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const toHotelOption = (hotel: HotelAlternative): HotelOption => ({
  name: hotel.hotel_name,
  price: hotel.price_per_night,
  rating: hotel.rating,
  is_women_friendly: hotel.is_women_friendly,
  latitude: hotel.latitude,
  longitude: hotel.longitude,
});

const toActivityOption = (activity: ActivityAlternative): ActivityOption => ({
  id: activity.id,
  activity_name: activity.activity_name,
  cost_per_person: activity.cost_per_person,
  rating: activity.rating,
  latitude: activity.latitude,
  longitude: activity.longitude,
  duration_minutes: activity.duration_minutes,
  description: activity.description,
});

const calcAlternativeHotelCost = (hotel: HotelAlternative, tripDetails: TripDetails) =>
  hotel.price_per_night * Math.ceil(tripDetails.travellers / 2) * tripDetails.days;

const calcRestaurantCost = (
  restaurant: RestaurantAlternative | RestaurantOption,
  tripDetails: TripDetails,
) => Number(restaurant.cost_per_meal) * 3 * tripDetails.travellers * tripDetails.days;

const calcActivityCost = (activity: ActivityAlternative | ActivityOption, tripDetails: TripDetails) =>
  Number(activity.cost_per_person) * tripDetails.travellers;

const calcTransportCost = (
  transport: TransportAlternative | TransportOption,
  tripDetails: TripDetails,
) => Number(transport.cost_per_person) * tripDetails.travellers;

export function clonePlannerPackage(plan: PlannerPackage): PlannerPackage {
  return JSON.parse(JSON.stringify(plan)) as PlannerPackage;
}

export function recalculatePlannerTotals(plan: PlannerPackage, budget: number): PlannerPackage {
  const baseTripCost =
    roundCurrency(plan.accommodationCost + plan.foodCost + plan.activityCost + plan.transportCost);
  const extrasCost = roundCurrency(
    (plan.extraItems ?? []).reduce((sum, item) => sum + item.price, 0),
  );
  const tripCost = roundCurrency(baseTripCost + extrasCost);
  const emergencyReserve = roundCurrency(plan.emergencyReserve ?? 0);
  const totalAllocated = roundCurrency(tripCost + emergencyReserve);
  const tripSpendingLimit =
    plan.tripSpendingLimit && plan.tripSpendingLimit > 0
      ? roundCurrency(plan.tripSpendingLimit)
      : roundCurrency(budget - emergencyReserve);

  return {
    ...plan,
    tripCost,
    emergencyReserve,
    tripSpendingLimit,
    totalAllocated,
    remainingBudget: roundCurrency(budget - totalAllocated),
    remainingSpendableBudget: roundCurrency(tripSpendingLimit - tripCost),
  };
}

export function selectPlannerPackage(plan: PlannerPackage, currentBudget: number): {
  plan: PlannerPackage;
  budget: number;
} {
  const nextBudget = plan.recommendedBudget ?? currentBudget;
  const nextPlan = clonePlannerPackage(plan);

  if (plan.recommendedBudget) {
    nextPlan.emergencyReserve = roundCurrency(plan.recommendedBudget * 0.1);
    nextPlan.tripSpendingLimit = roundCurrency(plan.recommendedBudget - nextPlan.emergencyReserve);
  }

  return {
    budget: nextBudget,
    plan: recalculatePlannerTotals(nextPlan, nextBudget),
  };
}

export function updatePlanBudget(plan: PlannerPackage, budget: number): PlannerPackage {
  return recalculatePlannerTotals(plan, budget);
}

export function updateEmergencyReserve(plan: PlannerPackage, reserve: number, budget: number): PlannerPackage {
  return recalculatePlannerTotals(
    {
      ...plan,
      emergencyReserve: roundCurrency(reserve),
      tripSpendingLimit: roundCurrency(budget - reserve),
    },
    budget,
  );
}

export function removeExtraItem(plan: PlannerPackage, itemIndex: number, budget: number): PlannerPackage {
  const nextPlan = clonePlannerPackage(plan);
  nextPlan.extraItems = (nextPlan.extraItems ?? []).filter((_, index) => index !== itemIndex);
  return recalculatePlannerTotals(nextPlan, budget);
}

function buildExtraItem(type: PlannerItemType, item: AlternativeItem, price: number): PlannerExtraItem {
  if (type === "hotel") {
    return { type, name: (item as HotelAlternative).hotel_name, price, rawItem: item };
  }
  if (type === "restaurant") {
    return { type, name: (item as RestaurantAlternative).restaurant_name, price, rawItem: item };
  }
  if (type === "activity") {
    return { type, name: (item as ActivityAlternative).activity_name, price, rawItem: item };
  }
  return { type, name: (item as TransportAlternative).transport_mode, price, rawItem: item };
}

function getAlternativeCost(
  type: PlannerItemType,
  item: AlternativeItem,
  tripDetails: TripDetails,
): number {
  if (type === "hotel") {
    return calcAlternativeHotelCost(item as HotelAlternative, tripDetails);
  }
  if (type === "restaurant") {
    return calcRestaurantCost(item as RestaurantAlternative, tripDetails);
  }
  if (type === "activity") {
    return calcActivityCost(item as ActivityAlternative, tripDetails);
  }
  return calcTransportCost(item as TransportAlternative, tripDetails);
}

export function applyAlternativeSelection(args: {
  currentPlan: PlannerPackage;
  itemType: PlannerItemType;
  mode: PlannerModalMode;
  item: AlternativeItem;
  tripDetails: TripDetails;
}): { plan: PlannerPackage | null; error: string | null } {
  const { currentPlan, itemType, mode, item, tripDetails } = args;
  const nextPlan = clonePlannerPackage(currentPlan);
  const newCost = roundCurrency(getAlternativeCost(itemType, item, tripDetails));

  if (mode === "add") {
    nextPlan.extraItems = [...(nextPlan.extraItems ?? []), buildExtraItem(itemType, item, newCost)];
    const recalculated = recalculatePlannerTotals(nextPlan, tripDetails.budget);

    if (recalculated.remainingBudget < 0) {
      return {
        plan: null,
        error: `Cannot add this option. It exceeds your budget by ${formatCurrency(
          Math.abs(recalculated.remainingBudget),
        )}.`,
      };
    }

    return { plan: recalculated, error: null };
  }

  if (itemType === "hotel") {
    nextPlan.selectedHotel = toHotelOption(item as HotelAlternative);
    nextPlan.accommodationCost = newCost;
  } else if (itemType === "restaurant") {
    nextPlan.selectedRestaurant = item as RestaurantAlternative;
    nextPlan.foodCost = newCost;
  } else if (itemType === "activity") {
    const normalizedActivity = toActivityOption(item as ActivityAlternative);
    nextPlan.selectedActivity = normalizedActivity;
    nextPlan.selectedActivities = [normalizedActivity];
    nextPlan.activityCost = newCost;
  } else {
    nextPlan.selectedTransport = item as TransportAlternative;
    nextPlan.transportCost = newCost;
  }

  return {
    plan: recalculatePlannerTotals(nextPlan, tripDetails.budget),
    error: null,
  };
}

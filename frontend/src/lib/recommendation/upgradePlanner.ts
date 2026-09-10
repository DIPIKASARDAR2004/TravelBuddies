import {
  getAverageActivityRating,
  getSubsets,
  hotelQuality as hotelObjectQuality,
  restaurantObjectQuality,
  transportObjectQuality,
  upgradeActivityQuality,
} from "./scoringUtils";
import {
  NamedPlan,
  PlanParams,
  RecommendationActivity,
  RecommendationHotel,
  RecommendationPlanCandidate,
  RecommendationRestaurant,
  RecommendationTransport,
  RecommendationUpgradeCandidate,
} from "./types";

function hotelQuality(hotel: RecommendationHotel) {
  return hotelObjectQuality(hotel);
}

function restaurantQuality(restaurant: RecommendationRestaurant) {
  return restaurantObjectQuality(restaurant);
}

function activityQuality(activities: RecommendationActivity[]) {
  return upgradeActivityQuality(activities);
}

function transportQuality(transport: RecommendationTransport) {
  return transportObjectQuality(transport);
}

function calcOverallQuality(
  hotel: RecommendationHotel,
  restaurant: RecommendationRestaurant,
  activities: RecommendationActivity[],
  transport: RecommendationTransport,
) {
  return (hotelQuality(hotel) + restaurantQuality(restaurant) + activityQuality(activities) + transportQuality(transport)) / 4;
}

function calcBalanceScore(
  hotel: RecommendationHotel,
  restaurant: RecommendationRestaurant,
  activities: RecommendationActivity[],
  transport: RecommendationTransport,
) {
  return Math.min(hotelQuality(hotel), restaurantQuality(restaurant), activityQuality(activities), transportQuality(transport));
}

function sortActivitiesByName(activities: RecommendationActivity[]) {
  return [...activities].sort((left, right) => left.activity_name.localeCompare(right.activity_name));
}

function isIdenticalPlan(
  left: Pick<RecommendationPlanCandidate, "h" | "r" | "a" | "t"> | null,
  right: Pick<RecommendationPlanCandidate, "h" | "r" | "a" | "t"> | null,
) {
  if (!left || !right) return false;
  if (left.h.hotel_name !== right.h.hotel_name) return false;
  if (left.r.restaurant_name !== right.r.restaurant_name) return false;
  if (left.t.transport_mode !== right.t.transport_mode) return false;
  if (left.a.length !== right.a.length) return false;

  const leftActivities = sortActivitiesByName(left.a);
  const rightActivities = sortActivitiesByName(right.a);
  return leftActivities.every((activity, index) => activity.activity_name === rightActivities[index].activity_name);
}

function isRatingImproved(newRating?: number | null, oldRating?: number | null) {
  return Number((newRating || 3.5).toFixed(1)) > Number((oldRating || 3.5).toFixed(1));
}

function isComfortImproved(newComfort?: number | null, oldComfort?: number | null) {
  return (newComfort || 1) > (oldComfort || 1);
}

function isActivityImproved(newActivities: RecommendationActivity[], oldActivities: RecommendationActivity[]) {
  return getAverageActivityRating(newActivities) >= getAverageActivityRating(oldActivities) + 0.1 - 0.0001;
}

function isHotelMeaningfullyImproved(newHotel: RecommendationHotel, oldHotel: RecommendationHotel) {
  const oldHotelQuality = hotelQuality(oldHotel);
  const newHotelQuality = hotelQuality(newHotel);
  const visibleImprovement =
    isRatingImproved(newHotel.rating, oldHotel.rating) ||
    isComfortImproved(newHotel.comfort_level, oldHotel.comfort_level);

  return newHotelQuality > oldHotelQuality + 0.0001 && visibleImprovement;
}

function isRestaurantMeaningfullyImproved(newRestaurant: RecommendationRestaurant, oldRestaurant: RecommendationRestaurant) {
  return isRatingImproved(newRestaurant.rating, oldRestaurant.rating);
}

function isTransportMeaningfullyImproved(newTransport: RecommendationTransport, oldTransport: RecommendationTransport) {
  return isComfortImproved(newTransport.comfort_level, oldTransport.comfort_level);
}

export function buildUpgradePlans(
  params: PlanParams,
  bestValuePlan: RecommendationPlanCandidate | null,
  originalTotalBudget: number,
): NamedPlan<RecommendationUpgradeCandidate>[] {
  const upgrades: NamedPlan<RecommendationUpgradeCandidate>[] = [];

  if (!bestValuePlan || bestValuePlan.tripCost > originalTotalBudget) {
    return upgrades;
  }

  const slightMax = originalTotalBudget * 0.05;
  const comfortMax = originalTotalBudget * 0.25;
  const premiumMax = originalTotalBudget * 0.5;

  const {
    qualifiedHotels,
    qualifiedRestaurants,
    qualifiedActivities,
    qualifiedTransport,
    calcAccommodation,
    calcFood,
    calcActivity,
    calcTransport,
  } = params;

  const baseHotel = bestValuePlan.h;
  const baseRestaurant = bestValuePlan.r;
  const baseActivities = bestValuePlan.a;
  const baseTransport = bestValuePlan.t;

  const baseHotelQuality = hotelQuality(baseHotel);
  const baseRestaurantQuality = restaurantQuality(baseRestaurant);
  const baseActivityQuality = activityQuality(baseActivities);
  const baseTransportQuality = transportQuality(baseTransport);

  const betterHotels = qualifiedHotels.filter((hotel) => isHotelMeaningfullyImproved(hotel, baseHotel));
  const betterRestaurants = qualifiedRestaurants.filter((restaurant) =>
    isRestaurantMeaningfullyImproved(restaurant, baseRestaurant),
  );
  const betterTransports = qualifiedTransport.filter((transport) =>
    isTransportMeaningfullyImproved(transport, baseTransport),
  );

  const targetActivityCount = baseActivities.length;
  let betterActivitySets: RecommendationActivity[][] = [];
  if (targetActivityCount > 0) {
    const allActivitySubsets = getSubsets(qualifiedActivities, targetActivityCount);
    betterActivitySets = allActivitySubsets.filter((activities) => isActivityImproved(activities, baseActivities));
  }

  const evaluateCandidate = (
    hotel: RecommendationHotel,
    restaurant: RecommendationRestaurant,
    activities: RecommendationActivity[],
    transport: RecommendationTransport,
  ): RecommendationUpgradeCandidate => {
    const tripCost = calcAccommodation(hotel) + calcFood(restaurant) + calcActivity(activities) + calcTransport(transport);
    const recommendedBudget = Math.ceil(tripCost / 0.9);
    const extraNeeded = recommendedBudget - originalTotalBudget;

    let changedCount = 0;
    let totalQualityGain = 0;
    if (hotel !== baseHotel) {
      changedCount += 1;
      totalQualityGain += hotelQuality(hotel) - baseHotelQuality;
    }
    if (restaurant !== baseRestaurant) {
      changedCount += 1;
      totalQualityGain += restaurantQuality(restaurant) - baseRestaurantQuality;
    }
    if (activities !== baseActivities) {
      changedCount += 1;
      totalQualityGain += activityQuality(activities) - baseActivityQuality;
    }
    if (transport !== baseTransport) {
      changedCount += 1;
      totalQualityGain += transportQuality(transport) - baseTransportQuality;
    }

    return {
      h: hotel,
      r: restaurant,
      a: activities,
      t: transport,
      tripCost,
      recommendedBudget,
      extraNeeded,
      changedCount,
      totalQualityGain,
      overallQuality: calcOverallQuality(hotel, restaurant, activities, transport),
      balanceScore: calcBalanceScore(hotel, restaurant, activities, transport),
      hRating: hotel.rating ?? 3.5,
      hComfortLevel: hotel.comfort_level ?? 2,
      rRating: restaurant.rating ?? 3.5,
      tComfortLevel: transport.comfort_level ?? 1,
    };
  };

  let slightPlanCandidate: RecommendationUpgradeCandidate | null = null;
  const slightCandidates: RecommendationUpgradeCandidate[] = [];

  for (const hotel of betterHotels) slightCandidates.push(evaluateCandidate(hotel, baseRestaurant, baseActivities, baseTransport));
  for (const restaurant of betterRestaurants) slightCandidates.push(evaluateCandidate(baseHotel, restaurant, baseActivities, baseTransport));
  for (const transport of betterTransports) slightCandidates.push(evaluateCandidate(baseHotel, baseRestaurant, baseActivities, transport));
  for (const activities of betterActivitySets) slightCandidates.push(evaluateCandidate(baseHotel, baseRestaurant, activities, baseTransport));

  const validSlightCandidates = slightCandidates.filter(
    (candidate) => candidate.extraNeeded > 0 && candidate.extraNeeded <= slightMax,
  );

  if (validSlightCandidates.length > 0) {
    validSlightCandidates.sort((left, right) => {
      if (left.extraNeeded !== right.extraNeeded) return left.extraNeeded - right.extraNeeded;
      if (Math.abs(right.totalQualityGain - left.totalQualityGain) > 0.0001) {
        return right.totalQualityGain - left.totalQualityGain;
      }
      return left.tripCost - right.tripCost;
    });

    slightPlanCandidate = validSlightCandidates[0];
    upgrades.push({
      plan: slightPlanCandidate,
      name: "Slight Upgrade",
      tagline: "One small but meaningful improvement",
    });
  }

  let comfortablePlanCandidate: RecommendationUpgradeCandidate | null = null;
  const comfortableCandidates: RecommendationUpgradeCandidate[] = [...slightCandidates];

  for (const hotel of betterHotels) {
    for (const restaurant of betterRestaurants) {
      comfortableCandidates.push(evaluateCandidate(hotel, restaurant, baseActivities, baseTransport));
    }
    for (const transport of betterTransports) {
      comfortableCandidates.push(evaluateCandidate(hotel, baseRestaurant, baseActivities, transport));
    }
    for (const activities of betterActivitySets) {
      comfortableCandidates.push(evaluateCandidate(hotel, baseRestaurant, activities, baseTransport));
    }
  }

  for (const restaurant of betterRestaurants) {
    for (const transport of betterTransports) {
      comfortableCandidates.push(evaluateCandidate(baseHotel, restaurant, baseActivities, transport));
    }
    for (const activities of betterActivitySets) {
      comfortableCandidates.push(evaluateCandidate(baseHotel, restaurant, activities, baseTransport));
    }
  }

  for (const transport of betterTransports) {
    for (const activities of betterActivitySets) {
      comfortableCandidates.push(evaluateCandidate(baseHotel, baseRestaurant, activities, transport));
    }
  }

  const validComfortableCandidates = comfortableCandidates.filter((candidate) => {
    if (candidate.extraNeeded <= slightMax || candidate.extraNeeded > comfortMax) return false;
    if (slightPlanCandidate) {
      if (candidate.recommendedBudget <= slightPlanCandidate.recommendedBudget) return false;
      if (isIdenticalPlan(candidate, slightPlanCandidate)) return false;
      if (candidate.totalQualityGain <= slightPlanCandidate.totalQualityGain + 0.0001) return false;
    }
    return true;
  });

  if (validComfortableCandidates.length > 0) {
    validComfortableCandidates.sort((left, right) => {
      const leftQualityPerExtra = left.totalQualityGain / left.extraNeeded;
      const rightQualityPerExtra = right.totalQualityGain / right.extraNeeded;
      if (Math.abs(rightQualityPerExtra - leftQualityPerExtra) > 0.0001) {
        return rightQualityPerExtra - leftQualityPerExtra;
      }
      if (Math.abs(right.totalQualityGain - left.totalQualityGain) > 0.0001) {
        return right.totalQualityGain - left.totalQualityGain;
      }
      return left.extraNeeded - right.extraNeeded;
    });

    comfortablePlanCandidate = validComfortableCandidates[0];
    upgrades.push({
      plan: comfortablePlanCandidate,
      name: "Comfortable Upgrade",
      tagline: "A clearly more comfortable trip",
    });
  }

  const getTop = <T,>(items: T[], qualityFn: (item: T) => number) =>
    [...items].sort((left, right) => qualityFn(right) - qualityFn(left)).slice(0, 3);

  const topHotels = [baseHotel, ...getTop(betterHotels, hotelQuality)];
  const topRestaurants = [baseRestaurant, ...getTop(betterRestaurants, restaurantQuality)];
  const topTransports = [baseTransport, ...getTop(betterTransports, transportQuality)];
  const topActivitySets = getTop(betterActivitySets, activityQuality);
  const activityIncludesBase = topActivitySets.some((activities) =>
    isIdenticalPlan(
      { h: baseHotel, r: baseRestaurant, a: activities, t: baseTransport },
      { h: baseHotel, r: baseRestaurant, a: baseActivities, t: baseTransport },
    ),
  );
  const premiumActivitySets = activityIncludesBase ? topActivitySets : [baseActivities, ...topActivitySets];

  const premiumCandidates: RecommendationUpgradeCandidate[] = [];
  for (const hotel of topHotels) {
    for (const restaurant of topRestaurants) {
      for (const transport of topTransports) {
        for (const activities of premiumActivitySets) {
          if (hotel === baseHotel && restaurant === baseRestaurant && transport === baseTransport && activities === baseActivities) {
            continue;
          }
          if (
            hotelQuality(hotel) < baseHotelQuality ||
            restaurantQuality(restaurant) < baseRestaurantQuality ||
            activityQuality(activities) < baseActivityQuality ||
            transportQuality(transport) < baseTransportQuality
          ) {
            continue;
          }
          premiumCandidates.push(evaluateCandidate(hotel, restaurant, activities, transport));
        }
      }
    }
  }

  const validPremiumCandidates = premiumCandidates.filter((candidate) => {
    if (candidate.extraNeeded <= comfortMax || candidate.extraNeeded > premiumMax) return false;
    if (comfortablePlanCandidate) {
      if (candidate.recommendedBudget <= comfortablePlanCandidate.recommendedBudget) return false;
      if (isIdenticalPlan(candidate, comfortablePlanCandidate)) return false;
      if (candidate.overallQuality <= comfortablePlanCandidate.overallQuality + 0.0001) return false;
      if (candidate.totalQualityGain <= comfortablePlanCandidate.totalQualityGain + 0.0001) return false;
    }
    if (slightPlanCandidate && isIdenticalPlan(candidate, slightPlanCandidate)) return false;
    return true;
  });

  if (validPremiumCandidates.length > 0) {
    validPremiumCandidates.sort((left, right) => {
      if (Math.abs(right.overallQuality - left.overallQuality) > 0.0001) {
        return right.overallQuality - left.overallQuality;
      }
      if (Math.abs(right.balanceScore - left.balanceScore) > 0.0001) {
        return right.balanceScore - left.balanceScore;
      }
      if (Math.abs(right.totalQualityGain - left.totalQualityGain) > 0.0001) {
        return right.totalQualityGain - left.totalQualityGain;
      }
      return left.recommendedBudget - right.recommendedBudget;
    });

    upgrades.push({
      plan: validPremiumCandidates[0],
      name: "Premium Upgrade",
      tagline: "The ultimate high-end experience",
    });
  }

  return upgrades;
}

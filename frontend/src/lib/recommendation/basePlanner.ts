import {
  activityQuality,
  baseHotelQuality as hotelQuality,
  getSubsets,
  restaurantQuality,
  sumActivityRating,
  transportQuality,
} from "./scoringUtils";
import { NamedPlan, PlanParams, RecommendationActivity, RecommendationPlanCandidate } from "./types";

interface BVScores {
  balance: number;
  overall: number;
  util: number;
}

function bvScores(plan: RecommendationPlanCandidate, tripSpendingLimit: number): BVScores {
  const hotelScore = hotelQuality(plan.hRating, plan.hComfortLevel);
  const restaurantScore = restaurantQuality(plan.rRating);
  const activityScore = activityQuality(plan.a);
  const transportScore = transportQuality(plan.tComfortLevel);

  return {
    balance: Math.min(hotelScore, restaurantScore, activityScore, transportScore),
    overall: (hotelScore + restaurantScore + activityScore + transportScore) / 4,
    util: tripSpendingLimit > 0 ? plan.tripCost / tripSpendingLimit : 0,
  };
}

function isBetterBestValue(
  candidate: RecommendationPlanCandidate,
  current: RecommendationPlanCandidate,
  tripSpendingLimit: number,
) {
  const candidateScores = bvScores(candidate, tripSpendingLimit);
  const currentScores = bvScores(current, tripSpendingLimit);

  if (Math.abs(candidateScores.balance - currentScores.balance) > 0.0001) {
    return candidateScores.balance > currentScores.balance;
  }
  if (Math.abs(candidateScores.overall - currentScores.overall) > 0.0001) {
    return candidateScores.overall > currentScores.overall;
  }
  if (Math.abs(candidateScores.util - currentScores.util) > 0.001) {
    return candidateScores.util > currentScores.util;
  }
  if (candidate.hRating !== current.hRating) {
    return candidate.hRating > current.hRating;
  }

  return candidate.tripCost < current.tripCost;
}

function isBetterHotel(candidate: RecommendationPlanCandidate, bestValuePlan: RecommendationPlanCandidate) {
  const candidateHotelQuality = hotelQuality(candidate.hRating, candidate.hComfortLevel);
  const bestValueHotelQuality = hotelQuality(bestValuePlan.hRating, bestValuePlan.hComfortLevel);
  return candidateHotelQuality > bestValueHotelQuality;
}

function sortActivitiesByName(activities: RecommendationActivity[]) {
  return [...activities].sort((left, right) => left.activity_name.localeCompare(right.activity_name));
}

function isPlanIdentical(left: RecommendationPlanCandidate | null, right: RecommendationPlanCandidate | null) {
  if (!left || !right) return false;
  if (left.h.hotel_name !== right.h.hotel_name) return false;
  if (left.r.restaurant_name !== right.r.restaurant_name) return false;
  if (left.t.transport_mode !== right.t.transport_mode) return false;
  if (left.a.length !== right.a.length) return false;

  const leftActivities = sortActivitiesByName(left.a);
  const rightActivities = sortActivitiesByName(right.a);
  return leftActivities.every((activity, index) => activity.activity_name === rightActivities[index].activity_name);
}

function formatDiagnosticPlan(plan: RecommendationPlanCandidate, params: PlanParams) {
  const scores = bvScores(plan, params.tripSpendingLimit);
  const hotelScore = hotelQuality(plan.hRating, plan.hComfortLevel);

  return `hotel=${plan.h.hotel_name} (${plan.hRating}★ C${plan.hComfortLevel} hQ=${hotelScore.toFixed(3)}) | ${plan.a.length} acts ` +
    `| balance=${scores.balance.toFixed(3)} overall=${scores.overall.toFixed(3)} util=${(scores.util * 100).toFixed(1)}%` +
    ` | ₹${plan.tripCost} (H:₹${params.calcAccommodation(plan.h)} R:₹${params.calcFood(plan.r)} A:₹${params.calcActivity(plan.a)} T:₹${params.calcTransport(plan.t)})`;
}

export function buildBasePlans(params: PlanParams) {
  const startTime = Date.now();
  let combinationsEvaluated = 0;

  const {
    qualifiedHotels,
    qualifiedRestaurants,
    qualifiedActivities,
    qualifiedTransport,
    tripSpendingLimit,
    calcAccommodation,
    calcFood,
    calcActivity,
    calcTransport,
    days,
  } = params;

  const maxActivities = days * 2;
  const targetActivities = Math.max(1, days);
  const allActivitySubsets = getSubsets(qualifiedActivities, maxActivities);
  const allValidPlans: RecommendationPlanCandidate[] = [];

  for (const hotel of qualifiedHotels) {
    const hotelCost = calcAccommodation(hotel);
    if (hotelCost > tripSpendingLimit) continue;

    for (const restaurant of qualifiedRestaurants) {
      const restaurantCost = calcFood(restaurant);
      if (hotelCost + restaurantCost > tripSpendingLimit) continue;

      for (const transport of qualifiedTransport) {
        const transportCost = calcTransport(transport);
        if (hotelCost + restaurantCost + transportCost > tripSpendingLimit) continue;

        for (const activities of allActivitySubsets) {
          combinationsEvaluated += 1;
          const activityCost = calcActivity(activities);
          const tripCost = hotelCost + restaurantCost + transportCost + activityCost;

          if (tripCost <= tripSpendingLimit) {
            allValidPlans.push({
              h: hotel,
              r: restaurant,
              a: activities,
              t: transport,
              tripCost,
              hRating: hotel.rating ?? 3.5,
              hComfortLevel: hotel.comfort_level ?? 2,
              rRating: restaurant.rating ?? 3.5,
              tComfortLevel: transport.comfort_level ?? 1,
            });
          }
        }
      }
    }
  }

  const plans: NamedPlan<RecommendationPlanCandidate>[] = [];
  let bestValuePlan: RecommendationPlanCandidate | null = null;

  for (let activityCount = targetActivities; activityCount >= 1; activityCount -= 1) {
    const candidates = allValidPlans.filter((plan) => plan.a.length === activityCount);
    if (candidates.length === 0) continue;

    for (const candidate of candidates) {
      if (!bestValuePlan || isBetterBestValue(candidate, bestValuePlan, tripSpendingLimit)) {
        bestValuePlan = candidate;
      }
    }
    break;
  }

  if (bestValuePlan) {
    plans.push({ plan: bestValuePlan, name: "Best Value", tagline: "The Perfect Balance" });
  }

  let betterStayPlan: RecommendationPlanCandidate | null = null;

  for (let activityCount = targetActivities; activityCount >= 1; activityCount -= 1) {
    const candidates = allValidPlans.filter((plan) => plan.a.length === activityCount);
    if (candidates.length === 0) continue;

    candidates.sort((left, right) => {
      const leftHotelScore = hotelQuality(left.hRating, left.hComfortLevel);
      const rightHotelScore = hotelQuality(right.hRating, right.hComfortLevel);
      if (Math.abs(rightHotelScore - leftHotelScore) > 0.0001) return rightHotelScore - leftHotelScore;

      const leftSupportScore =
        restaurantQuality(left.rRating) + activityQuality(left.a) + transportQuality(left.tComfortLevel);
      const rightSupportScore =
        restaurantQuality(right.rRating) + activityQuality(right.a) + transportQuality(right.tComfortLevel);
      if (Math.abs(rightSupportScore - leftSupportScore) > 0.001) return rightSupportScore - leftSupportScore;

      const leftUtil = left.tripCost / tripSpendingLimit;
      const rightUtil = right.tripCost / tripSpendingLimit;
      if (Math.abs(rightUtil - leftUtil) > 0.001) return rightUtil - leftUtil;

      return left.tripCost - right.tripCost;
    });

    for (const candidate of candidates) {
      if (bestValuePlan && !isBetterHotel(candidate, bestValuePlan)) continue;
      if (!isPlanIdentical(candidate, bestValuePlan)) {
        betterStayPlan = candidate;
        break;
      }
    }

    if (betterStayPlan) break;
  }

  if (betterStayPlan) {
    plans.push({ plan: betterStayPlan, name: "Better Stay", tagline: "Comfort First" });
  }

  let moreExperiencesPlan: RecommendationPlanCandidate | null = null;
  const experienceCandidates = [...allValidPlans].sort((left, right) => {
    if (right.a.length !== left.a.length) return right.a.length - left.a.length;

    const rightActivitySum = sumActivityRating(right.a);
    const leftActivitySum = sumActivityRating(left.a);
    if (Math.abs(rightActivitySum - leftActivitySum) > 0.01) return rightActivitySum - leftActivitySum;

    const rightQuality =
      hotelQuality(right.hRating, right.hComfortLevel) +
      restaurantQuality(right.rRating) +
      transportQuality(right.tComfortLevel);
    const leftQuality =
      hotelQuality(left.hRating, left.hComfortLevel) +
      restaurantQuality(left.rRating) +
      transportQuality(left.tComfortLevel);
    if (Math.abs(rightQuality - leftQuality) > 0.001) return rightQuality - leftQuality;

    return left.tripCost - right.tripCost;
  });

  for (const candidate of experienceCandidates) {
    if (bestValuePlan && isPlanIdentical(candidate, bestValuePlan)) continue;
    if (betterStayPlan && isPlanIdentical(candidate, betterStayPlan)) continue;
    moreExperiencesPlan = candidate;
    break;
  }

  if (moreExperiencesPlan) {
    plans.push({ plan: moreExperiencesPlan, name: "More Experiences", tagline: "Explorer Mode" });
  }

  const elapsedMs = Date.now() - startTime;
  console.log(`\n[Base Planner] ${combinationsEvaluated} combinations | ${elapsedMs}ms | spending limit ₹${tripSpendingLimit}`);
  if (bestValuePlan) console.log(`[Base Planner] Best Value:       ${formatDiagnosticPlan(bestValuePlan, params)}`);
  else console.log("[Base Planner] Best Value:       NONE");
  if (betterStayPlan) console.log(`[Base Planner] Better Stay:      ${formatDiagnosticPlan(betterStayPlan, params)}`);
  else console.log(`[Base Planner] Better Stay:      OMITTED — no hotel with higher hotelQuality fits within ₹${tripSpendingLimit}`);
  if (moreExperiencesPlan) console.log(`[Base Planner] More Experiences: ${formatDiagnosticPlan(moreExperiencesPlan, params)}`);

  return { plans, bestValuePlan };
}

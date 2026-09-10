import { PlanParams } from './basePlanner';

import {
  hotelQuality as baseObjectHotelQuality,
  restaurantObjectQuality,
  transportObjectQuality,
  upgradeActivityQuality,
  getAverageActivityRating,
  getSubsets
} from './scoringUtils';

// ─── Quality Scorers (Must mirror basePlanner) ───────────────────────────────

function hotelQuality(hotel: any): number {
  return baseObjectHotelQuality(hotel);
}

function restaurantQuality(restaurant: any): number {
  return restaurantObjectQuality(restaurant);
}

function activityQuality(activities: any[]): number {
  return upgradeActivityQuality(activities);
}

function transportQuality(transport: any): number {
  return transportObjectQuality(transport);
}

function calcOverallQuality(h: any, r: any, a: any[], t: any): number {
  return (hotelQuality(h) + restaurantQuality(r) + activityQuality(a) + transportQuality(t)) / 4;
}

function calcBalanceScore(h: any, r: any, a: any[], t: any): number {
  return Math.min(hotelQuality(h), restaurantQuality(r), activityQuality(a), transportQuality(t));
}

function isIdenticalPlan(p1: any, p2: any): boolean {
  if (!p1 || !p2) return false;
  if (p1.h?.hotel_name !== p2.h?.hotel_name) return false;
  if (p1.r?.restaurant_name !== p2.r?.restaurant_name) return false;
  if (p1.t?.transport_mode !== p2.t?.transport_mode) return false;
  if (p1.a?.length !== p2.a?.length) return false;
  const a1 = [...p1.a].sort((x, y) => x.activity_name.localeCompare(y.activity_name));
  const a2 = [...p2.a].sort((x, y) => x.activity_name.localeCompare(y.activity_name));
  return a1.every((act, i) => act.activity_name === a2[i].activity_name);
}

// ─── Meaningful Improvement Checkers ──────────────────────────────────────────

function isRatingImproved(newRating: number, oldRating: number): boolean {
  return Number((newRating || 3.5).toFixed(1)) > Number((oldRating || 3.5).toFixed(1));
}

function isComfortImproved(newComfort: number, oldComfort: number): boolean {
  return (newComfort || 1) > (oldComfort || 1);
}

function isActivityImproved(newActs: any[], oldActs: any[]): boolean {
  return getAverageActivityRating(newActs) >= getAverageActivityRating(oldActs) + 0.10 - 0.0001;
}

function isHotelMeaningfullyImproved(newH: any, oldH: any): boolean {
  const oldHQ = hotelQuality(oldH);
  const newHQ = hotelQuality(newH);
  const visibleImprovement = isRatingImproved(newH.rating, oldH.rating) || isComfortImproved(newH.comfort_level, oldH.comfort_level);
  return newHQ > oldHQ + 0.0001 && visibleImprovement;
}

function isRestaurantMeaningfullyImproved(newR: any, oldR: any): boolean {
  return isRatingImproved(newR.rating, oldR.rating);
}

function isTransportMeaningfullyImproved(newT: any, oldT: any): boolean {
  return isComfortImproved(newT.comfort_level, oldT.comfort_level);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function buildUpgradePlans(params: PlanParams, bestValuePlan: any, originalTotalBudget: number) {
  const upgrades: { plan: any; name: string; tagline: string }[] = [];

  if (!bestValuePlan || bestValuePlan.tripCost > originalTotalBudget) {
    return upgrades;
  }

  const slightMax = originalTotalBudget * 0.05;
  const comfortMax = originalTotalBudget * 0.25;
  const premiumMax = originalTotalBudget * 0.50;

  const {
    qualifiedHotels, qualifiedRestaurants, qualifiedActivities, qualifiedTransport,
    calcAccommodation, calcFood, calcActivity, calcTransport
  } = params;

  const bvH = bestValuePlan.h;
  const bvR = bestValuePlan.r;
  const bvA = bestValuePlan.a;
  const bvT = bestValuePlan.t;

  const qH = hotelQuality(bvH);
  const qR = restaurantQuality(bvR);
  const qA = activityQuality(bvA);
  const qT = transportQuality(bvT);

  // Generate meaningfully better single items
  const betterHotels = qualifiedHotels.filter(h => isHotelMeaningfullyImproved(h, bvH));
  const betterRestaurants = qualifiedRestaurants.filter(r => isRestaurantMeaningfullyImproved(r, bvR));
  const betterTransports = qualifiedTransport.filter(t => isTransportMeaningfullyImproved(t, bvT));
  
  const targetActCount = bvA.length;
  let betterActivities: any[][] = [];
  if (targetActCount > 0) {
    const allActivitySubsets = getSubsets(qualifiedActivities, targetActCount);
    betterActivities = allActivitySubsets.filter(acts => isActivityImproved(acts, bvA));
  }

  // Cost and metrics calculator for a candidate
  const evaluateCandidate = (h: any, r: any, a: any[], t: any) => {
    const tripCost = calcAccommodation(h) + calcFood(r) + calcActivity(a) + calcTransport(t);
    const recommendedBudget = Math.ceil(tripCost / 0.90);
    const extraNeeded = recommendedBudget - originalTotalBudget;
    
    // Quality gains
    let changedCount = 0;
    let totalQualityGain = 0;
    if (h !== bvH) { changedCount++; totalQualityGain += (hotelQuality(h) - qH); }
    if (r !== bvR) { changedCount++; totalQualityGain += (restaurantQuality(r) - qR); }
    if (a !== bvA) { changedCount++; totalQualityGain += (activityQuality(a) - qA); }
    if (t !== bvT) { changedCount++; totalQualityGain += (transportQuality(t) - qT); }

    const overallQuality = calcOverallQuality(h, r, a, t);
    const balanceScore = calcBalanceScore(h, r, a, t);

    return {
      h, r, a, t, tripCost, recommendedBudget, extraNeeded, changedCount, totalQualityGain, overallQuality, balanceScore
    };
  };

  // ─── A. SLIGHT UPGRADE ───────────────────────────────────────────────────────
  let slightPlanCand = null;
  const slightCandidates = [];

  for (const h of betterHotels) slightCandidates.push(evaluateCandidate(h, bvR, bvA, bvT));
  for (const r of betterRestaurants) slightCandidates.push(evaluateCandidate(bvH, r, bvA, bvT));
  for (const t of betterTransports) slightCandidates.push(evaluateCandidate(bvH, bvR, bvA, t));
  for (const a of betterActivities) slightCandidates.push(evaluateCandidate(bvH, bvR, a, bvT));

  const validSlight = slightCandidates.filter(c => c.extraNeeded > 0 && c.extraNeeded <= slightMax);
  
  if (validSlight.length > 0) {
    validSlight.sort((a, b) => {
      if (a.extraNeeded !== b.extraNeeded) return a.extraNeeded - b.extraNeeded;
      if (Math.abs(b.totalQualityGain - a.totalQualityGain) > 0.0001) return b.totalQualityGain - a.totalQualityGain;
      return a.tripCost - b.tripCost;
    });
    slightPlanCand = validSlight[0];
    upgrades.push({ plan: slightPlanCand, name: "Slight Upgrade", tagline: "One small but meaningful improvement" });
  }

  // ─── B. COMFORTABLE UPGRADE ──────────────────────────────────────────────────
  let comfortablePlanCand = null;
  const comfortableCandidates = [];

  // 1-category
  comfortableCandidates.push(...slightCandidates);
  
  // 2-category
  for (const h of betterHotels) {
    for (const r of betterRestaurants) comfortableCandidates.push(evaluateCandidate(h, r, bvA, bvT));
    for (const t of betterTransports) comfortableCandidates.push(evaluateCandidate(h, bvR, bvA, t));
    for (const a of betterActivities) comfortableCandidates.push(evaluateCandidate(h, bvR, a, bvT));
  }
  for (const r of betterRestaurants) {
    for (const t of betterTransports) comfortableCandidates.push(evaluateCandidate(bvH, r, bvA, t));
    for (const a of betterActivities) comfortableCandidates.push(evaluateCandidate(bvH, r, a, bvT));
  }
  for (const t of betterTransports) {
    for (const a of betterActivities) comfortableCandidates.push(evaluateCandidate(bvH, bvR, a, t));
  }

  const validComfortable = comfortableCandidates.filter(c => {
    if (c.extraNeeded <= slightMax || c.extraNeeded > comfortMax) return false;
    if (slightPlanCand) {
      if (c.recommendedBudget <= slightPlanCand.recommendedBudget) return false;
      if (isIdenticalPlan(c, slightPlanCand)) return false;
      if (c.totalQualityGain <= slightPlanCand.totalQualityGain + 0.0001) return false;
    }
    return true;
  });

  if (validComfortable.length > 0) {
    validComfortable.sort((a, b) => {
      const qpeA = a.totalQualityGain / a.extraNeeded;
      const qpeB = b.totalQualityGain / b.extraNeeded;
      if (Math.abs(qpeB - qpeA) > 0.0001) return qpeB - qpeA;
      if (Math.abs(b.totalQualityGain - a.totalQualityGain) > 0.0001) return b.totalQualityGain - a.totalQualityGain;
      return a.extraNeeded - b.extraNeeded;
    });
    comfortablePlanCand = validComfortable[0];
    upgrades.push({ plan: comfortablePlanCand, name: "Comfortable Upgrade", tagline: "A clearly more comfortable trip" });
  }

  // ─── C. PREMIUM UPGRADE ──────────────────────────────────────────────────────
  let premiumPlanCand = null;

  const getTop = (items: any[], qFn: (i: any) => number) => {
    const sorted = [...items].sort((a, b) => qFn(b) - qFn(a));
    return sorted.slice(0, 3);
  };
  
  const topBetterHotels = getTop(betterHotels, hotelQuality);
  const topBetterRestaurants = getTop(betterRestaurants, restaurantQuality);
  const topBetterTransports = getTop(betterTransports, transportQuality);
  const topBetterActivities = getTop(betterActivities, activityQuality);

  const topH = [bvH, ...topBetterHotels];
  const topR = [bvR, ...topBetterRestaurants];
  const topT = [bvT, ...topBetterTransports];
  
  const aContainsBv = topBetterActivities.some(a => isIdenticalPlan({ a }, { a: bvA }));
  const topA = aContainsBv ? topBetterActivities : [bvA, ...topBetterActivities];

  const premiumCandidates = [];
  for (const h of topH) {
    for (const r of topR) {
      for (const t of topT) {
        for (const a of topA) {
          if (h === bvH && r === bvR && t === bvT && a === bvA) continue; // Must be better in at least one category
          // Ensure no category becomes worse
          if (hotelQuality(h) < qH || restaurantQuality(r) < qR || activityQuality(a) < qA || transportQuality(t) < qT) continue;
          premiumCandidates.push(evaluateCandidate(h, r, a, t));
        }
      }
    }
  }

  const validPremium = premiumCandidates.filter(c => {
    if (c.extraNeeded <= comfortMax || c.extraNeeded > premiumMax) return false;
    if (comfortablePlanCand) {
      if (c.recommendedBudget <= comfortablePlanCand.recommendedBudget) return false;
      if (isIdenticalPlan(c, comfortablePlanCand)) return false;
      if (c.overallQuality <= comfortablePlanCand.overallQuality + 0.0001) return false;
      if (c.totalQualityGain <= comfortablePlanCand.totalQualityGain + 0.0001) return false;
    }
    if (slightPlanCand && isIdenticalPlan(c, slightPlanCand)) return false;
    return true;
  });

  if (validPremium.length > 0) {
    validPremium.sort((a, b) => {
      if (Math.abs(b.overallQuality - a.overallQuality) > 0.0001) return b.overallQuality - a.overallQuality;
      if (Math.abs(b.balanceScore - a.balanceScore) > 0.0001) return b.balanceScore - a.balanceScore;
      if (Math.abs(b.totalQualityGain - a.totalQualityGain) > 0.0001) return b.totalQualityGain - a.totalQualityGain;
      return a.recommendedBudget - b.recommendedBudget;
    });
    
    premiumPlanCand = validPremium[0];
    upgrades.push({ plan: premiumPlanCand, name: "Premium Upgrade", tagline: "The ultimate high-end experience" });
  }

  return upgrades;
}

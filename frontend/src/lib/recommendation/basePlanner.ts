export interface PlanParams {
  qualifiedHotels: any[];
  qualifiedRestaurants: any[];
  qualifiedActivities: any[];
  qualifiedTransport: any[];
  tripSpendingLimit: number;
  minH: any;
  minR: any;
  minA: any;
  minT: any;
  minHotelCost: number;
  minFoodCost: number;
  minActCost: number;
  minTransCost: number;
  calcAccommodation: (h: any) => number;
  calcFood: (r: any) => number;
  calcActivity: (a: any) => number;
  calcTransport: (t: any) => number;
  getNextCheaper: (items: any[], currentItem: any) => any;
  getNextBetter: (items: any[], currentItem: any, type: string) => any;
  isIdentical: (p1: any, p2: any) => boolean;
  days: number;
}

import {
  baseHotelQuality as hotelQuality,
  restaurantQuality,
  transportQuality,
  activityQuality,
  sumActivityRating,
  getSubsets
} from './scoringUtils';

// ─── Best Value Scoring ────────────────────────────────────────────────────────
//
// rankBy (higher is better):
//   1. balanceScore    = min of all four category scores (weak category drags down)
//   2. overallQuality  = arithmetic mean of four category scores
//   3. budgetUtil      = tripCost / tripSpendingLimit (prefers plans that use budget)
//   4. hotel rating    (stable tie-break)
//   5. tripCost ASC    (deterministic final tie-break)
// ─────────────────────────────────────────────────────────────────────────────

interface BVScores { balance: number; overall: number; util: number }

function bvScores(p: any, tripSpendingLimit: number): BVScores {
  const hQ = hotelQuality(p.hRating, p.hComfortLevel);
  const rQ = restaurantQuality(p.rRating);
  const aQ = activityQuality(p.a);
  const tQ = transportQuality(p.tComfortLevel);
  return {
    balance: Math.min(hQ, rQ, aQ, tQ),
    overall: (hQ + rQ + aQ + tQ) / 4,
    util:    tripSpendingLimit > 0 ? p.tripCost / tripSpendingLimit : 0,
  };
}

/** Returns true when candidate should replace current as Best Value winner. */
function isBetterBestValue(candidate: any, current: any, tsl: number): boolean {
  const cs = bvScores(candidate, tsl);
  const cu = bvScores(current, tsl);
  if (Math.abs(cs.balance - cu.balance) > 0.0001) return cs.balance > cu.balance;
  if (Math.abs(cs.overall - cu.overall) > 0.0001) return cs.overall > cu.overall;
  if (Math.abs(cs.util   - cu.util)    > 0.0010) return cs.util    > cu.util;
  if (candidate.hRating !== current.hRating)      return candidate.hRating > current.hRating;
  return candidate.tripCost < current.tripCost;
}

// ─── Better Stay Eligibility ───────────────────────────────────────────────────
//
// The candidate hotel must have a strictly higher composite hotelQuality score
// than the Best Value hotel. Using the composite (not just rating) so that
// same-rating/higher-comfort hotels (e.g. Alpine Heights vs Backpacker's Haven)
// are correctly identified as a genuine stay improvement.
// ─────────────────────────────────────────────────────────────────────────────

function isBetterHotel(candidate: any, bvPlan: any): boolean {
  const cHQ = hotelQuality(candidate.hRating, candidate.hComfortLevel);
  const bHQ = hotelQuality(bvPlan.hRating,    bvPlan.hComfortLevel);
  return cHQ > bHQ;
}

export function buildBasePlans(params: PlanParams) {
  const startTime = Date.now();
  let combinationsEvaluated = 0;

  const {
    qualifiedHotels, qualifiedRestaurants, qualifiedActivities, qualifiedTransport,
    tripSpendingLimit, calcAccommodation, calcFood, calcActivity, calcTransport, days
  } = params;

  const maxActs    = days * 2;
  const targetActs = Math.max(1, days);

  const allActivitySubsets = getSubsets(qualifiedActivities, maxActs);

  // ── 2. Backtracking search — prune branches exceeding spending limit ──────────
  const allValidPlans: any[] = [];

  for (const h of qualifiedHotels) {
    const cH = calcAccommodation(h);
    if (cH > tripSpendingLimit) continue;
    for (const r of qualifiedRestaurants) {
      const cR = calcFood(r);
      if (cH + cR > tripSpendingLimit) continue;
      for (const t of qualifiedTransport) {
        const cT = calcTransport(t);
        if (cH + cR + cT > tripSpendingLimit) continue;
        for (const acts of allActivitySubsets) {
          combinationsEvaluated++;
          const cA       = calcActivity(acts);
          const tripCost = cH + cR + cT + cA;
          if (tripCost <= tripSpendingLimit) {
            allValidPlans.push({
              h, r, t, a: acts, tripCost,
              hRating:       h.rating        ?? 3.5,
              hComfortLevel: h.comfort_level  ?? 2,
              rRating:       r.rating        ?? 3.5,
              tComfortLevel: t.comfort_level  ?? 1,
            });
          }
        }
      }
    }
  }

  // ── 3. Exact-plan identity check (all four categories + sorted activity set) ──
  function isPlanIdentical(p1: any, p2: any): boolean {
    if (!p1 || !p2)                                         return false;
    if (p1.h.hotel_name      !== p2.h.hotel_name)           return false;
    if (p1.r.restaurant_name !== p2.r.restaurant_name)      return false;
    if (p1.t.transport_mode  !== p2.t.transport_mode)       return false;
    if (p1.a.length          !== p2.a.length)               return false;
    const a1 = [...p1.a].sort((x, y) => x.activity_name.localeCompare(y.activity_name));
    const a2 = [...p2.a].sort((x, y) => x.activity_name.localeCompare(y.activity_name));
    return a1.every((act, i) => act.activity_name === a2[i].activity_name);
  }

  // ── 4. Plan Selection ─────────────────────────────────────────────────────────
  const plans: { plan: any; name: string; tagline: string }[] = [];

  // ── Best Value ────────────────────────────────────────────────────────────────
  // Target ~days activities; fall back to fewer if none fit.
  let bestValuePlan: any = null;
  for (let t = targetActs; t >= 1; t--) {
    const candidates = allValidPlans.filter(p => p.a.length === t);
    if (candidates.length === 0) continue;
    for (const p of candidates) {
      if (!bestValuePlan || isBetterBestValue(p, bestValuePlan, tripSpendingLimit)) {
        bestValuePlan = p;
      }
    }
    break;
  }
  if (bestValuePlan) plans.push({ plan: bestValuePlan, name: 'Best Value', tagline: 'The Perfect Balance' });

  // ── Better Stay ───────────────────────────────────────────────────────────────
  // Candidate hotel must have strictly higher hotelQuality() than BV hotel.
  // Sort remaining categories by best hotel → best support (restaurant, activities,
  // transport) → higher budget utilisation → lower cost.
  let betterStayPlan: any = null;
  for (let t = targetActs; t >= 1; t--) {
    const candidates = allValidPlans.filter(p => p.a.length === t);
    if (candidates.length === 0) continue;

    candidates.sort((a, b) => {
      const hQA = hotelQuality(a.hRating, a.hComfortLevel);
      const hQB = hotelQuality(b.hRating, b.hComfortLevel);
      if (Math.abs(hQB - hQA) > 0.0001) return hQB - hQA;
      // Same hotel quality: prefer better support categories
      const supA = restaurantQuality(a.rRating) + activityQuality(a.a) + transportQuality(a.tComfortLevel);
      const supB = restaurantQuality(b.rRating) + activityQuality(b.a) + transportQuality(b.tComfortLevel);
      if (Math.abs(supB - supA) > 0.001) return supB - supA;
      const utilA = a.tripCost / tripSpendingLimit;
      const utilB = b.tripCost / tripSpendingLimit;
      if (Math.abs(utilB - utilA) > 0.001) return utilB - utilA;
      return a.tripCost - b.tripCost;
    });

    for (const p of candidates) {
      if (bestValuePlan && !isBetterHotel(p, bestValuePlan)) continue;
      if (!isPlanIdentical(p, bestValuePlan)) {
        betterStayPlan = p;
        break;
      }
    }
    if (betterStayPlan) break;
  }
  if (betterStayPlan) plans.push({ plan: betterStayPlan, name: 'Better Stay', tagline: 'Comfort First' });

  // ── More Experiences ──────────────────────────────────────────────────────────
  // 1. Greatest distinct activity count (up to days*2)
  // 2. Higher summed activity rating
  // 3. Higher combined H+R+T quality
  // 4. Lower trip cost
  let moreExpPlan: any = null;
  const meCandidates = [...allValidPlans].sort((a, b) => {
    if (b.a.length !== a.a.length) return b.a.length - a.a.length;
    const bSum = sumActivityRating(b.a), aSum = sumActivityRating(a.a);
    if (Math.abs(bSum - aSum) > 0.01) return bSum - aSum;
    const bQ = hotelQuality(b.hRating, b.hComfortLevel) + restaurantQuality(b.rRating) + transportQuality(b.tComfortLevel);
    const aQ = hotelQuality(a.hRating, a.hComfortLevel) + restaurantQuality(a.rRating) + transportQuality(a.tComfortLevel);
    if (Math.abs(bQ - aQ) > 0.001) return bQ - aQ;
    return a.tripCost - b.tripCost;
  });
  for (const p of meCandidates) {
    if (bestValuePlan  && isPlanIdentical(p, bestValuePlan))  continue;
    if (betterStayPlan && isPlanIdentical(p, betterStayPlan)) continue;
    moreExpPlan = p;
    break;
  }
  if (moreExpPlan) plans.push({ plan: moreExpPlan, name: 'More Experiences', tagline: 'Explorer Mode' });

  // ── Diagnostics ───────────────────────────────────────────────────────────────
  const ms = Date.now() - startTime;
  const fmt = (p: any) => {
    const s = bvScores(p, tripSpendingLimit);
    const hQ = hotelQuality(p.hRating, p.hComfortLevel);
    return `hotel=${p.h.hotel_name} (${p.hRating}★ C${p.hComfortLevel} hQ=${hQ.toFixed(3)}) | ${p.a.length} acts ` +
           `| balance=${s.balance.toFixed(3)} overall=${s.overall.toFixed(3)} util=${(s.util*100).toFixed(1)}%` +
           ` | ₹${p.tripCost} (H:₹${calcAccommodation(p.h)} R:₹${calcFood(p.r)} A:₹${calcActivity(p.a)} T:₹${calcTransport(p.t)})`;
  };
  console.log(`\n[Base Planner] ${combinationsEvaluated} combinations | ${ms}ms | spending limit ₹${tripSpendingLimit}`);
  if (bestValuePlan)  console.log(`[Base Planner] Best Value:       ${fmt(bestValuePlan)}`);
  else                console.log(`[Base Planner] Best Value:       NONE`);
  if (betterStayPlan) console.log(`[Base Planner] Better Stay:      ${fmt(betterStayPlan)}`);
  else                console.log(`[Base Planner] Better Stay:      OMITTED — no hotel with higher hotelQuality fits within ₹${tripSpendingLimit}`);
  if (moreExpPlan)    console.log(`[Base Planner] More Experiences: ${fmt(moreExpPlan)}`);

  return { plans, bestValuePlan };
}

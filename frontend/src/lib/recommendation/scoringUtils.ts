// ─── Quality Scorers (all normalised to [0, 1]) ───────────────────────────────
//
// comfort_level: 1=basic, 2=standard, 3=premium  (Hotels & Transport)
// activity rating: curated prototype values — NOT verified customer reviews.
// ─────────────────────────────────────────────────────────────────────────────

import {
  RecommendationActivity,
  RecommendationHotel,
  RecommendationRestaurant,
  RecommendationTransport,
} from "./types";

/** Hotel: 60% star rating + 40% comfort tier */
export function baseHotelQuality(rating: number, comfort: number): number {
  return 0.60 * (rating / 5) + 0.40 * (comfort / 3);
}

/** Hotel quality extractor for object input */
export function hotelQuality(hotel: RecommendationHotel): number {
  return 0.60 * ((hotel.rating || 3.5) / 5) + 0.40 * ((hotel.comfort_level || 2) / 3);
}

/** Restaurant: star rating only */
export function restaurantQuality(rating: number): number {
  return rating / 5;
}

export function restaurantObjectQuality(restaurant: RecommendationRestaurant): number {
  return (restaurant.rating || 3.5) / 5;
}

/** Transport: comfort tier only */
export function transportQuality(comfort: number): number {
  return comfort / 3;
}

export function transportObjectQuality(transport: RecommendationTransport): number {
  return (transport.comfort_level || 1) / 3;
}

/** Average activity rating, normalised. Unrated activities contribute 0. */
export function activityQuality(acts: RecommendationActivity[]): number {
  const rated = acts.filter((activity) => activity.rating != null && activity.rating > 0);
  if (rated.length === 0) return 0;
  return (rated.reduce((sum, activity) => sum + (activity.rating || 0), 0) / rated.length) / 5;
}

export function getAverageActivityRating(activities: RecommendationActivity[]): number {
  if (!activities?.length) return 0;
  return activities.reduce((sum, activity) => sum + (activity.rating ?? 0), 0) / activities.length;
}

export function upgradeActivityQuality(activities: RecommendationActivity[]): number {
  return getAverageActivityRating(activities) / 5;
}

/** Sum of raw activity ratings (for More Experiences tie-break). */
export function sumActivityRating(acts: RecommendationActivity[]): number {
  return acts.reduce((sum, activity) => sum + (activity.rating || 0), 0);
}

// ─── Shared Utilities ────────────────────────────────────────────────────────

export const getSubsets = <T,>(arr: T[], maxSize: number): T[][] => {
  const results: T[][] = [];
  const helper = (startIdx: number, current: T[]) => {
    if (current.length > 0 && current.length <= maxSize) {
      results.push([...current]);
    }
    if (current.length === maxSize) {
      return;
    }
    for (let i = startIdx; i < arr.length; i++) {
      current.push(arr[i]);
      helper(i + 1, current);
      current.pop();
    }
  };
  helper(0, []);
  return results;
};

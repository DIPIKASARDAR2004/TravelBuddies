import { PlannerPackage } from "@/types";

export interface RecommendationHotel {
  hotel_name: string;
  price_per_night: number;
  rating?: number | null;
  comfort_level?: number | null;
  is_women_friendly?: boolean | null;
  destination?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
}

export interface RecommendationRestaurant {
  restaurant_name: string;
  cost_per_meal: number;
  rating?: number | null;
}

export interface RecommendationActivity {
  activity_name: string;
  cost_per_person: number;
  rating?: number | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
}

export interface RecommendationTransport {
  transport_mode: string;
  cost_per_person: number;
  comfort_level?: number | null;
}

export interface RecommendationPlanCandidate {
  h: RecommendationHotel;
  r: RecommendationRestaurant;
  a: RecommendationActivity[];
  t: RecommendationTransport;
  tripCost: number;
  hRating: number;
  hComfortLevel: number;
  rRating: number;
  tComfortLevel: number;
}

export interface RecommendationUpgradeCandidate extends RecommendationPlanCandidate {
  recommendedBudget: number;
  extraNeeded: number;
  changedCount: number;
  totalQualityGain: number;
  overallQuality: number;
  balanceScore: number;
}

export interface NamedPlan<TPlan> {
  plan: TPlan;
  name: string;
  tagline: string;
}

export interface PlanParams {
  qualifiedHotels: RecommendationHotel[];
  qualifiedRestaurants: RecommendationRestaurant[];
  qualifiedActivities: RecommendationActivity[];
  qualifiedTransport: RecommendationTransport[];
  tripSpendingLimit: number;
  calcAccommodation: (hotel: RecommendationHotel) => number;
  calcFood: (restaurant: RecommendationRestaurant) => number;
  calcActivity: (activities: RecommendationActivity[]) => number;
  calcTransport: (transport: RecommendationTransport) => number;
  days: number;
}

export type RecommendationPackage = PlannerPackage;

export type PlannerView = "FORM" | "TIERS" | "CUSTOMIZE";
export type PlannerItemType = "hotel" | "restaurant" | "activity" | "transport";
export type PlannerModalMode = "swap" | "add";

export interface TripDetails {
  budget: number;
  travellers: number;
  days: number;
  destination: string;
  dates?: { startDate: string; endDate: string };
  isSafetyTrip?: boolean;
}

export interface Hotel {
  id: string;
  name: string;
  location: string;
  price: number;
  price_per_night: number;
  rating?: number;
  image_url?: string;
  safety_score?: number;
  women_only?: boolean;
}

export interface HotelOption {
  name: string;
  price: number;
  rating?: number;
  latitude?: number | string | null;
  longitude?: number | string | null;
  is_women_friendly?: boolean;
}

export interface RestaurantOption {
  restaurant_name: string;
  cost_per_meal: number;
  rating?: number;
}

export interface ActivityOption {
  id?: string | number;
  activity_name: string;
  cost_per_person: number;
  rating?: number;
  latitude?: number | string | null;
  longitude?: number | string | null;
  duration_minutes?: number;
  description?: string;
  estimatedStartTime?: number;
  estimatedEndTime?: number;
}

export interface TransportOption {
  transport_mode: string;
  cost_per_person: number;
  comfort_level?: number;
}

export interface HotelAlternative {
  hotel_name: string;
  price_per_night: number;
  rating?: number;
  is_women_friendly?: boolean;
  latitude?: number | string | null;
  longitude?: number | string | null;
}

export interface RestaurantAlternative {
  restaurant_name: string;
  cost_per_meal: number;
  rating?: number;
}

export interface ActivityAlternative {
  id?: string | number;
  activity_name: string;
  cost_per_person: number;
  rating?: number;
  latitude?: number | string | null;
  longitude?: number | string | null;
  duration_minutes?: number;
  description?: string;
}

export interface TransportAlternative {
  transport_mode: string;
  cost_per_person: number;
  comfort_level?: number;
}

export interface PlannerExtraItem {
  type: PlannerItemType;
  name: string;
  price: number;
  rawItem:
    | HotelAlternative
    | RestaurantAlternative
    | ActivityAlternative
    | TransportAlternative;
}

export interface PlannerPackage {
  name: string;
  tagline?: string;
  accommodationCost: number;
  foodCost: number;
  activityCost: number;
  transportCost: number;
  tripCost: number;
  emergencyReserve: number;
  tripSpendingLimit: number;
  remainingSpendableBudget?: number;
  remainingBudget: number;
  totalAllocated: number;
  recommendedBudget?: number;
  recommendedEmergencyReserve?: number;
  recommendedTripSpendingLimit?: number;
  extraNeeded?: number;
  changedCategories?: string[];
  upgradeHighlights?: string[];
  selectedHotel: HotelOption | null;
  selectedRestaurant: RestaurantOption | null;
  selectedActivity: ActivityOption | null;
  selectedActivities: ActivityOption[];
  selectedTransport: TransportOption | null;
  extraItems?: PlannerExtraItem[];
}

export interface PlannerAlternatives {
  hotel: HotelAlternative[];
  restaurant: RestaurantAlternative[];
  activity: ActivityAlternative[];
  transport: TransportAlternative[];
}

export interface PlannerApiResponse {
  destination: string;
  totalBudget: number;
  tripSpendingLimit: number;
  travellers: number;
  days: number;
  isTripPossible: boolean;
  withinBudget: PlannerPackage[];
  upgrades: PlannerPackage[];
  alternatives: PlannerAlternatives;
}

export interface RouteLeg {
  durationMins: number;
  distanceKm: number;
}

export interface ItineraryDay {
  dayNumber: number;
  activities: ActivityOption[];
}

export interface EnrichedItineraryDay extends ItineraryDay {
  hotelDepartureTime: number;
  hotelReturnTime: number | null;
  routeLegs: RouteLeg[];
  totalDrivingDistanceKm: number;
  totalDrivingDurationMins: number;
  error: string | null;
}

export interface ItineraryItem {
  id: string;
  title: string;
  type: "hotel" | "restaurant" | "activity" | "transport";
  price: number;
  time?: string;
  description?: string;
}

export interface ApiResponse<T = unknown> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
  [key: string]: unknown;
}

export type ProtectedBookingStatus =
  | "PAYMENT_PENDING"
  | "PAYMENT_FAILED"
  | "PROTECTED"
  | "REFUND_PENDING"
  | "RELEASED"
  | "REFUNDED"
  | "CANCELLED"
  | "CANCELLED_BY_USER"
  | "CANCELLED_BY_HOTEL"
  | "CANCELLED_NO_REFUND"
  | "NO_SHOW"
  | "DISPUTED";

export interface ProtectedBookingHotelSnapshot {
  id?: string | number;
  name?: string;
  location?: string;
  price?: number;
  price_per_night?: number;
  rating?: number;
  image_url?: string;
}

export interface ProtectedBooking {
  id: string;
  destination: string;
  travellers: number;
  nights: number;
  rooms: number;
  amount_paise: number;
  currency: string;
  status: ProtectedBookingStatus;
  check_in_date: string | null;
  check_out_date: string | null;
  razorpay_order_id: string | null;
  razorpay_payment_id?: string | null;
  hotel_id?: string | null;
  hotel_snapshot: ProtectedBookingHotelSnapshot | null;
}

export interface ProtectedBookingActionResponse extends ApiResponse {
  status?: ProtectedBookingStatus;
  customer_refund_amount?: number;
}

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

export interface ItineraryItem {
  id: string;
  title: string;
  type: 'hotel' | 'restaurant' | 'activity' | 'transport';
  price: number;
  time?: string;
  description?: string;
}

export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
  [key: string]: any; // Allow arbitrary keys for legacy compatibility
}

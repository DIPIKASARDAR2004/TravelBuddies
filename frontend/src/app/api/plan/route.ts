import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { buildBasePlans } from '@/lib/recommendation/basePlanner';
import { buildUpgradePlans } from '@/lib/recommendation/upgradePlanner';
import {
  calcAccommodation,
  calcFood,
  calcActivity,
  calcTransport,
  formatOption,
  formatUpgrade,
  getBudgetItem,
} from '@/lib/recommendation/planService';
import {
  PlanParams,
  RecommendationActivity,
  RecommendationHotel,
  RecommendationRestaurant,
  RecommendationTransport,
} from '@/lib/recommendation/types';
import {
  ActivityAlternative,
  HotelAlternative,
  PlannerApiResponse,
  RestaurantAlternative,
  TransportAlternative,
} from '@/types';

interface PlanRequestBody {
  destination?: string;
  totalBudget?: number | string;
  travellers?: number | string;
  days?: number | string;
  womenOnly?: boolean;
}

const normalizeHotelAlternative = (hotel: RecommendationHotel): HotelAlternative => ({
  hotel_name: hotel.hotel_name,
  price_per_night: hotel.price_per_night,
  rating: hotel.rating ?? undefined,
  is_women_friendly: hotel.is_women_friendly ?? undefined,
  latitude: hotel.latitude,
  longitude: hotel.longitude,
});

const normalizeRestaurantAlternative = (restaurant: RecommendationRestaurant): RestaurantAlternative => ({
  restaurant_name: restaurant.restaurant_name,
  cost_per_meal: restaurant.cost_per_meal,
  rating: restaurant.rating ?? undefined,
});

const normalizeActivityAlternative = (activity: RecommendationActivity): ActivityAlternative => ({
  activity_name: activity.activity_name,
  cost_per_person: activity.cost_per_person,
  rating: activity.rating ?? undefined,
  latitude: activity.latitude,
  longitude: activity.longitude,
});

const normalizeTransportAlternative = (transport: RecommendationTransport): TransportAlternative => ({
  transport_mode: transport.transport_mode,
  cost_per_person: transport.cost_per_person,
  comfort_level: transport.comfort_level ?? undefined,
});

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PlanRequestBody;
    const { destination, totalBudget, travellers, days, womenOnly } = body;

    if (!destination || !totalBudget || !travellers || !days) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const budget = Number(totalBudget);
    const numTravellers = Number(travellers);
    const numDays = Number(days);

    const emergencyReserve = budget * 0.10;
    const tripSpendingLimit = budget - emergencyReserve;

    console.log("--- Recommendation Engine v2 ---");
    console.log("Destination:", destination, "| Budget:", budget, "| Spending Limit:", tripSpendingLimit);

    // Fetch ALL matching records
    const { data: allHotels } = await supabase
      .from('Hotels')
      .select('hotel_name, price_per_night, rating, comfort_level, is_women_friendly, destination, latitude, longitude')
      .ilike('destination', `%${destination}%`)
      .order('price_per_night', { ascending: true });

    const { data: allRestaurants } = await supabase
      .from('restaurants')
      .select('restaurant_name, cost_per_meal, rating')
      .ilike('destination', `%${destination}%`)
      .order('cost_per_meal', { ascending: true });

    const { data: allActivities } = await supabase
      .from('activities')
      .select('activity_name, cost_per_person, rating, latitude, longitude')
      .ilike('destination', `%${destination}%`)
      .order('cost_per_person', { ascending: true });

    const { data: allTransport } = await supabase
      .from('transport')
      .select('transport_mode, cost_per_person, comfort_level')
      .ilike('destination', `%${destination}%`)
      .order('cost_per_person', { ascending: true });

    // Apply minimum quality filters (rating >= 3.5)
    let qualifiedHotels: RecommendationHotel[] = ((allHotels || []) as RecommendationHotel[]).filter(
      (hotel) => (hotel.rating || 0) >= 3.5,
    );
    if (womenOnly) {
      qualifiedHotels = qualifiedHotels.filter((hotel) => hotel.is_women_friendly === true);
    }
    const qualifiedRestaurants: RecommendationRestaurant[] = ((allRestaurants || []) as RecommendationRestaurant[]).filter(
      (restaurant) => (restaurant.rating || 0) >= 3.5,
    );
    const qualifiedActivities: RecommendationActivity[] = (allActivities || []) as RecommendationActivity[];
    const qualifiedTransport: RecommendationTransport[] = (allTransport || []) as RecommendationTransport[];

    if (!qualifiedHotels.length || !qualifiedRestaurants.length || !qualifiedActivities.length || !qualifiedTransport.length) {
      return NextResponse.json({
        error: 'Insufficient data for this destination to build a complete plan.'
      }, { status: 400 });
    }


    // Base minimums
    const minH = getBudgetItem(qualifiedHotels) as RecommendationHotel;
    const minR = getBudgetItem(qualifiedRestaurants) as RecommendationRestaurant;
    const minA = getBudgetItem(qualifiedActivities) as RecommendationActivity;
    const minT = getBudgetItem(qualifiedTransport) as RecommendationTransport;

    const minHotelCost = calcAccommodation(minH, numTravellers, numDays);
    const minFoodCost = calcFood(minR, numTravellers, numDays);
    const minActCost = calcActivity([minA], numTravellers);
    const minTransCost = calcTransport(minT, numTravellers);

    // If absolute minimum exceeds limit, trip is not possible within budget.
    if (minHotelCost + minFoodCost + minActCost + minTransCost > tripSpendingLimit) {
      return NextResponse.json({
        destination, totalBudget: budget, tripSpendingLimit,
        travellers: numTravellers, days: numDays, isTripPossible: false, withinBudget: [], upgrades: [],
        alternatives: {
          hotel: ((allHotels || []) as RecommendationHotel[]).map(normalizeHotelAlternative),
          restaurant: ((allRestaurants || []) as RecommendationRestaurant[]).map(normalizeRestaurantAlternative),
          activity: ((allActivities || []) as RecommendationActivity[]).map(normalizeActivityAlternative),
          transport: ((allTransport || []) as RecommendationTransport[]).map(normalizeTransportAlternative),
        }
      }, { status: 200 });
    }

    // Wrap calculators for the planner algorithms to abstract away the numTravellers and numDays
    const params: PlanParams = {
      qualifiedHotels, qualifiedRestaurants, qualifiedActivities, qualifiedTransport,
      tripSpendingLimit,
      calcAccommodation: (hotel) => calcAccommodation(hotel, numTravellers, numDays),
      calcFood: (restaurant) => calcFood(restaurant, numTravellers, numDays),
      calcActivity: (activities) => calcActivity(activities, numTravellers),
      calcTransport: (transport) => calcTransport(transport, numTravellers),
      days: numDays
    };

    // Build Priority-Based Plans and Upgrades
    const withinBudget: PlannerApiResponse["withinBudget"] = [];
    const upgrades: PlannerApiResponse["upgrades"] = [];

    const { plans: basePlans, bestValuePlan } = buildBasePlans(params);
    
    basePlans.forEach(p => withinBudget.push(
      formatOption(p.plan, p.name, p.tagline, tripSpendingLimit, emergencyReserve, budget, numTravellers, numDays)
    ));

    const upgradePlans = buildUpgradePlans(params, bestValuePlan, budget);
    
    upgradePlans.forEach(p => upgrades.push(
      formatUpgrade(p.plan, p.name, p.tagline, bestValuePlan, budget, tripSpendingLimit, emergencyReserve, numTravellers, numDays)
    ));

    const isTripPossible = withinBudget.length > 0;

    const responseData: PlannerApiResponse = {
      destination,
      totalBudget: budget,
      tripSpendingLimit,
      travellers: numTravellers,
      days: numDays,
      isTripPossible,
      withinBudget,
      upgrades,
      alternatives: {
        hotel: womenOnly
          ? ((allHotels || []) as RecommendationHotel[])
              .filter((hotel) => hotel.is_women_friendly === true)
              .map(normalizeHotelAlternative)
          : ((allHotels || []) as RecommendationHotel[]).map(normalizeHotelAlternative),
        restaurant: ((allRestaurants || []) as RecommendationRestaurant[]).map(normalizeRestaurantAlternative),
        activity: ((allActivities || []) as RecommendationActivity[]).map(normalizeActivityAlternative),
        transport: ((allTransport || []) as RecommendationTransport[]).map(normalizeTransportAlternative)
      }
    };

    return NextResponse.json(responseData, { status: 200 });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

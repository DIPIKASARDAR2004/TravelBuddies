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
  getNextCheaper,
  getNextBetter,
  isIdentical
} from '@/lib/recommendation/planService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
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
    let qualifiedHotels = (allHotels || []).filter(h => h.rating >= 3.5);
    if (womenOnly) {
      qualifiedHotels = qualifiedHotels.filter(h => h.is_women_friendly === true);
    }
    const qualifiedRestaurants = (allRestaurants || []).filter(r => r.rating >= 3.5);
    const qualifiedActivities = allActivities || [];
    const qualifiedTransport = allTransport || [];

    if (!qualifiedHotels.length || !qualifiedRestaurants.length || !qualifiedActivities.length || !qualifiedTransport.length) {
      return NextResponse.json({
        error: 'Insufficient data for this destination to build a complete plan.'
      }, { status: 400 });
    }


    // Base minimums
    const minH = getBudgetItem(qualifiedHotels);
    const minR = getBudgetItem(qualifiedRestaurants);
    const minA = getBudgetItem(qualifiedActivities);
    const minT = getBudgetItem(qualifiedTransport);

    const minHotelCost = calcAccommodation(minH, numTravellers, numDays);
    const minFoodCost = calcFood(minR, numTravellers, numDays);
    const minActCost = calcActivity(minA, numTravellers);
    const minTransCost = calcTransport(minT, numTravellers);

    // If absolute minimum exceeds limit, trip is not possible within budget.
    if (minHotelCost + minFoodCost + minActCost + minTransCost > tripSpendingLimit) {
      return NextResponse.json({
        destination, totalBudget: budget, tripSpendingLimit,
        travellers: numTravellers, days: numDays, isTripPossible: false, withinBudget: [], upgrades: [],
        alternatives: { hotel: allHotels || [], restaurant: allRestaurants || [], activity: allActivities || [], transport: allTransport || [] }
      }, { status: 200 });
    }

    // Wrap calculators for the planner algorithms to abstract away the numTravellers and numDays
    const wrapCalcAcc = (h: any) => calcAccommodation(h, numTravellers, numDays);
    const wrapCalcFood = (r: any) => calcFood(r, numTravellers, numDays);
    const wrapCalcAct = (a: any) => calcActivity(a, numTravellers);
    const wrapCalcTrans = (t: any) => calcTransport(t, numTravellers);
    
    const wrapGetNextBetter = (items: any[], currentItem: any, type: string) => 
        getNextBetter(items, currentItem, type, numTravellers, numDays);

    const params = {
      qualifiedHotels, qualifiedRestaurants, qualifiedActivities, qualifiedTransport,
      tripSpendingLimit, minH, minR, minA, minT,
      minHotelCost, minFoodCost, minActCost, minTransCost,
      calcAccommodation: wrapCalcAcc, 
      calcFood: wrapCalcFood, 
      calcActivity: wrapCalcAct, 
      calcTransport: wrapCalcTrans,
      getNextCheaper, 
      getNextBetter: wrapGetNextBetter, 
      isIdentical, 
      days: numDays
    };

    // Build Priority-Based Plans and Upgrades
    const withinBudget: any[] = [];
    const upgrades: any[] = [];

    const { plans: basePlans, bestValuePlan } = buildBasePlans(params);
    
    basePlans.forEach(p => withinBudget.push(
      formatOption(p.plan, p.name, p.tagline, tripSpendingLimit, emergencyReserve, budget, numTravellers, numDays)
    ));

    const upgradePlans = buildUpgradePlans(params, bestValuePlan, budget);
    
    upgradePlans.forEach(p => upgrades.push(
      formatUpgrade(p.plan, p.name, p.tagline, bestValuePlan, budget, tripSpendingLimit, emergencyReserve, numTravellers, numDays)
    ));

    const isTripPossible = withinBudget.length > 0;

    const responseData = {
      destination,
      totalBudget: budget,
      tripSpendingLimit,
      travellers: numTravellers,
      days: numDays,
      isTripPossible,
      withinBudget,
      upgrades,
      alternatives: {
        hotel: womenOnly ? (allHotels || []).filter(h => h.is_women_friendly === true) : (allHotels || []),
        restaurant: allRestaurants || [],
        activity: allActivities || [],
        transport: allTransport || []
      }
    };

    return NextResponse.json(responseData, { status: 200 });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

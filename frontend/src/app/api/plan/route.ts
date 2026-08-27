import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { buildBasePlans } from '@/lib/recommendation/basePlanner';
import { buildUpgradePlans } from '@/lib/recommendation/upgradePlanner';

export async function POST(request: Request) {
  try {
    // 1. Parse and validate the incoming JSON body
    const body = await request.json();
    const { destination, totalBudget, travellers, days } = body;

    if (!destination || !totalBudget || !travellers || !days) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const budget = Number(totalBudget);
    const numTravellers = Number(travellers);
    const numDays = Number(days);

    const emergencyReserve = budget * 0.10;
    const tripSpendingLimit = budget - emergencyReserve;

    console.log("--- Recommendation Engine v2 ---");
    console.log("Destination:", destination, "| Budget:", budget, "| Spending Limit:", tripSpendingLimit);

    // --------------------------------------------------------
    // 2. Fetch ALL matching records from Supabase.
    //    NOTE: is_women_friendly is fetched to preserve it in
    //    the data, but is NOT used for filtering or ranking here.
    //    It will be used exclusively by the Safety/Women page.
    // --------------------------------------------------------
    const { data: allHotels } = await supabase
      .from('Hotels')
      .select('hotel_name, price_per_night, rating, comfort_level, is_women_friendly, destination')
      .ilike('destination', `%${destination}%`)
      .order('price_per_night', { ascending: true });

    const { data: allRestaurants } = await supabase
      .from('restaurants')
      .select('restaurant_name, cost_per_meal, rating')
      .ilike('destination', `%${destination}%`)
      .order('cost_per_meal', { ascending: true });

    // Activities and Transport do not have rating columns in our schema
    const { data: allActivities } = await supabase
      .from('activities')
      .select('activity_name, cost_per_person, rating')
      .ilike('destination', `%${destination}%`)
      .order('cost_per_person', { ascending: true });

    const { data: allTransport } = await supabase
      .from('transport')
      .select('transport_mode, cost_per_person, comfort_level')
      .ilike('destination', `%${destination}%`)
      .order('cost_per_person', { ascending: true });

    // --------------------------------------------------------
    // 3. Apply minimum quality filters (rating >= 3.5)
    //    Only for Hotels and Restaurants which have ratings.
    // --------------------------------------------------------
    const qualifiedHotels = (allHotels || []).filter(h => h.rating >= 3.5);
    const qualifiedRestaurants = (allRestaurants || []).filter(r => r.rating >= 3.5);
    // No rating filter for Activities or Transport
    const qualifiedActivities = allActivities || [];
    const qualifiedTransport = allTransport || [];

    // --------------------------------------------------------
    // 4. Selector helpers
    // --------------------------------------------------------

    const getBudgetItem = (items: any[]) => items.length > 0 ? items[0] : null;

    const getComfortableItem = (items: any[], ratingField: string | null) => {
      if (items.length === 0) return null;
      if (items.length <= 2) return items[Math.floor(items.length / 2)];

      const thirdSize = Math.floor(items.length / 3);
      const midSlice = items.slice(thirdSize, thirdSize * 2 + 1);

      if (ratingField) {
        return midSlice.reduce((best: any, curr: any) =>
          curr[ratingField] > best[ratingField] ? curr : best
        , midSlice[0]);
      }
      return midSlice[0];
    };

    const getPremiumHotel = (items: any[]) => {
      const highQuality = items.filter(h => h.rating >= 4.0);
      if (highQuality.length === 0) return null;
      return highQuality[highQuality.length - 1];
    };

    const getLastItem = (items: any[]) => items.length > 0 ? items[items.length - 1] : null;

    const getNextCheaper = (items: any[], currentItem: any) => {
      if (!currentItem || items.length === 0) return null;
      const idx = items.findIndex((i: any) => i === currentItem);
      return idx > 0 ? items[idx - 1] : null;
    };

    // --------------------------------------------------------
    // 5. Cost calculation helpers & Data Validation
    // --------------------------------------------------------
    if (!qualifiedHotels.length || !qualifiedRestaurants.length || !qualifiedActivities.length || !qualifiedTransport.length) {
      return NextResponse.json({
        error: 'Insufficient data for this destination to build a complete plan.'
      }, { status: 400 });
    }

    const calcAccommodation = (hotel: any) => hotel.price_per_night * Math.ceil(numTravellers / 2) * numDays;
    const calcFood = (restaurant: any) => restaurant.cost_per_meal * 3 * numTravellers * numDays;
    const calcActivity = (activity: any) => {
      if (Array.isArray(activity)) {
        return activity.reduce((sum, act) => sum + act.cost_per_person * numTravellers, 0);
      }
      return activity.cost_per_person * numTravellers;
    };
    const calcTransport = (transport: any) => transport.cost_per_person * numTravellers;

    const formatHotel = (hotel: any) => ({
      name: hotel.hotel_name,
      price: hotel.price_per_night,
      rating: hotel.rating,
      is_women_friendly: hotel.is_women_friendly
    });

    const formatRestaurant = (r: any) => ({
      restaurant_name: r.restaurant_name,
      cost_per_meal: r.cost_per_meal,
      rating: r.rating
    });

    const formatActivity = (a: any) => ({
      activity_name: a.activity_name,
      cost_per_person: a.cost_per_person
    });

    const formatTransport = (t: any) => ({
      transport_mode: t.transport_mode,
      cost_per_person: t.cost_per_person
    });

    // --------------------------------------------------------
    // 6. Build Priority-Based Plans and Upgrades
    // --------------------------------------------------------
    const withinBudget: any[] = [];
    const upgrades: any[] = [];

    // Base minimums
    const minH = getBudgetItem(qualifiedHotels);
    const minR = getBudgetItem(qualifiedRestaurants);
    const minA = getBudgetItem(qualifiedActivities);
    const minT = getBudgetItem(qualifiedTransport);

    const minHotelCost = calcAccommodation(minH);
    const minFoodCost = calcFood(minR);
    const minActCost = calcActivity(minA);
    const minTransCost = calcTransport(minT);

    // If absolute minimum exceeds limit, trip is not possible within budget.
    if (minHotelCost + minFoodCost + minActCost + minTransCost > tripSpendingLimit) {
      return NextResponse.json({
        destination, totalBudget: budget, tripSpendingLimit,
        travellers: numTravellers, days: numDays, isTripPossible: false, withinBudget: [], upgrades: [],
        alternatives: { hotel: allHotels || [], restaurant: allRestaurants || [], activity: allActivities || [], transport: allTransport || [] }
      }, { status: 200 });
    }

    const formatOption = (plan: any, name: string, tagline: string) => {
      const tripCost               = plan.tripCost;
      const remainingSpendableBudget = tripSpendingLimit - tripCost;
      return {
        name, tagline,
        accommodationCost: calcAccommodation(plan.h),
        foodCost:          calcFood(plan.r),
        activityCost:      calcActivity(plan.a),
        transportCost:     calcTransport(plan.t),
        tripCost,
        emergencyReserve,
        tripSpendingLimit,
        remainingSpendableBudget,
        // Legacy aliases — kept for swap-system and upgrade compatibility.
        // remainingBudget == remainingSpendableBudget (mathematically equal).
        totalAllocated: tripCost + emergencyReserve,
        remainingBudget: budget - (tripCost + emergencyReserve),
        selectedHotel:       formatHotel(plan.h),
        selectedRestaurant:  formatRestaurant(plan.r),
        selectedActivity:    plan.a.length > 0 ? formatActivity(plan.a[0]) : null,
        selectedActivities:  plan.a.map(formatActivity),
        selectedTransport:   formatTransport(plan.t),
      };
    };

    const isIdentical = (p1: any, p2: any) => {
      if (!p1 || !p2) return false;
      return p1.h?.hotel_name === p2.h?.hotel_name &&
             p1.r?.restaurant_name === p2.r?.restaurant_name &&
             p1.a?.activity_name === p2.a?.activity_name &&
             p1.t?.transport_mode === p2.t?.transport_mode;
    };


    const getNextBetter = (items: any[], currentItem: any, type: string) => {
        if (!currentItem || items.length === 0) return null;
        let betterItems = [];
        if (type === 'hotel' || type === 'rest') {
             betterItems = items.filter(i => i.rating > currentItem.rating); // Must be strictly higher rated
             // sort by price ascending so we pick the cheapest true upgrade
             betterItems.sort((a, b) => (type === 'hotel' ? calcAccommodation(a) - calcAccommodation(b) : calcFood(a) - calcFood(b)));
        } else {
             const baseCost = type === 'act' ? calcActivity(currentItem) : calcTransport(currentItem);
             betterItems = items.filter(i => (type === 'act' ? calcActivity(i) : calcTransport(i)) > baseCost);
             betterItems.sort((a, b) => (type === 'act' ? calcActivity(a) - calcActivity(b) : calcTransport(a) - calcTransport(b)));
        }
        return betterItems.length > 0 ? betterItems[0] : null;
    };

    // --- WITHIN-BUDGET PLANS ---

    const params = {
      qualifiedHotels, qualifiedRestaurants, qualifiedActivities, qualifiedTransport,
      tripSpendingLimit, minH, minR, minA, minT,
      minHotelCost, minFoodCost, minActCost, minTransCost,
      calcAccommodation, calcFood, calcActivity, calcTransport,
      getNextCheaper, getNextBetter, isIdentical, days: numDays
    };

    const { plans: basePlans, bestValuePlan } = buildBasePlans(params);
    basePlans.forEach(p => withinBudget.push(formatOption(p.plan, p.name, p.tagline)));

    // --- UPGRADE PLANS ---

    const formatUpgrade = (plan: any, name: string, tagline: string) => {
      const opt = formatOption(plan, name, tagline);
      const recommendedBudget = Math.ceil(plan.tripCost / 0.90);
      const extraNeeded = Math.max(0, recommendedBudget - budget);
      
      const upgradeHighlights: string[] = [];
      if (bestValuePlan && bestValuePlan.tripCost <= tripSpendingLimit) {
        if (plan.h.rating > bestValuePlan.h.rating) {
          upgradeHighlights.push(`Hotel rating improves from ${bestValuePlan.h.rating}★ to ${plan.h.rating}★`);
        }
        if (plan.r.rating > bestValuePlan.r.rating) {
          upgradeHighlights.push(`Dining rating improves from ${bestValuePlan.r.rating}★ to ${plan.r.rating}★`);
        }
        if (calcActivity(plan.a) > calcActivity(bestValuePlan.a)) {
          upgradeHighlights.push(`Higher-tier activity: ${plan.a.activity_name}`);
        }
        if (calcTransport(plan.t) > calcTransport(bestValuePlan.t)) {
          upgradeHighlights.push(`Transport upgraded to: ${plan.t.transport_mode}`);
        }
      }
      if (upgradeHighlights.length === 0) {
        upgradeHighlights.push("Overall improved quality");
      }

      return { ...opt, recommendedBudget, extraNeeded, upgradeHighlights };
    };

    const upgradePlans: any[] = []; // Disabled temporarily for multiple-activities
    upgradePlans.forEach(p => upgrades.push(formatUpgrade(p.plan, p.name, p.tagline)));

    // --------------------------------------------------------
    // 7. Return the final structured JSON response
    // --------------------------------------------------------
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
      // Raw Supabase data passed through for the Swap Modal
      alternatives: {
        hotel: allHotels || [],
        restaurant: allRestaurants || [],
        activity: allActivities || [],
        transport: allTransport || []
      }
    };

    return NextResponse.json(responseData, { status: 200 });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

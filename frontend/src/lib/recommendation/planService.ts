// Helpers for cost calculation
export const calcAccommodation = (hotel: any, numTravellers: number, numDays: number) => 
  hotel.price_per_night * Math.ceil(numTravellers / 2) * numDays;

export const calcFood = (restaurant: any, numTravellers: number, numDays: number) => 
  restaurant.cost_per_meal * 3 * numTravellers * numDays;

export const calcActivity = (activity: any, numTravellers: number) => {
  if (Array.isArray(activity)) {
    return activity.reduce((sum, act) => sum + act.cost_per_person * numTravellers, 0);
  }
  return activity.cost_per_person * numTravellers;
};

export const calcTransport = (transport: any, numTravellers: number) => 
  transport.cost_per_person * numTravellers;


// Helpers for formatting data
export const formatHotel = (hotel: any) => ({
  name: hotel.hotel_name,
  price: hotel.price_per_night,
  rating: hotel.rating,
  is_women_friendly: hotel.is_women_friendly,
  latitude: hotel.latitude,
  longitude: hotel.longitude
});

export const formatRestaurant = (r: any) => ({
  restaurant_name: r.restaurant_name,
  cost_per_meal: r.cost_per_meal,
  rating: r.rating
});

export const formatActivity = (a: any) => ({
  activity_name: a.activity_name,
  cost_per_person: a.cost_per_person,
  latitude: a.latitude,
  longitude: a.longitude
});

export const formatTransport = (t: any) => ({
  transport_mode: t.transport_mode,
  cost_per_person: t.cost_per_person
});

export const formatOption = (
  plan: any, 
  name: string, 
  tagline: string,
  tripSpendingLimit: number,
  emergencyReserve: number,
  budget: number,
  numTravellers: number,
  numDays: number
) => {
  const tripCost = plan.tripCost;
  const remainingSpendableBudget = tripSpendingLimit - tripCost;
  
  return {
    name, tagline,
    accommodationCost: calcAccommodation(plan.h, numTravellers, numDays),
    foodCost:          calcFood(plan.r, numTravellers, numDays),
    activityCost:      calcActivity(plan.a, numTravellers),
    transportCost:     calcTransport(plan.t, numTravellers),
    tripCost,
    emergencyReserve,
    tripSpendingLimit,
    remainingSpendableBudget,
    totalAllocated: tripCost + emergencyReserve,
    remainingBudget: budget - (tripCost + emergencyReserve),
    selectedHotel:       formatHotel(plan.h),
    selectedRestaurant:  formatRestaurant(plan.r),
    selectedActivity:    plan.a.length > 0 ? formatActivity(plan.a[0]) : null,
    selectedActivities:  plan.a.map(formatActivity),
    selectedTransport:   formatTransport(plan.t),
  };
};

export const formatUpgrade = (
  plan: any, 
  name: string, 
  tagline: string,
  bestValuePlan: any,
  budget: number,
  tripSpendingLimit: number,
  emergencyReserve: number,
  numTravellers: number,
  numDays: number
) => {
  const opt = formatOption(plan, name, tagline, tripSpendingLimit, emergencyReserve, budget, numTravellers, numDays);
  const recommendedBudget = Math.ceil(plan.tripCost / 0.90);
  const recommendedEmergencyReserve = recommendedBudget * 0.10;
  const recommendedTripSpendingLimit = recommendedBudget - recommendedEmergencyReserve;
  const extraNeeded = Math.max(0, recommendedBudget - budget);
  
  const changedCategories: string[] = [];
  const upgradeHighlights: string[] = [];

  if (bestValuePlan && bestValuePlan.tripCost <= tripSpendingLimit) {
    const oldHRatingNum = Number((bestValuePlan.h.rating || 3.5).toFixed(1));
    const newHRatingNum = Number((plan.h.rating || 3.5).toFixed(1));
    if (newHRatingNum > oldHRatingNum) {
      changedCategories.push('Hotel');
      upgradeHighlights.push(`Hotel rating improves from ${oldHRatingNum.toFixed(1)}★ to ${newHRatingNum.toFixed(1)}★`);
    }
    
    if (plan.h.comfort_level > bestValuePlan.h.comfort_level) {
      if (!changedCategories.includes('Hotel')) changedCategories.push('Hotel');
      upgradeHighlights.push(`Hotel comfort improves from level ${bestValuePlan.h.comfort_level} to level ${plan.h.comfort_level}`);
    }
    
    const oldRRatingNum = Number((bestValuePlan.r.rating || 3.5).toFixed(1));
    const newRRatingNum = Number((plan.r.rating || 3.5).toFixed(1));
    if (newRRatingNum > oldRRatingNum) {
      changedCategories.push('Restaurant');
      upgradeHighlights.push(`Dining rating improves from ${oldRRatingNum.toFixed(1)}★ to ${newRRatingNum.toFixed(1)}★`);
    }
    
    const oldActRatingRaw = bestValuePlan.a.length ? (bestValuePlan.a.reduce((s: number, a: any) => s + (a.rating || 0), 0) / bestValuePlan.a.length) : 0;
    const newActRatingRaw = plan.a.length ? (plan.a.reduce((s: number, a: any) => s + (a.rating || 0), 0) / plan.a.length) : 0;
    const oldActRatingNum = Number(oldActRatingRaw.toFixed(1));
    const newActRatingNum = Number(newActRatingRaw.toFixed(1));
    
    if (newActRatingNum >= oldActRatingNum + 0.1) {
      changedCategories.push('Activity');
      upgradeHighlights.push(`Activity average rating improves from ${oldActRatingNum.toFixed(1)}★ to ${newActRatingNum.toFixed(1)}★`);
    }
    
    if (plan.t.comfort_level > bestValuePlan.t.comfort_level) {
      changedCategories.push('Transport');
      upgradeHighlights.push(`Transport comfort improves from level ${bestValuePlan.t.comfort_level} to level ${plan.t.comfort_level}`);
    }
  }

  return { 
    ...opt, 
    recommendedBudget, 
    recommendedEmergencyReserve, 
    recommendedTripSpendingLimit, 
    extraNeeded, 
    changedCategories,
    upgradeHighlights 
  };
};

export const getBudgetItem = (items: any[]) => items.length > 0 ? items[0] : null;

export const getNextCheaper = (items: any[], currentItem: any) => {
  if (!currentItem || items.length === 0) return null;
  const idx = items.findIndex((i: any) => i === currentItem);
  return idx > 0 ? items[idx - 1] : null;
};

export const getNextBetter = (items: any[], currentItem: any, type: string, numTravellers: number, numDays: number) => {
    if (!currentItem || items.length === 0) return null;
    let betterItems = [];
    if (type === 'hotel' || type === 'rest') {
         betterItems = items.filter(i => i.rating > currentItem.rating);
         betterItems.sort((a, b) => (type === 'hotel' 
            ? calcAccommodation(a, numTravellers, numDays) - calcAccommodation(b, numTravellers, numDays) 
            : calcFood(a, numTravellers, numDays) - calcFood(b, numTravellers, numDays)));
    } else {
         const baseCost = type === 'act' ? calcActivity(currentItem, numTravellers) : calcTransport(currentItem, numTravellers);
         betterItems = items.filter(i => (type === 'act' ? calcActivity(i, numTravellers) : calcTransport(i, numTravellers)) > baseCost);
         betterItems.sort((a, b) => (type === 'act' 
            ? calcActivity(a, numTravellers) - calcActivity(b, numTravellers) 
            : calcTransport(a, numTravellers) - calcTransport(b, numTravellers)));
    }
    return betterItems.length > 0 ? betterItems[0] : null;
};

export const isIdentical = (p1: any, p2: any) => {
  if (!p1 || !p2) return false;
  return p1.h?.hotel_name === p2.h?.hotel_name &&
         p1.r?.restaurant_name === p2.r?.restaurant_name &&
         p1.a?.activity_name === p2.a?.activity_name &&
         p1.t?.transport_mode === p2.t?.transport_mode;
};

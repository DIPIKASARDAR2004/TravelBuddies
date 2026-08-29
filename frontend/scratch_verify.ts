import { buildBasePlans } from './src/lib/recommendation/basePlanner';
import { buildUpgradePlans } from './src/lib/recommendation/upgradePlanner';
import { supabase } from './src/lib/supabaseClient';

async function testUpgrade(budget: number) {
  console.log(`\n========================================================================`);
  console.log(`TESTING UPGRADES FOR DARJEELING WITH BUDGET ₹${budget}`);
  console.log(`========================================================================\n`);
  
  const destination = 'Darjeeling';
  const numTravellers = 2;
  const numDays = 2;
  
  const emergencyReserve = budget * 0.10;
  const tripSpendingLimit = budget - emergencyReserve;
  
  // Fetch mock data
  const { data: allHotels } = await supabase.from('Hotels').select('*').ilike('destination', `%${destination}%`);
  const { data: allRestaurants } = await supabase.from('restaurants').select('*').ilike('destination', `%${destination}%`);
  const { data: allActivities } = await supabase.from('activities').select('*').ilike('destination', `%${destination}%`);
  const { data: allTransport } = await supabase.from('transport').select('*').ilike('destination', `%${destination}%`);

  const qualifiedHotels = (allHotels || []).filter((h: any) => h.rating >= 3.5).sort((a: any, b: any) => a.price_per_night - b.price_per_night);
  const qualifiedRestaurants = (allRestaurants || []).filter((r: any) => r.rating >= 3.5).sort((a: any, b: any) => a.cost_per_meal - b.cost_per_meal);
  const qualifiedActivities = (allActivities || []).sort((a: any, b: any) => a.cost_per_person - b.cost_per_person);
  const qualifiedTransport = (allTransport || []).sort((a: any, b: any) => a.cost_per_person - b.cost_per_person);

  const getBudgetItem = (items: any[]) => items.length > 0 ? items[0] : null;
  const minH = getBudgetItem(qualifiedHotels);
  const minR = getBudgetItem(qualifiedRestaurants);
  const minA = getBudgetItem(qualifiedActivities);
  const minT = getBudgetItem(qualifiedTransport);

  const calcAccommodation = (hotel: any) => hotel.price_per_night * Math.ceil(numTravellers / 2) * numDays;
  const calcFood = (restaurant: any) => restaurant.cost_per_meal * 3 * numTravellers * numDays;
  const calcActivity = (activity: any) => {
      if (Array.isArray(activity)) {
        return activity.reduce((sum, act) => sum + act.cost_per_person * numTravellers, 0);
      }
      return activity.cost_per_person * numTravellers;
  };
  const calcTransport = (transport: any) => transport.cost_per_person * numTravellers;

  const minHotelCost = calcAccommodation(minH);
  const minFoodCost = calcFood(minR);
  const minActCost = calcActivity(minA);
  const minTransCost = calcTransport(minT);

  const isIdentical = (p1: any, p2: any) => {
      if (!p1 || !p2) return false;
      return p1.h?.hotel_name === p2.h?.hotel_name &&
             p1.r?.restaurant_name === p2.r?.restaurant_name &&
             p1.t?.transport_mode === p2.t?.transport_mode &&
             p1.a?.length === p2.a?.length &&
             p1.a?.every((act: any, i: number) => act.activity_name === p2.a[i].activity_name);
  };
  
  const getNextCheaper = () => null; 
  const getNextBetter = () => null; 

  const params = {
      qualifiedHotels, qualifiedRestaurants, qualifiedActivities, qualifiedTransport,
      tripSpendingLimit, minH, minR, minA, minT,
      minHotelCost, minFoodCost, minActCost, minTransCost,
      calcAccommodation, calcFood, calcActivity, calcTransport,
      getNextCheaper, getNextBetter, isIdentical, days: numDays
  };

  const { bestValuePlan } = buildBasePlans(params);

  if (!bestValuePlan) {
      console.log("No Best Value plan found.");
      return;
  }
  
  console.log(`[Best Value Plan] Cost: ₹${bestValuePlan.tripCost}`);

  const upgradePlans = buildUpgradePlans(params, bestValuePlan, budget);

  upgradePlans.forEach((upgrade: any) => {
      const plan = upgrade.plan;
      const recommendedBudget = Math.ceil(plan.tripCost / 0.90);
      const recommendedEmergencyReserve = recommendedBudget * 0.10;
      const recommendedTripSpendingLimit = recommendedBudget - recommendedEmergencyReserve;
      const extraNeeded = recommendedBudget - budget;

      let pctRange = "";
      if (upgrade.name === "Slight Upgrade") pctRange = "0-5%";
      if (upgrade.name === "Comfortable Upgrade") pctRange = "5-25%";
      if (upgrade.name === "Premium Upgrade") pctRange = "25-50%";

      const changedCategories: string[] = [];
      const upgradeHighlights: string[] = [];
      const b = bestValuePlan;
      const p = plan;

      const oldHRatingNum = Number((b.h.rating || 3.5).toFixed(1));
      const newHRatingNum = Number((p.h.rating || 3.5).toFixed(1));
      if (newHRatingNum > oldHRatingNum) {
        changedCategories.push('Hotel');
        upgradeHighlights.push(`Hotel rating improves from ${oldHRatingNum.toFixed(1)}★ to ${newHRatingNum.toFixed(1)}★`);
      }
      if (p.h.comfort_level > b.h.comfort_level) {
        if (!changedCategories.includes('Hotel')) changedCategories.push('Hotel');
        upgradeHighlights.push(`Hotel comfort improves from level ${b.h.comfort_level} to level ${p.h.comfort_level}`);
      }

      const oldRRatingNum = Number((b.r.rating || 3.5).toFixed(1));
      const newRRatingNum = Number((p.r.rating || 3.5).toFixed(1));
      if (newRRatingNum > oldRRatingNum) {
        changedCategories.push('Restaurant');
        upgradeHighlights.push(`Dining rating improves from ${oldRRatingNum.toFixed(1)}★ to ${newRRatingNum.toFixed(1)}★`);
      }

      const oldActRatingRaw = b.a.length ? (b.a.reduce((s: number, a: any) => s + (a.rating || 0), 0) / b.a.length) : 0;
      const newActRatingRaw = p.a.length ? (p.a.reduce((s: number, a: any) => s + (a.rating || 0), 0) / p.a.length) : 0;
      const oldActRatingNum = Number(oldActRatingRaw.toFixed(1));
      const newActRatingNum = Number(newActRatingRaw.toFixed(1));
      
      if (newActRatingNum >= oldActRatingNum + 0.1) {
        changedCategories.push('Activity');
        upgradeHighlights.push(`Activity average rating improves from ${oldActRatingNum.toFixed(1)}★ to ${newActRatingNum.toFixed(1)}★`);
      }

      if (p.t.comfort_level > b.t.comfort_level) {
        changedCategories.push('Transport');
        upgradeHighlights.push(`Transport comfort improves from level ${b.t.comfort_level} to level ${p.t.comfort_level}`);
      }

      console.log(`\n--- ${upgrade.name} ---`);
      console.log(`Applicable percentage range: ${pctRange}`);
      console.log(`Upgrade Trip Cost: ₹${plan.tripCost}`);
      console.log(`Recommended Budget: ₹${recommendedBudget}`);
      console.log(`Extra Needed: ₹${extraNeeded}`);
      console.log(`Changed Categories: ${changedCategories.join(', ') || 'None'}`);
      console.log(`Highlights:`);
      upgradeHighlights.forEach(h => console.log(`  - ${h}`));
      
      if (p.h !== b.h) {
          console.log(`  Hotel values: ${b.h.hotel_name} -> ${p.h.hotel_name} (Cost: ${calcAccommodation(b.h)} -> ${calcAccommodation(p.h)}, Rating: ${b.h.rating} -> ${p.h.rating})`);
      }
      if (p.r !== b.r) {
          console.log(`  Restaurant values: ${b.r.restaurant_name} -> ${p.r.restaurant_name} (Cost: ${calcFood(b.r)} -> ${calcFood(p.r)}, Rating: ${b.r.rating} -> ${p.r.rating})`);
      }

  });
}

async function run() {
  await testUpgrade(15000);
  await testUpgrade(25000);
  console.log("\nDone!");
}

run();

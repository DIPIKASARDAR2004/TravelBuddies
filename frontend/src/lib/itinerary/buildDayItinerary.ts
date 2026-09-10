import { ActivityOption, ItineraryDay, PlannerExtraItem, PlannerPackage } from "@/types";

export function buildDayItinerary(plan: PlannerPackage | null | undefined, days: number): ItineraryDay[] {
  const result: ItineraryDay[] = [];
  for (let i = 1; i <= days; i++) {
    result.push({ dayNumber: i, activities: [] });
  }

  if (!plan || !days) return result;

  let activitiesToSchedule: ActivityOption[] = [];
  
  if (plan.selectedActivities && Array.isArray(plan.selectedActivities) && plan.selectedActivities.length > 0) {
    activitiesToSchedule = [...plan.selectedActivities];
  } else if (plan.selectedActivity) {
    activitiesToSchedule = [plan.selectedActivity];
  }

  if (plan.extraItems && Array.isArray(plan.extraItems)) {
    const customActivities = plan.extraItems
      .filter((item: PlannerExtraItem) => item.type === 'activity')
      .map((item: PlannerExtraItem) => item.rawItem as ActivityOption);
    
    if (customActivities.length > 0) {
      activitiesToSchedule = [...activitiesToSchedule, ...customActivities];
    }
  }

  const uniqueActivities: ActivityOption[] = [];
  const seen = new Set();
  
  for (const act of activitiesToSchedule) {
    // Attempt to deduplicate using id or name if available
    const key = act.id || act.activity_name;
    if (key && !seen.has(key)) {
      seen.add(key);
      uniqueActivities.push(act);
    } else if (!key) {
      // If there's no identifier, just include it to be safe
      uniqueActivities.push(act);
    }
  }

  const maxCapacity = days * 2;
  if (uniqueActivities.length > maxCapacity) {
    console.warn(`[Itinerary Builder] Warning: More activities (${uniqueActivities.length}) than capacity (${maxCapacity}). Truncating to safely fit.`);
  }

  const activitiesToUse = uniqueActivities.slice(0, maxCapacity);
  
  let currentActIdx = 0;
  let actsRemaining = activitiesToUse.length;
  let daysRemaining = days;
  
  for (let i = 0; i < days; i++) {
    if (actsRemaining <= 0) break;
    
    // Distribute remaining activities across remaining days
    let countForDay = Math.ceil(actsRemaining / daysRemaining);
    if (countForDay > 2) countForDay = 2; // enforce max 2 per day constraint
    
    for (let j = 0; j < countForDay; j++) {
      if (currentActIdx < activitiesToUse.length) {
        result[i].activities.push(activitiesToUse[currentActIdx]);
        currentActIdx++;
        actsRemaining--;
      }
    }
    daysRemaining--;
  }

  return result;
}

import {
  ActivityOption,
  ItineraryDay,
  PlannerExtraItem,
  PlannerPackage,
} from "@/types";

// Existing prototype rule, still IN REVIEW; not proof of schedule feasibility.
export const DRAFT_ACTIVITIES_PER_DAY = 2;

export function getItineraryActivities(
  plan: PlannerPackage | null | undefined,
): ActivityOption[] {
  if (!plan) return [];

  let activitiesToSchedule: ActivityOption[] = [];

  if (
    plan.selectedActivities &&
    Array.isArray(plan.selectedActivities) &&
    plan.selectedActivities.length > 0
  ) {
    activitiesToSchedule = [...plan.selectedActivities];
  } else if (plan.selectedActivity) {
    activitiesToSchedule = [plan.selectedActivity];
  }

  if (plan.extraItems && Array.isArray(plan.extraItems)) {
    const customActivities = plan.extraItems
      .filter((item: PlannerExtraItem) => item.type === "activity")
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

  return uniqueActivities;
}

export function buildDayItinerary(
  plan: PlannerPackage | null | undefined,
  days: number,
): ItineraryDay[] {
  const result: ItineraryDay[] = [];
  if (!Number.isInteger(days) || days < 1 || days > 365) return result;
  for (let i = 1; i <= days; i++) {
    result.push({ dayNumber: i, activities: [] });
  }
  if (!plan) return result;

  const activitiesToUse = getItineraryActivities(plan).slice(
    0,
    days * DRAFT_ACTIVITIES_PER_DAY,
  );

  let currentActIdx = 0;
  let actsRemaining = activitiesToUse.length;
  let daysRemaining = days;

  for (let i = 0; i < days; i++) {
    if (actsRemaining <= 0) break;

    // Distribute remaining activities across remaining days
    let countForDay = Math.ceil(actsRemaining / daysRemaining);
    if (countForDay > DRAFT_ACTIVITIES_PER_DAY)
      countForDay = DRAFT_ACTIVITIES_PER_DAY;

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

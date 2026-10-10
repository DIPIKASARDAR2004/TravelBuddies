import type { PlannerCatalog } from "@/lib/planner/catalog";
import type { PlanRequest } from "@/lib/planner/planRequest";

// Synthetic contract fixtures, not approved recommendation/Golden Test outcomes.
export const planInput: PlanRequest = {
  destination: "Fixture town",
  totalBudget: 15000,
  travellers: 2,
  days: 2,
  womenOnly: false,
};
export const catalog: PlannerCatalog = {
  hotels: [
    {
      hotel_name: "Fixture stay",
      destination: "Fixture town",
      price_per_night: 2000,
      rating: 4.2,
      is_women_friendly: true,
    },
  ],
  restaurants: [
    { restaurant_name: "Fixture dining", cost_per_meal: 200, rating: 4.1 },
  ],
  activities: [{ activity_name: "Fixture walk", cost_per_person: 100 }],
  transport: [{ transport_mode: "Fixture bus", cost_per_person: 200 }],
};

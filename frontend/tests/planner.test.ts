import { expect, it } from "vitest";
import type { PlannerPackage } from "@/types";
import {
  recalculatePlannerTotals,
  updateEmergencyReserve,
  applyAlternativeSelection,
  removeExtraItem,
} from "@/lib/planner/planUtils";
import {
  getCheckoutTimeline,
  isBookingClosed,
  formatBookingAmount,
} from "@/lib/checkout/bookingStatus";
const plan: PlannerPackage = {
  name: "Test",
  accommodationCost: 100.1,
  foodCost: 20.2,
  activityCost: 10,
  transportCost: 30,
  tripCost: 0,
  emergencyReserve: 20,
  tripSpendingLimit: 180,
  remainingBudget: 0,
  totalAllocated: 0,
  selectedHotel: null,
  selectedRestaurant: null,
  selectedActivity: null,
  selectedActivities: [],
  selectedTransport: null,
};
it("rounds money and recalculates reserve without mutating the source", () => {
  const result = recalculatePlannerTotals(plan, 200);
  expect(result.tripCost).toBe(160.3);
  expect(result.totalAllocated).toBe(180.3);
  expect(result.remainingBudget).toBe(19.7);
  expect(updateEmergencyReserve(plan, 25, 200).tripSpendingLimit).toBe(175);
  expect(plan.tripCost).toBe(0);
});
it("rejects extras above budget and removes extras without changing the original", () => {
  const result = applyAlternativeSelection({
    currentPlan: plan,
    itemType: "activity",
    mode: "add",
    item: { activity_name: "Tour", cost_per_person: 100 },
    tripDetails: { budget: 200, days: 1, travellers: 2, destination: "Test" },
  });
  expect(result.plan).toBeNull();
  expect(result.error).toContain("exceeds your budget");
  const withExtra = {
    ...plan,
    extraItems: [
      {
        type: "activity" as const,
        name: "Tour",
        price: 10,
        rawItem: { activity_name: "Tour", cost_per_person: 10 },
      },
    ],
  };
  expect(removeExtraItem(withExtra, 0, 200).extraItems).toEqual([]);
  expect(withExtra.extraItems).toHaveLength(1);
});
it("maps failed, protected, and terminal booking stages", () => {
  expect(getCheckoutTimeline("PAYMENT_FAILED")[0].state).toBe("attention");
  expect(getCheckoutTimeline("PROTECTED")[1].state).toBe("active");
  expect(getCheckoutTimeline("REFUNDED")[2].state).toBe("active");
  expect(isBookingClosed("DISPUTED")).toBe(true);
  expect(isBookingClosed("PROTECTED")).toBe(false);
  expect(formatBookingAmount(125000)).toContain("1,250");
});

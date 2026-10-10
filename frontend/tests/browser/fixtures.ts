import { test as base, expect, type Route, type Page } from "@playwright/test";
import type { PlannerApiResponse, ProtectedBooking } from "../../src/types";

export const bookingId = "12345678-1234-4234-8234-123456789abc";
export const stay = {
  id: bookingId,
  stay_name: "Fixture stay",
  address: "Test address",
  check_in: "2026-10-12T09:00:34.123Z",
  check_out: "2026-10-14T09:00:00.000Z",
  status: "active",
  created_at: "2026-10-10T00:00:00+00:00",
  updated_at: "2026-10-10T00:00:00+00:00",
};

// Synthetic UI fixtures only: not real businesses, approved rankings or prices.
export const plannerResult: PlannerApiResponse = {
  destination: "Fixture town",
  totalBudget: 15000,
  tripSpendingLimit: 13500,
  travellers: 2,
  days: 2,
  isTripPossible: true,
  withinBudget: [
    {
      name: "Best Value",
      tagline: "Fixture package",
      accommodationCost: 4000,
      foodCost: 2400,
      activityCost: 200,
      transportCost: 400,
      tripCost: 7000,
      emergencyReserve: 1500,
      tripSpendingLimit: 13500,
      remainingSpendableBudget: 6500,
      remainingBudget: 6500,
      totalAllocated: 8500,
      selectedHotel: { name: "Fixture stay", price: 2000, rating: 4.2 },
      selectedRestaurant: {
        restaurant_name: "Fixture dining",
        cost_per_meal: 200,
        rating: 4.1,
      },
      selectedActivity: { activity_name: "Fixture walk", cost_per_person: 100 },
      selectedActivities: [
        { activity_name: "Fixture walk", cost_per_person: 100 },
      ],
      selectedTransport: {
        transport_mode: "Fixture local bus",
        cost_per_person: 200,
      },
    },
  ],
  upgrades: [],
  alternatives: { hotel: [], restaurant: [], activity: [], transport: [] },
};

export const booking: ProtectedBooking = {
  id: bookingId,
  destination: "Fixture town",
  travellers: 2,
  nights: 2,
  rooms: 1,
  amount_paise: 400000,
  currency: "INR",
  status: "PAYMENT_PENDING",
  check_in_date: "2026-10-12",
  check_out_date: "2026-10-14",
  razorpay_order_id: "order_fixture",
  hotel_snapshot: { name: "Fixture stay", location: "Fixture town" },
};

export const json = (route: Route, body: unknown, status = 200) =>
  route.fulfill({ status, json: body });

export async function enterFixtureTrip(page: Page) {
  await page.getByLabel("Destination", { exact: true }).fill("Fixture town");
  await page.getByLabel("Total budget", { exact: true }).fill("15000");
  await page.locator("#start-date").fill("2026-10-12");
  await page.locator("#end-date").fill("2026-10-14");
}

export const test = base.extend<{ isolatedNetwork: void }>({
  isolatedNetwork: [
    async ({ page }, use) => {
      const unexpected: string[] = [];
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.routeWebSocket("**/*", (socket) => socket.close());
      await page.route("**/*", async (route) => {
        const url = new URL(route.request().url());
        if (url.origin !== "http://127.0.0.1:4182") return route.abort();
        if (!url.pathname.startsWith("/api/")) return route.continue();
        if (route.request().method() === "GET") {
          const initial: Record<string, unknown> = {
            "/api/safe-stays": { stays: [] },
            "/api/trusted-contacts": { contacts: [] },
            "/api/emergency-alerts": { alerts: [] },
            "/api/location-sharing": { locationShare: null },
          };
          if (url.pathname in initial)
            return json(route, initial[url.pathname]);
        }
        unexpected.push(`${route.request().method()} ${url.pathname}`);
        return json(route, { error: "Unmocked test request" }, 500);
      });
      await use();
      expect(unexpected, "Every API request must be explicitly mocked").toEqual(
        [],
      );
      expect(errors, "No uncaught browser errors").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

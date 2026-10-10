import type { Page, Route } from "@playwright/test";
import {
  test,
  expect,
  json,
  plannerResult,
  enterFixtureTrip,
} from "./fixtures";
import { installMapsDouble } from "./mapsFixture";

async function selectMappablePlan(
  page: Page,
  options: {
    safety?: boolean;
    missingStay?: boolean;
    missingActivity?: boolean;
    activityCount?: number;
  } = {},
) {
  const result = structuredClone(plannerResult);
  const plan = result.withinBudget[0];
  Object.assign(plan.selectedHotel!, {
    latitude: options.missingStay ? null : 27,
    longitude: 88,
  });
  Object.assign(plan.selectedActivities[0], {
    latitude: options.missingActivity ? null : 27.1,
    longitude: 88.1,
  });
  plan.selectedActivity = plan.selectedActivities[0];
  for (let index = 1; index < (options.activityCount ?? 1); index++) {
    plan.selectedActivities.push({
      activity_name: `Additional fixture ${index}`,
      cost_per_person: 0,
      latitude: 27.1 + index / 100,
      longitude: 88.1,
    });
  }
  await page.route("**/api/plan", (route) => json(route, result));
  await page.goto(options.safety ? "/safety" : "/plan");
  await enterFixtureTrip(page);
  await page.getByRole("button", { name: "See curated packages" }).click();
  await page.getByRole("button", { name: "Select and customize" }).click();
  await page
    .getByRole("button", { name: "Preview itinerary on the map" })
    .click();
}

test("direct map entry has a usable planner link without a selected trip", async ({
  page,
}) => {
  await page.goto("/map");
  await expect(
    page.getByText("No plan selected", { exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Back to Trip Planner" }).click();
  await expect(page).toHaveURL("/plan");
  await expect(
    page.getByRole("button", { name: "See curated packages" }),
  ).toBeVisible();
});

test("route calculations remain stable across UI renders and drawings clean up on return", async ({
  page,
}) => {
  await installMapsDouble(page);
  await selectMappablePlan(page);
  await expect(
    page.getByText("Driving estimates for routed days"),
  ).toBeVisible();
  await expect(
    page.getByText("2.0 km • 20 min", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Fixture walk", { exact: true })).toBeVisible();
  const day = page.getByRole("button", { name: "Day 1: exploration day" });
  await day.click();
  await expect(day).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByText("Fixture walk", { exact: true })).toBeHidden();
  await day.click();
  await page.getByRole("button", { name: "Explore nearby routes" }).click();
  await expect(
    page.getByRole("heading", { name: "Try a different trip lens" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Quick route/ }).click();
  await expect(
    page.getByRole("button", { name: /Quick route/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect
    .poll(() => page.evaluate(() => window.__mapTest.requests.length))
    .toBe(1);
  expect(await page.evaluate(() => window.__mapTest.polylinesCreated)).toBe(1);
  await page.getByRole("link", { name: "Back to Trip Planner" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Customize the plan without losing budget clarity",
    }),
  ).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => window.__mapTest.polylinesDetached))
    .toBe(1);
  await page
    .getByRole("button", { name: "Preview itinerary on the map" })
    .click();
  await expect(
    page.getByText("Driving estimates for routed days"),
  ).toBeVisible();
  expect(await page.evaluate(() => window.__mapTest.requests.length)).toBe(2);
});

for (const missing of ["stay", "activity"] as const) {
  test(`missing ${missing} coordinates leave the day visible and untimed`, async ({
    page,
  }) => {
    await installMapsDouble(page);
    await selectMappablePlan(page, {
      missingStay: missing === "stay",
      missingActivity: missing === "activity",
    });
    await expect(
      page.getByText("Travel estimates unavailable", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Fixture walk", { exact: true })).toBeVisible();
    await expect(page.getByText(/no valid coordinates/).first()).toBeVisible();
    expect(await page.evaluate(() => window.__mapTest.requests.length)).toBe(0);
    await expect(
      page.getByText("Driving estimates for routed days"),
    ).toHaveCount(0);
  });
}

test("a blocked map SDK leaves the selected itinerary available", async ({
  page,
}) => {
  await selectMappablePlan(page);
  await expect(page.getByText(/The map could not load/).first()).toBeVisible({
    timeout: 15000,
  });
  await expect(page.getByText("Fixture walk", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Travel estimates unavailable", { exact: true }),
  ).toBeVisible();
});

test("a stalled map SDK stops loading after ten seconds", async ({ page }) => {
  await page.clock.install();
  let pending: Route | undefined;
  await page.route("https://maps.googleapis.com/**", (route) => {
    pending = route;
  });
  await selectMappablePlan(page);
  await expect.poll(() => Boolean(pending)).toBe(true);
  await page.clock.fastForward(10001);
  await expect(
    page.getByText(/The map took too long to load/).first(),
  ).toBeVisible();
  await expect(page.getByText("Fixture walk", { exact: true })).toBeVisible();
  await pending?.abort();
});

test("route timeout ignores late provider responses", async ({ page }) => {
  await page.clock.install();
  await installMapsDouble(page, "pending");
  await selectMappablePlan(page);
  await expect
    .poll(() => page.evaluate(() => window.__mapTest.requests.length))
    .toBe(1);
  await page.clock.fastForward(15001);
  await expect(
    page.getByText(/The driving-route request timed out/),
  ).toBeVisible();
  await page.evaluate(() => window.__mapTest.resolvePending());
  await page.getByRole("button", { name: "Explore nearby routes" }).click();
  expect(await page.evaluate(() => window.__mapTest.polylinesCreated)).toBe(0);
  await expect(page.getByText("Driving estimates for routed days")).toHaveCount(
    0,
  );
});

test("leaving a pending map preserves safety-planner context on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await installMapsDouble(page, "pending");
  await selectMappablePlan(page, { safety: true });
  await expect
    .poll(() => page.evaluate(() => window.__mapTest.requests.length))
    .toBe(1);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(375);
  await page.getByRole("link", { name: "Back to Trip Planner" }).click();
  await expect(page).toHaveURL("/safety");
  await page.evaluate(() => window.__mapTest.resolvePending());
  await expect(
    page.getByRole("heading", {
      name: "Customize the plan without losing budget clarity",
    }),
  ).toBeVisible();
  expect(await page.evaluate(() => window.__mapTest.polylinesCreated)).toBe(0);
  expect(
    await page.evaluate(
      () =>
        JSON.parse(sessionStorage.getItem("plan-storage")!).state.tripDetails
          .isSafetyTrip,
    ),
  ).toBe(true);
});

test("incomplete provider legs are not displayed as zero-minute driving", async ({
  page,
}) => {
  await installMapsDouble(page, "malformed");
  await selectMappablePlan(page);
  await expect(
    page.getByText("Travel estimates unavailable", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Fixture walk", { exact: true })).toBeVisible();
  await expect(page.getByText("Driving estimates for routed days")).toHaveCount(
    0,
  );
});

test("activities beyond the draft cap stay in the plan and are visibly identified", async ({
  page,
}) => {
  await installMapsDouble(page);
  await selectMappablePlan(page, { activityCount: 5 });
  await expect(
    page.getByText("Activities outside this draft preview", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(/not scheduled or routed here: Additional fixture 4/),
  ).toBeVisible();
  await expect(
    page.getByText("Driving estimates for routed days"),
  ).toBeVisible();
  const requests = await page.evaluate(() => window.__mapTest.requests);
  expect(requests).toHaveLength(2);
  expect(requests.map((request) => request.intermediates.length)).toEqual([
    2, 2,
  ]);
  const selected = await page.evaluate(
    () =>
      JSON.parse(sessionStorage.getItem("plan-storage")!).state.customizedPlan,
  );
  expect(selected.selectedActivities).toHaveLength(5);
  expect(selected.tripCost).toBe(7000);
});

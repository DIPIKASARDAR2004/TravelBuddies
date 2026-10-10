import type { Route } from "@playwright/test";
import {
  test,
  expect,
  json,
  plannerResult,
  enterFixtureTrip,
} from "./fixtures";

test("malformed or mismatched plans leave the form recoverable", async ({
  page,
}) => {
  let calls = 0;
  await page.route("**/api/plan", (route) => {
    calls++;
    return json(
      route,
      calls === 1
        ? { ...plannerResult, withinBudget: [{}] }
        : calls === 2
          ? { ...plannerResult, days: 3 }
          : plannerResult,
    );
  });
  await page.goto("/plan");
  await enterFixtureTrip(page);
  const submit = page.getByRole("button", { name: "See curated packages" });
  for (let attempt = 0; attempt < 2; attempt++) {
    await submit.click();
    await expect(
      page
        .getByText("The server returned invalid trip plans. Please try again.")
        .first(),
    ).toBeVisible();
    await expect(submit).toBeEnabled();
    await expect(page.getByLabel("Destination", { exact: true })).toHaveValue(
      "Fixture town",
    );
    await expect(
      page.getByRole("button", { name: "Select and customize" }),
    ).toHaveCount(0);
  }
  await submit.click();
  await expect(
    page.getByRole("button", { name: "Select and customize" }),
  ).toBeVisible();
});

for (const saved of [
  "{",
  JSON.stringify({
    state: {
      view: "CUSTOMIZE",
      tripDetails: {},
      customizedPlan: { selectedActivities: "bad" },
    },
    version: 0,
  }),
]) {
  test(`invalid session data resets to a usable form (${saved === "{" ? "JSON" : "shape"})`, async ({
    page,
  }) => {
    await page.addInitScript(
      (value) => sessionStorage.setItem("plan-storage", value),
      saved,
    );
    await page.route("**/api/plan", (route) => json(route, plannerResult));
    await page.goto("/plan");
    await enterFixtureTrip(page);
    await page.getByRole("button", { name: "See curated packages" }).click();
    await expect(
      page.getByRole("button", { name: "Select and customize" }),
    ).toBeVisible();
  });
}

test("disabled session storage still allows planning in memory", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(window, "sessionStorage", {
      configurable: true,
      get() {
        throw new DOMException("Storage denied", "SecurityError");
      },
    }),
  );
  await page.route("**/api/plan", (route) => json(route, plannerResult));
  await page.goto("/plan");
  await enterFixtureTrip(page);
  await page.getByRole("button", { name: "See curated packages" }).click();
  await page.getByRole("button", { name: "Select and customize" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Customize the plan without losing budget clarity",
    }),
  ).toBeVisible();
});

test("a stalled search times out and can be retried", async ({ page }) => {
  await page.clock.install();
  let pending: Route | undefined;
  let calls = 0;
  await page.route("**/api/plan", (route) => {
    calls++;
    if (calls === 1) {
      pending = route;
      return;
    }
    return json(route, plannerResult);
  });
  await page.goto("/plan");
  await enterFixtureTrip(page);
  await page.getByRole("button", { name: "See curated packages" }).click();
  await expect.poll(() => calls).toBe(1);
  await page.clock.fastForward(15001);
  await expect(
    page.getByRole("button", { name: "See curated packages" }),
  ).toBeEnabled();
  await expect(page.getByLabel("Destination", { exact: true })).toHaveValue(
    "Fixture town",
  );
  await pending?.abort();
  await page.getByRole("button", { name: "See curated packages" }).click();
  await expect(
    page.getByRole("button", { name: "Select and customize" }),
  ).toBeVisible();
});

test("leaving a pending search cancels it before switching planner modes", async ({
  page,
}) => {
  let pending: Route | undefined;
  await page.route("**/api/plan", (route) => {
    pending = route;
  });
  await page.goto("/plan");
  await enterFixtureTrip(page);
  await page.getByRole("button", { name: "See curated packages" }).click();
  await expect.poll(() => Boolean(pending)).toBe(true);
  const cancelled = page.waitForEvent("requestfailed", (request) =>
    request.url().endsWith("/api/plan"),
  );
  await page.getByRole("link", { name: "Safety", exact: true }).click();
  await cancelled;
  await pending?.abort();
  await expect(
    page.getByRole("heading", { name: "Build a safer trip shortlist" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "See curated packages" }),
  ).toBeEnabled();
  await expect(
    page.getByRole("button", { name: "Select and customize" }),
  ).toHaveCount(0);
});

test("swaps and add-ons preserve totals through reload and keyboard dismissal", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const response = structuredClone(plannerResult);
  response.alternatives.hotel = [
    {
      hotel_name: "Fixture replacement stay",
      destination: "Fixture town",
      price_per_night: 2500,
      rating: 4.3,
    },
  ];
  response.alternatives.activity = [
    { activity_name: "Free fixture visit", cost_per_person: 0 },
    { activity_name: "Over-budget fixture visit", cost_per_person: 10000 },
  ];
  await page.route("**/api/plan", (route) => json(route, response));
  await page.goto("/plan");
  await enterFixtureTrip(page);
  await page.getByRole("button", { name: "See curated packages" }).click();
  await page.getByRole("button", { name: "Select and customize" }).click();
  await page.getByRole("button", { name: "Swap accommodation" }).click();
  await expect(page.getByRole("dialog", { name: "Swap hotel" })).toBeVisible();
  const dialogBounds = await page.getByRole("dialog").boundingBox();
  expect(dialogBounds!.x).toBeGreaterThanOrEqual(0);
  expect(dialogBounds!.x + dialogBounds!.width).toBeLessThanOrEqual(375);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Swap accommodation" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await page
    .getByRole("button", {
      name: "Select Fixture replacement stay",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("heading", { name: "Fixture replacement stay" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Add activities" }).click();
  await page
    .getByRole("button", { name: "Add Over-budget fixture visit", exact: true })
    .click();
  await expect(page.getByText(/Cannot add this option/)).toBeVisible();
  await page
    .getByRole("button", { name: "Add Free fixture visit", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Custom add-ons" }),
  ).toBeVisible();
  const stored = await page.evaluate(
    () => JSON.parse(sessionStorage.getItem("plan-storage")!).state,
  );
  expect(stored.customizedPlan).toMatchObject({
    accommodationCost: 5000,
    tripCost: 8000,
    remainingBudget: 5500,
    emergencyReserve: 1500,
  });
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Fixture replacement stay" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Remove Free fixture visit" }).click();
  await expect(
    page.getByRole("heading", { name: "Custom add-ons" }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(
      () =>
        JSON.parse(sessionStorage.getItem("plan-storage")!).state.customizedPlan
          .tripCost,
    ),
  ).toBe(8000);
});

test("customizer budget and reserve controls preserve rules and reject negative values", async ({
  page,
}) => {
  await page.route("**/api/plan", (route) => json(route, plannerResult));
  await page.goto("/plan");
  await enterFixtureTrip(page);
  await page.getByRole("button", { name: "See curated packages" }).click();
  await page.getByRole("button", { name: "Select and customize" }).click();
  const budget = page.getByRole("spinbutton", { name: "Total trip budget" });
  const reserve = page.getByRole("spinbutton", { name: "Emergency reserve" });
  const checkout = page.getByRole("button", {
    name: "Continue to protected checkout",
  });
  await budget.fill("10000");
  await expect(reserve).toHaveValue("1500");
  await reserve.fill("4000");
  await expect(
    page.getByText("Budget exceeded", { exact: true }),
  ).toBeVisible();
  await expect(checkout).toBeDisabled();
  await reserve.fill("1000");
  await expect(checkout).toBeEnabled();
  await budget.fill("-1");
  await expect(budget).toHaveValue("10000");
  await reserve.fill("-1");
  await expect(reserve).toHaveValue("1000");
  await page.reload();
  await expect(budget).toHaveValue("10000");
  await expect(reserve).toHaveValue("1000");
  const saved = await page.evaluate(
    () =>
      JSON.parse(sessionStorage.getItem("plan-storage")!).state.customizedPlan,
  );
  expect(saved).toMatchObject({
    tripCost: 7000,
    remainingBudget: 2000,
    emergencyReserve: 1000,
  });
});

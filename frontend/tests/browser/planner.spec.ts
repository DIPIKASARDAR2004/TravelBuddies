import {
  test,
  expect,
  json,
  plannerResult,
  bookingId,
  booking,
} from "./fixtures";

test("plan selection survives reload and continues to checkout with trip dates", async ({
  page,
}) => {
  let orderInput: Record<string, unknown> | undefined;
  await page.route("**/api/plan", (route) => {
    expect(route.request().postDataJSON()).toEqual({
      destination: "Fixture town",
      totalBudget: 15000,
      travellers: 2,
      days: 2,
      womenOnly: false,
    });
    return json(route, plannerResult);
  });
  await page.route("**/api/payments/create-order", (route) => {
    orderInput = route.request().postDataJSON();
    expect(route.request().headers()["idempotency-key"]).toMatch(
      /^[0-9a-f-]{36}$/,
    );
    expect(orderInput?.hotel).toEqual({ name: "Fixture stay" });
    return json(route, { success: true, booking_id: bookingId });
  });
  await page.route(
    "https://travel-test.supabase.co/rest/v1/protected_bookings?*",
    (route) => json(route, booking),
  );
  await page.goto("/plan");
  await page.getByLabel("Destination", { exact: true }).fill("Fixture town");
  await page.getByLabel("Total budget", { exact: true }).fill("15000");
  await page.getByLabel(/^Check-in/).fill("2026-10-12");
  await page.getByLabel(/^Check-out/).fill("2026-10-14");
  await page.getByRole("button", { name: "See curated packages" }).click();
  await page.getByRole("button", { name: "Select and customize" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Customize the plan without losing budget clarity",
    }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: "Customize the plan without losing budget clarity",
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Continue to protected checkout" })
    .click();
  await expect(page).toHaveURL(`/plan/checkout/${bookingId}`);
  await expect(
    page.getByRole("heading", { name: "Checkout and payout control" }),
  ).toBeVisible();
  expect(orderInput).toMatchObject({
    checkInDate: "2026-10-12",
    checkOutDate: "2026-10-14",
    travellers: 2,
    days: 2,
  });
  await expect(page.getByLabel("Check-in", { exact: true })).toHaveValue(
    "2026-10-12",
  );
  await expect(page.getByLabel("Check-in", { exact: true })).toHaveAttribute(
    "readonly",
    "",
  );
  await expect(
    page.getByText(
      "Secure checkout could not be loaded. Please refresh and try again.",
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Secure checkout unavailable" }),
  ).toBeDisabled();
});

test("safety planning sends its explicit filter and recovers from an API failure", async ({
  page,
}) => {
  let calls = 0;
  await page.route("**/api/plan", (route) => {
    expect(route.request().postDataJSON().womenOnly).toBe(true);
    calls += 1;
    return calls === 1
      ? json(route, { error: "Planner temporarily unavailable." }, 503)
      : json(route, plannerResult);
  });
  await page.goto("/safety");
  await page.getByLabel("Destination", { exact: true }).fill("Fixture town");
  await page.getByLabel("Total budget", { exact: true }).fill("15000");
  await page.locator("#start-date").fill("2026-10-12");
  await page.locator("#end-date").fill("2026-10-14");
  await page.getByRole("button", { name: "See curated packages" }).click();
  await expect(
    page.getByText("Planner temporarily unavailable."),
  ).toBeVisible();
  await expect(page.getByLabel("Destination", { exact: true })).toHaveValue(
    "Fixture town",
  );
  await page.getByRole("button", { name: "See curated packages" }).click();
  await expect(
    page.getByRole("button", { name: "Select and customize" }),
  ).toBeVisible();
});

test("a lost booking response reuses the same request key after reload", async ({
  page,
}) => {
  const attempts: { key: string; body: unknown }[] = [];
  await page.route("**/api/plan", (route) => json(route, plannerResult));
  await page.route("**/api/payments/create-order", (route) => {
    attempts.push({
      key: route.request().headers()["idempotency-key"],
      body: route.request().postDataJSON(),
    });
    if (attempts.length === 1) return route.abort("connectionreset");
    return json(route, { success: true, booking_id: bookingId });
  });
  await page.route(
    "https://travel-test.supabase.co/rest/v1/protected_bookings?*",
    (route) => json(route, booking),
  );
  await page.goto("/plan");
  await page.getByLabel("Destination", { exact: true }).fill("Fixture town");
  await page.getByLabel("Total budget", { exact: true }).fill("15000");
  await page.getByLabel(/^Check-in/).fill("2026-10-12");
  await page.getByLabel(/^Check-out/).fill("2026-10-14");
  await page.getByRole("button", { name: "See curated packages" }).click();
  await page.getByRole("button", { name: "Select and customize" }).click();
  const checkout = page.getByRole("button", {
    name: "Continue to protected checkout",
  });
  await checkout.click();
  await expect(checkout).toBeEnabled();
  expect(attempts).toHaveLength(1);
  expect(attempts[0].key).toMatch(/^[0-9a-f-]{36}$/);
  await expect(page).toHaveURL("/plan");
  await page.reload();
  await checkout.click();
  await expect(page).toHaveURL(`/plan/checkout/${bookingId}`);
  expect(attempts).toHaveLength(2);
  expect(attempts[1]).toEqual(attempts[0]);
});

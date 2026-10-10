import type { Route } from "@playwright/test";
import { test, expect, json, bookingId } from "./fixtures";
import { installGeolocation } from "./geolocationFixture";
const record = {
  id: bookingId,
  latitude: 27,
  longitude: 88,
  sharing: false,
  updated_at: "2026-10-10T10:00:00Z",
};
const station = {
  id: "node/1",
  name: "Fixture station",
  category: "police",
  latitude: 27,
  longitude: 88,
  distanceMeters: 0,
  address: null,
  phone: "+00 1234567",
};

test("saving a first location preserves sharing off; disabling later never requests GPS", async ({
  page,
}) => {
  await installGeolocation(page);
  const writes: unknown[] = [];
  await page.route("**/api/location-sharing", (route) => {
    if (route.request().method() === "GET")
      return json(route, { locationShare: null });
    const body = route.request().postDataJSON();
    writes.push(body);
    return json(route, { locationShare: { ...record, sharing: body.sharing } });
  });
  await page.goto("/safety");
  const panel = page.getByRole("region", {
    name: "Location sharing",
    exact: true,
  });
  await expect(panel.getByText("Sharing: OFF", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => window.__geoTest.calls)).toBe(0);
  await panel.getByRole("button", { name: "Update latest location" }).click();
  await expect(
    panel.getByText(/Sharing is off. The latest stored location is retained./),
  ).toBeVisible();
  expect(writes[0]).toEqual({ latitude: 27, longitude: 88, sharing: false });
  await panel
    .getByRole("button", { name: "Turn sharing on", exact: true })
    .click();
  await expect(panel.getByText("Sharing: ON", { exact: true })).toBeVisible();
  await page.evaluate(() => {
    window.__geoTest.mode = "denied";
  });
  await panel
    .getByRole("button", { name: "Turn sharing off", exact: true })
    .click();
  await expect(panel.getByText("Sharing: OFF", { exact: true })).toBeVisible();
  expect(writes[2]).toEqual({ sharing: false });
  expect(await page.evaluate(() => window.__geoTest.calls)).toBe(2);
});

test("unknown or contradictory saved location state is not reported as successful sharing", async ({
  page,
}) => {
  await installGeolocation(page);
  let reads = 0;
  await page.route("**/api/location-sharing", (route) => {
    if (route.request().method() === "GET")
      return json(route, ++reads === 1 ? {} : { locationShare: record });
    return json(route, { locationShare: { ...record, sharing: false } });
  });
  await page.goto("/safety");
  const panel = page.getByRole("region", {
    name: "Location sharing",
    exact: true,
  });
  await expect(
    panel.getByText("Sharing: UNKNOWN", { exact: true }),
  ).toBeVisible();
  await expect(
    panel.getByRole("button", { name: "Turn sharing on", exact: true }),
  ).toBeDisabled();
  await expect(panel.getByText(/invalid location-sharing state/)).toBeVisible();
  await panel.getByRole("button", { name: "Refresh saved state" }).click();
  await expect(panel.getByText("Sharing: OFF", { exact: true })).toBeVisible();
  await panel
    .getByRole("button", { name: "Turn sharing on", exact: true })
    .click();
  await expect(panel.getByText(/invalid location-sharing state/)).toBeVisible();
  await expect(
    panel.getByText("Sharing: UNKNOWN", { exact: true }),
  ).toBeVisible();
  await expect(
    panel.getByText(/Latest location and sharing choice saved/),
  ).toHaveCount(0);
});

test("denied and stalled location requests do not create server writes", async ({
  page,
}) => {
  await page.clock.install();
  await installGeolocation(page, "denied");
  await page.goto("/safety");
  const panel = page.getByRole("region", {
    name: "Location sharing",
    exact: true,
  });
  await panel
    .getByRole("button", { name: "Turn sharing on", exact: true })
    .click();
  await expect(panel.getByText(/permission was denied/)).toBeVisible();
  await page.evaluate(() => {
    window.__geoTest.mode = "pending";
  });
  await panel
    .getByRole("button", { name: "Turn sharing on", exact: true })
    .click();
  await expect.poll(() => page.evaluate(() => window.__geoTest.calls)).toBe(2);
  await page.clock.fastForward(10001);
  await expect(panel.getByText(/too long/)).toBeVisible();
  await page.evaluate(() => window.__geoTest.resolve());
  await expect(
    panel.getByRole("button", { name: "Turn sharing on", exact: true }),
  ).toBeEnabled();
});

test("leaving a pending location request prevents a late save", async ({
  page,
}) => {
  await installGeolocation(page, "pending");
  await page.goto("/safety");
  await page
    .getByRole("region", { name: "Location sharing", exact: true })
    .getByRole("button", { name: "Turn sharing on", exact: true })
    .click();
  await expect.poll(() => page.evaluate(() => window.__geoTest.calls)).toBe(1);
  await page.locator('a[href="/plan"]').first().click();
  await expect(page).toHaveURL("/plan");
  await page.evaluate(() => window.__geoTest.resolve());
  await expect(
    page.getByRole("button", { name: "See curated packages" }),
  ).toBeVisible();
});

test("nearby search validates results and clears stale categories and provider failures", async ({
  page,
}) => {
  await installGeolocation(page);
  let calls = 0;
  await page.route("**/api/nearby-safety-services?*", (route) => {
    calls++;
    const query = new URL(route.request().url()).searchParams;
    expect(query.get("latitude")).toBe("27");
    expect(query.get("radius")).toBe("2000");
    if (calls === 1)
      return json(route, {
        services: [station],
        category: "police",
        radiusMeters: 2000,
      });
    if (calls === 2)
      return json(route, { error: "Fixture provider unavailable" }, 503);
    if (calls === 3)
      return json(route, {
        services: [{}],
        category: "hospital",
        radiusMeters: 2000,
      });
    return json(route, {
      services: [],
      category: "hospital",
      radiusMeters: 2000,
    });
  });
  await page.goto("/safety");
  const panel = page.getByRole("region", {
    name: "Nearby safety services",
    exact: true,
  });
  await panel.getByRole("button", { name: "Find nearby services" }).click();
  await expect(
    panel.getByRole("heading", { name: "Fixture station" }),
  ).toBeVisible();
  await expect(
    panel.getByRole("link", { name: "+00 1234567" }),
  ).toHaveAttribute("href", "tel:+00 1234567");
  await panel.getByLabel("Service type").selectOption("hospital");
  await expect(panel.getByText("Fixture station", { exact: true })).toHaveCount(
    0,
  );
  for (const message of [
    /Fixture provider unavailable/,
    /invalid nearby-service data/,
  ]) {
    await panel.getByRole("button", { name: "Find nearby services" }).click();
    await expect(panel.getByText(message)).toBeVisible();
    await expect(
      panel.getByText("No matches nearby", { exact: true }),
    ).toHaveCount(0);
  }
  await panel.getByRole("button", { name: "Find nearby services" }).click();
  await expect(
    panel.getByText("No matches nearby", { exact: true }),
  ).toBeVisible();
  await expect(
    panel.getByText(/does not establish that no services exist/),
  ).toBeVisible();
});

test("nearby requests time out and are cancelled when leaving the safety page", async ({
  page,
}) => {
  await page.clock.install();
  await installGeolocation(page);
  const requests: Route[] = [];
  await page.route("**/api/nearby-safety-services?*", (route) => {
    requests.push(route);
  });
  await page.goto("/safety");
  const panel = page.getByRole("region", {
    name: "Nearby safety services",
    exact: true,
  });
  await panel.getByRole("button", { name: "Find nearby services" }).click();
  await expect.poll(() => requests.length).toBe(1);
  await page.clock.fastForward(25001);
  await expect(panel.getByText(/search took too long/)).toBeVisible();
  await requests[0].abort();
  await panel.getByRole("button", { name: "Find nearby services" }).click();
  await expect.poll(() => requests.length).toBe(2);
  const aborted = page.waitForEvent("requestfailed", (request) =>
    request.url().includes("/api/nearby-safety-services?"),
  );
  await page.getByRole("link", { name: "Plan Trip", exact: true }).click();
  await aborted;
  await requests[1].abort();
  await expect(
    page.getByRole("button", { name: "See curated packages" }),
  ).toBeVisible();
});

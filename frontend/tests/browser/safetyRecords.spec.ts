import type { Route } from "@playwright/test";
import { test, expect, json, bookingId } from "./fixtures";
import { installGeolocation } from "./geolocationFixture";

const contact = {
  id: bookingId,
  name: "Fixture friend",
  phone: "+91 1234567890",
  email: null,
  relationship: "Friend",
  is_active: true,
  created_at: "2026-10-10T10:00:00Z",
  updated_at: "2026-10-10T10:00:00Z",
};
const alert = {
  id: bookingId,
  latitude: 27,
  longitude: 88,
  message: "Keep my SOS note",
  status: "pending",
  created_at: "2026-10-10T10:00:00Z",
  resolved_at: null,
};

test("contact create/edit/cancel/soft removal works at mobile width with honest copy", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const methods: string[] = [];
  await page.route("**/api/trusted-contacts{,/*}", (route) => {
    const method = route.request().method();
    methods.push(method);
    if (method === "GET") return json(route, { contacts: [] });
    if (method === "DELETE")
      return json(route, {
        contact: { ...contact, name: "Updated friend", is_active: false },
      });
    return json(
      route,
      { contact: { ...contact, ...route.request().postDataJSON() } },
      method === "POST" ? 201 : 200,
    );
  });
  await page.goto("/safety");
  const panel = page.getByRole("region", {
    name: "Trusted contacts",
    exact: true,
  });
  await expect(
    panel.getByText("No contacts yet", { exact: true }),
  ).toBeVisible();
  await expect(
    panel.getByText(/does not verify, invite or notify/),
  ).toBeVisible();
  await panel.getByLabel("Name", { exact: true }).fill(contact.name);
  await panel.getByRole("button", { name: "Add contact", exact: true }).click();
  await expect(panel.getByRole("alert")).toContainText(
    "Add a phone number or email address.",
  );
  expect(methods).toEqual(["GET"]);
  await panel.getByLabel("Phone", { exact: true }).fill(contact.phone);
  await panel
    .getByLabel("Relationship", { exact: true })
    .fill(contact.relationship);
  await panel.getByRole("button", { name: "Add contact", exact: true }).click();
  await expect(panel.getByRole("status")).toContainText(
    "No notification was sent.",
  );
  await panel
    .getByRole("button", { name: "Edit Fixture friend", exact: true })
    .click();
  await expect(panel.getByLabel("Name", { exact: true })).toHaveValue(
    contact.name,
  );
  await panel.getByRole("button", { name: "Cancel editing" }).click();
  await expect(panel.getByLabel("Name", { exact: true })).toHaveValue("");
  await panel
    .getByRole("button", { name: "Edit Fixture friend", exact: true })
    .click();
  await panel.getByLabel("Name", { exact: true }).fill("Updated friend");
  await panel.getByRole("button", { name: "Update contact" }).click();
  await expect(panel.getByRole("status")).toContainText(
    "Trusted contact updated.",
  );
  await panel
    .getByRole("button", { name: "Remove Updated friend", exact: true })
    .click();
  await expect(panel.getByText(/does not erase stored details/)).toBeVisible();
  await panel.getByRole("button", { name: "Cancel removal" }).click();
  expect(methods).toEqual(["GET", "POST", "PATCH"]);
  await panel
    .getByRole("button", { name: "Remove Updated friend", exact: true })
    .click();
  await panel
    .getByRole("button", { name: "Confirm remove Updated friend", exact: true })
    .click();
  await expect(panel.getByRole("status")).toContainText(
    "The stored record is retained.",
  );
  await expect(
    panel.getByText("No contacts yet", { exact: true }),
  ).toBeVisible();
  expect(methods).toEqual(["GET", "POST", "PATCH", "DELETE"]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("loading blocks mutations and malformed lists cannot look like empty histories", async ({
  page,
}) => {
  await installGeolocation(page);
  const pending: Route[] = [];
  await page.route("**/api/trusted-contacts", (route) => {
    pending.push(route);
  });
  await page.route("**/api/emergency-alerts", (route) => {
    pending.push(route);
  });
  await page.goto("/safety");
  await expect.poll(() => pending.length).toBe(2);
  const contacts = page.getByRole("region", {
    name: "Trusted contacts",
    exact: true,
  });
  const sos = page.getByRole("region", { name: "Emergency SOS", exact: true });
  await expect(
    contacts.getByRole("button", { name: "Add contact", exact: true }),
  ).toBeDisabled();
  await expect(
    sos.getByRole("button", { name: "Save SOS record", exact: true }),
  ).toBeDisabled();
  expect(await page.evaluate(() => window.__geoTest.calls)).toBe(0);
  for (const route of pending) await json(route, {});
  await expect(contacts.getByRole("alert")).toContainText(
    "invalid trusted contacts list",
  );
  await expect(sos.getByRole("alert")).toContainText("invalid SOS history");
  await expect(
    contacts.getByText("No contacts yet", { exact: true }),
  ).toHaveCount(0);
  await expect(
    sos.getByText("No SOS records yet", { exact: true }),
  ).toHaveCount(0);
  await page.route("**/api/trusted-contacts", (route) =>
    json(route, { contacts: [] }),
  );
  await page.route("**/api/emergency-alerts", (route) =>
    json(route, { alerts: [] }),
  );
  await contacts.getByRole("button", { name: "Refresh contacts" }).click();
  await sos.getByRole("button", { name: "Refresh SOS history" }).click();
  await expect(
    contacts.getByRole("button", { name: "Add contact", exact: true }),
  ).toBeEnabled();
  await expect(
    sos.getByRole("button", { name: "Save SOS record", exact: true }),
  ).toBeEnabled();
});

test("an uncertain contact save retains the draft and requires refresh and review before another action", async ({
  page,
}) => {
  let posts = 0;
  let pending: Route | undefined;
  await page.route("**/api/trusted-contacts", (route) => {
    if (route.request().method() === "GET")
      return json(route, { contacts: posts ? [contact] : [] });
    posts++;
    pending = route;
  });
  await page.goto("/safety");
  const panel = page.getByRole("region", {
    name: "Trusted contacts",
    exact: true,
  });
  await panel.getByLabel("Name", { exact: true }).fill(contact.name);
  await panel.getByLabel("Phone", { exact: true }).fill(contact.phone);
  await panel
    .getByLabel("Relationship", { exact: true })
    .fill(contact.relationship);
  // Two synchronous submissions bypassing button rendering must still dispatch only once.
  await panel.locator("form").evaluate((form: HTMLFormElement) => {
    form.requestSubmit();
    form.requestSubmit();
  });
  await expect.poll(() => posts).toBe(1);
  await expect(panel.getByLabel("Name", { exact: true })).toBeDisabled();
  await json(
    pending!,
    { contact: { ...contact, name: "Wrong response" } },
    201,
  );
  await expect(panel.getByRole("alert")).toContainText(
    "invalid trusted contact details",
  );
  await expect(panel.getByLabel("Name", { exact: true })).toHaveValue(
    contact.name,
  );
  await expect(
    panel.getByRole("button", { name: "Add contact", exact: true }),
  ).toBeDisabled();
  await panel.getByRole("button", { name: "Refresh contacts" }).click();
  await expect(panel.getByText(contact.name, { exact: true })).toBeVisible();
  await expect(
    panel.getByRole("button", { name: "Add contact", exact: true }),
  ).toBeDisabled();
  await panel
    .getByRole("button", { name: "I reviewed saved contacts" })
    .click();
  await panel
    .getByRole("button", { name: "Edit Fixture friend", exact: true })
    .click();
  await expect(
    panel.getByRole("button", { name: "Update contact" }),
  ).toBeEnabled();
  expect(posts).toBe(1);
});

test("wrong-ID contact removal stays unconfirmed and retains the last record", async ({
  page,
}) => {
  await page.route("**/api/trusted-contacts", (route) =>
    json(route, { contacts: [contact] }),
  );
  await page.route(`**/api/trusted-contacts/${contact.id}`, (route) =>
    json(route, {
      contact: {
        ...contact,
        id: "12345678-1234-4234-8234-123456789abd",
        is_active: false,
      },
    }),
  );
  await page.goto("/safety");
  const panel = page.getByRole("region", {
    name: "Trusted contacts",
    exact: true,
  });
  await panel
    .getByRole("button", { name: "Remove Fixture friend", exact: true })
    .click();
  await panel
    .getByRole("button", { name: "Confirm remove Fixture friend", exact: true })
    .click();
  await expect(panel.getByRole("alert")).toContainText(
    "invalid trusted contact details",
  );
  await expect(panel.getByText(contact.name, { exact: true })).toBeVisible();
  await expect(panel.getByText(/Last confirmed contacts/)).toBeVisible();
  await expect(
    panel.getByRole("button", { name: "Remove Fixture friend", exact: true }),
  ).toBeDisabled();
  await expect(panel.getByText("No contacts yet", { exact: true })).toHaveCount(
    0,
  );
});

test("contact reads time out and pending writes abort on navigation", async ({
  page,
}) => {
  await page.clock.install();
  const requests: Route[] = [];
  await page.route("**/api/trusted-contacts", (route) => {
    requests.push(route);
  });
  await page.goto("/safety");
  const panel = page.getByRole("region", {
    name: "Trusted contacts",
    exact: true,
  });
  await expect.poll(() => requests.length).toBe(1);
  await page.clock.fastForward(15001);
  await expect(panel.getByRole("alert")).toBeVisible();
  await expect(
    panel.getByRole("button", { name: "Add contact", exact: true }),
  ).toBeDisabled();
  await requests[0].abort();
  await panel.getByRole("button", { name: "Refresh contacts" }).click();
  await expect.poll(() => requests.length).toBe(2);
  await json(requests[1], { contacts: [] });
  await panel.getByLabel("Name", { exact: true }).fill(contact.name);
  await panel.getByLabel("Phone", { exact: true }).fill(contact.phone);
  await panel.getByRole("button", { name: "Add contact", exact: true }).click();
  await expect.poll(() => requests.length).toBe(3);
  const cancelled = page.waitForEvent(
    "requestfailed",
    (request) =>
      request.url().endsWith("/api/trusted-contacts") &&
      request.method() === "POST",
  );
  await page.locator('a[href="/plan"]').first().click();
  await cancelled;
  await requests[2].abort();
  await expect(page).toHaveURL("/plan");
});

test("SOS confirmation is explicit, duplicate clicks are locked and history stays bounded", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await installGeolocation(page);
  let writes = 0;
  let pending: Route | undefined;
  const history = Array.from({ length: 10 }, (_, index) => ({
    ...alert,
    id: `12345678-1234-4234-8234-${String(index).padStart(12, "0")}`,
    message: `Earlier note ${index}`,
  }));
  await page.route("**/api/emergency-alerts", (route) => {
    if (route.request().method() === "GET")
      return json(route, { alerts: history });
    expect(route.request().postDataJSON()).toEqual({
      latitude: 27,
      longitude: 88,
      message: alert.message,
    });
    writes++;
    pending = route;
  });
  await page.goto("/safety");
  const panel = page.getByRole("region", {
    name: "Emergency SOS",
    exact: true,
  });
  await expect(
    panel.getByText("Record only — no emergency response"),
  ).toBeVisible();
  await panel.getByLabel("Optional message").fill(alert.message);
  await panel
    .getByRole("button", { name: "Save SOS record", exact: true })
    .click();
  await panel.getByRole("button", { name: "Cancel", exact: true }).click();
  expect(await page.evaluate(() => window.__geoTest.calls)).toBe(0);
  await panel
    .getByRole("button", { name: "Save SOS record", exact: true })
    .click();
  await panel
    .getByRole("button", { name: "Confirm save SOS record", exact: true })
    .evaluate((button: HTMLButtonElement) => {
      button.click();
      button.click();
    });
  await expect.poll(() => writes).toBe(1);
  await expect(panel.getByLabel("Optional message")).toBeDisabled();
  await json(pending!, { alert }, 201);
  await expect(panel.getByRole("status")).toContainText(
    "No one was notified and no help was dispatched.",
  );
  await expect(panel.getByLabel("Optional message")).toHaveValue("");
  await expect(
    panel.getByText("Record status: pending", { exact: true }),
  ).toHaveCount(10);
  await expect(panel.getByText("Earlier note 9", { exact: true })).toHaveCount(
    0,
  );
  expect(await page.evaluate(() => window.__geoTest.calls)).toBe(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("denied and stalled SOS location keep the draft and never write or accept late coordinates", async ({
  page,
}) => {
  await page.clock.install();
  await installGeolocation(page, "denied");
  await page.goto("/safety");
  const panel = page.getByRole("region", {
    name: "Emergency SOS",
    exact: true,
  });
  await panel.getByLabel("Optional message").fill(alert.message);
  await panel
    .getByRole("button", { name: "Save SOS record", exact: true })
    .click();
  await panel
    .getByRole("button", { name: "Confirm save SOS record", exact: true })
    .click();
  await expect(panel.getByRole("alert")).toContainText(
    "Location permission was denied",
  );
  await expect(panel.getByLabel("Optional message")).toHaveValue(alert.message);
  await expect(
    panel.getByText("Save outcome unknown", { exact: true }),
  ).toHaveCount(0);
  await page.evaluate(() => {
    window.__geoTest.mode = "pending";
  });
  await panel
    .getByRole("button", { name: "Save SOS record", exact: true })
    .click();
  await panel
    .getByRole("button", { name: "Confirm save SOS record", exact: true })
    .click();
  await expect.poll(() => page.evaluate(() => window.__geoTest.calls)).toBe(2);
  await page.clock.fastForward(10001);
  await expect(panel.getByRole("alert")).toContainText(
    "Location took too long",
  );
  await page.evaluate(() => window.__geoTest.resolve());
  await expect(
    panel.getByRole("button", { name: "Save SOS record", exact: true }),
  ).toBeEnabled();
  await expect(panel.getByLabel("Optional message")).toHaveValue(alert.message);
});

test("leaving while SOS location is pending prevents a later POST", async ({
  page,
}) => {
  await installGeolocation(page, "pending");
  await page.goto("/safety");
  const panel = page.getByRole("region", {
    name: "Emergency SOS",
    exact: true,
  });
  await panel
    .getByRole("button", { name: "Save SOS record", exact: true })
    .click();
  await panel
    .getByRole("button", { name: "Confirm save SOS record", exact: true })
    .click();
  await expect.poll(() => page.evaluate(() => window.__geoTest.calls)).toBe(1);
  await page.locator('a[href="/plan"]').first().click();
  await expect(page).toHaveURL("/plan");
  await page.evaluate(() => window.__geoTest.resolve());
  await expect(
    page.getByRole("button", { name: "See curated packages" }),
  ).toBeVisible();
});

test("malformed SOS saves retain the draft and require inspecting refreshed history without automatic retry", async ({
  page,
}) => {
  await installGeolocation(page);
  let writes = 0;
  await page.route("**/api/emergency-alerts", (route) => {
    if (route.request().method() === "GET")
      return json(route, { alerts: writes ? [alert] : [] });
    writes++;
    return json(route, { alert: { ...alert, latitude: 0 } }, 201);
  });
  await page.goto("/safety");
  const panel = page.getByRole("region", {
    name: "Emergency SOS",
    exact: true,
  });
  await panel.getByLabel("Optional message").fill(alert.message);
  await panel
    .getByRole("button", { name: "Save SOS record", exact: true })
    .click();
  await panel
    .getByRole("button", { name: "Confirm save SOS record", exact: true })
    .click();
  await expect(panel.getByRole("alert")).toContainText(
    "invalid SOS record details",
  );
  await expect(
    panel.getByText("Save outcome unknown", { exact: true }),
  ).toBeVisible();
  await expect(panel.getByLabel("Optional message")).toHaveValue(alert.message);
  await expect(
    panel.getByRole("button", { name: "Save SOS record", exact: true }),
  ).toBeDisabled();
  await panel.getByRole("button", { name: "Refresh SOS history" }).click();
  await expect(panel.getByText(alert.message, { exact: true })).toBeVisible();
  await expect(
    panel.getByRole("button", { name: "Save SOS record", exact: true }),
  ).toBeDisabled();
  await panel.getByRole("button", { name: "I checked history" }).click();
  await expect(
    panel.getByRole("button", { name: "Save SOS record", exact: true }),
  ).toBeEnabled();
  await expect(
    panel.getByRole("button", { name: "Confirm save SOS record", exact: true }),
  ).toHaveCount(0);
  expect(writes).toBe(1);
});

test("SOS POST timeout requires recovery, and navigation aborts a later dispatched request", async ({
  page,
}) => {
  await page.clock.install();
  await installGeolocation(page);
  const pending: Route[] = [];
  await page.route("**/api/emergency-alerts", (route) => {
    if (route.request().method() === "GET") return json(route, { alerts: [] });
    pending.push(route);
  });
  await page.goto("/safety");
  const panel = page.getByRole("region", {
    name: "Emergency SOS",
    exact: true,
  });
  await panel.getByLabel("Optional message").fill(alert.message);
  await panel
    .getByRole("button", { name: "Save SOS record", exact: true })
    .click();
  await panel
    .getByRole("button", { name: "Confirm save SOS record", exact: true })
    .click();
  await expect.poll(() => pending.length).toBe(1);
  await page.clock.fastForward(15001);
  await expect(
    panel.getByText("Save outcome unknown", { exact: true }),
  ).toBeVisible();
  await expect(panel.getByLabel("Optional message")).toHaveValue(alert.message);
  await pending[0].abort();
  await panel.getByRole("button", { name: "Refresh SOS history" }).click();
  await panel.getByRole("button", { name: "I checked history" }).click();
  await panel
    .getByRole("button", { name: "Save SOS record", exact: true })
    .click();
  await panel
    .getByRole("button", { name: "Confirm save SOS record", exact: true })
    .click();
  await expect.poll(() => pending.length).toBe(2);
  const cancelled = page.waitForEvent(
    "requestfailed",
    (request) =>
      request.url().endsWith("/api/emergency-alerts") &&
      request.method() === "POST",
  );
  await page.locator('a[href="/plan"]').first().click();
  await cancelled;
  await pending[1].abort();
  await expect(page).toHaveURL("/plan");
});

test("unauthorized safety reads remain unavailable instead of showing empty records", async ({
  page,
}) => {
  await page.route("**/api/trusted-contacts", (route) =>
    json(route, { error: "Sign in to view contacts." }, 401),
  );
  await page.route("**/api/emergency-alerts", (route) =>
    json(route, { error: "Sign in to view SOS records." }, 401),
  );
  await page.goto("/safety");
  const contacts = page.getByRole("region", {
    name: "Trusted contacts",
    exact: true,
  });
  const sos = page.getByRole("region", { name: "Emergency SOS", exact: true });
  await expect(contacts.getByRole("alert")).toHaveText(
    "Sign in to view contacts.",
  );
  await expect(sos.getByRole("alert")).toHaveText(
    "Sign in to view SOS records.",
  );
  await expect(
    contacts.getByRole("button", { name: "Add contact", exact: true }),
  ).toBeDisabled();
  await expect(
    sos.getByRole("button", { name: "Save SOS record", exact: true }),
  ).toBeDisabled();
});

import { test, expect, json, stay } from "./fixtures";

test("editing a stay preserves local times and unchanged timestamp precision", async ({
  page,
}) => {
  let saved: Record<string, unknown> | undefined;
  await page.route("**/api/safe-stays", (route) =>
    json(route, { stays: [stay] }),
  );
  await page.route(`**/api/safe-stays/${stay.id}`, (route) => {
    saved = route.request().postDataJSON();
    return json(route, { stay: { ...stay, ...saved } });
  });
  await page.goto("/safety");
  const panel = page.getByRole("region", { name: "Safe stay", exact: true });
  await panel.getByRole("button", { name: "Edit", exact: true }).click();
  await expect(panel.getByLabel("Check-in", { exact: true })).toHaveValue(
    "2026-10-12T14:30",
  );
  await expect(panel.getByLabel("Check-out", { exact: true })).toHaveValue(
    "2026-10-14T14:30",
  );
  await panel.getByRole("button", { name: "Update stay" }).click();
  await expect(
    panel.getByText("Safe stay updated.", { exact: true }),
  ).toBeVisible();
  expect(saved).toMatchObject({
    check_in: stay.check_in,
    check_out: stay.check_out,
  });
  await expect(
    panel.getByRole("button", { name: "Dismiss reminder" }),
  ).toHaveCount(0);
});

test("creates, reminds only on explicit check-in, completes and confirms deletion", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    let prompts = 0;
    class TestNotification {
      static permission = "default";
      static async requestPermission() {
        prompts += 1;
        return "denied";
      }
    }
    Object.defineProperty(window, "Notification", { value: TestNotification });
    Object.defineProperty(window, "notificationPrompts", {
      get: () => prompts,
    });
  });
  const methods: string[] = [];
  await page.route("**/api/safe-stays{,/*}", (route) => {
    const method = route.request().method();
    methods.push(method);
    if (method === "GET") return json(route, { stays: [] });
    if (method === "DELETE") return json(route, { success: true });
    return json(
      route,
      { stay: { ...stay, ...route.request().postDataJSON() } },
      method === "POST" ? 201 : 200,
    );
  });
  await page.goto("/safety");
  const panel = page.getByRole("region", { name: "Safe stay", exact: true });
  await expect(panel.getByText("No safe stay records")).toBeVisible();
  expect(
    await page.evaluate(() => Reflect.get(window, "notificationPrompts")),
  ).toBe(0);
  await panel.getByLabel("Stay or property name").fill("Fixture stay");
  await panel.getByLabel("Check-in", { exact: true }).fill("2026-10-12T14:30");
  await panel.getByLabel("Check-out", { exact: true }).fill("2026-10-14T14:30");
  await panel.getByRole("button", { name: "Start safe stay" }).click();
  await expect(
    panel.getByRole("button", { name: "Dismiss reminder" }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => Reflect.get(window, "notificationPrompts")),
  ).toBe(1);
  await panel.getByRole("button", { name: "Edit", exact: true }).click();
  await panel.getByRole("combobox").selectOption("completed");
  await panel.getByRole("button", { name: "Update stay" }).click();
  await expect(panel.getByText("completed", { exact: true })).toBeVisible();
  await expect(
    panel.getByRole("button", { name: "Dismiss reminder" }),
  ).toHaveCount(0);
  await panel.getByRole("button", { name: "Delete", exact: true }).click();
  expect(methods).not.toContain("DELETE");
  await panel.getByRole("button", { name: "Confirm delete" }).click();
  await expect(panel.getByText("No safe stay records")).toBeVisible();
  expect(methods).toEqual(["GET", "POST", "PATCH", "DELETE"]);
});

test("malformed list and mutation responses show errors without losing the form", async ({
  page,
}) => {
  await page.route("**/api/safe-stays", (route) =>
    json(
      route,
      route.request().method() === "GET"
        ? { stays: null }
        : { stay: { id: "broken" } },
    ),
  );
  await page.goto("/safety");
  const panel = page.getByRole("region", { name: "Safe stay", exact: true });
  await expect(
    panel.getByText("The server returned an invalid Safe Stay list."),
  ).toBeVisible();
  await panel.getByLabel("Stay or property name").fill("Keep my draft");
  await panel.getByLabel("Check-in", { exact: true }).fill("2026-10-12T14:30");
  await panel.getByLabel("Check-out", { exact: true }).fill("2026-10-14T14:30");
  await panel.getByRole("button", { name: "Start safe stay" }).click();
  await expect(
    panel.getByText("The server returned invalid Safe Stay details."),
  ).toBeVisible();
  await expect(panel.getByLabel("Stay or property name")).toHaveValue(
    "Keep my draft",
  );
  await expect(
    panel.getByRole("button", { name: "Start safe stay" }),
  ).toBeEnabled();
});

test("failed deletion retains the record and offers a retry", async ({
  page,
}) => {
  await page.route("**/api/safe-stays", (route) =>
    json(route, { stays: [stay] }),
  );
  await page.route(`**/api/safe-stays/${stay.id}`, (route) =>
    json(route, { error: "Please sign in again." }, 401),
  );
  await page.goto("/safety");
  const panel = page.getByRole("region", { name: "Safe stay", exact: true });
  await panel.getByRole("button", { name: "Delete", exact: true }).click();
  await panel.getByRole("button", { name: "Confirm delete" }).click();
  await expect(panel.getByText("Please sign in again.")).toBeVisible();
  await expect(panel.getByText(stay.stay_name, { exact: true })).toBeVisible();
  await expect(
    panel.getByRole("button", { name: "Delete", exact: true }),
  ).toBeEnabled();
});

import type { Route } from "@playwright/test";
import { test, expect, json } from "./fixtures";

test("chat sends complete turns, exposes privacy limits and supports keyboard close", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const bodies: unknown[] = [];
  await page.route("**/api/chat", (route) => {
    bodies.push(route.request().postDataJSON());
    return json(route, { text: "Fixture travel advice" });
  });
  await page.goto("/plan");
  const opener = page.getByRole("button", { name: "Open trip assistant" });
  await opener.click();
  const dialog = page.getByRole("dialog", { name: "Trip assistant" });
  const input = dialog.getByRole("textbox", {
    name: "Message to trip assistant",
  });
  await expect(input).toBeFocused();
  await expect(dialog.getByText(/Messages are sent to Google/)).toBeVisible();
  await input.fill("Plan a fixture weekend");
  await input.press("Enter");
  await expect(
    dialog.getByText("Fixture travel advice", { exact: true }),
  ).toBeVisible();
  expect(bodies[0]).toEqual({
    messages: [{ role: "user", content: "Plan a fixture weekend" }],
  });
  await input.fill("What should I pack?");
  await dialog.getByRole("button", { name: "Send message" }).click();
  await expect(
    dialog.getByText("Fixture travel advice", { exact: true }),
  ).toHaveCount(2);
  expect(bodies[1]).toEqual({
    messages: [
      { role: "user", content: "Plan a fixture weekend" },
      { role: "assistant", content: "Fixture travel advice" },
      { role: "user", content: "What should I pack?" },
    ],
  });
  const bounds = await dialog.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(375);
  await input.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
  await opener.click();
  await dialog.getByRole("button", { name: "Clear conversation" }).click();
  await expect(
    dialog.getByText("Fixture travel advice", { exact: true }),
  ).toHaveCount(0);
});

test("failed and malformed chat replies keep the draft out of future conversation history", async ({
  page,
}) => {
  const bodies: unknown[] = [];
  await page.route("**/api/chat", (route) => {
    bodies.push(route.request().postDataJSON());
    return bodies.length === 1
      ? json(route, { error: "Assistant is busy. Retry later." }, 429)
      : bodies.length === 2
        ? json(route, { text: {} })
        : json(route, { text: "Recovered reply" });
  });
  await page.goto("/plan");
  await page.getByRole("button", { name: "Open trip assistant" }).click();
  const input = page.getByRole("textbox", {
    name: "Message to trip assistant",
  });
  await input.fill("Retry this trip question");
  for (const message of [/Assistant is busy/, /invalid reply/]) {
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(
      page.getByRole("dialog", { name: "Trip assistant" }).getByRole("alert"),
    ).toContainText(message);
    await expect(input).toHaveValue("Retry this trip question");
    await expect(input).toBeEnabled();
  }
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(
    page.getByText("Recovered reply", { exact: true }),
  ).toBeVisible();
  expect(bodies).toEqual(
    Array(3).fill({
      messages: [{ role: "user", content: "Retry this trip question" }],
    }),
  );
});

test("closing a pending chat cancels waiting and keeps the draft for a fresh retry", async ({
  page,
}) => {
  let pending: Route | undefined;
  await page.route("**/api/chat", (route) => {
    pending = route;
  });
  await page.goto("/plan");
  await page.getByRole("button", { name: "Open trip assistant" }).click();
  const input = page.getByRole("textbox", {
    name: "Message to trip assistant",
  });
  await input.fill("Pending trip question");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect.poll(() => Boolean(pending)).toBe(true);
  await expect(
    page.getByRole("button", { name: "Plan a weekend trip", exact: true }),
  ).toBeDisabled();
  const aborted = page.waitForEvent("requestfailed", (request) =>
    request.url().endsWith("/api/chat"),
  );
  await page.getByRole("button", { name: "Close trip assistant" }).click();
  await aborted;
  await pending?.abort();
  await page.getByRole("button", { name: "Open trip assistant" }).click();
  await expect(input).toHaveValue("Pending trip question");
  await expect(input).toBeEnabled();
  await expect(
    page.getByRole("dialog", { name: "Trip assistant" }).getByRole("alert"),
  ).toHaveCount(0);
});

test("stalled chat requests time out and unlock retry", async ({ page }) => {
  await page.clock.install();
  let pending: Route | undefined;
  await page.route("**/api/chat", (route) => {
    pending = route;
  });
  await page.goto("/plan");
  await page.getByRole("button", { name: "Open trip assistant" }).click();
  await page
    .getByRole("button", { name: "Plan a weekend trip", exact: true })
    .click();
  await expect.poll(() => Boolean(pending)).toBe(true);
  await page.clock.fastForward(25001);
  await expect(
    page.getByRole("dialog", { name: "Trip assistant" }).getByRole("alert"),
  ).toContainText("too long");
  await expect(
    page.getByRole("textbox", { name: "Message to trip assistant" }),
  ).toHaveValue("Plan a weekend trip");
  await expect(
    page.getByRole("button", { name: "Send message" }),
  ).toBeEnabled();
  await pending?.abort();
});

test("generated markdown cannot auto-load images or activate raw HTML and unsafe links", async ({
  page,
}) => {
  const external: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("tracker.invalid")) external.push(request.url());
  });
  await page.route("**/api/chat", (route) =>
    json(route, {
      text: '[Guide](https://example.com/guide)\n\n![tracking](https://tracker.invalid/pixel)\n\n[unsafe](javascript:alert(1))\n\n<iframe src="https://tracker.invalid/frame"></iframe>',
    }),
  );
  await page.goto("/plan");
  await page.getByRole("button", { name: "Open trip assistant" }).click();
  await page
    .getByRole("button", { name: "Plan a weekend trip", exact: true })
    .click();
  const log = page.getByRole("log", { name: "Conversation" });
  await expect(log.getByRole("link", { name: "Guide" })).toHaveAttribute(
    "rel",
    "noopener noreferrer",
  );
  await expect(
    log.locator("img, iframe, script, a[href^='javascript:']"),
  ).toHaveCount(0);
  expect(external).toEqual([]);
});

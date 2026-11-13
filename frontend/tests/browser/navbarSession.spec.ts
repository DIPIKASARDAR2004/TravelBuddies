import { test, expect, json } from "./fixtures";
import type { Page } from "@playwright/test";

const user = {
  id: "12345678-1234-4234-8234-123456789abc",
  aud: "authenticated",
  email: "fixture@example.invalid",
  app_metadata: {},
  user_metadata: {},
};
async function seedSession(page: Page) {
  const encode = (value: unknown) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  const exp = Math.floor(Date.now() / 1000) + 3600;
  await page.context().addCookies([
    {
      name: "sb-travel-test-auth-token",
      url: "http://127.0.0.1:4182",
      value: `base64-${encode({ access_token: `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ sub: user.id, exp, aud: "authenticated" })}.fixture-signature`, refresh_token: "fixture-refresh", expires_at: exp, expires_in: 3600, token_type: "bearer", user })}`,
    },
  ]);
  await page.route("https://travel-test.supabase.co/auth/v1/user", (route) =>
    json(route, user),
  );
}

test("missing session shows guest controls and unavailable theme storage cannot break auth", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new DOMException("Fixture blocked storage", "SecurityError");
    };
    Storage.prototype.setItem = () => {
      throw new DOMException("Fixture blocked storage", "SecurityError");
    };
  });
  await page.goto("/login");
  await expect(
    page.locator("nav").getByRole("link", { name: "Login", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Toggle Theme" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.getByRole("button", { name: "Toggle Theme" }).click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
});

test("a checked SDK logout clears synthetic cookies and navigates once", async ({
  page,
}) => {
  await seedSession(page);
  let count = 0;
  await page.route(
    "https://travel-test.supabase.co/auth/v1/logout*",
    (route) => {
      count++;
      return route.fulfill({ status: 204 });
    },
  );
  await page.goto("/login");
  await expect(
    page.locator("nav").getByText("fixture", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Logout", exact: true })
    .evaluate((button) => {
      (button as HTMLButtonElement).click();
      (button as HTMLButtonElement).click();
    });
  await expect(page).toHaveURL("http://127.0.0.1:4182/");
  await expect(
    page.locator("nav").getByRole("link", { name: "Login", exact: true }),
  ).toBeVisible();
  expect(count).toBe(1);
  expect(
    (await page.context().cookies()).filter((cookie) =>
      cookie.name.startsWith("sb-travel-test-auth-token"),
    ),
  ).toEqual([]);
});

test("failed remote logout can clear local access without becoming reported success", async ({
  page,
}) => {
  await seedSession(page);
  await page.route("https://travel-test.supabase.co/auth/v1/logout*", (route) =>
    json(route, { message: "private fixture error" }, 500),
  );
  await page.goto("/login");
  await page.getByRole("button", { name: "Logout", exact: true }).click();
  await expect(page.locator("nav").getByRole("alert")).toContainText(
    "Remote sign-out was not confirmed",
  );
  await expect(page.locator("nav").getByRole("alert")).not.toContainText(
    "private fixture",
  );
  await page
    .getByRole("button", { name: "Check session", exact: true })
    .click();
  await expect(
    page.locator("nav").getByRole("link", { name: "Login", exact: true }),
  ).toBeVisible();
  await expect(page.locator("nav").getByRole("alert")).toContainText(
    "not confirmed",
  );
  await expect(page).toHaveURL(/\/login$/);
});

test("failed user verification stays unknown and offers an explicit recheck", async ({
  page,
}) => {
  await seedSession(page);
  await page.route("https://travel-test.supabase.co/auth/v1/user", (route) =>
    json(route, { message: "fixture denied" }, 403),
  );
  await page.goto("/login");
  await expect(
    page.locator("nav").getByText("Account unavailable"),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Logout", exact: true }),
  ).toHaveCount(0);
  await page.route("https://travel-test.supabase.co/auth/v1/user", (route) =>
    json(route, user),
  );
  await page
    .getByRole("button", { name: "Check session", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Logout", exact: true }),
  ).toBeVisible();
});

test("late logout after moving to signup never redirects that newer page", async ({
  page,
}) => {
  await seedSession(page);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let received = false;
  await page.route(
    "https://travel-test.supabase.co/auth/v1/logout*",
    async (route) => {
      received = true;
      await gate;
      await route.fulfill({ status: 204 });
    },
  );
  try {
    await page.goto("/login");
    await page.getByRole("button", { name: "Logout", exact: true }).click();
    await expect.poll(() => received).toBe(true);
    await page.getByRole("link", { name: "Create one", exact: true }).click();
    await expect(page).toHaveURL(/\/signup$/);
    release();
    await expect(page.locator("nav").getByRole("alert")).toContainText(
      "not confirmed",
    );
    await expect(page).toHaveURL(/\/signup$/);
  } finally {
    release();
  }
});

test("stalled logout bounds waiting without issuing another SDK operation", async ({
  page,
}) => {
  await seedSession(page);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let count = 0;
  await page.route(
    "https://travel-test.supabase.co/auth/v1/logout*",
    async (route) => {
      count++;
      await gate;
      await route.fulfill({ status: 204 });
    },
  );
  try {
    await page.goto("/login");
    await expect(
      page.getByRole("button", { name: "Logout", exact: true }),
    ).toBeVisible();
    await page.clock.install();
    await page.getByRole("button", { name: "Logout", exact: true }).click();
    await expect.poll(() => count).toBe(1);
    await page.clock.fastForward(15001);
    await expect(page.locator("nav").getByRole("alert")).toContainText(
      "not confirmed",
    );
    await expect(
      page.getByRole("button", { name: "Check session", exact: true }),
    ).toBeDisabled();
    release();
    await expect(
      page.getByRole("button", { name: "Check session", exact: true }),
    ).toBeEnabled();
    await expect(page).toHaveURL(/\/login$/);
    expect(count).toBe(1);
  } finally {
    release();
  }
});

test("mobile account controls use the same checked logout flow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seedSession(page);
  await page.route("https://travel-test.supabase.co/auth/v1/logout*", (route) =>
    route.fulfill({ status: 204 }),
  );
  await page.goto("/login");
  const menu = page.getByRole("button", { name: "Toggle Mobile Menu" });
  await menu.click();
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  await page
    .locator("#mobile-navigation")
    .getByRole("button", { name: "Logout" })
    .click();
  await expect(page).toHaveURL("http://127.0.0.1:4182/");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("a stalled identity read times out and cannot overwrite its explicit recovery", async ({
  page,
}) => {
  await seedSession(page);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let received = false;
  let completed = false;
  await page.route(
    "https://travel-test.supabase.co/auth/v1/user",
    async (route) => {
      received = true;
      await gate;
      await json(route, user);
      completed = true;
    },
  );
  try {
    await page.clock.install();
    await page.goto("/login");
    await expect.poll(() => received).toBe(true);
    await page.clock.fastForward(15001);
    await expect(
      page.locator("nav").getByText("Account unavailable"),
    ).toBeVisible();
    release();
    await expect.poll(() => completed).toBe(true);
    await expect(
      page.locator("nav").getByText("Account unavailable"),
    ).toBeVisible();
    await page.route("https://travel-test.supabase.co/auth/v1/user", (route) =>
      json(route, { ...user, email: "rechecked@example.invalid" }),
    );
    await page
      .getByRole("button", { name: "Check session", exact: true })
      .click();
    await expect(
      page.locator("nav").getByText("rechecked", { exact: true }),
    ).toBeVisible();
  } finally {
    release();
  }
});

test("SDK broadcast sign-out prevents an older user read from restoring the account label", async ({
  page,
}) => {
  await seedSession(page);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let received = false;
  let completed = false;
  await page.route(
    "https://travel-test.supabase.co/auth/v1/user",
    async (route) => {
      received = true;
      await gate;
      await json(route, user);
      completed = true;
    },
  );
  try {
    await page.goto("/login");
    await expect.poll(() => received).toBe(true);
    await page.context().clearCookies();
    await page.evaluate(() => {
      const sender = new BroadcastChannel("sb-travel-test-auth-token");
      sender.postMessage({ event: "SIGNED_OUT", session: null });
      sender.close();
    });
    await expect(
      page.locator("nav").getByRole("link", { name: "Login", exact: true }),
    ).toBeVisible();
    release();
    await expect.poll(() => completed).toBe(true);
    await expect(
      page.getByRole("button", { name: "Logout", exact: true }),
    ).toHaveCount(0);
  } finally {
    release();
  }
});

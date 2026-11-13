import { test, expect, json } from "./fixtures";
import type { Page } from "@playwright/test";

const authenticated = {
  status: "authenticated",
  user: { id: "12345678-1234-4234-8234-123456789abc" },
};
const credentials = {
  email: "person@example.invalid",
  password: "  fixture-password  ",
};

async function fill(page: Page, mode: "login" | "signup" = "login") {
  await page
    .getByLabel("Email address", { exact: true })
    .fill(credentials.email);
  await page.getByLabel("Password", { exact: true }).fill(credentials.password);
  if (mode === "signup") {
    await page
      .getByLabel("Full name", { exact: true })
      .fill("  Fixture Person  ");
    await page
      .getByLabel("Confirm password", { exact: true })
      .fill(credentials.password);
  }
}

test("login validates inputs, then accepts an existing short password and performs a fresh navigation", async ({
  page,
}) => {
  let payload: unknown;
  let requests = 0;
  let safetyDocuments = 0;
  page.on("request", (request) => {
    if (
      request.isNavigationRequest() &&
      new URL(request.url()).pathname === "/safety"
    )
      safetyDocuments++;
  });
  await page.route("**/api/login", (route) => {
    requests++;
    payload = route.request().postDataJSON();
    return json(route, authenticated);
  });
  await page.goto("/login");
  await page.getByRole("button", { name: "Continue to account" }).click();
  await expect(page.locator("form").getByRole("alert")).toContainText(
    "valid email",
  );
  expect(requests).toBe(0);
  await fill(page);
  await page.getByLabel("Password", { exact: true }).fill(" x ");
  await page.getByRole("button", { name: "Continue to account" }).click();
  await expect(page).toHaveURL(/\/safety$/);
  expect(payload).toEqual({ email: credentials.email, password: " x " });
  expect(requests).toBe(1);
  expect(safetyDocuments).toBe(1);
});

test("signup collects only supported data, validates confirmation and keeps email guidance on screen", async ({
  page,
}) => {
  let payload: unknown;
  let requests = 0;
  await page.route("**/api/signup", (route) => {
    requests++;
    payload = route.request().postDataJSON();
    return json(
      route,
      {
        status: "confirmation_required",
        message: "Account definitely created!",
      },
      201,
    );
  });
  await page.goto("/signup");
  await expect(
    page.getByText("Business and host account tools are not available.", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(page.getByLabel("Phone number")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /^(MyBiz|Host)$/ }),
  ).toHaveCount(0);
  await fill(page, "signup");
  await page
    .getByLabel("Confirm password", { exact: true })
    .fill("wrong password");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page.locator("form").getByRole("alert")).toContainText(
    "Passwords do not match",
  );
  expect(requests).toBe(0);
  await page
    .getByLabel("Confirm password", { exact: true })
    .fill(credentials.password);
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "If signup is available for this address",
  );
  await expect(page).toHaveURL(/\/signup$/);
  expect(payload).toEqual({ ...credentials, fullName: "Fixture Person" });
  expect(requests).toBe(1);
  await expect(
    page.getByRole("button", { name: "Create account", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText("Account definitely created!")).toHaveCount(0);
});

test("signup with an acknowledged session enters the account", async ({
  page,
}) => {
  await page.route("**/api/signup", (route) => json(route, authenticated, 201));
  await page.goto("/signup");
  await fill(page, "signup");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page).toHaveURL(/\/safety$/);
});

for (const status of [401, 429]) {
  test(`explicit rejection ${status} leaves an editable form without reflecting provider details`, async ({
    page,
  }) => {
    let requests = 0;
    await page.route("**/api/login", (route) => {
      requests++;
      return json(route, { error: "raw fixture diagnostic" }, status);
    });
    await page.goto("/login");
    await fill(page);
    await page.getByRole("button", { name: "Continue to account" }).click();
    await expect(page.locator("form").getByRole("alert")).toContainText(
      status === 429 ? "Please wait" : "not accepted",
    );
    await expect(
      page.getByLabel("Email address", { exact: true }),
    ).toBeEnabled();
    await expect(page.getByText("raw fixture diagnostic")).toHaveCount(0);
    await expect(page).toHaveURL(/\/login$/);
    expect(requests).toBe(1);
  });
}

for (const failure of ["malformed", "server", "network"] as const) {
  test(`${failure} failure requires acknowledgement before another attempt`, async ({
    page,
  }) => {
    let requests = 0;
    await page.route("**/api/signup", (route) => {
      requests++;
      if (failure === "network") return route.abort();
      return json(
        route,
        failure === "malformed" ? { message: "Success" } : { error: "private" },
        failure === "server" ? 502 : 201,
      );
    });
    await page.goto("/signup");
    await fill(page, "signup");
    await page
      .getByRole("button", { name: "Create account", exact: true })
      .click();
    await expect(page.locator("form").getByRole("alert")).toContainText(
      "may already have taken effect",
    );
    await expect(
      page.getByRole("button", { name: "Create account", exact: true }),
    ).toBeDisabled();
    await page
      .locator("form")
      .evaluate((form) =>
        form.dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true }),
        ),
      );
    expect(requests).toBe(1);
    await page
      .getByRole("button", { name: "I've checked — enable another attempt" })
      .click();
    await expect(
      page.getByRole("button", { name: "Create account", exact: true }),
    ).toBeEnabled();
    await page
      .getByRole("button", { name: "Create account", exact: true })
      .click();
    await expect(page.locator("form").getByRole("alert")).toContainText(
      "may already have taken effect",
    );
    expect(requests).toBe(2);
  });
}

test("synchronous duplicate submissions share one request and cannot edit its fields", async ({
  page,
}) => {
  let requests = 0;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/login", async (route) => {
    requests++;
    await gate;
    await json(route, { error: "rejected" }, 401);
  });
  try {
    await page.goto("/login");
    await fill(page);
    await page.locator("form").evaluate((form) => {
      form.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
      form.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
    });
    await expect.poll(() => requests).toBe(1);
    await expect(
      page.getByLabel("Email address", { exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "Please wait..." }),
    ).toBeDisabled();
    release();
    await expect(page.locator("form").getByRole("alert")).toContainText(
      "not accepted",
    );
    expect(requests).toBe(1);
  } finally {
    release();
  }
});

test("leaving a pending form suppresses late success and navigation", async ({
  page,
}) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let received = false;
  let completed = false;
  await page.route("**/api/login", async (route) => {
    received = true;
    await gate;
    await json(route, authenticated).catch(() => {});
    completed = true;
  });
  try {
    await page.goto("/login");
    await fill(page);
    await page.getByRole("button", { name: "Continue to account" }).click();
    await expect.poll(() => received).toBe(true);
    await page.getByRole("link", { name: "Create one", exact: true }).click();
    await expect(page).toHaveURL(/\/signup$/);
    release();
    await expect.poll(() => completed).toBe(true);
    await expect(
      page.getByRole("heading", { name: "Create your account" }),
    ).toBeVisible();
    await expect(page.locator("form").getByRole("alert")).toHaveCount(0);
    await expect(page).toHaveURL(/\/signup$/);
  } finally {
    release();
  }
});

test("a stalled request times out, blocks retry and ignores a late acknowledgement", async ({
  page,
}) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let requests = 0;
  let completed = false;
  await page.route("**/api/login", async (route) => {
    requests++;
    await gate;
    await json(route, authenticated).catch(() => {});
    completed = true;
  });
  try {
    await page.goto("/login");
    await fill(page);
    await page.clock.install();
    await page.getByRole("button", { name: "Continue to account" }).click();
    await expect.poll(() => requests).toBe(1);
    await page.clock.fastForward(15001);
    await expect(page.locator("form").getByRole("alert")).toContainText(
      "may already have taken effect",
    );
    release();
    await expect.poll(() => completed).toBe(true);
    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole("button", { name: "Continue to account" }),
    ).toBeDisabled();
    expect(requests).toBe(1);
  } finally {
    release();
  }
});

test("mobile signup has named password controls, autocomplete and no horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/signup");
  await fill(page, "signup");
  const password = page.getByLabel("Password", { exact: true });
  await expect(page.getByRole("main")).toHaveCount(1);
  await expect(password).toHaveAttribute("autocomplete", "new-password");
  await expect(
    page.getByLabel("Email address", { exact: true }),
  ).toHaveAttribute("autocomplete", "email");
  await page
    .getByRole("button", { name: "Show confirm password", exact: true })
    .click();
  await expect(
    page.getByLabel("Confirm password", { exact: true }),
  ).toHaveAttribute("type", "text");
  await expect(password).toHaveAttribute("type", "password");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("the deadline also bounds a response body that ignores cancellation", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = window.fetch;
    window.fetch = (input, init) => {
      if (input !== "/api/login") return original(input, init);
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () =>
          new Promise((resolve) => {
            document.documentElement.dataset.fixtureBodyWaiting = "true";
            window.addEventListener(
              "fixture-release-auth-body",
              () => {
                resolve({
                  status: "authenticated",
                  user: { id: "12345678-1234-4234-8234-123456789abc" },
                });
                document.documentElement.dataset.fixtureBodyReleased = "true";
              },
              { once: true },
            );
          }),
      } as Response);
    };
  });
  await page.goto("/login");
  await fill(page);
  await page.clock.install();
  await page.getByRole("button", { name: "Continue to account" }).click();
  await expect(page.locator("html")).toHaveAttribute(
    "data-fixture-body-waiting",
    "true",
  );
  await page.clock.fastForward(15001);
  await expect(page.locator("form").getByRole("alert")).toContainText(
    "may already have taken effect",
  );
  await page.evaluate(() =>
    window.dispatchEvent(new Event("fixture-release-auth-body")),
  );
  await expect(page.locator("html")).toHaveAttribute(
    "data-fixture-body-released",
    "true",
  );
  await expect(
    page.getByRole("button", { name: "Continue to account" }),
  ).toBeDisabled();
  await expect(page).toHaveURL(/\/login$/);
});

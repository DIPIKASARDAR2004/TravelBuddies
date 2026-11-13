import {
  test,
  expect,
  json,
  booking,
  bookingId,
  plannerResult,
} from "./fixtures";
import type { Page } from "@playwright/test";

const bookingUrl =
  "https://travel-test.supabase.co/rest/v1/protected_bookings?*";
async function mockBooking(page: Page, status = "PROTECTED") {
  await page.route(bookingUrl, (route) => json(route, { ...booking, status }));
}
async function installPayment(
  page: Page,
  immediate = true,
  throwOnOpen = false,
) {
  await page.addInitScript(
    ({ immediate, throwOnOpen }) => {
      class Checkout {
        constructor(
          private options: {
            order_id: string;
            handler: (value: unknown) => Promise<void>;
            modal: { ondismiss: () => void };
          },
        ) {}
        on(_event: string, handler: (value: unknown) => void) {
          Reflect.set(window, "fixturePaymentFailed", handler);
        }
        close() {
          document.documentElement.dataset.fixtureCheckoutClosed = "true";
        }
        open() {
          const result = {
            razorpay_order_id: this.options.order_id,
            razorpay_payment_id: "pay_fixture",
            razorpay_signature: "signature_fixture",
          };
          const send = () => this.options.handler(result);
          Reflect.set(window, "fixturePaymentCallback", send);
          if (immediate) {
            void send();
            void send();
          }
          if (throwOnOpen) throw new Error("Fixture gateway opening failure");
        }
      }
      Reflect.set(window, "Razorpay", Checkout);
    },
    { immediate, throwOnOpen },
  );
}

test("synchronous action clicks send one mutation and lock competing actions", async ({
  page,
}) => {
  await mockBooking(page);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let count = 0;
  await page.route(`**/api/bookings/${bookingId}/release`, async (route) => {
    count++;
    await gate;
    await json(route, {
      success: true,
      status: "RELEASED",
      message: "Fixture released.",
    });
  });
  try {
    await page.goto(`/plan/checkout/${bookingId}`);
    await page
      .getByRole("button", { name: /^Confirm checkout/ })
      .evaluate((button) => {
        (button as HTMLButtonElement).click();
        (button as HTMLButtonElement).click();
      });
    await expect.poll(() => count).toBe(1);
    await expect(
      page.getByRole("button", { name: /^Cancel booking/ }),
    ).toBeDisabled();
    release();
    await expect(
      page.getByText("Fixture released.", { exact: true }),
    ).toBeVisible();
    expect(count).toBe(1);
  } finally {
    release();
  }
});

test("an action deadline locks mutations until a fresh read and explicit review", async ({
  page,
}) => {
  await mockBooking(page);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let count = 0;
  await page.route(`**/api/bookings/${bookingId}/cancel`, async (route) => {
    count++;
    await gate;
    await json(route, { success: true, status: "CANCELLED_BY_USER" }).catch(
      () => {},
    );
  });
  try {
    await page.goto(`/plan/checkout/${bookingId}`);
    await page.clock.install();
    await page.getByRole("button", { name: /^Cancel booking/ }).click();
    await expect.poll(() => count).toBe(1);
    await page.clock.fastForward(15001);
    await expect(
      page.getByText("Booking outcome unconfirmed", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^Open dispute/ }),
    ).toBeDisabled();
    await expect(
      page.getByRole("button", {
        name: "I've reviewed — enable actions",
        exact: true,
      }),
    ).toHaveCount(0);
    release();
    await page
      .getByRole("button", { name: "Refresh booking status", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: /^Open dispute/ }),
    ).toBeDisabled();
    await page
      .getByRole("button", {
        name: "I've reviewed — enable actions",
        exact: true,
      })
      .click();
    await expect(
      page.getByRole("button", { name: /^Open dispute/ }),
    ).toBeEnabled();
    expect(count).toBe(1);
  } finally {
    release();
  }
});

test("stalled booking reads time out with an explicit reload path", async ({
  page,
}) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let received = false;
  await page.route(bookingUrl, async (route) => {
    received = true;
    await gate;
    await json(route, booking).catch(() => {});
  });
  try {
    await page.clock.install();
    await page.goto(`/plan/checkout/${bookingId}`);
    await expect.poll(() => received).toBe(true);
    await page.clock.fastForward(15001);
    await expect(
      page.getByText("Checkout unavailable", { exact: true }),
    ).toBeVisible();
    release();
    await mockBooking(page);
    await page
      .getByRole("button", { name: "Reload booking", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: /^Confirm checkout/ }),
    ).toBeEnabled();
  } finally {
    release();
  }
});

test("a failed recovery read never unlocks the uncertain mutation", async ({
  page,
}) => {
  await mockBooking(page);
  await page.route(`**/api/bookings/${bookingId}/release`, (route) =>
    json(route, { success: true, status: "DISPUTED" }),
  );
  await page.goto(`/plan/checkout/${bookingId}`);
  await page.getByRole("button", { name: /^Confirm checkout/ }).click();
  await expect(
    page.getByText("Booking outcome unconfirmed", { exact: true }),
  ).toBeVisible();
  await page.route(bookingUrl, (route) =>
    json(route, { error: "denied" }, 403),
  );
  await page
    .getByRole("button", { name: "Refresh booking status", exact: true })
    .click();
  await expect(
    page.getByText("Checkout unavailable", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /^Open dispute/ })).toHaveCount(
    0,
  );
  await mockBooking(page);
  await page
    .getByRole("button", { name: "Reload booking", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: /^Open dispute/ }),
  ).toBeDisabled();
});

test("an old booking's late action cannot update a newly selected booking", async ({
  page,
}) => {
  const nextId = "87654321-4321-4321-8321-cba987654321";
  await page.route(bookingUrl, (route) => {
    const next =
      new URL(route.request().url()).searchParams.get("id") === `eq.${nextId}`;
    return json(route, {
      ...booking,
      id: next ? nextId : bookingId,
      status: "PROTECTED",
      hotel_snapshot: { name: next ? "Next fixture stay" : "Fixture stay" },
    });
  });
  await page.route("**/api/plan", (route) => json(route, plannerResult));
  await page.route("**/api/payments/create-order", (route) =>
    json(route, { success: true, booking_id: nextId }),
  );
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let received = false;
  let completed = false;
  await page.route(`**/api/bookings/${bookingId}/release`, async (route) => {
    received = true;
    await gate;
    await json(route, {
      success: true,
      status: "RELEASED",
      message: "Old fixture updated.",
    }).catch(() => {});
    completed = true;
  });
  try {
    await page.goto(`/plan/checkout/${bookingId}`);
    await page.getByRole("button", { name: /^Confirm checkout/ }).click();
    await expect.poll(() => received).toBe(true);
    await page
      .getByRole("button", { name: "Back to planner", exact: true })
      .click();
    await page.getByLabel("Destination", { exact: true }).fill("Fixture town");
    await page.getByLabel("Total budget", { exact: true }).fill("15000");
    await page.getByLabel(/^Check-in/).fill("2026-10-12");
    await page.getByLabel(/^Check-out/).fill("2026-10-14");
    await page.getByRole("button", { name: "See curated packages" }).click();
    await page.getByRole("button", { name: "Select and customize" }).click();
    await page
      .getByRole("button", { name: "Continue to protected checkout" })
      .click();
    await expect(page).toHaveURL(`/plan/checkout/${nextId}`);
    await expect(
      page.getByRole("heading", { name: "Next fixture stay", exact: true }),
    ).toBeVisible();
    release();
    await expect.poll(() => completed).toBe(true);
    await expect(
      page.getByRole("button", { name: /^Confirm checkout/ }),
    ).toBeEnabled();
    await expect(
      page.getByText("Old fixture updated.", { exact: true }),
    ).toHaveCount(0);
  } finally {
    release();
  }
});

test("duplicate gateway callbacks verify once and stale callbacks after success do nothing", async ({
  page,
}) => {
  await installPayment(page);
  await mockBooking(page, "PAYMENT_PENDING");
  let count = 0;
  await page.route("**/api/payments/verify", (route) => {
    count++;
    return json(route, { success: true, status: "PROTECTED" });
  });
  await page.goto(`/plan/checkout/${bookingId}`);
  await page
    .getByRole("button", { name: "Pay securely in test mode", exact: true })
    .evaluate((button) => {
      (button as HTMLButtonElement).click();
      (button as HTMLButtonElement).click();
    });
  await expect(
    page.getByText("Payment successful. Your booking is now protected.", {
      exact: true,
    }),
  ).toBeVisible();
  await page.evaluate(async () => {
    await Reflect.get(window, "fixturePaymentCallback")();
  });
  expect(count).toBe(1);
  await expect(
    page.getByRole("button", { name: /^Confirm checkout/ }),
  ).toBeEnabled();
});

test("leaving checkout closes its gateway and suppresses late verification dispatch", async ({
  page,
}) => {
  await installPayment(page, false);
  await mockBooking(page, "PAYMENT_PENDING");
  await page.goto(`/plan/checkout/${bookingId}`);
  await page
    .getByRole("button", { name: "Pay securely in test mode", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Back to planner", exact: true })
    .click();
  await expect(page).toHaveURL(/\/plan$/);
  await expect(page.locator("html")).toHaveAttribute(
    "data-fixture-checkout-closed",
    "true",
  );
  await page.evaluate(async () => {
    await Reflect.get(window, "fixturePaymentCallback")();
  });
  await expect(
    page.getByText("Payment successful. Your booking is now protected.", {
      exact: true,
    }),
  ).toHaveCount(0);
  // The shared fixture rejects every unmocked /api call, including a late verify.
});

test("stalled payment verification cannot reopen payment after the local deadline", async ({
  page,
}) => {
  await installPayment(page);
  await mockBooking(page, "PAYMENT_PENDING");
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let received = false;
  await page.route("**/api/payments/verify", async (route) => {
    received = true;
    await gate;
    await json(route, { success: true, status: "PROTECTED" }).catch(() => {});
  });
  try {
    await page.goto(`/plan/checkout/${bookingId}`);
    await page.clock.install();
    await page
      .getByRole("button", { name: "Pay securely in test mode", exact: true })
      .click();
    await expect.poll(() => received).toBe(true);
    await page.clock.fastForward(15001);
    await expect(
      page.getByText("Booking outcome unconfirmed", { exact: true }),
    ).toBeVisible();
    release();
    await expect(
      page.getByRole("button", {
        name: "Pay securely in test mode",
        exact: true,
      }),
    ).toBeDisabled();
    await expect(
      page.getByRole("button", { name: /^Confirm checkout/ }),
    ).toHaveCount(0);
  } finally {
    release();
  }
});

test("a provider failure does not expose diagnostics or authorize another payment", async ({
  page,
}) => {
  await installPayment(page, false);
  await mockBooking(page, "PAYMENT_PENDING");
  await page.goto(`/plan/checkout/${bookingId}`);
  await page
    .getByRole("button", { name: "Pay securely in test mode", exact: true })
    .click();
  await page.evaluate(() => {
    Reflect.get(
      window,
      "fixturePaymentFailed",
    )({ error: { description: "private fixture diagnostic" } });
  });
  await expect(
    page.getByText("Booking outcome unconfirmed", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("private fixture diagnostic")).toHaveCount(0);
  await expect(
    page.getByRole("button", {
      name: "Pay securely in test mode",
      exact: true,
    }),
  ).toBeDisabled();
  await page.evaluate(async () => {
    await Reflect.get(window, "fixturePaymentCallback")();
  });
});

test("a gateway throw after callback dispatch stays uncertain instead of enabling a second charge", async ({
  page,
}) => {
  await installPayment(page, true, true);
  await mockBooking(page, "PAYMENT_PENDING");
  await page.route("**/api/payments/verify", (route) =>
    json(route, { success: true, status: "PROTECTED" }),
  );
  await page.goto(`/plan/checkout/${bookingId}`);
  await page
    .getByRole("button", { name: "Pay securely in test mode", exact: true })
    .click();
  await expect(
    page.getByText("Booking outcome unconfirmed", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Pay securely in test mode",
      exact: true,
    }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: /^Confirm checkout/ }),
  ).toHaveCount(0);
});

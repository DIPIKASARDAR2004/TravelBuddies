import { test, expect, json, booking, bookingId } from "./fixtures";

test("a pending refund stays actionable for refresh without claiming completion", async ({
  page,
}) => {
  await page.route(
    "https://travel-test.supabase.co/rest/v1/protected_bookings?*",
    (route) => json(route, { ...booking, status: "PROTECTED" }),
  );
  await page.route(`**/api/bookings/${bookingId}/cancel`, (route) =>
    json(
      route,
      {
        success: true,
        status: "REFUND_PENDING",
        message: "Refund awaits provider confirmation.",
      },
      202,
    ),
  );
  await page.route(`**/api/bookings/${bookingId}/refund`, (route) =>
    json(route, {
      success: true,
      status: "CANCELLED_BY_USER",
      customer_refund_amount: 320000,
      message: "Test refund confirmed.",
    }),
  );
  await page.goto(`/plan/checkout/${bookingId}`);
  await page.getByRole("button", { name: /^Cancel booking/ }).click();
  await expect(
    page.getByText("Refund awaits provider confirmation.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/Refunded/)).toHaveCount(0);
  await page.getByRole("button", { name: "Refresh refund status" }).click();
  await expect(page.getByText(/Test refund confirmed./)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Refresh refund status" }),
  ).toHaveCount(0);
});

test("malformed booking and action responses never crash or change the displayed status", async ({
  page,
}) => {
  await page.route(
    "https://travel-test.supabase.co/rest/v1/protected_bookings?*",
    (route) => json(route, { ...booking, status: "NOT_A_STATUS" }),
  );
  await page.goto(`/plan/checkout/${bookingId}`);
  await expect(
    page.getByText("The server returned invalid booking details."),
  ).toBeVisible();
  await page.route(
    "https://travel-test.supabase.co/rest/v1/protected_bookings?*",
    (route) => json(route, { ...booking, status: "PROTECTED" }),
  );
  await page.route(`**/api/bookings/${bookingId}/release`, (route) =>
    json(route, { success: "true", status: "RELEASED" }),
  );
  await page.reload();
  await page.getByRole("button", { name: /^Confirm checkout/ }).click();
  await expect(
    page.getByText("The server did not confirm a valid booking update."),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /^Open dispute/ }),
  ).toBeEnabled();
});

test("missing booking dates never borrow an unrelated planner's dates", async ({
  page,
}) => {
  await page.addInitScript(() => {
    sessionStorage.setItem(
      "plan-storage",
      JSON.stringify({
        state: {
          tripDetails: {
            dates: { startDate: "2026-10-12", endDate: "2026-10-14" },
          },
        },
        version: 0,
      }),
    );
    Reflect.set(window, "Razorpay", class {});
  });
  await page.route(
    "https://travel-test.supabase.co/rest/v1/protected_bookings?*",
    (route) =>
      json(route, { ...booking, check_in_date: null, check_out_date: null }),
  );
  await page.goto(`/plan/checkout/${bookingId}`);
  await expect(
    page.getByText("Missing trip dates", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Pay securely in test mode" }),
  ).toBeDisabled();
  await expect(page.getByLabel("Check-in", { exact: true })).toHaveValue("");
});

test("dismissed payment unlocks the button and only valid verification protects the booking", async ({
  page,
}) => {
  await page.addInitScript(() => {
    let opens = 0;
    class TestCheckout {
      constructor(
        private options: {
          order_id: string;
          modal: { ondismiss: () => void };
          handler: (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => Promise<void>;
        },
      ) {}
      on() {}
      open() {
        opens += 1;
        if (opens === 1) return this.options.modal.ondismiss();
        void this.options.handler({
          razorpay_order_id: this.options.order_id,
          razorpay_payment_id: "payment_fixture",
          razorpay_signature: "signature_fixture",
        });
      }
    }
    Reflect.set(window, "Razorpay", TestCheckout);
  });
  await page.route(
    "https://travel-test.supabase.co/rest/v1/protected_bookings?*",
    (route) => json(route, booking),
  );
  let verifications = 0;
  await page.route("**/api/payments/verify", (route) => {
    verifications += 1;
    expect(route.request().postDataJSON()).toEqual({
      booking_id: bookingId,
      razorpay_order_id: "order_fixture",
      razorpay_payment_id: "payment_fixture",
      razorpay_signature: "signature_fixture",
    });
    return json(route, {
      success: verifications === 1 ? "true" : true,
      status: "PROTECTED",
    });
  });
  await page.goto(`/plan/checkout/${bookingId}`);
  const pay = page.getByRole("button", { name: "Pay securely in test mode" });
  await pay.click();
  await expect(pay).toBeEnabled();
  expect(verifications).toBe(0);
  await pay.click();
  await expect(
    page.getByText("Payment verification failed.", { exact: true }),
  ).toBeVisible();
  await expect(pay).toBeEnabled();
  await expect(
    page.getByRole("button", { name: /^Confirm checkout/ }),
  ).toHaveCount(0);
  await pay.click();
  await expect(
    page.getByText("Payment successful. Your booking is now protected."),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /^Confirm checkout/ }),
  ).toBeEnabled();
  expect(verifications).toBe(2);
});

test("a stalled payment SDK times out instead of leaving checkout loading forever", async ({
  page,
}) => {
  await page.clock.install();
  await page.route(
    "https://travel-test.supabase.co/rest/v1/protected_bookings?*",
    (route) => json(route, booking),
  );
  let release: () => void = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(
    "https://checkout.razorpay.com/v1/checkout.js",
    async (route) => {
      await held;
      await route.abort();
    },
  );
  try {
    await page.goto(`/plan/checkout/${bookingId}`, {
      waitUntil: "domcontentloaded",
    });
    await expect(
      page.getByRole("button", { name: "Loading secure checkout..." }),
    ).toBeVisible();
    await page.clock.fastForward(10001);
    await expect(
      page.getByRole("button", { name: "Secure checkout unavailable" }),
    ).toBeDisabled();
    await expect(
      page.getByText(
        "Secure checkout could not be loaded. Please refresh and try again.",
      ),
    ).toBeVisible();
  } finally {
    release();
  }
});

test("missing booking fails safely with a return to planner", async ({
  page,
}) => {
  await page.route(
    "https://travel-test.supabase.co/rest/v1/protected_bookings?*",
    (route) => json(route, { message: "Not found" }, 404),
  );
  await page.goto(`/plan/checkout/${bookingId}`);
  await expect(
    page.getByText("Checkout unavailable", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Return to planner" }).click();
  await expect(page).toHaveURL("/plan");
  await expect(page.getByLabel("Destination", { exact: true })).toBeVisible();
});

test("rejected checkout action preserves protection; successful dispute is read-only", async ({
  page,
}) => {
  await page.route(
    "https://travel-test.supabase.co/rest/v1/protected_bookings?*",
    (route) => json(route, { ...booking, status: "PROTECTED" }),
  );
  await page.route(`**/api/bookings/${bookingId}/release`, (route) =>
    json(route, { error: "Only the booking owner can do this." }, 403),
  );
  await page.route(`**/api/bookings/${bookingId}/dispute`, (route) =>
    json(route, {
      success: true,
      status: "DISPUTED",
      message: "Dispute recorded.",
    }),
  );
  await page.goto(`/plan/checkout/${bookingId}`);
  await page.getByRole("button", { name: /^Confirm checkout/ }).click();
  await expect(
    page.getByText("Only the booking owner can do this."),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /^Open dispute/ }),
  ).toBeEnabled();
  await page.getByRole("button", { name: /^Open dispute/ }).click();
  await expect(page.getByText("Dispute recorded.")).toBeVisible();
  await expect(page.getByRole("button", { name: /^Open dispute/ })).toHaveCount(
    0,
  );
  await expect(page.getByRole("button", { name: /Pay securely/ })).toHaveCount(
    0,
  );
});

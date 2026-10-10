import { createHmac } from "node:crypto";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { PaymentDatabase } from "./support/paymentDatabase";
import { PaymentError } from "@/lib/checkout/paymentContracts";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  client: vi.fn(),
  createOrder: vi.fn(),
  fetchPayment: vi.fn(),
  refund: vi.fn(),
}));
vi.mock("@/lib/supabaseServer", () => ({
  requireUser: mocks.requireUser,
  createSupabaseServerClient: vi.fn().mockResolvedValue({}),
  UnauthenticatedError: class extends Error {
    statusCode = 401;
    constructor() {
      super("Authentication required");
    }
  },
}));
vi.mock("@supabase/supabase-js", () => ({ createClient: mocks.client }));
vi.mock("@/lib/services/razorpay", () => ({
  createTestOrder: mocks.createOrder,
  fetchTestPayment: mocks.fetchPayment,
  confirmTestRefund: mocks.refund,
}));
import { UnauthenticatedError } from "@/lib/supabaseServer";
import { POST as create } from "@/app/api/payments/create-order/route";
import { POST as verify } from "@/app/api/payments/verify/route";
import { POST as cancel } from "@/app/api/bookings/[id]/cancel/route";
import { POST as release } from "@/app/api/bookings/[id]/release/route";
import { POST as dispute } from "@/app/api/bookings/[id]/dispute/route";
import { POST as refreshRefund } from "@/app/api/bookings/[id]/refund/route";
import { POST as hotelAction } from "@/app/api/hotel-admin/bookings/[id]/cancel/route";

const owner = "10000000-0000-4000-8000-000000000001";
const id = "20000000-0000-4000-8000-000000000001";
const key = "30000000-0000-4000-8000-000000000001";
const context = { params: Promise.resolve({ id }) };
const input = {
  hotel: { name: "Fixture stay", price: 1, rating: 5 },
  destination: "Fixture town",
  travellers: 3,
  days: 2,
  checkInDate: "2026-10-12",
  checkOutDate: "2026-10-14",
};
const request = (body?: unknown) =>
  new Request("http://test/api", {
    method: "POST",
    headers: { "Idempotency-Key": key },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
const verification = () => ({
  booking_id: id,
  razorpay_order_id: "order_fixture",
  razorpay_payment_id: "pay_fixture",
  razorpay_signature: createHmac("sha256", "fixture-secret")
    .update("order_fixture|pay_fixture")
    .digest("hex"),
});
const pending = {
  id,
  user_id: owner,
  amount_paise: 400000,
  currency: "INR",
  status: "PAYMENT_PENDING",
  order_creation_state: "READY",
  payment_key_id: "rzp_test_fixture",
  razorpay_order_id: "order_fixture",
  razorpay_payment_id: null,
  razorpay_refund_id: null,
  nights: 2,
  check_in_date: "2026-10-12",
};
let db: PaymentDatabase;

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("PAYMENTS_TEST_MODE_ENABLED", "true");
  vi.stubEnv("RAZORPAY_KEY_ID", "rzp_test_fixture");
  vi.stubEnv("NEXT_PUBLIC_RAZORPAY_KEY_ID", "rzp_test_fixture");
  vi.stubEnv("RAZORPAY_KEY_SECRET", "fixture-secret");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://fixture.invalid");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "server-fixture");
  vi.stubEnv("HOTEL_SIMULATOR_ENABLED", "false");
  db = new PaymentDatabase();
  mocks.client.mockReturnValue(db);
  mocks.requireUser.mockResolvedValue({ id: owner });
  mocks.createOrder.mockResolvedValue({ id: "order_new" });
  mocks.fetchPayment.mockResolvedValue({
    id: "pay_fixture",
    order_id: "order_fixture",
    amount: 400000,
    currency: "INR",
    status: "captured",
    captured: true,
    amount_refunded: 0,
  });
  mocks.refund.mockResolvedValue({ id: "rfnd_fixture", status: "processed" });
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

it("guards all payment mutations before constructing a privileged client", async () => {
  mocks.requireUser.mockRejectedValue(new UnauthenticatedError());
  for (const handler of [
    create,
    verify,
    cancel,
    release,
    dispute,
    refreshRefund,
    hotelAction,
  ])
    expect((await handler(request(), context)).status).toBe(401);
  expect(mocks.client).not.toHaveBeenCalled();
  expect(mocks.createOrder).not.toHaveBeenCalled();
});
it("fails closed when disabled, missing a secret, or given a live key", async () => {
  for (const [name, value] of [
    ["PAYMENTS_TEST_MODE_ENABLED", "false"],
    ["RAZORPAY_KEY_SECRET", ""],
    ["RAZORPAY_KEY_ID", "rzp_live_fixture"],
  ]) {
    const original = process.env[name];
    vi.stubEnv(name, value);
    expect((await create(request(input), context)).status).toBe(503);
    vi.stubEnv(name, original);
  }
  expect(mocks.client).not.toHaveBeenCalled();
});
it("rejects cross-origin mutations before opening a privileged client", async () => {
  const response = await create(
    new Request("http://test/api", {
      method: "POST",
      headers: { Origin: "https://other.invalid" },
      body: JSON.stringify(input),
    }),
    context,
  );
  expect(response.status).toBe(403);
  expect(mocks.client).not.toHaveBeenCalled();
});
it("prices from the catalog, binds ownership and reuses a durable request key", async () => {
  const first = await create(
    request({ ...input, user_id: "attacker", amount_paise: 1 }),
    context,
  );
  expect(first.status).toBe(200);
  expect(await first.json()).toMatchObject({ amount_paise: 800000 });
  expect(db.bookings[0]).toMatchObject({
    user_id: owner,
    rooms: 2,
    amount_paise: 800000,
    hotel_snapshot: { price_per_night: 2000, rating: 4.2 },
    check_in_date: "2026-10-12",
  });
  expect(mocks.createOrder).toHaveBeenCalledWith(
    { keyId: "rzp_test_fixture", keySecret: "fixture-secret" },
    800000,
    db.bookings[0].id,
  );
  expect((await create(request(input), context)).status).toBe(200);
  expect(mocks.createOrder).toHaveBeenCalledOnce();
  expect(
    (await create(request({ ...input, travellers: 2 }), context)).status,
  ).toBe(409);
});
it("prevents concurrent creates from issuing duplicate provider orders", async () => {
  const results = await Promise.all([
    create(request(input), context),
    create(request(input), context),
  ]);
  expect(results.map((response) => response.status)).toContain(200);
  expect(
    results.every((response) => [200, 409].includes(response.status)),
  ).toBe(true);
  expect(mocks.createOrder).toHaveBeenCalledOnce();
  expect(db.bookings).toHaveLength(1);
});
it("retains an uncertain order for reconciliation instead of creating another", async () => {
  mocks.createOrder.mockRejectedValue(
    new PaymentError("Provider unavailable", 502),
  );
  expect((await create(request(input), context)).status).toBe(502);
  expect(db.bookings[0].order_creation_state).toBe("RECONCILE");
  expect((await create(request(input), context)).status).toBe(409);
  expect(mocks.createOrder).toHaveBeenCalledOnce();
});
it("rejects missing/ambiguous hotels and invalid body types without a provider call", async () => {
  db.hotels = [];
  expect((await create(request(input), context)).status).toBe(409);
  db.hotels = [
    { hotel_name: "Fixture stay", destination: "Fixture town" },
    { hotel_name: "Fixture stay", destination: "Fixture town" },
  ];
  expect((await create(request(input), context)).status).toBe(409);
  expect((await create(request({ ...input, days: "2" }), context)).status).toBe(
    400,
  );
  expect(mocks.createOrder).not.toHaveBeenCalled();
});
it("does not let another owner read or mutate the booking", async () => {
  db.bookings = [{ ...pending, user_id: "someone-else", status: "PROTECTED" }];
  for (const [handler, body] of [
    [verify, verification()],
    [release, undefined],
    [cancel, undefined],
    [dispute, undefined],
    [refreshRefund, undefined],
  ] as const)
    expect((await handler(request(body), context)).status).toBe(404);
  expect(db.writes).toHaveLength(0);
  expect(mocks.fetchPayment).not.toHaveBeenCalled();
  expect(mocks.refund).not.toHaveBeenCalled();
});
it("rejects forged signatures without marking any booking failed", async () => {
  db.bookings = [{ ...pending }];
  expect(
    (
      await verify(
        request({ ...verification(), razorpay_signature: "0".repeat(64) }),
        context,
      )
    ).status,
  ).toBe(400);
  expect(db.writes).toHaveLength(0);
  expect(mocks.fetchPayment).not.toHaveBeenCalled();
});
it.each([
  { amount: 1 },
  { order_id: "order_other" },
  { status: "authorized", captured: false },
  { amount_refunded: 1 },
  { currency: "USD" },
])("requires matching captured provider details: %j", async (mismatch) => {
  db.bookings = [{ ...pending }];
  const baseline = await mocks.fetchPayment();
  mocks.fetchPayment.mockResolvedValue({ ...baseline, ...mismatch });
  expect((await verify(request(verification()), context)).status).toBe(409);
  expect(db.writes).toHaveLength(0);
});
it("accepts a valid captured payment exactly once and never reopens a closed booking", async () => {
  db.bookings = [{ ...pending }];
  expect((await verify(request(verification()), context)).status).toBe(200);
  expect(db.bookings[0].status).toBe("PROTECTED");
  expect((await verify(request(verification()), context)).status).toBe(200);
  expect(mocks.fetchPayment).toHaveBeenCalledOnce();
  for (const status of [
    "RELEASED",
    "DISPUTED",
    "REFUND_PENDING",
    "CANCELLED_BY_USER",
  ]) {
    db.bookings[0].status = status;
    expect((await verify(request(verification()), context)).status).toBe(409);
    expect(db.bookings[0].status).toBe(status);
  }
});
it("does not report success on a lost state race or reuse of another booking's payment", async () => {
  db.bookings = [{ ...pending }];
  db.beforeUpdate = () => {
    db.bookings[0].status = "DISPUTED";
  };
  expect((await verify(request(verification()), context)).status).toBe(409);
  db.bookings = [
    { ...pending },
    {
      ...pending,
      id: key,
      razorpay_order_id: "order_other",
      razorpay_payment_id: "pay_fixture",
    },
  ];
  expect((await verify(request(verification()), context)).status).toBe(409);
  expect(db.bookings[0].status).toBe("PAYMENT_PENDING");
});
it("serializes release/dispute outcomes with a guarded update", async () => {
  db.bookings = [
    { ...pending, status: "PROTECTED", razorpay_payment_id: "pay_fixture" },
  ];
  const results = await Promise.all([
    release(request(), context),
    dispute(request(), context),
  ]);
  expect(results.map((response) => response.status).sort()).toEqual([200, 409]);
  expect(["RELEASED", "DISPUTED"]).toContain(db.bookings[0].status);
});
it("keeps uncertain refunds pending and retries with the original amount and key", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-10T00:00:00Z"));
  db.bookings = [
    { ...pending, status: "PROTECTED", razorpay_payment_id: "pay_fixture" },
  ];
  mocks.refund.mockRejectedValueOnce(new PaymentError("Provider timeout", 502));
  const first = await cancel(request(), context);
  expect(first.status).toBe(202);
  expect(await first.json()).not.toHaveProperty("customer_refund_amount");
  expect(db.bookings[0]).toMatchObject({
    status: "REFUND_PENDING",
    customer_refund_amount: 320000,
    razorpay_refund_id: null,
  });
  vi.setSystemTime(new Date("2026-10-11T12:00:00Z"));
  expect((await refreshRefund(request(), context)).status).toBe(200);
  expect(mocks.refund.mock.calls[0]).toEqual(mocks.refund.mock.calls[1]);
  expect(db.bookings[0].status).toBe("CANCELLED_BY_USER");
  expect((await cancel(request(), context)).status).toBe(200);
  expect(mocks.refund).toHaveBeenCalledTimes(2);
});
it("never pretends pending or failed provider refunds succeeded", async () => {
  db.bookings = [
    { ...pending, status: "PROTECTED", razorpay_payment_id: "pay_fixture" },
  ];
  mocks.refund.mockResolvedValue({ id: "rfnd_fixture", status: "pending" });
  expect((await cancel(request(), context)).status).toBe(202);
  mocks.refund.mockResolvedValue({ id: "rfnd_fixture", status: "failed" });
  expect((await refreshRefund(request(), context)).status).toBe(202);
  expect(db.bookings[0].status).toBe("REFUND_PENDING");
  expect(mocks.refund.mock.calls[1][4]).toBe("rfnd_fixture");
});
it("keeps the hotel simulator disabled by default and owner-only when enabled", async () => {
  db.bookings = [
    { ...pending, status: "PROTECTED", razorpay_payment_id: "pay_fixture" },
  ];
  expect(
    (await hotelAction(request({ action: "CANCEL" }), context)).status,
  ).toBe(403);
  vi.stubEnv("HOTEL_SIMULATOR_ENABLED", "true");
  expect(
    (await hotelAction(request({ action: "UNKNOWN" }), context)).status,
  ).toBe(400);
  db.bookings[0].user_id = "someone-else";
  expect(
    (await hotelAction(request({ action: "CANCEL" }), context)).status,
  ).toBe(404);
  expect(mocks.refund).not.toHaveBeenCalled();
});
it("redacts database failures and never reports a zero-row write as successful", async () => {
  db.bookings = [{ ...pending }];
  db.updateError = "XX000";
  const response = await verify(request(verification()), context);
  expect(response.status).toBe(500);
  expect(await response.text()).not.toContain("private database");
  expect(db.bookings[0].status).toBe("PAYMENT_PENDING");
});

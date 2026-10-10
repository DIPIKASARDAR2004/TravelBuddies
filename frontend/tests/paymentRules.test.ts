import { afterEach, expect, it, vi } from "vitest";
import {
  accommodationPaise,
  parseCreateOrder,
  parseVerification,
  refundBreakdown,
} from "@/lib/checkout/paymentContracts";
import { getPaymentConfig } from "@/lib/checkout/paymentServer";
import {
  readBookingAction,
  readProtectedBooking,
} from "@/lib/checkout/bookingResponses";

const id = "12345678-1234-4234-8234-123456789abc";
const input = {
  hotel: { name: "Fixture stay", price: 1 },
  destination: "Fixture town",
  travellers: 3,
  days: 2,
  checkInDate: "2026-10-12",
  checkOutDate: "2026-10-14",
};
afterEach(() => vi.unstubAllEnvs());

it("accepts dates and identities but never accepts a client-supplied price or owner", () => {
  const parsed = parseCreateOrder(
    { ...input, user_id: "attacker", amount_paise: 1 },
    id,
  );
  expect(parsed).toEqual({
    hotelName: "Fixture stay",
    destination: "Fixture town",
    travellers: 3,
    nights: 2,
    checkIn: "2026-10-12",
    checkOut: "2026-10-14",
    idempotencyKey: id,
  });
  expect(accommodationPaise(123.45, 3, 2)).toBe(49380);
});
it("rejects malformed requests, date rollovers, fractional counts and unsafe amounts", () => {
  for (const body of [
    null,
    [],
    {},
    { ...input, travellers: "3" },
    { ...input, travellers: 1.5 },
    { ...input, days: -1 },
    { ...input, checkInDate: "2026-02-30" },
    { ...input, days: 3 },
    { ...input, hotel: { name: " " } },
  ])
    expect(() => parseCreateOrder(body, id)).toThrow();
  expect(() => parseCreateOrder(input, null)).toThrow("Idempotency-Key");
  for (const price of [
    null,
    "",
    "2000",
    -1,
    0,
    NaN,
    Infinity,
    1.001,
    2147483647,
  ])
    expect(() => accommodationPaise(price, 3, 2)).toThrow();
  expect(() =>
    parseVerification({
      booking_id: id,
      razorpay_order_id: "../private",
      razorpay_payment_id: "pay_test",
      razorpay_signature: "f".repeat(64),
    }),
  ).toThrow();
});
it.each([
  [72, 10000],
  [71.999, 8000],
  [24, 8000],
  [23.999, 5000],
  [0, 5000],
])(
  "applies the documented cancellation boundary at %s hours",
  (hours, expected) => {
    const now = new Date(Date.parse("2026-10-12T00:00:00Z") - hours * 3600000);
    const result = refundBreakdown(
      { amount_paise: 10000, nights: 2, check_in_date: "2026-10-12" },
      "TRAVELLER_CANCEL",
      now,
    );
    expect(result.customer_refund_amount).toBe(expected);
    expect(
      result.customer_refund_amount +
        result.hotel_net_payout +
        result.platform_commission_amount,
    ).toBe(10000);
  },
);
it("uses integer paise for no-shows and hotel cancellations", () => {
  const booking = {
    amount_paise: 10001,
    nights: 3,
    check_in_date: "2026-10-12",
  };
  expect(() =>
    refundBreakdown(booking, "NO_SHOW", new Date("2026-10-11")),
  ).toThrow("before check-in");
  const result = refundBreakdown(booking, "NO_SHOW", new Date("2026-10-13"));
  expect(result.customer_refund_amount).toBe(6668);
  expect(
    result.customer_refund_amount +
      result.hotel_net_payout +
      result.platform_commission_amount,
  ).toBe(10001);
  expect(
    refundBreakdown(booking, "HOTEL_CANCEL", new Date()).customer_refund_amount,
  ).toBe(10001);
});
it("requires explicit enabled test mode and matching nonempty account credentials", () => {
  vi.stubEnv("PAYMENTS_TEST_MODE_ENABLED", "true");
  vi.stubEnv("RAZORPAY_KEY_ID", "rzp_test_fixture");
  vi.stubEnv("NEXT_PUBLIC_RAZORPAY_KEY_ID", "rzp_test_fixture");
  vi.stubEnv("RAZORPAY_KEY_SECRET", "fixture-secret");
  expect(getPaymentConfig().keyId).toBe("rzp_test_fixture");
  for (const [key, value] of [
    ["PAYMENTS_TEST_MODE_ENABLED", "false"],
    ["RAZORPAY_KEY_ID", "rzp_live_fixture"],
    ["RAZORPAY_KEY_SECRET", ""],
    ["NEXT_PUBLIC_RAZORPAY_KEY_ID", "rzp_test_other"],
  ]) {
    const original = process.env[key];
    vi.stubEnv(key, value);
    expect(() => getPaymentConfig()).toThrow("not configured");
    vi.stubEnv(key, original);
  }
});
it("rejects malformed booking/action responses instead of rendering untrusted state", () => {
  expect(() => readProtectedBooking({ id, status: "UNKNOWN" }, id)).toThrow(
    "invalid booking",
  );
  for (const body of [
    null,
    { success: "true", status: "PROTECTED" },
    { success: true, status: "UNKNOWN" },
    { success: true, status: "REFUNDED", customer_refund_amount: -1 },
  ])
    expect(() => readBookingAction(body)).toThrow();
  expect(
    readBookingAction({ success: true, status: "REFUND_PENDING" }).status,
  ).toBe("REFUND_PENDING");
});

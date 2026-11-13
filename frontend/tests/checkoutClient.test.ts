import { afterEach, expect, it, vi } from "vitest";
vi.mock("@/lib/supabaseBrowserClient", () => ({
  supabaseBrowser: { from: vi.fn() },
}));
import {
  checkedCheckoutAction,
  performCheckoutAction,
  waitForCheckout,
  CHECKOUT_WAIT_MS,
  type CheckoutAction,
} from "@/lib/checkout/checkoutClient";
import type { ProtectedBooking } from "@/types";

const booking: ProtectedBooking = {
  id: "12345678-1234-4234-8234-123456789abc",
  status: "PROTECTED",
  currency: "INR",
  amount_paise: 400000,
  travellers: 2,
  nights: 2,
  rooms: 1,
  destination: "Fixture town",
  check_in_date: "2026-10-12",
  check_out_date: "2026-10-14",
  hotel_snapshot: { name: "Fixture" },
  razorpay_order_id: "order_fixture",
};
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

it.each([
  ["release", "RELEASED"],
  ["dispute", "DISPUTED"],
  ["cancel", "CANCELLED_BY_USER"],
  ["hotel_cancel", "CANCELLED_BY_HOTEL"],
  ["no_show", "NO_SHOW"],
  ["refund", "REFUND_PENDING"],
] as const)("accepts the concrete %s outcome", (action, status) => {
  expect(
    checkedCheckoutAction({ success: true, status }, booking, action).status,
  ).toBe(status);
});
it.each([
  ["release", { success: true, status: "PROTECTED" }],
  ["cancel", { success: true, status: "CANCELLED_BY_HOTEL" }],
  ["refund", { success: true, status: "RELEASED" }],
  [
    "cancel",
    { success: true, status: "REFUND_PENDING", customer_refund_amount: 1 },
  ],
  [
    "cancel",
    {
      success: true,
      status: "CANCELLED_BY_USER",
      customer_refund_amount: 400001,
    },
  ],
  ["release", { success: true, status: "RELEASED", customer_refund_amount: 0 }],
] as Array<[CheckoutAction, unknown]>)(
  "rejects contradictory update %#",
  (action, body) => {
    expect(() => checkedCheckoutAction(body, booking, action)).toThrow();
  },
);
it("uses the concrete simulator URL and projects the action body", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValue(Response.json({ success: true, status: "NO_SHOW" }));
  vi.stubGlobal("fetch", fetch);
  await performCheckoutAction(booking, "no_show", new AbortController().signal);
  expect(fetch).toHaveBeenCalledWith(
    `/api/hotel-admin/bookings/${booking.id}/cancel`,
    expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ action: "NO_SHOW" }),
      cache: "no-store",
    }),
  );
});
it("invalid IDs and impossible local actions never start HTTP", () => {
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);
  expect(() =>
    performCheckoutAction(
      { ...booking, id: "bad" },
      "release",
      new AbortController().signal,
    ),
  ).toThrow();
  expect(() =>
    performCheckoutAction(booking, "refund", new AbortController().signal),
  ).toThrow();
  expect(fetch).not.toHaveBeenCalled();
});
it.each([403, 409, 500])(
  "distinguishes permission rejection from uncertain/conflicting HTTP %i",
  async (status) => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ error: "Fixture message" }, { status }),
        ),
    );
    await expect(
      performCheckoutAction(booking, "release", new AbortController().signal),
    ).rejects.toMatchObject({ uncertain: status !== 403 });
  },
);
it("rejects non-JSON success as uncertain", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue(new Response("<html>not an acknowledgement</html>")),
  );
  await expect(
    performCheckoutAction(booking, "release", new AbortController().signal),
  ).rejects.toMatchObject({ uncertain: true });
});
it("deadline releases waiting even if the adapter ignores cancellation", async () => {
  vi.useFakeTimers();
  let signal!: AbortSignal;
  const task = waitForCheckout(new AbortController().signal, (current) => {
    signal = current;
    return new Promise<never>(() => {});
  });
  const check = expect(task).rejects.toThrow("timed out");
  await vi.advanceTimersByTimeAsync(CHECKOUT_WAIT_MS);
  await check;
  expect(signal.aborted).toBe(true);
  expect(vi.getTimerCount()).toBe(0);
});
it("cancellation and successful completion both clean up deadline timers", async () => {
  vi.useFakeTimers();
  const controller = new AbortController();
  const task = waitForCheckout(
    controller.signal,
    () => new Promise<never>(() => {}),
  );
  const check = expect(task).rejects.toThrow();
  controller.abort();
  await check;
  await expect(
    waitForCheckout(new AbortController().signal, async () => 1),
  ).resolves.toBe(1);
  expect(vi.getTimerCount()).toBe(0);
});

import { afterEach, expect, it, vi } from "vitest";
import {
  createTestOrder,
  fetchTestPayment,
  confirmTestRefund,
} from "@/lib/services/razorpay";
const config = { keyId: "rzp_test_fixture", keySecret: "fixture-secret" };
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it("sends server authentication and a bounded order request with matching response fields", async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValue(
      Response.json({
        id: "order_fixture",
        amount: 10000,
        currency: "INR",
        receipt: "receipt",
        status: "created",
      }),
    );
  vi.stubGlobal("fetch", fetcher);
  expect(await createTestOrder(config, 10000, "receipt")).toEqual({
    id: "order_fixture",
  });
  const [url, options] = fetcher.mock.calls[0];
  expect(url).toBe("https://api.razorpay.com/v1/orders");
  expect(options.headers.Authorization).toBe(
    `Basic ${Buffer.from("rzp_test_fixture:fixture-secret").toString("base64")}`,
  );
  expect(options.signal).toBeInstanceOf(AbortSignal);
  expect(options.redirect).toBe("error");
  expect(JSON.parse(options.body)).toEqual({
    amount: 10000,
    currency: "INR",
    receipt: "receipt",
  });
});
it("redacts non-JSON/network/provider errors and rejects mismatched order data", async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(
      new Response("private upstream detail", { status: 502 }),
    )
    .mockResolvedValueOnce(
      Response.json({
        id: "order_fixture",
        amount: 1,
        currency: "INR",
        receipt: "receipt",
        status: "created",
      }),
    );
  vi.stubGlobal("fetch", fetcher);
  await expect(createTestOrder(config, 10000, "receipt")).rejects.toThrow(
    "could not confirm",
  );
  await expect(createTestOrder(config, 10000, "receipt")).rejects.toThrow(
    "inconsistent order",
  );
});
it("propagates the timeout signal into the provider fetch and fails safely on abort", async () => {
  const controller = new AbortController();
  const timeout = vi
    .spyOn(AbortSignal, "timeout")
    .mockReturnValue(controller.signal);
  vi.stubGlobal(
    "fetch",
    vi.fn(
      (_url, options) =>
        new Promise((_resolve, reject) =>
          options.signal.addEventListener("abort", () =>
            reject(new Error("private socket details")),
          ),
        ),
    ),
  );
  const call = createTestOrder(config, 10000, "receipt");
  const rejected = expect(call).rejects.toThrow("could not confirm");
  controller.abort();
  await rejected;
  expect(timeout).toHaveBeenCalledWith(15000);
});
it("checks provider payment identifiers and blocks path injection", async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValue(
      Response.json({
        id: "pay_other",
        order_id: "order_fixture",
        amount: 10000,
        currency: "INR",
        status: "captured",
        amount_refunded: 0,
      }),
    );
  vi.stubGlobal("fetch", fetcher);
  await expect(fetchTestPayment(config, "../private")).rejects.toThrow(
    "Invalid payment ID",
  );
  expect(fetcher).not.toHaveBeenCalled();
  await expect(fetchTestPayment(config, "pay_fixture")).rejects.toThrow(
    "inconsistent payment",
  );
});
it("reuses a refund key/payload and polls an existing refund without sending another POST", async () => {
  const fetcher = vi
    .fn()
    .mockImplementation(() =>
      Promise.resolve(
        Response.json({
          id: "rfnd_fixture",
          payment_id: "pay_fixture",
          amount: 8000,
          currency: "INR",
          status: "processed",
        }),
      ),
    );
  vi.stubGlobal("fetch", fetcher);
  await confirmTestRefund(
    config,
    "pay_fixture",
    8000,
    "stable-request-key",
    null,
  );
  await confirmTestRefund(
    config,
    "pay_fixture",
    8000,
    "stable-request-key",
    null,
  );
  expect(fetcher.mock.calls[0][1].headers["X-Refund-Idempotency"]).toBe(
    "stable-request-key",
  );
  expect(fetcher.mock.calls[0][1].body).toBe(fetcher.mock.calls[1][1].body);
  await confirmTestRefund(
    config,
    "pay_fixture",
    8000,
    "stable-request-key",
    "rfnd_fixture",
  );
  expect(fetcher.mock.calls[2][0]).toBe(
    "https://api.razorpay.com/v1/refunds/rfnd_fixture",
  );
  expect(fetcher.mock.calls[2][1].method).toBe("GET");
});
it("rejects inconsistent or invented provider refund outcomes", async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValue(
      Response.json({
        id: "simulated_refund_1",
        payment_id: "pay_other",
        amount: 1,
        currency: "INR",
        status: "processed",
      }),
    );
  vi.stubGlobal("fetch", fetcher);
  await expect(
    confirmTestRefund(config, "pay_fixture", 8000, "stable-request-key", null),
  ).rejects.toThrow("inconsistent refund");
});

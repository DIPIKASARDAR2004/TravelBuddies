import { afterEach, expect, it, vi } from "vitest";
import { requestJson } from "@/lib/client/requestJson";
afterEach(() => vi.unstubAllGlobals());
it("preserves Headers and a caller's cancellation signal", async () => {
  const fetcher = vi.fn().mockResolvedValue(new Response('{"ok":true}'));
  vi.stubGlobal("fetch", fetcher);
  const controller = new AbortController();
  expect(
    await requestJson("/api/test", {
      method: "POST",
      body: "{}",
      headers: new Headers({ "X-Test": "yes" }),
      signal: controller.signal,
    }),
  ).toEqual({ ok: true });
  const options = fetcher.mock.calls[0][1];
  expect(options.headers.get("X-Test")).toBe("yes");
  expect(options.headers.get("Content-Type")).toBe("application/json");
  expect(options.signal).toBe(controller.signal);
});
it("accepts empty deletion responses and does not set JSON headers on FormData", async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValue(new Response(null, { status: 204 }));
  vi.stubGlobal("fetch", fetcher);
  expect(
    await requestJson("/api/test", { method: "POST", body: new FormData() }),
  ).toBeUndefined();
  expect(fetcher.mock.calls[0][1].headers.has("Content-Type")).toBe(false);
});
it("reports JSON errors and non-JSON upstream failures without HTML leakage", async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(
      new Response('{"error":"Not found"}', { status: 404 }),
    )
    .mockResolvedValueOnce(
      new Response("<html>private proxy details</html>", { status: 502 }),
    )
    .mockResolvedValueOnce(new Response("{invalid"));
  vi.stubGlobal("fetch", fetcher);
  await expect(requestJson("/api/test")).rejects.toThrow("Not found");
  await expect(requestJson("/api/test")).rejects.toThrow("The request failed");
  await expect(requestJson("/api/test")).rejects.toThrow("invalid response");
});

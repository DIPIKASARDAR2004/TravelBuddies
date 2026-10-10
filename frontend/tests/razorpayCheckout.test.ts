import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { loadRazorpayCheckout } from "@/lib/client/razorpayCheckout";

class TestScript extends EventTarget {
  src = "";
  async = false;
  remove = vi.fn();
}
let script: TestScript;
let append: ReturnType<typeof vi.fn>;
beforeEach(() => {
  vi.useFakeTimers();
  script = new TestScript();
  append = vi.fn();
  vi.stubGlobal("window", { setTimeout, clearTimeout });
  vi.stubGlobal("document", {
    querySelector: () => null,
    createElement: () => script,
    body: { appendChild: append },
  });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it("does not treat a loaded script without the checkout constructor as ready", async () => {
  const result = loadRazorpayCheckout(new AbortController().signal);
  const rejected = expect(result).rejects.toThrow("could not be loaded");
  script.dispatchEvent(new Event("load"));
  await rejected;
  expect(script.remove).toHaveBeenCalledOnce();
  expect(vi.getTimerCount()).toBe(0);
});

it("bounds a stalled SDK request and cleans up owned scripts and timers", async () => {
  const result = loadRazorpayCheckout(new AbortController().signal);
  const rejected = expect(result).rejects.toThrow("could not be loaded");
  await vi.advanceTimersByTimeAsync(10000);
  await rejected;
  expect(script.remove).toHaveBeenCalledOnce();
  expect(vi.getTimerCount()).toBe(0);
});

it("cancels an in-flight script on unmount and reuses an already loaded constructor", async () => {
  const controller = new AbortController();
  const result = loadRazorpayCheckout(controller.signal);
  const rejected = expect(result).rejects.toMatchObject({ name: "AbortError" });
  controller.abort();
  await rejected;
  expect(script.remove).toHaveBeenCalledOnce();
  expect(vi.getTimerCount()).toBe(0);
  Reflect.set(window, "Razorpay", class {});
  await loadRazorpayCheckout(new AbortController().signal);
  expect(append).toHaveBeenCalledOnce();
});

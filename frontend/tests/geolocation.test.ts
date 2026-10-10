import { afterEach, expect, it, vi } from "vitest";
import { requestCurrentPosition } from "@/lib/client/safetyClient";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
const position = {
  coords: { latitude: 0, longitude: 0 },
} as GeolocationPosition;
function browser() {
  let success!: PositionCallback;
  let failure!: PositionErrorCallback;
  const getCurrentPosition = vi.fn(
    (done: PositionCallback, fail: PositionErrorCallback) => {
      success = done;
      failure = fail;
    },
  );
  vi.stubGlobal("navigator", { geolocation: { getCurrentPosition } });
  return {
    getCurrentPosition,
    succeed: (value = position) => success(value),
    fail: (code: number) => failure({ code } as GeolocationPositionError),
  };
}
it("only requests location explicitly, accepts zero degrees and cleans up after success", async () => {
  vi.useFakeTimers();
  const mock = browser();
  expect(mock.getCurrentPosition).not.toHaveBeenCalled();
  const pending = requestCurrentPosition();
  expect(mock.getCurrentPosition).toHaveBeenCalledWith(
    expect.any(Function),
    expect.any(Function),
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
  );
  mock.succeed();
  expect(await pending).toBe(position);
  expect(vi.getTimerCount()).toBe(0);
});
it("distinguishes denial, missing support, unavailable and invalid location", async () => {
  vi.stubGlobal("navigator", {});
  await expect(requestCurrentPosition()).rejects.toThrow(/unavailable/);
  for (const [code, message] of [
    [1, "permission was denied"],
    [2, "unavailable"],
    [3, "too long"],
  ] as const) {
    const mock = browser();
    const pending = requestCurrentPosition();
    mock.fail(code);
    await expect(pending).rejects.toThrow(message);
  }
  const mock = browser();
  const pending = requestCurrentPosition();
  mock.succeed({
    coords: { latitude: Infinity, longitude: 0 },
  } as GeolocationPosition);
  await expect(pending).rejects.toThrow(/invalid location/);
});
it("bounds a browser that never calls back and ignores late success", async () => {
  vi.useFakeTimers();
  const mock = browser();
  const pending = requestCurrentPosition();
  const assertion = expect(pending).rejects.toThrow(/too long/);
  await vi.advanceTimersByTimeAsync(10000);
  await assertion;
  mock.succeed();
  expect(vi.getTimerCount()).toBe(0);
});
it("cancels waiting and ignores late callbacks without requesting again", async () => {
  vi.useFakeTimers();
  const mock = browser();
  const controller = new AbortController();
  const pending = requestCurrentPosition(controller.signal);
  controller.abort();
  await expect(pending).rejects.toMatchObject({ name: "AbortError" });
  mock.succeed();
  await expect(requestCurrentPosition(controller.signal)).rejects.toMatchObject(
    { name: "AbortError" },
  );
  expect(mock.getCurrentPosition).toHaveBeenCalledTimes(1);
  expect(vi.getTimerCount()).toBe(0);
});

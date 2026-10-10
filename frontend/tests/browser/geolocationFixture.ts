import type { Page } from "@playwright/test";
type Mode = "success" | "denied" | "pending";
declare global {
  interface Window {
    __geoTest: { mode: Mode; calls: number; resolve: () => void };
  }
}
export async function installGeolocation(page: Page, mode: Mode = "success") {
  await page.addInitScript((mode) => {
    const pending: (() => void)[] = [];
    const state = {
      mode,
      calls: 0,
      resolve: () => pending.splice(0).forEach((callback) => callback()),
    };
    window.__geoTest = state;
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition(
          success: PositionCallback,
          failure: PositionErrorCallback,
        ) {
          state.calls++;
          const finish = () =>
            success({
              coords: {
                latitude: 27,
                longitude: 88,
                accuracy: 10,
                altitude: null,
                altitudeAccuracy: null,
                heading: null,
                speed: null,
              },
              timestamp: Date.now(),
            } as GeolocationPosition);
          if (state.mode === "pending") pending.push(finish);
          else
            queueMicrotask(() =>
              state.mode === "denied"
                ? failure({ code: 1 } as GeolocationPositionError)
                : finish(),
            );
        },
      },
    });
  }, mode);
}

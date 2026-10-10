import type { Page } from "@playwright/test";

interface MapTestState {
  requests: { intermediates: { location: { lat: number; lng: number } }[] }[];
  polylinesCreated: number;
  polylinesDetached: number;
  boundsFits: number;
  resolvePending: () => void;
}

declare global {
  interface Window {
    __mapTest: MapTestState;
  }
}

/** Minimal provider double, not a replacement for the real React map wrapper.
 * It draws no tiles and performs no network requests. Only tests install it. */
export async function installMapsDouble(
  page: Page,
  mode: "success" | "pending" | "malformed" = "success",
) {
  await page.addInitScript((mode) => {
    const pending: (() => void)[] = [];
    const state: MapTestState = {
      requests: [],
      polylinesCreated: 0,
      polylinesDetached: 0,
      boundsFits: 0,
      resolvePending: () => pending.splice(0).forEach((resolve) => resolve()),
    };
    window.__mapTest = state;
    const listener = () => ({ remove() {} });
    class LatLng {
      constructor(private value: { lat: number; lng: number }) {}
      toJSON() {
        return this.value;
      }
      lat() {
        return this.value.lat;
      }
      lng() {
        return this.value.lng;
      }
    }
    class LatLngBounds {
      extend() {
        return this;
      }
      toJSON() {
        return { north: 28, south: 26, east: 89, west: 87 };
      }
    }
    class MapDouble {
      constructor(
        private element: HTMLElement,
        private options: { center: { lat: number; lng: number }; zoom: number },
      ) {}
      getDiv() {
        return this.element;
      }
      getCenter() {
        return new LatLng(this.options.center);
      }
      getZoom() {
        return this.options.zoom;
      }
      getHeading() {
        return 0;
      }
      getTilt() {
        return 0;
      }
      getBounds() {
        return new LatLngBounds();
      }
      setOptions() {}
      moveCamera() {}
      fitBounds() {
        state.boundsFits++;
      }
      addListener = listener;
    }
    class Polyline {
      private attached = true;
      constructor() {
        state.polylinesCreated++;
      }
      setMap(map: unknown) {
        if (map === null && this.attached) {
          state.polylinesDetached++;
          this.attached = false;
        }
      }
    }
    class AdvancedMarkerElement extends EventTarget {
      content = document.createElement("div");
      dataset = {};
      addListener = listener;
    }
    class PinElement {
      element = document.createElement("div");
    }
    const Route = {
      async computeRoutes(request: MapTestState["requests"][number]) {
        state.requests.push(request);
        if (mode === "pending")
          await new Promise<void>((resolve) => pending.push(resolve));
        return {
          routes: [
            {
              path: [
                { lat: 27, lng: 88 },
                { lat: 27.1, lng: 88.1 },
              ],
              legs: Array.from(
                { length: request.intermediates.length + 1 },
                () =>
                  mode === "malformed"
                    ? {}
                    : { distanceMeters: 1000, durationMillis: 600000 },
              ),
            },
          ],
        };
      },
    };
    const marker = { AdvancedMarkerElement, PinElement };
    const maps = {
      version: "3.65.0",
      Settings: { getInstance: () => ({}) },
      Map: MapDouble,
      LatLng,
      LatLngBounds,
      Polyline,
      marker,
      event: {
        addListener: listener,
        clearInstanceListeners() {},
        removeListener() {},
      },
      async importLibrary(name: string) {
        if (name === "routes") return { Route };
        if (name === "marker") return marker;
        return { Map: MapDouble, LatLng, LatLngBounds };
      },
    };
    Object.assign(window, { google: { maps } });
  }, mode);
}

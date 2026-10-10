export function formatDateTime(value: string) {
  return new Date(value).toLocaleString();
}

/** One explicit location request. Cancellation stops waiting, not the browser sensor. */
export function requestCurrentPosition(signal?: AbortSignal) {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    if (signal?.aborted)
      return reject(
        new DOMException("Location request cancelled.", "AbortError"),
      );
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Location is unavailable in this browser."));
      return;
    }
    let settled = false;
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
      callback();
    };
    const abort = () =>
      finish(() =>
        reject(new DOMException("Location request cancelled.", "AbortError")),
      );
    const timer = setTimeout(
      () =>
        finish(() =>
          reject(
            new Error("Location took too long to respond. Please try again."),
          ),
        ),
      10000,
    );
    signal?.addEventListener("abort", abort, { once: true });
    try {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          if (
            !Number.isFinite(latitude) ||
            Math.abs(latitude) > 90 ||
            !Number.isFinite(longitude) ||
            Math.abs(longitude) > 180
          ) {
            finish(() =>
              reject(new Error("The browser returned an invalid location.")),
            );
            return;
          }
          finish(() => resolve(position));
        },
        (error) =>
          finish(() =>
            reject(
              new Error(
                error.code === 1
                  ? "Location permission was denied. You can change it in browser settings."
                  : error.code === 3
                    ? "Location took too long to respond. Please try again."
                    : "Your current location is unavailable. Please try again.",
              ),
            ),
          ),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      );
    } catch {
      finish(() =>
        reject(new Error("Location is unavailable in this browser.")),
      );
    }
  });
}

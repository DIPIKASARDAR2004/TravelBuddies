const checkoutScriptUrl = "https://checkout.razorpay.com/v1/checkout.js";
export const checkoutLoadError =
  "Secure checkout could not be loaded. Please refresh and try again.";

/** One concrete vendor boundary: bounded loading, cleanup and constructor check. */
export function loadRazorpayCheckout(signal: AbortSignal): Promise<void> {
  if (signal.aborted) return Promise.reject(signal.reason);
  if (typeof Reflect.get(window, "Razorpay") === "function")
    return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${checkoutScriptUrl}"]`,
    );
    const script = existing ?? document.createElement("script");
    let finished = false;

    const finish = (error?: Error) => {
      if (finished) return;
      finished = true;
      window.clearTimeout(timeout);
      script.removeEventListener("load", loaded);
      script.removeEventListener("error", failed);
      signal.removeEventListener("abort", aborted);
      if (error) {
        if (!existing) script.remove();
        reject(error);
      } else resolve();
    };
    const loaded = () =>
      finish(
        typeof Reflect.get(window, "Razorpay") === "function"
          ? undefined
          : new Error(checkoutLoadError),
      );
    const failed = () => finish(new Error(checkoutLoadError));
    const aborted = () =>
      finish(new DOMException("Checkout loading cancelled.", "AbortError"));
    const timeout = window.setTimeout(failed, 10000);
    script.addEventListener("load", loaded);
    script.addEventListener("error", failed);
    signal.addEventListener("abort", aborted, { once: true });
    if (!existing) {
      script.src = checkoutScriptUrl;
      script.async = true;
      document.body.appendChild(script);
    }
  });
}

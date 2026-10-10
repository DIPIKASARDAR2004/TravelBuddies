/** Transport only: UI notifications and endpoint-specific validation belong to callers. */
export async function requestJson<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && typeof options.body === "string") {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(endpoint, {
    ...options,
    headers,
    signal: options.signal ?? AbortSignal.timeout(15000),
  });
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : undefined;
  } catch {
    throw new Error(
      response.ok
        ? "The server returned an invalid response."
        : "The request failed. Please try again.",
    );
  }
  if (!response.ok) {
    const record =
      body && typeof body === "object" ? (body as Record<string, unknown>) : {};
    const message =
      typeof record.error === "string"
        ? record.error
        : typeof record.message === "string"
          ? record.message
          : "The request failed. Please try again.";
    throw new Error(message);
  }
  return body as T;
}

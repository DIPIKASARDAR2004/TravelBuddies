import { type AuthAction, type AuthOutcome } from "./contracts";

export const AUTH_CLIENT_WAIT_MS = 15000;
export const AUTH_UNCERTAIN =
  "Authentication could not be confirmed. Check your session or email before trying again; the request may already have taken effect.";

export class AuthRequestFailure extends Error {
  constructor(
    message: string,
    readonly uncertain = true,
  ) {
    super(message);
  }
}

/** Check our HTTP acknowledgement, not the SDK's private session representation. */
export function readAuthResponse(
  action: AuthAction,
  value: unknown,
): AuthOutcome {
  const body =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  if (action === "logout" && body.status === "signed_out")
    return { status: "signed_out", message: "Signed out successfully." };
  if (action === "signup" && body.status === "confirmation_required")
    return {
      status: "confirmation_required",
      message:
        "If signup is available for this address, check your email to confirm it. You can also try signing in.",
    };
  const user =
    body.user && typeof body.user === "object"
      ? (body.user as Record<string, unknown>)
      : {};
  if (
    action !== "logout" &&
    body.status === "authenticated" &&
    typeof user.id === "string" &&
    /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(user.id)
  )
    return {
      status: "authenticated",
      message: "Signed in successfully.",
      user: { id: user.id },
    };
  throw new AuthRequestFailure(AUTH_UNCERTAIN);
}

/** Auth needs status-aware uncertainty handling; no global toast or automatic retry. */
export async function requestAuth(
  action: AuthAction,
  input: unknown,
  signal: AbortSignal,
): Promise<AuthOutcome> {
  signal.throwIfAborted();
  const response = await fetch(`/api/${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    cache: "no-store",
    body: action === "logout" ? undefined : JSON.stringify(input),
    signal,
  });
  if ([400, 401, 403, 422, 429].includes(response.status)) {
    throw new AuthRequestFailure(
      response.status === 429
        ? "Too many authentication attempts. Please wait before trying again."
        : "Authentication was not accepted. Check your details and email confirmation.",
      false,
    );
  }
  if (!response.ok) throw new AuthRequestFailure(AUTH_UNCERTAIN);
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new AuthRequestFailure(AUTH_UNCERTAIN);
  }
  signal.throwIfAborted();
  return readAuthResponse(action, body);
}

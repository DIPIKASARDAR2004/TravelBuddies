/** Concrete auth contracts. Passwords are never trimmed, logged or returned. */
export type AuthAction = "login" | "signup" | "logout";
export type Credentials = { email: string; password: string };
export type SignupInput = Credentials & { fullName: string };
export type AuthOutcome = {
  status: "authenticated" | "confirmation_required" | "signed_out";
  message: string;
  user?: { id: string };
};

export class AuthFailure extends Error {
  constructor(
    message: string,
    readonly statusCode = 400,
  ) {
    super(message);
  }
}

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function readCredentials(value: unknown): Credentials {
  const body = record(value);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  if (
    !email ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    /[\u0000-\u001f\u007f]/.test(email)
  )
    throw new AuthFailure("Enter a valid email address.");
  // Login accepts existing passwords regardless of the signup minimum.
  if (
    typeof body?.password !== "string" ||
    !body.password.length ||
    body.password.length > 1024
  )
    throw new AuthFailure("Enter a password of at most 1024 characters.");
  return { email, password: body.password };
}

export function readSignupInput(value: unknown): SignupInput {
  const credentials = readCredentials(value);
  const body = record(value)!;
  const fullName =
    typeof body.fullName === "string" ? body.fullName.trim() : "";
  if (
    fullName.length < 3 ||
    fullName.length > 120 ||
    /[\u0000-\u001f\u007f]/.test(fullName)
  )
    throw new AuthFailure("Enter a name between 3 and 120 characters.");
  if (credentials.password.length < 6)
    throw new AuthFailure("Use a password of at least 6 characters.");
  // Old form fields/claimed roles are not grants or supported profile data.
  return { ...credentials, fullName };
}

function userId(value: unknown): string | null {
  const id = record(value)?.id;
  return typeof id === "string" &&
    /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id)
    ? id
    : null;
}

export function readProviderOutcome(
  action: AuthAction,
  value: unknown,
): AuthOutcome {
  const result = record(value);
  if (!result || result.error !== null) {
    const error = record(result?.error);
    if (error?.status === 429)
      throw new AuthFailure(
        "Too many authentication attempts. Please wait before trying again.",
        429,
      );
    if (
      action === "login" &&
      error &&
      [400, 401, 403, 422].includes(Number(error.status))
    )
      throw new AuthFailure(
        "Unable to sign in. Check your details and email confirmation.",
        401,
      );
    if (
      action === "signup" &&
      error &&
      [400, 422].includes(Number(error.status))
    )
      throw new AuthFailure(
        "Signup was not accepted. Check your details, or try signing in if you already registered.",
        400,
      );
    throw new AuthFailure(
      "Authentication could not be confirmed. Please check your session or email before trying again.",
      502,
    );
  }
  if (action === "logout")
    return { status: "signed_out", message: "Signed out successfully." };
  const data = record(result.data);
  const id = userId(data?.user);
  if (action === "signup" && id && data?.session === null) {
    // Supabase can intentionally return an obfuscated user for an existing address.
    return {
      status: "confirmation_required",
      message:
        "If signup is available for this address, check your email to confirm it. You can also try signing in.",
    };
  }
  const session = record(data?.session);
  if (
    !id ||
    userId(session?.user) !== id ||
    typeof session?.access_token !== "string" ||
    !session.access_token ||
    typeof session.refresh_token !== "string" ||
    !session.refresh_token
  )
    throw new AuthFailure(
      "The authentication response could not be confirmed. Please try signing in.",
      502,
    );
  return {
    status: "authenticated",
    message: "Signed in successfully.",
    user: { id },
  };
}

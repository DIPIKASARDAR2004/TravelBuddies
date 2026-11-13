import "server-only";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { parseJson } from "@/lib/services/apiHandler";
import {
  AuthFailure,
  readCredentials,
  readSignupInput,
  readProviderOutcome,
  type AuthAction,
} from "./contracts";

export const AUTH_WAIT_MS = 10000;

/** Auth-only orchestration, using the existing request-scoped cookie client. */
export async function authResponse(action: AuthAction, request: Request) {
  const deadline = new AbortController();
  const signal = AbortSignal.any([request.signal, deadline.signal]);
  const timer = setTimeout(() => deadline.abort(), AUTH_WAIT_MS);
  const headers = { "Cache-Control": "no-store" };
  let stopWaiting: (() => void) | undefined;
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin)
      throw new AuthFailure(
        "Cross-origin authentication requests are not allowed.",
        403,
      );
    signal.throwIfAborted();
    const aborted = new Promise<never>((_, reject) => {
      stopWaiting = () =>
        reject(
          new AuthFailure(
            "Authentication timed out or was interrupted. Check your session or email before trying again.",
            504,
          ),
        );
      signal.addEventListener("abort", stopWaiting, { once: true });
    });
    const work = async () => {
      const body = action === "logout" ? null : await parseJson(request);
      signal.throwIfAborted();
      const signupInput = action === "signup" ? readSignupInput(body) : null;
      const loginInput = action === "login" ? readCredentials(body) : null;
      const client = await createSupabaseServerClient({
        signal,
        strictCookies: true,
      });
      signal.throwIfAborted();
      let result: unknown;
      if (signupInput) {
        result = await client.auth.signUp({
          email: signupInput.email,
          password: signupInput.password,
          options: { data: { full_name: signupInput.fullName } },
        });
      } else if (loginInput) {
        result = await client.auth.signInWithPassword(loginInput);
      } else {
        result = await client.auth.signOut();
      }
      signal.throwIfAborted();
      return readProviderOutcome(action, result);
    };
    const result = await Promise.race([work(), aborted]);
    return NextResponse.json(result, {
      status: action === "signup" ? 201 : 200,
      headers,
    });
  } catch (error) {
    const message =
      error instanceof AuthFailure
        ? error.message
        : "Authentication could not be confirmed. Check your session or email before trying again.";
    const status =
      error instanceof AuthFailure
        ? error.statusCode
        : signal.aborted
          ? 504
          : 500;
    return NextResponse.json({ error: message }, { status, headers });
  } finally {
    clearTimeout(timer);
    if (stopWaiting) signal.removeEventListener("abort", stopWaiting);
    deadline.abort();
  }
}

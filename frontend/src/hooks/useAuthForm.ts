"use client";

import { useEffect, useRef, useState } from "react";
import {
  AuthFailure,
  readCredentials,
  readSignupInput,
} from "@/lib/auth/contracts";
import {
  AUTH_CLIENT_WAIT_MS,
  AUTH_UNCERTAIN,
  AuthRequestFailure,
  requestAuth,
} from "@/lib/auth/client";

export type AuthFormInput = {
  email: string;
  password: string;
  fullName: string;
  confirmPassword: string;
};

/** One form owns one in-flight attempt; leaving it suppresses late UI effects. */
export function useAuthForm(mode: "login" | "signup") {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [uncertain, setUncertain] = useState(false);
  const active = useRef<AbortController | null>(null);
  const locked = useRef(false);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      active.current?.abort();
      active.current = null;
    };
  }, []);

  const submit = async (form: AuthFormInput) => {
    if (!mounted.current || active.current || locked.current) return;
    let input;
    try {
      input = mode === "signup" ? readSignupInput(form) : readCredentials(form);
      if (mode === "signup" && form.password !== form.confirmPassword)
        throw new AuthFailure("Passwords do not match.");
    } catch (cause) {
      setError(
        cause instanceof AuthFailure ? cause.message : "Check your details.",
      );
      return;
    }
    const controller = new AbortController();
    active.current = controller;
    setLoading(true);
    setError("");
    let onAbort: (() => void) | undefined;
    let navigating = false;
    const timer = setTimeout(() => controller.abort(), AUTH_CLIENT_WAIT_MS);
    const current = () => mounted.current && active.current === controller;
    try {
      // Race the body read too, even when a transport ignores abort.
      const aborted = new Promise<never>((_, reject) => {
        onAbort = () => reject(new AuthRequestFailure(AUTH_UNCERTAIN));
        controller.signal.addEventListener("abort", onAbort, { once: true });
      });
      const outcome = await Promise.race([
        requestAuth(mode, input, controller.signal),
        aborted,
      ]);
      if (!current() || controller.signal.aborted) return;
      locked.current = true;
      if (outcome.status === "confirmation_required") {
        setConfirmation(outcome.message);
      } else {
        // Read server-set cookies with a fresh SDK instead of its cached session.
        window.location.assign("/safety");
        navigating = true;
      }
    } catch (cause) {
      if (!current()) return;
      const unknown = !(cause instanceof AuthRequestFailure) || cause.uncertain;
      locked.current = unknown;
      setUncertain(unknown);
      setError(
        cause instanceof AuthRequestFailure ? cause.message : AUTH_UNCERTAIN,
      );
    } finally {
      clearTimeout(timer);
      if (onAbort) controller.signal.removeEventListener("abort", onAbort);
      controller.abort();
      if (current()) {
        active.current = null;
        setLoading(navigating);
      }
    }
  };

  const acknowledgeUncertainty = () => {
    if (active.current || !uncertain) return;
    locked.current = false;
    setUncertain(false);
    setError("");
  };

  return {
    submit,
    loading,
    error,
    confirmation,
    uncertain,
    acknowledgeUncertainty,
  };
}

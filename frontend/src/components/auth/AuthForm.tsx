"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuthForm } from "@/hooks/useAuthForm";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { PasswordField } from "./PasswordField";

/** Shared fields and request states, not configurable form machinery. */
export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const signup = mode === "signup";
  const auth = useAuthForm(mode);
  const [form, setForm] = useState({
    email: "",
    password: "",
    fullName: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const change = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white">
          {signup ? "Create your account" : "Log in"}
        </h2>
        <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
          Personal travel accounts only. Business and host account tools are not
          available.
        </p>
      </div>

      {auth.confirmation ? (
        <div role="status">
          <StatusBanner title="Check your email">
            {auth.confirmation}
          </StatusBanner>
        </div>
      ) : (
        <form
          className="space-y-5"
          noValidate
          aria-busy={auth.loading}
          onSubmit={(event) => {
            event.preventDefault();
            void auth.submit(form);
          }}
        >
          <fieldset
            disabled={auth.loading || auth.uncertain}
            className="space-y-5"
          >
            {signup && (
              <Input
                label="Full name"
                name="fullName"
                autoComplete="name"
                required
                maxLength={120}
                value={form.fullName}
                onChange={change}
              />
            )}
            <Input
              label="Email address"
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={form.email}
              onChange={change}
              placeholder="you@example.com"
            />
            <PasswordField
              label="Password"
              name="password"
              value={form.password}
              onChange={change}
              autoComplete={signup ? "new-password" : "current-password"}
              visible={showPassword}
              onToggleVisibility={() =>
                setShowPassword((previous) => !previous)
              }
            />
            {signup && (
              <>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Use at least 6 characters. Your password is kept exactly as
                  entered.
                </p>
                <PasswordField
                  label="Confirm password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={change}
                  autoComplete="new-password"
                  visible={showConfirmation}
                  onToggleVisibility={() =>
                    setShowConfirmation((previous) => !previous)
                  }
                />
              </>
            )}
            <Button
              type="submit"
              fullWidth
              className="py-3.5"
              disabled={auth.loading || auth.uncertain}
            >
              {auth.loading
                ? "Please wait..."
                : signup
                  ? "Create account"
                  : "Continue to account"}
            </Button>
          </fieldset>
          {auth.error && (
            <div role="alert">
              <StatusBanner tone="danger">{auth.error}</StatusBanner>
            </div>
          )}
          {auth.uncertain && (
            <div className="space-y-3">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Check your email or{" "}
                <Link href="/safety" className="underline" prefetch={false}>
                  check your account
                </Link>{" "}
                before another attempt. This acknowledgement does not verify or
                undo the previous request.
              </p>
              <Button type="button" onClick={auth.acknowledgeUncertainty}>
                I&apos;ve checked — enable another attempt
              </Button>
            </div>
          )}
        </form>
      )}

      <p className="text-sm text-slate-600 dark:text-slate-300">
        This prototype has not completed hosted security, payment or privacy
        acceptance. Use test details only.
      </p>
      <p className="text-center text-sm text-slate-600 dark:text-slate-400">
        {signup ? "Already have an account? " : "Don't have an account? "}
        <Link
          href={signup ? "/login" : "/signup"}
          className="font-semibold text-sky-600 hover:text-sky-500"
        >
          {signup ? "Log in" : "Create one"}
        </Link>
      </p>
    </div>
  );
}

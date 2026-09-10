"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { FiCompass, FiShield, FiStar } from "react-icons/fi";
import { AuthShell } from "@/components/auth/AuthShell";
import { AccountTypeTabs } from "@/components/auth/AccountTypeTabs";
import { PasswordField } from "@/components/auth/PasswordField";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { apiClient } from "@/lib/services/apiClient";

type LoginTab = "personal" | "business";

const LOGIN_TABS: ReadonlyArray<{ value: LoginTab; label: string }> = [
  { value: "personal", label: "Personal" },
  { value: "business", label: "MyBiz" },
];

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<LoginTab>("personal");
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const isFormValid = formData.email.includes("@") && formData.password.length >= 6;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    try {
      await apiClient<{ message?: string }>("/api/login", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      toast.success("Login successful!");
      router.push("/safety");
      router.refresh();
    } catch (error: unknown) {
      console.error("Login failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Pick up your planning flow without losing context"
      description="Log in to recover saved planning progress, move into safer travel tools, and keep your trip decisions in one place."
      accent="sky"
      aside={
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { icon: FiCompass, title: "Planner sync" },
            { icon: FiShield, title: "Safety tools" },
            { icon: FiStar, title: "Protected checkout" },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
              <item.icon className="h-5 w-5" />
              <p className="mt-3 text-sm font-semibold">{item.title}</p>
            </div>
          ))}
        </div>
      }
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white">Log in</h2>
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
            Use your account to continue trip planning, review map previews, and access safety tools.
          </p>
        </div>

        <AccountTypeTabs value={tab} onChange={setTab} options={LOGIN_TABS} />

        <StatusBanner title={tab === "business" ? "Business mode" : "Personal mode"}>
          {tab === "business"
            ? "Use your JourneyPilot business account to manage travel planning for customers or teams."
            : "Use your personal account to manage your own trips and safety workflows."}
        </StatusBanner>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <Input
            label="Email address"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
          />

          <PasswordField
            label="Password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            visible={showPassword}
            onToggleVisibility={() => setShowPassword((current) => !current)}
          />

          <Button type="submit" fullWidth disabled={!isFormValid || loading} className="py-3.5">
            {loading ? "Logging in..." : "Continue to account"}
          </Button>
        </form>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          By continuing, you agree to the product terms, privacy policy, and secure payment conditions used in JourneyPilot.
        </div>

        <p className="text-center text-sm text-slate-600 dark:text-slate-400">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-sky-600 hover:text-sky-500">
            Create one
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}

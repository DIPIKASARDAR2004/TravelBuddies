'use client';

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import toast from "react-hot-toast";
import { FiBriefcase, FiHome, FiUser } from "react-icons/fi";
import { AuthShell } from "@/components/auth/AuthShell";
import { AccountTypeTabs } from "@/components/auth/AccountTypeTabs";
import { PasswordField } from "@/components/auth/PasswordField";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { apiClient } from "@/lib/services/apiClient";

type SignupTab = "personal" | "business" | "host";

const SIGNUP_TABS: ReadonlyArray<{ value: SignupTab; label: string }> = [
  { value: "personal", label: "Personal" },
  { value: "business", label: "MyBiz" },
  { value: "host", label: "Host" },
];

const ACCOUNT_DESCRIPTIONS: Record<SignupTab, string> = {
  personal: "Create an account for your own itineraries, trip customization, and safety workflows.",
  business: "Use MyBiz if you plan travel for customers, teams, or managed travel requests.",
  host: "Use Host if you want to manage stays, booking flows, and hospitality inventory.",
};

export default function SignupPage() {
  const router = useRouter();
  const [tab, setTab] = useState<SignupTab>("personal");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState({
    fullName: false,
    email: false,
    phone: false,
    password: false,
    confirmPassword: false,
  });

  const isPhoneValid = formData.phone.replace(/\D/g, "").length >= 10;
  const isFormValid =
    formData.fullName.length > 2 &&
    formData.email.includes("@") &&
    isPhoneValid &&
    formData.password.length >= 6 &&
    formData.password === formData.confirmPassword &&
    agreed;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    try {
      const data = await apiClient<{ message?: string }>("/api/signup", {
        method: "POST",
        body: JSON.stringify({ ...formData, accountType: tab }),
      });

      toast.success(data.message || "Account created successfully!");
      router.push("/login");
    } catch (error: unknown) {
      console.error("Signup failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setTouched((current) => ({ ...current, [name]: true }));
  };

  return (
    <AuthShell
      eyebrow="Create an account"
      title="Join the product from the side that fits how you travel"
      description="Whether you are planning your own trip, managing travel for others, or listing stays, the same product flow stays consistent and easier to maintain."
      accent="rose"
      aside={
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { icon: FiUser, title: "Personal trips" },
            { icon: FiBriefcase, title: "Managed travel" },
            { icon: FiHome, title: "Host tools" },
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
          <h2 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white">Create your account</h2>
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
            Set up access for planning, checkout, safety workflows, or hosting tools with one cleaner onboarding flow.
          </p>
        </div>

        <AccountTypeTabs value={tab} onChange={setTab} options={SIGNUP_TABS} />

        <StatusBanner title={`${tab[0].toUpperCase()}${tab.slice(1)} account`}>
          {ACCOUNT_DESCRIPTIONS[tab]}
        </StatusBanner>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <Input
            label="Full name"
            name="fullName"
            type="text"
            required
            value={formData.fullName}
            onChange={handleChange}
            onBlur={() => setTouched((current) => ({ ...current, fullName: true }))}
            placeholder="John Doe"
            error={touched.fullName && formData.fullName.length <= 2 ? "Full name must be at least 3 characters." : undefined}
          />

          <Input
            label="Email address"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            onBlur={() => setTouched((current) => ({ ...current, email: true }))}
            placeholder="you@example.com"
            error={touched.email && !formData.email.includes("@") ? "Please enter a valid email address." : undefined}
          />

          <div>
            <label className="mb-1.5 ml-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Phone number
            </label>
            <PhoneInput
              country="in"
              value={formData.phone}
              onChange={(phone) => {
                setFormData((current) => ({ ...current, phone }));
                setTouched((current) => ({ ...current, phone: true }));
              }}
              onBlur={() => setTouched((current) => ({ ...current, phone: true }))}
              inputStyle={{
                width: "100%",
                padding: "12px 12px 12px 48px",
                borderRadius: "0.75rem",
                border: "1px solid rgb(226 232 240)",
                boxShadow: "none",
                background: "transparent",
              }}
              containerClass="!w-full [&>input]:bg-white [&>input]:text-slate-900 [&>input]:dark:bg-slate-800 [&>input]:dark:text-white [&>input]:border-slate-200 [&>input]:dark:border-slate-700"
            />
            {touched.phone && !isPhoneValid ? (
              <p className="ml-1 mt-1.5 text-xs text-rose-600 dark:text-rose-400">
                Please enter a valid phone number with at least 10 digits.
              </p>
            ) : null}
          </div>

          <PasswordField
            label="Password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            onBlur={() => setTouched((current) => ({ ...current, password: true }))}
            placeholder="••••••••"
            visible={showPassword}
            onToggleVisibility={() => setShowPassword((current) => !current)}
            error={touched.password && formData.password.length < 6 ? "Password must be at least 6 characters." : undefined}
          />

          <PasswordField
            label="Confirm password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            onBlur={() => setTouched((current) => ({ ...current, confirmPassword: true }))}
            placeholder="••••••••"
            visible={showConfirmPassword}
            onToggleVisibility={() => setShowConfirmPassword((current) => !current)}
            error={
              touched.confirmPassword && formData.password !== formData.confirmPassword
                ? "Passwords do not match."
                : undefined
            }
          />

          <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              checked={agreed}
              onChange={(event) => setAgreed(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            />
            <span>
              I agree to the Terms of Service, privacy expectations, and account verification rules for JourneyPilot.
            </span>
          </label>

          <Button type="submit" disabled={!isFormValid || loading} fullWidth className="py-3.5">
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <p className="text-center text-sm text-slate-600 dark:text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-rose-600 hover:text-rose-500">
            Log in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}

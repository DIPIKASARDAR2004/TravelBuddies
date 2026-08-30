"use client";
import { useState } from "react";
import Link from "next/link";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const [tab, setTab] = useState("personal");
  const [phone, setPhone] = useState("");

  const isPhoneValid = phone.replace(/\D/g, "").length >= 10;

  const handleSubmit = async () => {
    const res = await fetch("/api/login", {
      method: "POST",
      body: JSON.stringify({ phone }),
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    alert(data.message);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 pt-20 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full p-8 space-y-8 border-slate-100 dark:border-slate-700">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Login to continue to JourneyPilot
          </p>
        </div>

        {/* Account type tabs */}
        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <button
            onClick={() => setTab("personal")}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              tab === "personal"
                ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Personal
          </button>
          <button
            onClick={() => setTab("business")}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              tab === "business"
                ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            MyBiz
          </button>
        </div>

        <div className="space-y-6">
          {/* Phone input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Phone Number
            </label>
            <PhoneInput
              country={"in"}
              value={phone}
              onChange={setPhone}
              inputStyle={{
                width: "100%",
                padding: "12px 12px 12px 48px",
                borderRadius: "0.75rem",
                border: "none",
                boxShadow: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
                background: "var(--tw-bg-opacity, #ffffff)"
              }}
              containerClass="!w-full [&>input]:dark:bg-slate-800 [&>input]:dark:text-white"
            />
          </div>

          <Button
            fullWidth
            onClick={handleSubmit}
            disabled={!isPhoneValid}
          >
            CONTINUE
          </Button>
        </div>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-300 dark:border-slate-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-slate-800 text-slate-500">
                Or continue with
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <Button variant="outline" fullWidth>
              G
            </Button>
            <Button variant="outline" fullWidth>
              @
            </Button>
          </div>
        </div>

        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400 text-center">
          By proceeding, you agree to our{" "}
          <a href="#" className="text-blue-600 hover:text-blue-400">Privacy Policy</a>,{" "}
          <a href="#" className="text-blue-600 hover:text-blue-400">User Agreement</a> and{" "}
          <a href="#" className="text-blue-600 hover:text-blue-400">T&Cs</a>.
        </p>

        <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
            Sign up
          </Link>
        </p>
      </Card>
    </div>
  );
}

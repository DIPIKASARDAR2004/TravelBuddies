'use client';
import { useState } from "react";
import Link from "next/link";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function SignupPage() {
  const [tab, setTab] = useState("personal");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isPhoneValid = formData.phone.replace(/\D/g, "").length >= 10;
  const isFormValid = 
    formData.fullName.length > 2 && 
    formData.email.includes("@") && 
    isPhoneValid && 
    formData.password.length >= 6 && 
    formData.password === formData.confirmPassword && 
    agreed;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    
    setLoading(true);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        body: JSON.stringify({ ...formData, accountType: tab }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      alert(data.message);
      if (res.ok) {
        window.location.href = "/login";
      }
    } catch (error) {
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full mx-auto space-y-8 p-8 border-slate-100 dark:border-slate-700">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            Join JourneyPilot
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Create an account to start your journey
          </p>
        </div>

        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <button
            type="button"
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
            type="button"
            onClick={() => setTab("business")}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              tab === "business" 
                ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm" 
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            MyBiz
          </button>
          <button
            type="button"
            onClick={() => setTab("host")}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              tab === "host" 
                ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm" 
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Host
          </button>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              label="Full Name"
              name="fullName"
              type="text"
              required
              value={formData.fullName}
              onChange={handleChange}
              placeholder="John Doe"
            />
            
            <Input
              label="Email address"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
            />
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Phone Number</label>
              <PhoneInput
                country={'in'}
                value={formData.phone}
                onChange={(phone) => setFormData({ ...formData, phone })}
                inputStyle={{
                  width: '100%',
                  padding: '12px 12px 12px 48px',
                  borderRadius: '0.75rem',
                  border: 'none',
                  boxShadow: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
                  background: 'var(--tw-bg-opacity, #ffffff)'
                }}
                containerClass="!w-full [&>input]:dark:bg-slate-800 [&>input]:dark:text-white"
              />
            </div>
            
            <div className="relative">
              <Input
                label="Password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-10 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            
            <div className="relative">
              <Input
                label="Confirm Password"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-10 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div className="flex items-center ml-1">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-slate-900 dark:text-slate-300">
              I agree to the <a href="#" className="text-blue-600 hover:text-blue-500">Terms of Service</a> and <a href="#" className="text-blue-600 hover:text-blue-500">Privacy Policy</a>
            </label>
          </div>

          <Button
            type="submit"
            disabled={!isFormValid || loading}
            fullWidth
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-300 dark:border-slate-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-slate-800 text-slate-500">Or continue with</span>
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
        
        <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Log in
          </Link>
        </p>
      </Card>
    </div>
  );
}

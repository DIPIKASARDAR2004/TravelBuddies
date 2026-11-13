"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaMoon, FaSun, FaChevronDown, FaBars, FaTimes } from "react-icons/fa";
import { useNavbarSession } from "@/hooks/useNavbarSession";
import { NavbarAccount } from "@/components/auth/NavbarAccount";
import { NAV_ITEMS } from "@/constants/navigation";

export default function Navbar() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const session = useNavbarSession();
  const pathname = usePathname();

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem("theme");
    } catch {}
    const initial =
      saved === "light" || saved === "dark"
        ? saved
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    try {
      localStorage.setItem("theme", next);
    } catch {}
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-[9999] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-sm dark:shadow-none border-b border-slate-200/50 dark:border-slate-800 transition-all duration-300">
      <div className="flex justify-between items-center px-6 py-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="flex items-center gap-2 group hover:opacity-90 transition-opacity"
          >
            <div className="bg-blue-600 text-white p-2 rounded-xl shadow-lg shadow-blue-200 dark:shadow-blue-900 group-hover:scale-105 transition-transform">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold leading-tight tracking-tight text-slate-800 dark:text-white">
                Journey
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  Pilot
                </span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                Travel Smart. Travel Safe.
              </span>
            </div>
          </Link>
        </div>

        {/* Center Links (Desktop) */}
        <ul className="hidden md:flex items-center gap-8">
          {NAV_ITEMS.map(({ href, label, hasDropdown }) => (
            <li key={label}>
              <Link
                href={href}
                className={`flex items-center gap-1 text-sm font-medium transition-colors ${
                  pathname === href
                    ? "text-blue-600 dark:text-blue-400 font-bold"
                    : "text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400"
                }`}
              >
                {label}
                {hasDropdown && (
                  <FaChevronDown className="text-[10px] opacity-70" />
                )}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right side Auth & Theme */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            aria-label="Toggle Theme"
          >
            {theme === "light" ? <FaMoon /> : <FaSun />}
          </button>

          <div className="hidden md:flex items-center gap-3">
            <NavbarAccount
              session={session}
              closeMenu={() => setIsMobileMenuOpen(false)}
            />
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Toggle Mobile Menu"
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation"
          >
            {isMobileMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
          </button>
        </div>
      </div>

      {(session.notice || session.status === "unknown") && (
        <div className="border-t border-amber-300 bg-amber-50 px-6 py-3 text-sm text-amber-950">
          <p role="alert">
            {session.notice ||
              "Your account session could not be checked. Try checking again before continuing."}
          </p>
          <button
            className="mt-2 rounded border border-amber-800 px-3 py-1 disabled:opacity-60"
            disabled={!session.canCheck}
            onClick={session.check}
          >
            Check session
          </button>
          {!session.canCheck && (
            <p className="mt-1">
              The previous request is still settling. No automatic retry will be
              sent.
            </p>
          )}
        </div>
      )}

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <div
          id="mobile-navigation"
          className="md:hidden absolute top-full left-0 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xl flex flex-col py-4 px-6 space-y-4"
        >
          <ul className="flex flex-col space-y-4">
            {NAV_ITEMS.map(({ href, label }) => (
              <li key={label}>
                <Link
                  href={href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block text-base font-medium ${
                    pathname === href
                      ? "text-blue-600 dark:text-blue-400 font-bold"
                      : "text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400"
                  }`}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex flex-col space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <NavbarAccount
              session={session}
              closeMenu={() => setIsMobileMenuOpen(false)}
              mobile
            />
          </div>
        </div>
      )}
    </nav>
  );
}

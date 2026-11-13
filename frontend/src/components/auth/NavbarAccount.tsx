"use client";

import Link from "next/link";
import { FaSignOutAlt, FaUserCircle } from "react-icons/fa";
import type { NavbarSessionState } from "@/lib/auth/navbarSession";

export function NavbarAccount({
  session,
  closeMenu,
  mobile = false,
}: {
  session: NavbarSessionState & { logout: () => void; check: () => void };
  closeMenu: () => void;
  mobile?: boolean;
}) {
  const { status, user } = session;
  const control =
    "rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-60";
  return (
    <div className={`flex gap-3 ${mobile ? "flex-col" : "items-center"}`}>
      {status === "checking" || status === "signing_out" ? (
        <span
          role="status"
          className="text-sm text-slate-600 dark:text-slate-300"
        >
          {status === "checking" ? "Checking account..." : "Signing out..."}
        </span>
      ) : status === "signed_in" && user ? (
        <>
          <span className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <FaUserCircle aria-hidden="true" />
            <span className="max-w-24 truncate" title={user.label}>
              {user.label}
            </span>
          </span>
          <button
            onClick={session.logout}
            className={`${control} flex items-center gap-2 border-red-200 text-red-600 dark:text-red-400`}
          >
            <FaSignOutAlt aria-hidden="true" />
            Logout
          </button>
        </>
      ) : status === "guest" ? (
        <>
          <Link
            href="/login"
            onClick={closeMenu}
            className={`${control} text-slate-700 dark:text-slate-200`}
          >
            Login
          </Link>
          <Link
            href="/signup"
            onClick={closeMenu}
            className={`${control} bg-blue-600 text-white`}
          >
            Sign Up
          </Link>
        </>
      ) : (
        <span className="text-sm text-slate-600 dark:text-slate-300">
          Account unavailable
        </span>
      )}
    </div>
  );
}

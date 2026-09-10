import React from "react";

interface StatusBannerProps {
  tone?: "default" | "danger" | "warning" | "success";
  title?: string;
  children: React.ReactNode;
}

const toneClasses: Record<NonNullable<StatusBannerProps["tone"]>, string> = {
  default:
    "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200",
  danger:
    "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200",
  warning:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-200",
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/30 dark:text-emerald-200",
};

export function StatusBanner({ tone = "default", title, children }: StatusBannerProps) {
  return (
    <div className={`rounded-2xl border px-4 py-3 ${toneClasses[tone]}`}>
      {title ? <p className="text-sm font-bold">{title}</p> : null}
      <div className="text-sm leading-6">{children}</div>
    </div>
  );
}

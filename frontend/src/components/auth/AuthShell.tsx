import React from "react";

interface AuthShellProps {
  eyebrow: string;
  title: string;
  description: string;
  accent: "sky" | "rose";
  children: React.ReactNode;
  aside?: React.ReactNode;
}

const accentStyles = {
  sky: {
    page: "bg-[radial-gradient(circle_at_top,#dbeafe,transparent_28%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] dark:bg-[radial-gradient(circle_at_top,#082f49,transparent_24%),linear-gradient(180deg,#020617_0%,#0f172a_100%)]",
    badge: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-300",
    panel: "from-sky-600 via-cyan-600 to-indigo-700",
  },
  rose: {
    page: "bg-[radial-gradient(circle_at_top,#ffe4e6,transparent_28%),linear-gradient(180deg,#fff7f8_0%,#fff 100%)] dark:bg-[radial-gradient(circle_at_top,#4c0519,transparent_24%),linear-gradient(180deg,#020617_0%,#111827_100%)]",
    badge: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300",
    panel: "from-rose-600 via-pink-600 to-fuchsia-700",
  },
} as const;

export function AuthShell({
  eyebrow,
  title,
  description,
  accent,
  children,
  aside,
}: AuthShellProps) {
  const theme = accentStyles[accent];

  return (
    <main className={`min-h-screen px-4 pb-12 pt-24 sm:px-6 lg:px-8 ${theme.page}`}>
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_480px] lg:items-start">
        <section className={`relative overflow-hidden rounded-[2rem] bg-gradient-to-br ${theme.panel} p-8 text-white shadow-[0_28px_90px_-48px_rgba(15,23,42,0.9)] md:p-10`}>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_20%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.14),transparent_24%)]" />
          <div className="relative space-y-6">
            <div className={`inline-flex items-center rounded-full border px-4 py-1 text-xs font-bold uppercase tracking-[0.22em] ${theme.badge}`}>
              {eyebrow}
            </div>
            <div className="space-y-4">
              <h1 className="max-w-xl text-4xl font-black tracking-tight md:text-5xl">{title}</h1>
              <p className="max-w-2xl text-sm leading-7 text-white/88 md:text-base">{description}</p>
            </div>
            {aside}
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200/80 bg-white/92 p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/85 md:p-8">
          {children}
        </section>
      </div>
    </main>
  );
}

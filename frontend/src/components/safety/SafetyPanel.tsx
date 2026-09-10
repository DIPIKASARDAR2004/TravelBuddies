import React from "react";

interface SafetyPanelProps {
  icon: React.ElementType;
  title: string;
  description: string;
  accent: "rose" | "sky" | "emerald" | "amber";
  children: React.ReactNode;
}

const accentClasses = {
  rose: {
    border: "border-rose-200 dark:border-rose-900/40",
    icon: "bg-rose-100 text-rose-600 dark:bg-rose-950/30 dark:text-rose-300",
  },
  sky: {
    border: "border-sky-200 dark:border-sky-900/40",
    icon: "bg-sky-100 text-sky-600 dark:bg-sky-950/30 dark:text-sky-300",
  },
  emerald: {
    border: "border-emerald-200 dark:border-emerald-900/40",
    icon: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-300",
  },
  amber: {
    border: "border-amber-200 dark:border-amber-900/40",
    icon: "bg-amber-100 text-amber-600 dark:bg-amber-950/30 dark:text-amber-300",
  },
} as const;

export function SafetyPanel({
  icon: Icon,
  title,
  description,
  accent,
  children,
}: SafetyPanelProps) {
  const theme = accentClasses[accent];

  return (
    <section
      className={`rounded-[1.75rem] border bg-white/90 p-6 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.35)] backdrop-blur dark:bg-slate-950/75 ${theme.border}`}
    >
      <div className="mb-6 flex items-start gap-4">
        <div className={`rounded-2xl p-3 ${theme.icon}`}>
          <Icon className="text-2xl" />
        </div>
        <div>
          <h2 className="text-xl font-black tracking-tight text-slate-950 dark:text-white">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

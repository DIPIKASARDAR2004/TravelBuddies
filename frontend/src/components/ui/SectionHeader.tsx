import React from "react";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  actions?: React.ReactNode;
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
  actions,
}: SectionHeaderProps) {
  const alignmentClass = align === "center" ? "items-center text-center" : "items-start text-left";

  return (
    <div className={`flex flex-col gap-4 md:flex-row md:items-end md:justify-between ${alignmentClass}`}>
      <div className={`flex flex-col gap-2 ${alignmentClass}`}>
        {eyebrow ? (
          <span className="inline-flex w-fit rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-400">
            {eyebrow}
          </span>
        ) : null}
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white md:text-4xl">
            {title}
          </h2>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 md:text-base">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-3">{actions}</div> : null}
    </div>
  );
}

import React from "react";

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  htmlFor?: string;
  children: React.ReactNode;
}

export function Field({ label, hint, error, htmlFor, children }: FieldProps) {
  return (
    <label
      className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200"
      htmlFor={htmlFor}
    >
      <div className="flex items-center justify-between gap-3">
        <span>{label}</span>
        {hint ? <span className="text-xs font-medium text-slate-400 dark:text-slate-500">{hint}</span> : null}
      </div>
      {children}
      {error ? <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">{error}</span> : null}
    </label>
  );
}

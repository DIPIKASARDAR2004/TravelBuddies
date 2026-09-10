import React from "react";

interface AccountTypeTabsProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: ReadonlyArray<{ value: T; label: string }>;
}

export function AccountTypeTabs<T extends string>({
  value,
  onChange,
  options,
}: AccountTypeTabsProps<T>) {
  return (
    <div className="grid gap-2 rounded-2xl bg-slate-100 p-1 dark:bg-slate-900 sm:grid-cols-3">
      {options.map((option) => {
        const active = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
              active
                ? "bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-white"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

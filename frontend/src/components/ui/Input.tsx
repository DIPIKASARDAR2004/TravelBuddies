import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, fullWidth = true, className = "", ...props }, ref) => {
    const widthClass = fullWidth ? "w-full" : "";
    const inputClasses = error
      ? "ring-1 ring-rose-300 focus:ring-4 focus:ring-rose-500/20 dark:ring-rose-800 dark:focus:ring-rose-500/30"
      : "focus:ring-4 focus:ring-blue-500/30 dark:focus:ring-blue-600/40";
    
    return (
      <div className={`flex flex-col ${widthClass}`}>
        {label && (
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          aria-invalid={Boolean(error)}
          className={`px-4 py-3 rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 shadow-sm outline-none transition-all ${inputClasses} ${className}`}
          {...props}
        />
        {error && <span className="text-red-500 text-xs mt-1.5 ml-1">{error}</span>}
      </div>
    );
  }
);

Input.displayName = "Input";

import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", fullWidth = false, ...props }, ref) => {
    
    const baseStyles = "inline-flex items-center justify-center font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed";
    
    const variants = {
      primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg dark:bg-blue-700 dark:hover:bg-blue-600",
      secondary: "bg-indigo-100 hover:bg-indigo-200 text-indigo-700 dark:bg-indigo-900/40 dark:hover:bg-indigo-800/60 dark:text-indigo-300",
      outline: "border-2 border-slate-200 hover:border-slate-300 text-slate-700 bg-transparent dark:border-slate-700 dark:hover:border-slate-600 dark:text-slate-300",
      danger: "bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg dark:bg-red-900 dark:hover:bg-red-800",
      ghost: "bg-transparent hover:bg-slate-100 text-slate-700 dark:hover:bg-slate-800 dark:text-slate-300"
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm rounded-lg",
      md: "px-5 py-2.5 text-base rounded-xl",
      lg: "px-8 py-3 text-lg rounded-xl"
    };

    const widthClass = fullWidth ? "w-full" : "";

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

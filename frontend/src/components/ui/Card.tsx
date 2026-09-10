import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = "", hoverable = false, ...props }) => {
  const baseClass =
    "overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white/92 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.4)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/80";
  const hoverClass = hoverable
    ? "transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_80px_-42px_rgba(15,23,42,0.55)]"
    : "";

  return (
    <div className={`${baseClass} ${hoverClass} ${className}`} {...props}>
      {children}
    </div>
  );
};

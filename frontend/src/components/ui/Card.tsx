import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = "", hoverable = false, ...props }) => {
  const baseClass = "glass-panel premium-shadow rounded-2xl overflow-hidden";
  const hoverClass = hoverable ? "hover-lift transition-all duration-300" : "";
  
  return (
    <div className={`${baseClass} ${hoverClass} ${className}`} {...props}>
      {children}
    </div>
  );
};

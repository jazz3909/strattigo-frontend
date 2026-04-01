"use client";

import { HTMLAttributes, ReactNode } from "react";

type CardVariant = "default" | "hover" | "interactive" | "glass";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: "none" | "sm" | "md" | "lg";
  children: ReactNode;
}

const variantStyles: Record<CardVariant, string> = {
  default: "bg-white border border-slate-100 shadow-sm",
  hover: "bg-white border border-slate-100 shadow-sm card-hover cursor-pointer",
  interactive:
    "bg-white border border-slate-100 shadow-sm hover:border-violet-200 hover:shadow-md cursor-pointer transition-all duration-200",
  glass: "glass shadow-sm",
};

const paddingStyles = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

export function Card({
  variant = "default",
  padding = "lg",
  className = "",
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={`rounded-2xl ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

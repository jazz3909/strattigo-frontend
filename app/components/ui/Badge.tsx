"use client";

import { ReactNode } from "react";

type BadgeVariant = "purple" | "blue" | "green" | "red" | "amber" | "gray" | "pink";
type BadgeSize = "sm" | "md";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  purple: "bg-violet-100 text-violet-700 border-violet-200",
  blue: "bg-blue-100 text-blue-700 border-blue-200",
  green: "bg-emerald-100 text-emerald-700 border-emerald-200",
  red: "bg-red-100 text-red-700 border-red-200",
  amber: "bg-amber-100 text-amber-700 border-amber-200",
  gray: "bg-slate-100 text-slate-600 border-slate-200",
  pink: "bg-pink-100 text-pink-700 border-pink-200",
};

const dotColors: Record<BadgeVariant, string> = {
  purple: "bg-violet-500",
  blue: "bg-blue-500",
  green: "bg-emerald-500",
  red: "bg-red-500",
  amber: "bg-amber-500",
  gray: "bg-slate-400",
  pink: "bg-pink-500",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-xs",
};

export function Badge({
  children,
  variant = "gray",
  size = "md",
  dot = false,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColors[variant]}`} />
      )}
      {children}
    </span>
  );
}

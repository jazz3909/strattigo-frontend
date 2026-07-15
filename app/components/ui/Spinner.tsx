"use client";

import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  xs: "w-3 h-3 border-[1.5px]",
  sm: "w-4 h-4 border-2",
  md: "w-5 h-5 border-2",
  lg: "w-8 h-8 border-[3px]",
};

/**
 * Accent spinner — tint track, accent head (cream tokens). On a solid accent
 * button, override via className (e.g. "border-white/40 border-t-white").
 */
export function Spinner({ size = "md", className = "" }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        sizeMap[size],
        "border-accent-tint2 border-t-accent rounded-full animate-spin inline-block flex-shrink-0",
        className
      )}
    />
  );
}

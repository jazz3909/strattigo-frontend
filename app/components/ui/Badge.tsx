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

function getBadgeStyle(variant: BadgeVariant): React.CSSProperties {
  switch (variant) {
    case "purple":
      return { background: "var(--accent-dim)", color: "var(--accent)", borderColor: "var(--accent-dim)" };
    case "blue":
      return { background: "rgba(96,165,250,0.1)", color: "#60a5fa", borderColor: "rgba(96,165,250,0.2)" };
    case "green":
      return { background: "rgba(16,185,129,0.1)", color: "var(--success)", borderColor: "rgba(16,185,129,0.2)" };
    case "red":
      return { background: "rgba(239,68,68,0.1)", color: "var(--danger)", borderColor: "rgba(239,68,68,0.2)" };
    case "amber":
      return { background: "rgba(251,191,36,0.1)", color: "#fbbf24", borderColor: "rgba(251,191,36,0.2)" };
    case "gray":
      return { background: "var(--surface-2)", color: "var(--text-secondary)", borderColor: "var(--border)" };
    case "pink":
      return { background: "rgba(236,72,153,0.1)", color: "#ec4899", borderColor: "rgba(236,72,153,0.2)" };
    default:
      return { background: "var(--surface-2)", color: "var(--text-secondary)", borderColor: "var(--border)" };
  }
}

function getDotColor(variant: BadgeVariant): string {
  switch (variant) {
    case "purple": return "var(--accent)";
    case "blue": return "#60a5fa";
    case "green": return "var(--success)";
    case "red": return "var(--danger)";
    case "amber": return "#fbbf24";
    case "gray": return "var(--text-tertiary)";
    case "pink": return "#ec4899";
    default: return "var(--text-tertiary)";
  }
}

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
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${sizeStyles[size]} ${className}`}
      style={getBadgeStyle(variant)}
    >
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ background: getDotColor(variant) }}
        />
      )}
      {children}
    </span>
  );
}

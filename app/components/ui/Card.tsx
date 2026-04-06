"use client";

import { HTMLAttributes, ReactNode } from "react";

type CardVariant = "default" | "hover" | "interactive" | "glass";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: "none" | "sm" | "md" | "lg";
  children: ReactNode;
}

const paddingStyles = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

function getVariantStyle(variant: CardVariant): React.CSSProperties {
  switch (variant) {
    case "default":
      return { background: "var(--surface)", border: "1px solid var(--border)" };
    case "hover":
      return { background: "var(--surface)", border: "1px solid var(--border)" };
    case "interactive":
      return { background: "var(--surface)", border: "1px solid var(--border)" };
    case "glass":
      return {};
    default:
      return { background: "var(--surface)", border: "1px solid var(--border)" };
  }
}

export function Card({
  variant = "default",
  padding = "lg",
  className = "",
  style,
  children,
  ...rest
}: CardProps) {
  const isHover = variant === "hover";
  const isInteractive = variant === "interactive";
  const isGlass = variant === "glass";

  return (
    <div
      className={`
        rounded-2xl shadow-sm
        ${isHover ? "card-hover cursor-pointer" : ""}
        ${isInteractive ? "cursor-pointer transition-all duration-200" : ""}
        ${isGlass ? "glass" : ""}
        ${paddingStyles[padding]}
        ${className}
      `}
      style={{ ...getVariantStyle(variant), ...style }}
      {...rest}
    >
      {children}
    </div>
  );
}

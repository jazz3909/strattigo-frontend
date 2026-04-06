"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";
import { Spinner } from "./Spinner";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline-purple";
type ButtonSize = "xs" | "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children?: ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "btn-press shadow-sm hover:shadow-md hover:opacity-90 disabled:opacity-50",
  secondary:
    "border btn-press shadow-sm hover:shadow-md disabled:opacity-50",
  ghost:
    "btn-press disabled:opacity-50",
  danger:
    "text-white shadow-sm btn-press disabled:opacity-50",
  "outline-purple":
    "border btn-press disabled:opacity-50",
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: "px-2.5 py-1.5 text-xs rounded-lg gap-1.5",
  sm: "px-3.5 py-2 text-sm rounded-xl gap-2",
  md: "px-4 py-2.5 text-sm rounded-xl gap-2",
  lg: "px-6 py-3.5 text-base rounded-xl gap-2.5",
};

function getInlineStyle(variant: ButtonVariant): React.CSSProperties {
  switch (variant) {
    case "primary":
      return { background: "var(--accent)", color: "#0a0a0f" };
    case "secondary":
      return { background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-primary)" };
    case "ghost":
      return { color: "var(--text-secondary)" };
    case "danger":
      return { background: "var(--danger)" };
    case "outline-purple":
      return { background: "var(--accent-dim)", borderColor: "var(--accent-dim)", color: "var(--accent)" };
    default:
      return {};
  }
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  leftIcon,
  rightIcon,
  children,
  fullWidth = false,
  className = "",
  disabled,
  style,
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center font-semibold
        transition-all duration-150 cursor-pointer
        focus-visible:ring-2 focus-visible:ring-offset-2
        disabled:cursor-not-allowed select-none
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
      style={{ ...getInlineStyle(variant), ...style }}
      {...rest}
    >
      {loading ? (
        <Spinner size="sm" className={variant === "primary" || variant === "danger" ? "border-white/30 border-t-white" : ""} />
      ) : leftIcon ? (
        <span className="flex-shrink-0">{leftIcon}</span>
      ) : null}
      {children && <span>{children}</span>}
      {!loading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
    </button>
  );
}

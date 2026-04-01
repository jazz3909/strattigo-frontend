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
    "btn-gradient btn-press text-white shadow-sm hover:shadow-md hover:opacity-95 disabled:opacity-50",
  secondary:
    "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-sm btn-press disabled:opacity-50",
  ghost:
    "text-slate-600 hover:bg-slate-100 hover:text-slate-900 btn-press disabled:opacity-50",
  danger:
    "bg-red-600 text-white hover:bg-red-700 shadow-sm btn-press disabled:opacity-50",
  "outline-purple":
    "border border-violet-200 text-violet-700 bg-violet-50 hover:bg-violet-100 hover:border-violet-300 btn-press disabled:opacity-50",
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: "px-2.5 py-1.5 text-xs rounded-lg gap-1.5",
  sm: "px-3.5 py-2 text-sm rounded-xl gap-2",
  md: "px-4 py-2.5 text-sm rounded-xl gap-2",
  lg: "px-6 py-3.5 text-base rounded-xl gap-2.5",
};

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
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center font-semibold
        transition-all duration-150 cursor-pointer
        focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2
        disabled:cursor-not-allowed select-none
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
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

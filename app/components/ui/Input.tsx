"use client";

import { InputHTMLAttributes, ReactNode, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightElement?: ReactNode;
  wrapperClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    error,
    helperText,
    leftIcon,
    rightElement,
    wrapperClassName = "",
    className = "",
    id,
    ...rest
  },
  ref
) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className={`space-y-1.5 ${wrapperClassName}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span
            className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none"
            style={{ color: "var(--text-tertiary)" }}
          >
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full px-4 py-3 text-sm
            border rounded-xl outline-none
            transition-all duration-150
            disabled:cursor-not-allowed
            ${leftIcon ? "pl-10" : ""}
            ${rightElement ? "pr-12" : ""}
            ${className}
          `}
          style={
            error
              ? {
                  background: "var(--surface-2)",
                  borderColor: "var(--danger)",
                  color: "var(--text-primary)",
                }
              : {
                  background: "var(--surface-2)",
                  borderColor: "var(--border)",
                  color: "var(--text-primary)",
                }
          }
          onFocus={(e) => {
            if (!error) {
              e.currentTarget.style.borderColor = "var(--accent)";
              e.currentTarget.style.boxShadow = "0 0 0 2px var(--accent-dim)";
            }
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error ? "var(--danger)" : "var(--border)";
            e.currentTarget.style.boxShadow = "";
            rest.onBlur?.(e);
          }}
          {...rest}
        />
        {rightElement && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center">
            {rightElement}
          </span>
        )}
      </div>
      {error && (
        <p className="text-xs flex items-center gap-1" style={{ color: "var(--danger)" }}>
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
      {!error && helperText && (
        <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{helperText}</p>
      )}
    </div>
  );
});

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  wrapperClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, helperText, wrapperClassName = "", className = "", id, ...rest },
  ref
) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className={`space-y-1.5 ${wrapperClassName}`}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        className={`
          w-full px-4 py-3 text-sm
          border rounded-xl outline-none resize-none
          transition-all duration-150
          ${className}
        `}
        style={
          error
            ? { background: "var(--surface-2)", borderColor: "var(--danger)", color: "var(--text-primary)" }
            : { background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text-primary)" }
        }
        onFocus={(e) => {
          if (!error) {
            e.currentTarget.style.borderColor = "var(--accent)";
            e.currentTarget.style.boxShadow = "0 0 0 2px var(--accent-dim)";
          }
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error ? "var(--danger)" : "var(--border)";
          e.currentTarget.style.boxShadow = "";
          rest.onBlur?.(e);
        }}
        {...rest}
      />
      {error && <p className="text-xs" style={{ color: "var(--danger)" }}>{error}</p>}
      {!error && helperText && <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{helperText}</p>}
    </div>
  );
});

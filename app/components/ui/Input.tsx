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
          className="block text-sm font-medium text-slate-700"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 flex items-center pointer-events-none">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full px-4 py-3 text-sm text-slate-900 placeholder-slate-400
            border rounded-xl outline-none
            transition-all duration-150
            ${error
              ? "border-red-400 bg-red-50/50 focus:ring-2 focus:ring-red-400/40 focus:border-red-400"
              : "border-slate-200 bg-white focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
            }
            disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
            ${leftIcon ? "pl-10" : ""}
            ${rightElement ? "pr-12" : ""}
            ${className}
          `}
          {...rest}
        />
        {rightElement && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center">
            {rightElement}
          </span>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
      {!error && helperText && (
        <p className="text-xs text-slate-400">{helperText}</p>
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
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        className={`
          w-full px-4 py-3 text-sm text-slate-900 placeholder-slate-400
          border rounded-xl outline-none resize-none
          transition-all duration-150
          ${error
            ? "border-red-400 bg-red-50/50 focus:ring-2 focus:ring-red-400/40 focus:border-red-400"
            : "border-slate-200 bg-white focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
          }
          disabled:bg-slate-50 disabled:text-slate-400
          ${className}
        `}
        {...rest}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      {!error && helperText && <p className="text-xs text-slate-400">{helperText}</p>}
    </div>
  );
});

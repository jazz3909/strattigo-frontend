"use client";

import { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  iconEmoji?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  iconEmoji,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-16 px-4 ${className}`}>
      {(icon || iconEmoji) && (
        <div className="mb-5">
          {iconEmoji ? (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-50 to-blue-50 border border-violet-100 flex items-center justify-center text-3xl shadow-sm">
              {iconEmoji}
            </div>
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-50 to-blue-50 border border-violet-100 flex items-center justify-center text-violet-500 shadow-sm">
              {icon}
            </div>
          )}
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-800 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-slate-400 max-w-sm leading-relaxed mb-6">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}

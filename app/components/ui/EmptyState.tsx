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
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-sm"
              style={{ background: "var(--accent-dim)", border: "1px solid var(--border)" }}
            >
              {iconEmoji}
            </div>
          ) : (
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm"
              style={{ background: "var(--accent-dim)", border: "1px solid var(--border)", color: "var(--accent)" }}
            >
              {icon}
            </div>
          )}
        </div>
      )}
      <h3 className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>{title}</h3>
      {description && (
        <p className="text-sm max-w-sm leading-relaxed mb-6" style={{ color: "var(--text-tertiary)" }}>{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}

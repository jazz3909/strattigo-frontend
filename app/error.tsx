"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

/**
 * Route-level error boundary (Next 16: `unstable_retry` re-fetches and
 * re-renders the failed segment). Reports the error to Sentry, then shows a
 * friendly frosted-glass card instead of the blank page users got before.
 */
export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: "transparent" }}
    >
      <div
        className="max-w-md w-full px-7 py-8 text-center"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 18,
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <span
          style={{
            fontSize: "20px",
            fontWeight: 800,
            letterSpacing: "0.12em",
            color: "var(--accent)",
          }}
        >
          STRATTIGO
        </span>
        <h2
          className="mt-5 text-lg font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Something went wrong
        </h2>
        <p
          className="mt-2 text-sm leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          An unexpected error interrupted this page. Your courses and materials
          are safe — try again, or head back to your dashboard.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={() => unstable_retry()}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
            style={{ background: "var(--accent)", color: "#0A0E18" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "var(--accent-hover)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "var(--accent)";
            }}
          >
            Try again
          </button>
          <a
            href="/dashboard"
            className="px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
            style={{
              color: "var(--text-secondary)",
              border: "1px solid var(--border)",
            }}
          >
            Go to dashboard
          </a>
        </div>
        {error.digest && (
          <p
            className="mt-5 text-xs"
            style={{ color: "var(--text-secondary)", opacity: 0.6, fontFamily: "monospace" }}
          >
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}

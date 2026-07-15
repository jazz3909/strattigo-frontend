"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

/**
 * Route-level error boundary (Next 16: `unstable_retry` re-fetches and
 * re-renders the failed segment). Reports the error to Sentry, then shows a
 * calm cream card instead of the blank page users got before.
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
    <div className="min-h-screen flex items-center justify-center px-6 bg-page text-ink">
      <div className="max-w-md w-full px-7 py-8 text-center rounded-xl border border-rule bg-sheet shadow-lg">
        <span className="font-display font-semibold text-xl tracking-[0.1em] text-accent-deep">
          STRATTIGO
        </span>
        <h2 className="mt-5 font-display text-display-s text-ink">
          Something went wrong
        </h2>
        <p className="mt-2 font-read text-read-s leading-relaxed text-ink-soft">
          An unexpected error interrupted this page. Your courses and materials
          are safe — try again, or head back to your dashboard.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={() => unstable_retry()}
            className="cursor-pointer rounded-sm bg-accent px-5 py-2.5 font-sans text-ui font-medium text-white transition-colors hover:bg-accent-hover"
          >
            Try again
          </button>
          <a
            href="/dashboard"
            className="rounded-sm border border-rule-strong px-5 py-2.5 font-sans text-ui font-medium text-ink-soft transition-colors hover:bg-rule-soft"
          >
            Go to dashboard
          </a>
        </div>
        {error.digest && (
          <p className="mt-5 font-mono text-xs text-ink-faint">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}

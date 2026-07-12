"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

/**
 * Top-level boundary for errors thrown in the root layout itself. It replaces
 * the entire document, so it must render its own <html>/<body> and cannot use
 * globals.css — the app palette (salmon #E19485, dark frosted glass) is
 * hardcoded inline to still look like the product.
 */
export default function GlobalError({
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
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background: "linear-gradient(160deg, #0A0E18 0%, #111825 60%, #1A2D45 100%)",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: 420,
            width: "100%",
            padding: "32px 28px",
            textAlign: "center",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 18,
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          <span
            style={{
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: "0.12em",
              color: "#E19485",
            }}
          >
            STRATTIGO
          </span>
          <h2 style={{ margin: "20px 0 0", fontSize: 18, color: "#F2EDE8" }}>
            Something went wrong
          </h2>
          <p
            style={{
              margin: "10px 0 0",
              fontSize: 14,
              lineHeight: 1.6,
              color: "#8A9AB5",
            }}
          >
            An unexpected error interrupted the app. Your courses and materials
            are safe — reloading usually fixes it.
          </p>
          <button
            onClick={() => unstable_retry()}
            style={{
              marginTop: 24,
              padding: "10px 22px",
              borderRadius: 12,
              border: "none",
              background: "#E19485",
              color: "#0A0E18",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          {error.digest && (
            <p
              style={{
                marginTop: 20,
                fontSize: 11,
                fontFamily: "monospace",
                color: "#8A9AB5",
                opacity: 0.6,
              }}
            >
              Error ID: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}

"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

/**
 * Top-level boundary for errors thrown in the root layout itself. It replaces
 * the entire document, so it must render its own <html>/<body> and cannot use
 * globals.css — the cream palette is hardcoded inline (values mirror the
 * @theme tokens: page #F4F1E9, raised #FFFFFF, rule #E3DED2, ink #23211C,
 * ink-soft #4A4740, ink-faint #86827A, accent #5E7185, accent-deep #3B4A5A)
 * to still look like the product.
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
          background: "#F4F1E9",
          color: "#23211C",
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
            background: "#FFFFFF",
            border: "1px solid #E3DED2",
            borderRadius: 16,
            boxShadow:
              "0 4px 12px rgba(35, 33, 28, 0.06), 0 20px 50px rgba(35, 33, 28, 0.12)",
          }}
        >
          <span
            style={{
              fontSize: 20,
              fontWeight: 600,
              letterSpacing: "0.1em",
              color: "#3B4A5A",
            }}
          >
            STRATTIGO
          </span>
          <h2 style={{ margin: "20px 0 0", fontSize: 18, color: "#23211C" }}>
            Something went wrong
          </h2>
          <p
            style={{
              margin: "10px 0 0",
              fontSize: 14,
              lineHeight: 1.6,
              color: "#4A4740",
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
              borderRadius: 8,
              border: "none",
              background: "#5E7185",
              color: "#FFFFFF",
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
                color: "#86827A",
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

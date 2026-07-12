"use client";

// ─────────────────────────────────────────────────────────────────────────────
// THROWAWAY DEBUG ROUTE — Sentry live-capture verification. DELETE AFTER TEST.
// Clicking the button throws during render, which (1) triggers app/error.tsx
// (the "Something went wrong" boundary) and (2) reports the error to Sentry
// via the boundary's captureException.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";

export default function SentryLiveTest() {
  const [crash, setCrash] = useState(false);

  if (crash) {
    throw new Error("sentry-frontend-live-test");
  }

  const sentryEnabled = Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: "transparent" }}
    >
      <div
        className="max-w-md w-full px-7 py-8 text-center"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px dashed rgba(225,148,133,0.5)",
          borderRadius: 18,
        }}
      >
        <p
          className="text-xs font-bold tracking-widest"
          style={{ color: "var(--accent)" }}
        >
          DEBUG · TEMPORARY · SENTRY TEST
        </p>
        <p
          className="mt-3 text-sm leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          Sentry in this build:{" "}
          <strong style={{ color: "var(--text-primary)" }}>
            {sentryEnabled ? "ENABLED (DSN present)" : "DISABLED (no DSN baked into this build)"}
          </strong>
          . The button below throws a render-time error to verify the error
          boundary and Sentry capture. This page will be removed.
        </p>
        <button
          onClick={() => setCrash(true)}
          className="mt-6 px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
          style={{ background: "var(--danger)", color: "#0A0E18" }}
        >
          Throw test error
        </button>
      </div>
    </div>
  );
}

/**
 * Client-side Sentry init (Next 16 instrumentation-client convention).
 *
 * Privacy-first for student data: no PII, no Session Replay (it records the
 * screen — i.e. student material and chat content), no console breadcrumbs
 * (the app console.logs chat bodies), secrets scrubbed via lib/sentry-scrub.
 * If NEXT_PUBLIC_SENTRY_DSN is unset, Sentry is disabled and the app runs
 * exactly as before.
 */
import * as Sentry from "@sentry/nextjs";
import { scrubDeep, scrubEvent } from "./lib/sentry-scrub";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || "production",
    sendDefaultPii: false, // no IP addresses, no auth headers, no cookies
    tracesSampleRate: 0.1, // light performance sampling

    // Session Replay is deliberately OFF: no replayIntegration() is added,
    // and both sample rates are pinned to 0 so it stays off even if an
    // integration ever sneaks in via a default or a future upgrade.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,

    beforeSend: scrubEvent,
    beforeSendTransaction: scrubEvent,
    beforeBreadcrumb(breadcrumb) {
      // The app logs chat request/response bodies to the console; console
      // breadcrumbs would ship that student content with every event.
      if (breadcrumb.category === "console") return null;
      return scrubDeep(breadcrumb) as typeof breadcrumb;
    },
  });
}

// Safe no-op when Sentry.init was skipped (no DSN).
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

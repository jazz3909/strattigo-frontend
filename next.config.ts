import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["45.79.221.129"],
  experimental: {
    // Inline the app's (atomic Tailwind) CSS into <head> as <style> instead of
    // a render-blocking <link>. Removes the CSS request from the critical path
    // so first paint no longer waits a round-trip for the stylesheet — the
    // "render-blocking requests" LCP lever. Delivery-only: identical styles,
    // no visual change. Recommended by Next for atomic-CSS/Tailwind apps.
    inlineCss: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://45.79.221.129:8000/:path*',
      },
    ];
  },
  async headers() {
    return [
      {
        // Hashed build assets (JS/CSS/next-font media) are content-addressed —
        // a new deploy emits new filenames — so they can cache forever. Vercel
        // already applies this; declaring it keeps self-hosted `next start`
        // (the Linode preview) and any other host consistent.
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // Source-map upload only runs when SENTRY_AUTH_TOKEN is provided (e.g. in
  // Vercel env); local/CI builds without it stay silent and fully functional.
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,
  telemetry: false,
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
  disableLogger: true,
  // The client SDK ships on every page, so trim code paths this app never
  // uses. Session Replay is disabled in instrumentation-client.ts (no
  // replayIntegration, sample rates pinned to 0), so its shadow-DOM / iframe /
  // worker bundles are dead weight; excludeDebugStatements drops the SDK's
  // logger internals. Pure build-time tree-shaking — no runtime behavior change.
  bundleSizeOptimizations: {
    excludeReplayShadowDom: true,
    excludeReplayIframe: true,
    excludeReplayWorker: true,
    excludeDebugStatements: true,
  },
});

import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["45.79.221.129"],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://45.79.221.129:8000/:path*',
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
});

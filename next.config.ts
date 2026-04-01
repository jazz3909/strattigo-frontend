import type { NextConfig } from "next";

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

export default nextConfig;

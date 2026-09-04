import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  allowedDevOrigins: ["127.0.0.1"],
  experimental: {
    // Keeps Server Action payloads small; raise deliberately if a feature needs it.
    serverActions: { bodySizeLimit: "1mb" },
  },
};

export default nextConfig;

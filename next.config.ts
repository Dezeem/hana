import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output keeps the Docker image small and self-contained.
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  // Native / dynamically imported packages must stay outside the bundle so the
  // standalone server can resolve them at runtime.
  serverExternalPackages: ["sharp", "undici"],
  experimental: {
    // The Douban importer can fetch large HTML documents; keep the limit sane.
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

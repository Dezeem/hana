import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Lets a production build run beside an active `next dev` without the two
   * processes fighting over `.next` (which corrupts route chunks):
   *   NEXT_DIST_DIR=.next-build npm run build
   */
  distDir: process.env.NEXT_DIST_DIR || ".next",
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
  /**
   * Dev-only: the file watcher used to follow node_modules and the data volume,
   * which blows past `fs.inotify.max_user_watches` (8192 on many hosts) and
   * floods the console with ENOSPC errors. Neither directory can change in a way
   * that needs a rebuild.
   */
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: ["**/node_modules/**", "**/.git/**", "**/data/**", "**/.next/**"],
      };
    }
    return config;
  },
};

export default nextConfig;

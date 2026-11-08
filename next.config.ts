import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // รันใน Docker ด้วย .next/standalone/server.js (ดู Dockerfile)
  output: "standalone",
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

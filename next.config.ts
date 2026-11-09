import type { NextConfig } from "next";
import pkg from "./package.json" with { type: "json" };

// เลขเวอร์ชันโชว์ท้ายเว็บ: แก้ "version" ใน package.json ทุกครั้งที่ขึ้นเว็บ · เวลา build บอกว่าเครื่องจริงอัปเดตแล้ว
const buildTime = new Intl.DateTimeFormat("th-TH", {
  timeZone: "Asia/Bangkok",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
}).format(new Date());

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version,
    NEXT_PUBLIC_BUILD_TIME: buildTime,
  },
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

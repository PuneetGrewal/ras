// Next.js settings. The one custom setting only matters during development (see below).
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets a phone on the same Wi-Fi test the dev server (`npm run dev -- -H 0.0.0.0`, then the computer's
  // address, e.g. http://192.168.1.23:3000). Next.js otherwise blocks its dev scripts for any address but
  // localhost, and the safety form never comes alive. No effect on the deployed site.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*"],
};

export default nextConfig;

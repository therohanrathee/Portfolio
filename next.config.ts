import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable static HTML export ONLY when building on GitHub Actions
  output: process.env.GITHUB_ACTIONS ? "export" : undefined,
  images: {
    unoptimized: true, // Required for static exports
  },
};

export default nextConfig;

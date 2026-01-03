import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    turbo: {
      // This forces Turbopack to look at the current working directory
      root: '.', 
    },
  },
};

export default nextConfig;
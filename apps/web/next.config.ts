import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  eslint: {
    //TODO: fix lint errors
    // Disable ESLint during builds for Docker
    ignoreDuringBuilds: true,
  },
  typescript: {
    //TODO: fix lint errors
    // Disable TypeScript errors during builds for Docker
    ignoreBuildErrors: true,
  },
};

export default nextConfig;

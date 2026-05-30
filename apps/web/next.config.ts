import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@mediation-rooms/ui",
    "@mediation-rooms/config",
    "@arkiv-network/sdk",
  ],
};

export default nextConfig;

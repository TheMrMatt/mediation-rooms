import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@mediation-rooms/ui",
    "@mediation-rooms/config",
    "@mediation-rooms/arkiv",
    "@mediation-rooms/agent",
    "@mediation-rooms/api",
    "@arkiv-network/sdk",
  ],
  serverExternalPackages: ["@hono/node-server"],
};

export default nextConfig;

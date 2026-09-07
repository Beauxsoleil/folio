import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server bundle for Docker / VPS deploys (server.js).
  output: "standalone",
};

export default nextConfig;

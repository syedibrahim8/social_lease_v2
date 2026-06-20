import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This app lives inside the backend repo, which has its own lockfile one
  // level up. Pin the Turbopack root to this directory so Next never infers
  // the backend as the workspace root.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;

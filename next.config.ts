import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Pin workspace root so Next only watches this project (stops recompilation
    // loop when another lockfile exists up the tree, e.g. in your user directory).
    root: path.resolve(process.cwd()),
  },
  async redirects() {
    return [
      { source: "/founder/dashboard", destination: "/dashboard", permanent: true },
    ];
  },
};

export default nextConfig;

import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
  turbopack: {
    // Pin workspace root so Next only watches this project (stops recompilation
    // loop when another lockfile exists up the tree, e.g. in your user directory).
    root: path.resolve(process.cwd()),
  },
  experimental: {
    optimizePackageImports: ["@supabase/supabase-js", "@supabase/auth-js", "country-state-city"],
  },
  async redirects() {
    return [
      { source: "/founder/dashboard", destination: "/dashboard", permanent: true },
      { source: "/messages", destination: "/community", permanent: true },
    ];
  },
};

export default nextConfig;

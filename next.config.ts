import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for Cloudflare Pages deployment
  // Will switch to OpenNext (@opennextjs/cloudflare) when SSR is needed
  output: "export",

  // Fix workspace root detection (parent has a lockfile too)
  turbopack: {
    root: __dirname,
  },

  // Image optimization (unoptimized for static export, BunnyCDN handles optimization)
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.b-cdn.net",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },

  // Note: headers() not supported with static export
  // Security headers are set via public/_headers for Cloudflare Pages
};

export default nextConfig;

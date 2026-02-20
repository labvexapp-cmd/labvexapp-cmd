import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // SSR mode - OpenNext for Cloudflare Pages
  // Build: npx opennextjs-cloudflare build
  // Deploy: npx opennextjs-cloudflare deploy

  // Fix workspace root detection (parent has a lockfile too)
  turbopack: {
    root: __dirname,
  },

  // BunnyCDN handles image optimization
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
};

export default nextConfig;

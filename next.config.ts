import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true, // Disable Next.js image optimization
  },
  trailingSlash: true, // Recommended for static hosting
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Exclude `canvas` from the client-side build
      config.resolve.alias.canvas = false;
    }
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push("canvas");
    }
    return config;
  },
};

export default nextConfig;
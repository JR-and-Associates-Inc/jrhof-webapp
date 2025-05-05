import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export', // ✅ Static HTML export
  images: {
    unoptimized: true, // ✅ Required for using <Image> with static output
  },
  trailingSlash: true, // ✅ Recommended for static hosting like GitHub Pages, S3, etc.
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias.canvas = false; // ✅ Avoids errors for canvas on client
    }
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push("canvas"); // ✅ Ensures canvas loads server-side only
    }
    return config;
  },
};

export default nextConfig;
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true, // Recommended for static hosting
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push("canvas");
    }
    return config;
  },
};

export default nextConfig;
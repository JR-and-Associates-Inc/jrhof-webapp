import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  output: 'export',

  // ✅ Correct location for this block
  future: {
    legacyBrowsers: false,
  },

  webpack: (config) => {
    config.experiments = { ...config.experiments, topLevelAwait: true };

    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      stream: false,
    };

    return config;
  },
};

export default nextConfig;
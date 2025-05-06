import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  webpack: (config) => {
    // Enable top-level await for future-proofing or react-pdf
    config.experiments = { ...config.experiments, topLevelAwait: true };

    // Remove unnecessary Node polyfills
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
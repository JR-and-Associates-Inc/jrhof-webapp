import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,  // Optional, depending on how you handle images
  },
  trailingSlash: true,
  output: 'export', // Add this line to make it a fully static site
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
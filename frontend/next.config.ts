import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use webpack instead of turbopack to avoid configuration conflicts
  experimental: {
    turbo: {
      // Disable turbopack for now
    }
  },
  webpack: (config, { isServer }) => {
    // Add Buffer polyfill for browser compatibility
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        buffer: require.resolve('buffer'),
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        util: require.resolve('util'),
      };
    }
    return config;
  },
};

export default nextConfig;

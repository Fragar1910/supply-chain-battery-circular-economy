import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Webpack configuration for production build
  webpack: (config, { isServer }) => {
    // Ignore test files from dependencies
    config.module.rules.push({
      test: /node_modules\/thread-stream\/(test|LICENSE|README\.md)/,
      use: 'null-loader',
    });

    return config;
  },

  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
};

export default nextConfig;

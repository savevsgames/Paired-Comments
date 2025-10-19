/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  swcMinify: true,

  // Monaco editor requires these settings
  webpack: (config) => {
    config.module.rules.push({
      test: /\.ttf$/,
      type: 'asset/resource',
    });

    return config;
  },

  // Disable telemetry
  telemetry: false,

  // Environment variables
  env: {
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'Paired Comments Demo',
    NEXT_PUBLIC_VERSION: process.env.NEXT_PUBLIC_VERSION || '2.1.6',
  },
};

module.exports = nextConfig;

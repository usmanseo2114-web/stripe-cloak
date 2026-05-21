/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  // swcMinify removed for Next.js 15 compatibility
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@/lib': path.resolve(__dirname, 'lib'),
      '@/components/ui': path.resolve(__dirname, 'components/ui'),
    };
    return config;
  },
};

module.exports = nextConfig
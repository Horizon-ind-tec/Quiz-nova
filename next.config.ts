import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // The 'appDir' flag is now stable in Next.js 15, 
  // but included here as requested for your specific setup.
  experimental: {
    // @ts-ignore
    appDir: true
  }
};

export default nextConfig;
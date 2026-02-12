/** @type {import('next').NextConfig} */
const nextConfig = {
  /* 
   * AI-Powered Learning App Configuration
   * We use standard deployment (not static export) to support AI Server Actions.
   */
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;

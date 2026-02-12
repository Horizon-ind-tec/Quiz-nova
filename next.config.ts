/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
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
  // 'appDir' is now stable in Next.js 15, but kept here for compatibility
  experimental: {
    appDir: true
  }
};

export default nextConfig;
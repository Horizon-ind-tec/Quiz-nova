/** @type {import('next').NextConfig} */
const nextConfig = {
  /* 
   * NOTE: We removed 'output: export' because Server Actions (used for AI) 
   * require a server runtime. Use Firebase App Hosting for deployment.
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

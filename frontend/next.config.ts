import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['framer-motion', 'clsx', 'tailwind-merge'],
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/cro-calculator-react',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

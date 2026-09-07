import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  
    outputFileTracingRoot: path.join(__dirname, "../"),

  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable Turbopack to avoid crashes - use stable Webpack instead
  // Turbopack was causing FATAL panics
};

export default nextConfig;

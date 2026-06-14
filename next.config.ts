import type { NextConfig } from "next";

// SSL certificate issue fix for development - must be set before anything else
// Vercel/production da kerak emas - faqat local development uchun
// if (process.env.NODE_ENV !== 'production') {
//   process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
// }

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

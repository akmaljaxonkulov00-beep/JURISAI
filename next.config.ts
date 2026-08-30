import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Domen sozlamalari
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Domain',
            value: 'juristiv.uz',
          },
        ],
      },
    ];
  },
};

export default nextConfig;

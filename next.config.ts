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
            value: 'www.juristiv.uz',
          },
        ],
      },
    ];
  },
};

export default nextConfig;

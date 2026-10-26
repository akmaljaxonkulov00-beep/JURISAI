import type { NextConfig } from "next";

if (process.env.NODE_ENV !== "production") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

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

import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  async rewrites() {
    if (!isDevelopment) {
      return [];
    }

    return [
      {
        source: "/api",
        destination: "http://127.0.0.1:8000/api",
      },
    ];
  },
};

export default nextConfig;

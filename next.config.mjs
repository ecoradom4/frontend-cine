/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://backend-cine-b0xw.onrender.com/api/:path*", // tu backend en Render
      },
    ];
  },

  env: {
    NEXT_PUBLIC_API_URL: "https://backend-cine-b0xw.onrender.com/api/",
  },
};

export default nextConfig;

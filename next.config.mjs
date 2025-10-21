/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    domains: ['backend-cine-b0xw.onrender.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'backend-cine-b0xw.onrender.com',
        pathname: '/**',
      },
    ],
  },
  
  // Configuración de headers para CORS
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ];
  },

  // Deshabilitar la optimización de fuentes si causa problemas
  optimizeFonts: false,
  
  // Configuración para preload de fuentes
  experimental: {
    optimizeCss: false,
  },
}

export default nextConfig;
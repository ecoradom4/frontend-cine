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
        pathname: '/storage/**',
      },
      {
        protocol: 'https',
        hostname: 'backend-cine-b0xw.onrender.com',
        pathname: '/api/**',
      },
    ],
  },
  
  // Configuración de headers para CORS
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: 'https://backend-cine-b0xw.onrender.com',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
          {
            key: 'Access-Control-Max-Age',
            value: '86400',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },

  // Configuración de redirecciones para desarrollo
  async rewrites() {
    // Solo en desarrollo, redirige las API calls al backend local
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:4000/api/:path*',
        },
        {
          source: '/storage/:path*',
          destination: 'http://localhost:4000/storage/:path*',
        },
      ];
    }
    return [];
  },

  // Variables de entorno
  env: {
    BACKEND_URL: process.env.NODE_ENV === 'production' 
      ? 'https://backend-cine-b0xw.onrender.com'
      : 'http://localhost:4000',
    NEXTAUTH_URL: process.env.NODE_ENV === 'production'
      ? 'https://frontend-cine.onrender.com' // Cambia por tu URL de frontend
      : 'http://localhost:3000',
  },

  // Otras configuraciones
  poweredByHeader: false,
  compress: true,
  trailingSlash: false,
}

export default nextConfig;
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // output: 'export', // Removido para permitir API Routes
  images: {
    unoptimized: true,
  },
  // trailingSlash: true, // Removido para compatibilidade
}

module.exports = nextConfig

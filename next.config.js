/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
    serverComponentsExternalPackages: ['pdfkit'],
  },
  images: {
    domains: ['abs-rh.lovable.app'],
  },
}

module.exports = nextConfig
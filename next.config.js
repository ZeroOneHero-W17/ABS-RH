/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pdfkit'],
  },
  images: {
    domains: ['abs-rh.lovable.app'],
  },
}

module.exports = nextConfig
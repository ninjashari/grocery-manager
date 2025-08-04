/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['localhost', 'lh3.googleusercontent.com'],
  },
}

module.exports = nextConfig
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Mengizinkan halaman dev dibuka lewat localhost maupun 127.0.0.1
  allowedDevOrigins: ['localhost', '127.0.0.1'],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig

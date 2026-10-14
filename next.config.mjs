/** @type {import('next').NextConfig} */
const nextConfig = {
  // Daftar origin (hostname saja, tanpa http/port) yang boleh mengakses dev server.
  // Dibutuhkan saat menguji dari device lain: lewat IP jaringan lokal atau lewat tunnel.
  allowedDevOrigins: [
    'localhost',
    '127.0.0.1',
    '192.168.*.*', // Wi-Fi/LAN umum (mis. 192.168.1.5)
    '10.*.*.*', // LAN lain
    '*.trycloudflare.com', // cloudflared quick tunnel
    '*.ngrok-free.app', // ngrok (free)
    '*.ngrok-free.dev', // ngrok (free, domain baru)
    '*.ngrok.app',
    '*.ngrok.io', // ngrok (legacy)
    '*.loca.lt', // localtunnel
  ],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: false, // Disable SWC minification to see if that's causing issues
  images: {
    domains: ['ipfs.io', 'w3s.link', 'cloudflare-ipfs.com', 'gateway.pinata.cloud'],
  },
}

module.exports = nextConfig 
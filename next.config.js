const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 👇 Yeh line Turbopack ko disable karega aur webpack use karega
  webpack: (config, { isServer }) => {
    return config
  },
}

module.exports = withPWA(nextConfig)
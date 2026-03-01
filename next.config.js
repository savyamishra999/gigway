const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
})

const nextConfig = {
  reactStrictMode: true,
  // Yeh line webpack ko enable karegi
  webpack: (config, { isServer }) => {
    return config
  },
}

module.exports = withPWA(nextConfig)
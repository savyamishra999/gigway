const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
})

const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["@google-cloud/tasks"],
  // Yeh line webpack ko enable karegi
  webpack: (config, { isServer }) => {
    return config
  },
  // "@" is reserved for parallel-route slots in app/, so /@username profile
  // links are served from app/u/[username] and rewritten here instead.
  async rewrites() {
    return [{ source: "/@:username", destination: "/u/:username" }]
  },
}

module.exports = withPWA(nextConfig)

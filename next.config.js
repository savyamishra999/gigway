const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
})

const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["@google-cloud/tasks"],
  // v7 loads its GAPIC config and protobuf JSON with runtime `require()` calls.
  // Keep the Node package external, but explicitly trace those non-static assets
  // into only the server functions that use Cloud Tasks.
  outputFileTracingIncludes: {
    "/api/admin/media-inspection/test": ["./node_modules/@google-cloud/tasks/**/*"],
    "/api/social/posts/[id]/jox-clip": ["./node_modules/@google-cloud/tasks/**/*"],
  },
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

const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  clientsClaim: true,
  cleanupOutdatedCaches: true,
  // The start URL is auth-sensitive. Disabling both switches prevents
  // next-pwa from prepending its own NetworkFirst `start-url` route or
  // precaching `/` ahead of our NetworkOnly navigation rule.
  cacheStartUrl: false,
  dynamicStartUrl: false,
  // Never persist document responses or API payloads. Both can contain
  // session-specific state while their URL stays identical across accounts.
  // Static build assets remain cacheable and use a versioned cache name so a
  // newly activated worker cannot read the former broad runtime caches.
  runtimeCaching: [
    {
      urlPattern: ({ request, url }) => request.mode === "navigate" || url.pathname.startsWith("/api/"),
      handler: "NetworkOnly",
    },
    {
      urlPattern: ({ url }) => url.origin === self.location.origin && url.pathname.startsWith("/_next/static/"),
      handler: "CacheFirst",
      options: {
        cacheName: "gigway-static-v2",
        expiration: { maxEntries: 128, maxAgeSeconds: 30 * 24 * 60 * 60 },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
  ],
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

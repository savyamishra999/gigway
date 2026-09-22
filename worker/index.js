// Imported into the generated next-pwa worker. Remove only cache names used by
// the former broad navigation/API runtime rules; precached and static asset
// caches remain under Workbox's normal lifecycle management.
const UNSAFE_LEGACY_RUNTIME_CACHES = new Set([
  "start-url",
  "apis",
  "others",
  "next-data",
  "static-data-assets",
  "cross-origin",
  "static-image-assets",
  "next-image",
  "static-audio-assets",
  "static-video-assets",
])

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(names => Promise.all(
      names.filter(name => UNSAFE_LEGACY_RUNTIME_CACHES.has(name)).map(name => caches.delete(name)),
    )),
  )
})

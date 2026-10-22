const CACHE_NAME = 'startup-daily-v2'
const STATIC_ASSETS = [
  '/',
  '/index.html',
]

// Install — cache shell
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// Activate — clean old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Fetch — network first, fallback to cache. Only same-origin GETs are
// cached: favicons and font CDNs would otherwise grow the cache without bound.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return
  if (new URL(e.request.url).origin !== self.location.origin) return

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok) {
          const clone = res.clone()
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(e.request, clone))
            .catch(() => {})
        }
        return res
      })
      .catch(() => caches.match(e.request))
  )
})

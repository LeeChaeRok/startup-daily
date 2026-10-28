/* Service worker. vite.config.js fills in the two build constants below with this
   build's files and a hash of them, so the first visit is enough to open
   offline and every deploy gets a fresh shell cache (old ones are deleted). */
const PRECACHE = __PRECACHE__
const SHELL = `sd-shell-${__VERSION__}`
const DATA = 'sd-data'
const RUNTIME = 'sd-runtime'
const KEEP = [SHELL, DATA, RUNTIME]
const TIMEOUT_MS = 3000
// module scripts and the data preload are CORS requests (they carry Origin); a server that
// answers with Vary: Origin would otherwise never match what install cached without it
const MATCH = { ignoreVary: true }

self.addEventListener('install', (e) => {
  e.waitUntil(
    (async () => {
      const shell = await caches.open(SHELL)
      await shell.addAll(PRECACHE.filter((u) => !u.startsWith('/data/')))
      // data also goes to its own cache so the first offline open has an issue to show
      const data = await caches.open(DATA)
      await Promise.all(PRECACHE.filter((u) => u.startsWith('/data/')).map((u) => data.add(u).catch(() => {})))
    })(),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.filter((k) => !KEEP.includes(k)).map((k) => caches.delete(k)))
      await self.clients.claim()
    })(),
  )
})

const put = (cacheName, req, res) => {
  if (!res.ok) return
  const copy = res.clone()
  caches.open(cacheName).then((c) => c.put(req, copy)).catch(() => {})
}

/** Network first, but give up waiting after TIMEOUT_MS when a cached copy exists (weak signal in the subway). */
async function networkFirst(req, cacheName, cacheKey = req) {
  const cached = caches.match(cacheKey, MATCH)
  const network = fetch(req).then((res) => {
    put(cacheName, cacheKey, res)
    return res
  })
  const timeout = new Promise((resolve) => setTimeout(resolve, TIMEOUT_MS))
  const first = await Promise.race([network.catch(() => null), timeout.then(() => cached)])
  if (first) return first
  try {
    return await network
  } catch {
    return (await cached) || Response.error()
  }
}

async function cacheFirst(req, cacheName) {
  const hit = await caches.match(req, MATCH)
  if (hit) return hit
  const res = await fetch(req)
  put(cacheName, req, res)
  return res
}

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  // only same-origin: favicons and font CDNs would otherwise grow the cache without bound
  if (url.origin !== self.location.origin) return
  // generated analyses are kept on the device by the app itself; never serve a stale API answer
  if (url.pathname.startsWith('/api/')) return

  if (url.pathname === '/' || url.pathname === '/index.html') {
    e.respondWith(networkFirst(req, SHELL, '/'))
  } else if (req.mode === 'navigate') {
    // /s/:id link-preview pages and the like: never cached as the shell; offline, open the app
    e.respondWith(fetch(req).catch(async () => (await caches.match('/', MATCH)) || Response.error()))
  } else if (url.pathname.startsWith('/assets/')) {
    e.respondWith(cacheFirst(req, SHELL)) // hashed file names never change content
  } else if (url.pathname.startsWith('/data/')) {
    e.respondWith(networkFirst(req, DATA))
  } else {
    e.respondWith(cacheFirst(req, RUNTIME)) // logos, icons
  }
})

/* ---------- New-issue alerts (sent by /api/push/send after a daily deploy) ---------- */

self.addEventListener('push', (e) => {
  let d = {}
  try {
    d = e.data?.json() || {}
  } catch {
    /* empty or non-JSON payload: show a plain alert */
  }
  e.waitUntil(
    (async () => {
      if (d.badge && self.navigator.setAppBadge) await self.navigator.setAppBadge(d.badge).catch(() => {})
      await self.registration.showNotification(d.title || 'Startup Daily', {
        body: d.body || '새 호가 나왔어요',
        tag: d.tag,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        data: { url: d.url || '/' },
      })
    })(),
  )
})

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const url = new URL(e.notification.data?.url || '/', self.location.origin).href
  e.waitUntil(
    (async () => {
      const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      const win = wins.find((w) => new URL(w.url).origin === self.location.origin)
      if (win) {
        await win.focus()
        // reload so the new issue's data is fetched
        return win.navigate(url).catch(() => {})
      }
      return self.clients.openWindow(url)
    })(),
  )
})

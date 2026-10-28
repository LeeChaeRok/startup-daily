/* A home-screen app is resumed from memory, not reloaded, so a new issue (or a new
   deploy) would stay invisible. Check when the app comes back to the foreground and
   every 10 minutes while it is open; when something newer is on the server, tell the
   listeners (a toast offers to reload). Never reload on its own: the reader may be
   in the middle of something, such as a 2~3 minute "한국에서는" request. */

const runningBundle = () =>
  [...document.scripts].map((s) => s.src).find((s) => s.includes('/assets/index-'))?.split('/').pop()
const THROTTLE_MS = 60_000
const INTERVAL_MS = 10 * 60_000
const listeners = new Set()
let loadedAt = null // meta.generated_at of the data on screen
let last = 0
let announced = false

export function setLoadedMeta(meta) {
  loadedAt = meta?.generated_at || null
}

export function onUpdate(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

async function check() {
  const now = Date.now()
  if (announced || now - last < THROTTLE_MS || document.visibilityState !== 'visible') return
  last = now
  try {
    const meta = await (await fetch('/data/meta.json', { cache: 'no-store' })).json()
    let kind = loadedAt && meta.generated_at && meta.generated_at !== loadedAt ? 'issue' : null
    const current = runningBundle()
    if (!kind && current) {
      const html = await (await fetch('/', { cache: 'no-store' })).text()
      const latest = html.match(/\/assets\/(index-[^"']+\.js)/)?.[1]
      if (latest && latest !== current) kind = 'app'
    }
    if (kind) {
      announced = true
      listeners.forEach((l) => l(kind, meta))
    }
  } catch {
    /* offline: keep what we have */
  }
}

export function watchForUpdates() {
  document.addEventListener('visibilitychange', check)
  setInterval(check, INTERVAL_MS)
}

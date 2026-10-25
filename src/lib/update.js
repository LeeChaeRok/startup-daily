/* A home-screen app is resumed from memory, not reloaded, so a new deploy (or a new
   daily issue) would stay invisible. When the app comes back to the foreground, compare
   the bundle the server now serves with the one running, and reload if they differ. */

const running = () => [...document.scripts].map((s) => s.src).find((s) => s.includes('/assets/index-'))?.split('/').pop()
const THROTTLE_MS = 60_000
let last = 0

async function check() {
  const now = Date.now()
  if (now - last < THROTTLE_MS) return
  last = now
  try {
    const html = await (await fetch('/', { cache: 'no-store' })).text()
    const latest = html.match(/\/assets\/(index-[^"']+\.js)/)?.[1]
    const current = running()
    if (latest && current && latest !== current) window.location.reload()
  } catch {
    /* offline: keep what we have */
  }
}

export function watchForUpdates() {
  // dev server has no hashed bundle, so there is nothing to compare
  if (!running()) return
  document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && check())
}

/* New-issue alerts over Web Push. Available in Chrome/Edge/Firefox and in iOS 16.4+
   only once the site is added to the home screen. The server side is /api/push/*;
   when it is not configured, the setting stays hidden. */

let config = null

async function getConfig() {
  config ??= fetch('/api/push/config')
    .then((r) => (r.ok ? r.json() : { enabled: false }))
    .catch(() => ({ enabled: false }))
  return config
}

const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
const standalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true

function keyBytes(base64) {
  const pad = '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + pad).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

async function registration() {
  if (!('serviceWorker' in navigator)) return null
  return (await navigator.serviceWorker.getRegistration()) || null
}

/**
 * 'unsupported' — this browser cannot receive alerts
 * 'install'     — iPhone/iPad Safari: add to the home screen first
 * 'disabled'    — alerts are not set up on the server
 * 'denied'      — the reader blocked notifications for this site
 * 'off' | 'on'
 */
export async function pushState() {
  if (isIOS() && !standalone()) return 'install'
  if (!('PushManager' in window) || !('Notification' in window) || !('serviceWorker' in navigator)) return 'unsupported'
  const reg = await registration()
  if (!reg) return 'unsupported'
  const { enabled } = await getConfig()
  if (!enabled) return 'disabled'
  if (Notification.permission === 'denied') return 'denied'
  const sub = await reg.pushManager.getSubscription()
  return sub ? 'on' : 'off'
}

async function post(body) {
  const res = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`subscribe ${res.status}`)
}

/** Must run from a click: browsers only show the permission prompt for a user gesture. */
export async function enablePush(prefs) {
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return permission === 'denied' ? 'denied' : 'off'
  const reg = await navigator.serviceWorker.ready
  const { publicKey } = await getConfig()
  const sub =
    (await reg.pushManager.getSubscription()) ||
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) }))
  await post({ subscription: sub.toJSON(), ...prefs })
  return 'on'
}

export async function disablePush() {
  const reg = await registration()
  const sub = await reg?.pushManager.getSubscription()
  if (sub) {
    await post({ endpoint: sub.endpoint, remove: true }).catch(() => {})
    await sub.unsubscribe()
  }
  return 'off'
}

/** Keep the server's copy of the reader's sectors in step (alerts can be limited to them). */
export async function syncPushPrefs(prefs) {
  const reg = await registration()
  const sub = await reg?.pushManager.getSubscription()
  if (sub) await post({ subscription: sub.toJSON(), ...prefs }).catch(() => {})
}

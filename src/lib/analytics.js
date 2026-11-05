/* Product events for the "내 5곳" comparison (_workspace/14 §2-4): app_open, detail_open,
   issue_complete, tab_switch; and for hidden sectors (_workspace/15 §5): sector_mute,
   sector_unmute, folded_expand, my_short. Sent to /api/event, which only writes them to the function log
   (no store yet, like reader reports). Each event carries a random device id kept on this
   device — no account, no IP, no user agent — and whether "내 5곳" is on, so the two groups
   can be compared. Vercel Web Analytics (index.html) counts page views on its own. */
import { load, save } from './storage.js'

const KEY = 'sd_device'
let device = load(KEY, null)
if (typeof device !== 'string' || !/^[a-z0-9]{12}$/.test(device)) {
  device = Math.random().toString(36).slice(2, 14).padEnd(12, '0')
  save(KEY, device)
}

const local = /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)

export function track(name, data = {}) {
  const tab = load('sd_home_tab', 'mine')
  const mine = load('sd_my_issue', null)?.date === localDay() && tab === 'mine'
  const mutedN = (load('sd_muted', []) || []).length // hidden sectors (_workspace/15 §5)
  const body = JSON.stringify({ name, device, mine, muted_n: mutedN, data, at: new Date().toISOString() })
  if (local) return console.debug('[track]', body)
  try {
    if (navigator.sendBeacon?.('/api/event', new Blob([body], { type: 'application/json' }))) return
    fetch('/api/event', { method: 'POST', body, headers: { 'content-type': 'application/json' }, keepalive: true }).catch(() => {})
  } catch {
    // analytics never breaks the app
  }
}

function localDay(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

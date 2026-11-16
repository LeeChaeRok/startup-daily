/* History bookkeeping shared by the router, the back button and sheets (spec v2 §8).

   Each entry carries an id and a depth in history.state:
   - the id keys the scroll position, so back/forward restores where the reader was;
   - the depth says whether there is an in-app page behind this one, so the on-screen
     back button can call history.back() (same place as the browser's back) and only
     falls back to a fixed parent for a page opened straight from a link.

   A sheet adds an entry of its own (same id), so the back gesture closes the sheet
   instead of leaving the screen.                                                    */

// the router restores positions itself (App.jsx); the browser's own restore would fight it,
// especially when a sheet's entry is popped
if ('scrollRestoration' in history) history.scrollRestoration = 'manual'

let current = null // { key, depth } of the entry on screen; null before first commit

export const scrollMemory = new Map()

export function currentEntry() {
  return current
}

/** The page being opened is the first one of the visit (a shared link, a reload). Safe to call
    while rendering a new page: a page pushed or replaced in the app has no id of its own yet. */
export function isColdStart() {
  if (current === null) return true
  const st = history.state
  return Boolean(st?.sdKey) && st.sdDepth === 0
}

const newKey = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

export function claimEntry() {
  const st = history.state
  let entry
  if (st?.sdKey) {
    entry = { key: st.sdKey, depth: st.sdDepth || 0, fresh: false }
  } else {
    // a replaced entry keeps the depth of the one it replaced (navigate(…, { replace }))
    const depth = Number.isInteger(st?.sdDepth) ? st.sdDepth : current ? current.depth + 1 : 0
    entry = { key: newKey(), depth, fresh: true }
    history.replaceState({ ...(st || {}), sdKey: entry.key, sdDepth: entry.depth }, '')
  }
  const first = current === null
  current = entry
  return { ...entry, first }
}

/** Replace the current entry with a new page: a fresh scroll id, the same depth. */
export function replaceHash(next) {
  history.replaceState({ sdDepth: current?.depth ?? history.state?.sdDepth ?? 0 }, '', next)
  window.dispatchEvent(new HashChangeEvent('hashchange'))
}

/** The on-screen back button: the browser's back when there is an in-app page behind,
    otherwise the given parent (replacing this entry, so back again leaves the app). */
export function goBack(fallback = '/') {
  if (current?.depth > 0) window.history.back()
  else replaceHash(fallback.startsWith('#') ? fallback : `#${fallback}`)
}

/* ---------- Sheets ---------- */

/* A sheet that closes from the UI calls history.back(), which lands a moment later. Another
   sheet opened in that moment (menu → 틀린 내용 알리기) must wait for it, or that late popstate
   would close the new sheet. */
let pending = null

/** history.back() for a sheet's own entry; resolves once the browser has gone back. */
export function sheetBack() {
  pending = new Promise((resolve) => {
    const on = () => {
      window.removeEventListener('popstate', on)
      pending = null
      resolve()
    }
    window.addEventListener('popstate', on)
  })
  const p = pending
  history.back()
  return p
}

/** Run fn now, or after a sheet's back() still in flight. */
export function whenSettled(fn) {
  if (pending) pending.then(fn)
  else fn()
}

/** Push a history entry for an open sheet. Returns a token; the entry shares the screen's id. */
export function pushSheetEntry() {
  const token = newKey()
  history.pushState({ ...(history.state || {}), sdSheet: token }, '')
  return token
}

export const isSheetEntry = (token) => history.state?.sdSheet === token

/** Follow a link from inside a sheet: drop the sheet's entry first, so back from the
    new page returns to the screen, not to a sheet that is no longer there. */
export function leaveSheetTo(href, { replace = false } = {}) {
  const target = href.startsWith('#') ? href : `#${href}`
  const go = () => {
    if (window.location.hash === target) return
    if (replace) replaceHash(target)
    else window.location.hash = target
  }
  if (history.state?.sdSheet) sheetBack().then(go)
  else whenSettled(go)
}

/* ---------- Per-entry state (survives back/forward) ---------- */

export function readEntryState(name, fallback) {
  const v = history.state?.[`sd_${name}`]
  return v === undefined ? fallback : v
}

export function writeEntryState(name, value) {
  history.replaceState({ ...(history.state || {}), [`sd_${name}`]: value }, '')
}

import { useCallback, useState, useSyncExternalStore } from 'react'
import { load, save } from './storage.js'

/* ---------- Hash router ----------
   Static hosting on Vercel without rewrites, so routes live in the hash:
   #/                 latest issue
   #/d/2026-04-27     a past issue
   #/s/skild-ai-2026  startup detail (?from=saved keeps the saved list as context)
   #/explore          browse & search (?view=&q=&sector=&stage=&region=&sort=)
   #/saved            saved list
   #/settings         settings (role, sectors, order, theme, alerts, …)
   #/about            about, selection criteria, corrections                 */

function readHash(hash) {
  const h = (hash || '').replace(/^#/, '') || '/'
  const [path, query = ''] = h.split('?')
  const parts = path
    .split('/')
    .filter(Boolean)
    .map((p) => {
      try {
        return decodeURIComponent(p)
      } catch {
        return p // malformed escape: fall through to "not found" instead of crashing
      }
    })
  return { parts, params: new URLSearchParams(query), raw: h }
}

function subscribeHash(cb) {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}

export function useRoute() {
  const hash = useSyncExternalStore(subscribeHash, () => window.location.hash, () => '')
  return readHash(hash)
}

export function navigate(to, { replace = false } = {}) {
  const next = to.startsWith('#') ? to : `#${to}`
  if (window.location.hash === next) return
  if (replace) {
    history.replaceState(history.state, '', next)
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  } else {
    window.location.hash = next
  }
}

export function buildQuery(params) {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v == null || v === '' || (Array.isArray(v) && v.length === 0)) continue
    q.set(k, Array.isArray(v) ? v.join(',') : String(v))
  }
  const s = q.toString()
  return s ? `?${s}` : ''
}

/* ---------- Small persisted stores ----------
   localStorage can throw (private mode, blocked storage); every access is
   guarded and the in-memory value keeps the UI working.                   */

export function createStore(key, fallback, validate = () => true) {
  const initial = load(key, fallback)
  let value = validate(initial) ? initial : fallback
  const listeners = new Set()
  return {
    get: () => value,
    set(next) {
      value = typeof next === 'function' ? next(value) : next
      save(key, value)
      listeners.forEach((l) => l())
    },
    subscribe(cb) {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
  }
}

export function useStore(store) {
  return useSyncExternalStore(store.subscribe, store.get, store.get)
}

/* Saved startups — key kept from v1 so existing saves survive. */
const savedStore = createStore('saved_startups', [], Array.isArray)

export function useSaved() {
  const saved = useStore(savedStore)
  const toggle = useCallback((id) => {
    savedStore.set((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev]))
  }, [])
  const restore = useCallback((list) => savedStore.set(list), [])
  return { saved, isSaved: (id) => saved.includes(id), toggle, restore }
}

/* Read log — { [id]: 'YYYY-MM-DD' } in the reader's local date. */
const readStore = createStore('sd_read', {}, (v) => v && typeof v === 'object' && !Array.isArray(v))

export function localDate(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

// ids the reader marked unread this session: auto-tracking leaves them alone
const keptUnread = new Set()

// other reading signals (personal.js: page opens) are cleared with the read log
const clearListeners = new Set()
export const onReadCleared = (l) => (clearListeners.add(l), () => clearListeners.delete(l))

export function useReadLog() {
  const readLog = useStore(readStore)
  const markRead = useCallback((id) => {
    if (readStore.get()[id] || keptUnread.has(id)) return
    readStore.set((prev) => ({ ...prev, [id]: localDate() }))
  }, [])
  const clearRead = useCallback(() => {
    readStore.set({})
    clearListeners.forEach((l) => l())
  }, [])
  // explicit toggles from the reader: on → today, off → drop the entry
  const setRead = useCallback((ids, on) => {
    readStore.set((prev) => {
      const next = { ...prev }
      for (const id of ids) {
        if (on) {
          next[id] ||= localDate()
          keptUnread.delete(id)
        } else {
          delete next[id]
          keptUnread.add(id)
        }
      }
      return next
    })
  }, [])
  const restoreRead = useCallback((log) => readStore.set(log), [])
  return { readLog, isRead: (id) => Boolean(readLog[id]), markRead, setRead, restoreRead, clearRead }
}

/* Sectors the reader cares about (keys from SECTORS). Marks rows, seeds filters, can
   limit alerts, and moves those companies up in the reader's order of an issue
   (personal.js; the published order stays one tap away). */
const interestStore = createStore('sd_interests', [], Array.isArray)

export function useInterests() {
  const interests = useStore(interestStore)
  const toggle = useCallback((key) => {
    interestStore.set((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))
  }, [])
  const set = useCallback((list) => interestStore.set(list), [])
  return { interests, isInterest: (key) => interests.includes(key), toggle, set }
}

export const getInterests = () => interestStore.get()

/* Reading text size: 'sm' | 'md' | 'lg', applied as data-font on <html>. */
const FONT_SIZES = ['sm', 'md', 'lg']
const fontStore = createStore('sd_font', 'md', (v) => FONT_SIZES.includes(v))
const applyFont = (v) => (document.documentElement.dataset.font = v)
applyFont(fontStore.get())

export function useFontSize() {
  const value = useStore(fontStore)
  const set = useCallback((v) => {
    fontStore.set(v)
    applyFont(v)
  }, [])
  return [value, set]
}

/* One-off flags (intro dismissed, last seen issue, …). */
export function useFlag(key, fallback = null) {
  const [value, setValue] = useState(() => load(key, fallback))
  const update = useCallback(
    (v) => {
      setValue(v)
      save(key, v)
    },
    [key],
  )
  return [value, update]
}

/* ---------- Theme: system | light | dark ----------
   Stored as a raw string because index.html reads it before first paint. */

const THEME_KEY = 'sd_theme'
const darkQuery = typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null

function readTheme() {
  try {
    const v = localStorage.getItem(THEME_KEY)
    return v === 'light' || v === 'dark' ? v : 'system'
  } catch {
    return 'system'
  }
}

let themeValue = typeof window !== 'undefined' ? readTheme() : 'system'
const themeListeners = new Set()

function applyTheme(pref) {
  const dark = pref === 'dark' || (pref === 'system' && darkQuery?.matches)
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--sd-bg').trim()
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', bg))
}

function setThemeValue(next) {
  themeValue = next
  try {
    localStorage.setItem(THEME_KEY, next)
  } catch {
    /* ignore */
  }
  applyTheme(next)
  themeListeners.forEach((l) => l())
}

darkQuery?.addEventListener('change', () => {
  if (themeValue === 'system') applyTheme('system')
})

export function useTheme() {
  const theme = useSyncExternalStore(
    (cb) => {
      themeListeners.add(cb)
      return () => themeListeners.delete(cb)
    },
    () => themeValue,
    () => 'system',
  )
  return [theme, setThemeValue]
}

/* ---------- Media query ---------- */

export function useMediaQuery(query) {
  const subscribe = useCallback(
    (cb) => {
      const mq = window.matchMedia(query)
      mq.addEventListener('change', cb)
      return () => mq.removeEventListener('change', cb)
    },
    [query],
  )
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false)
}

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

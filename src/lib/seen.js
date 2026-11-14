/* Days the reader has opened: the issue of a date (#/, #/d/:date) and the YC list of a date
   (#/yc/:date). Shown as "봤음" on past-day rows. Only in this browser, like everything else. */
import { useEffect } from 'react'
import { createStore, useStore } from './hooks.js'

const MAX = 400
const store = createStore('sd_seen_days', { issue: [], yc: [] }, (v) => Boolean(v) && Array.isArray(v.issue) && Array.isArray(v.yc))

export function markSeen(kind, date) {
  store.set((prev) => (prev[kind].includes(date) ? prev : { ...prev, [kind]: [date, ...prev[kind]].slice(0, MAX) }))
}

/** isSeen(date) for 'issue' or 'yc'. */
export function useSeen(kind) {
  const v = useStore(store)
  return (date) => v[kind].includes(date)
}

/** Counts the day as seen once it has been on screen for a moment (not on a quick pass). */
export function useMarkSeen(kind, date) {
  useEffect(() => {
    if (!date) return
    const t = setTimeout(() => markSeen(kind, date), 1500)
    return () => clearTimeout(t)
  }, [kind, date])
}

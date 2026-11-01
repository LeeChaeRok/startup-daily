/* "내 5곳 | 모두의 5곳" on the latest issue (_workspace/14 §2). Shown only when the day has a
   public sector pool (or in ?preview=pool) and the reader follows a sector. The five are
   picked once a day (src/lib/pick.js) and kept in sd_my_issue, so reading a company never
   reshuffles them; changing the followed sectors picks again. */
import { useCallback, useEffect, useMemo } from 'react'
import { byDate, byId, dates, poolOf, useDataVersion } from './data.js'
import { createStore, useInterests, useReadLog, useStore } from './hooks.js'
import { followedPools, moreInMySectors, pickMine } from './pick.js'

// { date, key: followed pools joined, ids: [interest ids…], discovery: id | null }
const myStore = createStore('sd_my_issue', null, (v) => v === null || (v && typeof v === 'object' && Array.isArray(v.ids)))
const tabStore = createStore('sd_home_tab', 'mine', (v) => v === 'mine' || v === 'all')

export function useHomeTab() {
  const tab = useStore(tabStore)
  const set = useCallback((v) => tabStore.set(v === 'all' ? 'all' : 'mine'), [])
  return [tab, set]
}

/**
 * → { available, list, discoveryId, more, repicked }
 *   available  the toggle should show (latest issue, a pool, followed sectors)
 *   list       the five records, interest picks first, the discovery last
 *   more       unread companies left in the followed sectors today (the done card)
 *   repicked   picked again today because the followed sectors changed
 */
export function useMyIssue(date) {
  useDataVersion()
  const { interests } = useInterests()
  const { isRead } = useReadLog()
  const stored = useStore(myStore)
  const key = followedPools(interests).join(',')
  const latest = date && date === dates[0]
  const hasPool = latest && poolOf(date).length > byDate(date).length
  const available = Boolean(hasPool && key)
  const valid = available && stored?.date === date && stored.key === key && stored.ids.every((id) => byId(id))

  // picked with the read log of this moment only: later reads must not change the five
  const fresh = useMemo(() => {
    if (!available || valid) return null
    const i = dates.indexOf(date)
    const days = [date, dates[i + 1], dates[i + 2]].filter(Boolean).map(poolOf)
    const pick = pickMine({ days, interests, isRead })
    return pick && { date, key, ids: pick.interest.map((s) => s.id), discovery: pick.discovery?.id || null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [available, valid, date, key])

  const repicked = Boolean(fresh && stored?.date === date && stored.key !== key)
  useEffect(() => {
    if (fresh) myStore.set(fresh)
  }, [fresh])

  const pick = valid ? stored : fresh
  const list = pick ? [...pick.ids, pick.discovery].filter(Boolean).map(byId).filter(Boolean) : []
  const more = available ? moreInMySectors({ today: poolOf(date), interests, shown: list.map((s) => s.id), isRead }) : 0
  return { available: available && list.length > 0, list, discoveryId: pick?.discovery || null, more, repicked }
}

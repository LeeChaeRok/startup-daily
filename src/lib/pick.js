// Plain module (no React, no app data) so the push server can use the same rule.

/* "내 5곳" (_workspace/14 §2-1): four companies from the sectors the reader follows and one
   "오늘의 발견" from outside them. Deterministic — sort keys only, no randomness — so the
   same day and the same interests always give the same five.

     interest share (4): today's pool in the followed sectors, unread first; the sectors take
                         turns (round robin, in SECTOR_KEYS order). Short → the previous two
                         days' unread ones, then today's shared five.
     discovery (1):      the shared five's strongest company outside the followed sectors
                         (when they cover every sector: the pool's strongest left over).   */
import { SECTOR_KEYS, canonicalSector, sectorFor } from './sectors.js'

export const MY_SIZE = 5
const INTEREST_SHARE = MY_SIZE - 1

const keyOf = (s) => s._sector?.key || sectorFor(s).key
const attention = (s) => Number(s.attention) || 0
// featured first, then the model's attention score, then the day file's order
const strongest = (list) =>
  list
    .map((s, i) => ({ s, i }))
    .sort((a, b) => (b.s.featured !== false) - (a.s.featured !== false) || attention(b.s) - attention(a.s) || a.i - b.i)
    .map(({ s }) => s)

/** Followed sectors as pool keys, in a stable order. */
export function followedPools(interests = []) {
  const set = new Set(interests.map(canonicalSector))
  return SECTOR_KEYS.filter((k) => set.has(k))
}

function roundRobin(pools, bySector, want, taken) {
  const out = []
  const queues = pools.map((k) => (bySector.get(k) || []).filter((s) => !taken.has(s.id)))
  for (let i = 0; out.length < want && queues.some((q) => i < q.length); i++) {
    for (const q of queues) {
      if (out.length >= want) break
      if (i < q.length && !taken.has(q[i].id)) {
        out.push(q[i])
        taken.add(q[i].id)
      }
    }
  }
  return out
}

/**
 * days: [today's pool, the day before, the one before that], each an array of records
 * (featured ones carry featured !== false). Returns { interest: [...], discovery } or null
 * when the reader follows no sector (then the shared five is their issue).
 */
export function pickMine({ days, interests, isRead = () => false }) {
  const pools = followedPools(interests)
  if (!pools.length || !days?.[0]?.length) return null
  const [today] = days
  const shared = today.filter((s) => s.featured !== false)
  const taken = new Set()

  const group = (list) => {
    const bySector = new Map()
    for (const s of strongest(list.filter((s) => !isRead(s.id)))) {
      const k = keyOf(s)
      if (!pools.includes(k)) continue
      if (!bySector.has(k)) bySector.set(k, [])
      bySector.get(k).push(s)
    }
    return bySector
  }

  // discovery first, so the interest share can't take the only outside company
  const outside = strongest(shared.filter((s) => !pools.includes(keyOf(s))))
  const discovery = outside[0] || strongest(today.filter((s) => !pools.includes(keyOf(s))))[0] || null
  if (discovery) taken.add(discovery.id)

  const interest = []
  for (const day of days.filter(Boolean)) {
    if (interest.length >= INTEREST_SHARE) break
    interest.push(...roundRobin(pools, group(day), INTEREST_SHARE - interest.length, taken))
  }
  // still short: today's shared five, unread first
  const filler = [...shared.filter((s) => !isRead(s.id)), ...shared.filter((s) => isRead(s.id))]
  for (const s of filler) {
    if (interest.length >= INTEREST_SHARE + (discovery ? 0 : 1)) break
    if (!taken.has(s.id)) {
      interest.push(s)
      taken.add(s.id)
    }
  }
  return { interest, discovery }
}

/** How many unread companies in the followed sectors today's pool still has beyond `shown`. */
export function moreInMySectors({ today, interests, shown = [], isRead = () => false }) {
  const pools = followedPools(interests)
  const ids = new Set(shown)
  return (today || []).filter((s) => pools.includes(keyOf(s)) && !ids.has(s.id) && !isRead(s.id)).length
}

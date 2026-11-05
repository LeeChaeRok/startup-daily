// Plain module (no React, no app data) so the push server can use the same rule.

/* "내 5곳" (_workspace/14 §2-1): four companies from the sectors the reader follows and one
   "오늘의 발견" from outside them. Deterministic — sort keys only, no randomness — so the
   same day and the same interests always give the same five.

     interest share (4): today's pool in the followed sectors, unread first; the sectors take
                         turns (round robin, in SECTOR_KEYS order). Short → the previous two
                         days' unread ones, then today's shared five.
     discovery (1):      the shared five's strongest company outside the followed sectors
                         (when they cover every sector: the pool's strongest left over).

   Hidden sectors (_workspace/15) never appear: not in the share, not as the find, not as
   filler — fewer than five is shown rather than a hidden one. A reader who only hides
   sectors gets five from the rest, in turns, with no find (nothing is "outside" for them). */
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

/** Hidden sectors as pool keys, in a stable order; a followed sector is never hidden. */
export function mutedPools(muted = [], interests = []) {
  const set = new Set(muted.map(canonicalSector))
  const followed = followedPools(interests)
  return SECTOR_KEYS.filter((k) => set.has(k) && !followed.includes(k))
}

/** The pools "내 5곳" draws from, and whether one of the five is a find from outside them. */
export function myPools(interests = [], muted = []) {
  const hidden = mutedPools(muted, interests)
  const followed = followedPools(interests)
  if (followed.length) return { pools: followed, hidden, find: true }
  if (hidden.length) return { pools: SECTOR_KEYS.filter((k) => !hidden.includes(k)), hidden, find: false }
  return { pools: [], hidden, find: false }
}

/** The key "내 5곳" is stored under: unchanged for readers who hide nothing. */
export function myKey(interests = [], muted = []) {
  const hidden = mutedPools(muted, interests)
  return followedPools(interests).join(',') + (hidden.length ? `|-${hidden.join(',')}` : '')
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
 * when the reader neither follows nor hides a sector (then the shared five is their issue).
 */
export function pickMine({ days, interests = [], muted = [], isRead = () => false }) {
  const { pools, hidden, find } = myPools(interests, muted)
  if (!pools.length || !days?.[0]?.length) return null
  const [today] = days
  const allowed = (s) => !hidden.includes(keyOf(s))
  const shared = today.filter((s) => s.featured !== false && allowed(s))
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
  let discovery = null
  if (find) {
    const outside = (s) => !pools.includes(keyOf(s)) && allowed(s)
    discovery =
      strongest(shared.filter(outside))[0] ||
      strongest(today.filter(outside))[0] ||
      days.slice(1).filter(Boolean).map((d) => strongest(d.filter((s) => outside(s) && !isRead(s.id)))[0]).find(Boolean) ||
      null
    if (discovery) taken.add(discovery.id)
  }

  const share = find ? INTEREST_SHARE : MY_SIZE
  const interest = []
  for (const day of days.filter(Boolean)) {
    if (interest.length >= share) break
    interest.push(...roundRobin(pools, group(day), share - interest.length, taken))
  }
  // still short: today's shared five (hidden sectors left out), unread first
  const filler = [...shared.filter((s) => !isRead(s.id)), ...shared.filter((s) => isRead(s.id))]
  for (const s of filler) {
    if (interest.length >= MY_SIZE - (discovery ? 1 : 0)) break
    if (!taken.has(s.id)) {
      interest.push(s)
      taken.add(s.id)
    }
  }
  return { interest, discovery }
}

/** How many unread companies in the reader's pools today's pool still has beyond `shown`. */
export function moreInMySectors({ today, interests, muted = [], shown = [], isRead = () => false }) {
  const { pools } = myPools(interests, muted)
  const ids = new Set(shown)
  return (today || []).filter((s) => pools.includes(keyOf(s)) && !ids.has(s.id) && !isRead(s.id)).length
}

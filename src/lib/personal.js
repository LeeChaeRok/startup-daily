/* Personalization, all on this device (no account): a role, the sectors the reader
   follows, and what they open, read and save. Everyone gets the same issue; only four
   things change — the order inside an issue, the "○○라면" line, alert copy (server)
   and the "내 분야 지난 회사" picks. Spec: _workspace/12_ux-architect_app-ia.md §1.

   Weights are never stored: they are recomputed from sd_read, sd_opens and
   saved_startups, so clearing the read log (설정) or a sector remap in sectors.js
   is reflected at once. */
import { useCallback, useMemo } from 'react'
import { createStore, localDate, onReadCleared, useInterests, useReadLog, useSaved, useStore } from './hooks.js'
import { cleanAmount, dates, startups } from './data.js'
import { splitAmount } from './amount.js'
import { enDash, parseDate, ym } from './format.js'
import { L, isEn } from './i18n.js'

/* ---------- Stores ---------- */

export const ROLES = [
  { key: 'founder', label: L('창업자', 'Founder'), line: L('창업자라면', 'For founders') },
  { key: 'investor', label: L('투자자·애널리스트', 'Investor / analyst'), line: L('투자자라면', 'For investors') },
  { key: 'pm', label: L('PM·기획자', 'PM / product'), line: L('PM이라면', 'For PMs') },
  { key: 'job', label: L('취업·이직 준비', 'Job seeker'), line: L('커리어로 보면', 'For job seekers') },
  { key: 'curious', label: L('그냥 궁금해요', 'Just curious'), line: null },
]
const ROLE_KEYS = ROLES.map((r) => r.key)

const roleStore = createStore('sd_role', null, (v) => v === null || ROLE_KEYS.includes(v))
// { [id]: 'YYYY-MM-DD' } — detail pages opened, read or not; the newest 300
const opensStore = createStore('sd_opens', {}, (v) => v && typeof v === 'object' && !Array.isArray(v))
const orderStore = createStore('sd_order', 'personal', (v) => v === 'personal' || v === 'editorial')
/* The taste sheet asks once on its own. shown: the day it popped up; dismissed: times it
   was skipped; card: the day the one-line "역할과 분야를 고르면…" card at the end of the
   list was first shown (it shows on that day only). */
const promptStore = createStore(
  'sd_taste_prompt',
  { shown: null, dismissed: 0, card: null },
  (v) => v && typeof v === 'object' && !Array.isArray(v),
)

const MAX_OPENS = 300
onReadCleared(() => opensStore.set({}))

export function useRole() {
  const role = useStore(roleStore)
  const set = useCallback((v) => roleStore.set(ROLE_KEYS.includes(v) ? v : null), [])
  return [role, set]
}

export function useOrder() {
  const order = useStore(orderStore)
  const set = useCallback((v) => orderStore.set(v === 'editorial' ? 'editorial' : 'personal'), [])
  return [order, set]
}

export function useTastePrompt() {
  const value = useStore(promptStore)
  const update = useCallback(
    (patch) => promptStore.set((prev) => ({ ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) })),
    [],
  )
  return [value, update]
}

/** A detail page was opened (Detail mount). Oldest entries go past 300. */
export function recordOpen(id) {
  opensStore.set((prev) => {
    const next = { ...prev }
    delete next[id] // re-insert so the newest open is last
    next[id] = localDate()
    const keys = Object.keys(next)
    if (keys.length <= MAX_OPENS) return next
    const drop = keys.sort((a, b) => next[a].localeCompare(next[b])).slice(0, keys.length - MAX_OPENS)
    for (const k of drop) delete next[k]
    return next
  })
}

/* ---------- Scores (IA §1-6) ----------
   score(s) = 10 × [sector followed] + min(5, affinity[sector])
   affinity  = Σ over companies in that sector of
               1.0 × decay(read)   (0.3 for the latest issue: everyone gets those)
             + 0.5 × decay(opened) (not when the open turned into a read)
             + 2.0 × saved         (no date, so no decay)
   decay(d)  = 0.5 ^ (days / 30)                                                    */

const HALF_LIFE = 30
const decay = (ymd, today) => {
  const days = Math.max(0, (today - parseDate(ymd)) / 864e5)
  return 0.5 ** (days / HALF_LIFE)
}

// exclude: an issue date whose own companies don't count, so reading an issue never
// reshuffles that issue (or its prev/next) while the reader is in it
function affinityOf({ readLog, opens, saved }, exclude = null) {
  const today = parseDate(localDate())
  const latest = dates[0]
  const bySector = new Map()
  const add = (s, w) => bySector.set(s._sector.key, (bySector.get(s._sector.key) || 0) + w)
  const savedSet = new Set(saved)
  for (const s of startups) {
    if (s.date === exclude) continue
    const read = readLog[s.id]
    if (read) add(s, (s.date === latest ? 0.3 : 1) * decay(read, today))
    else if (opens[s.id]) add(s, 0.5 * decay(opens[s.id], today))
    if (savedSet.has(s.id)) add(s, 2)
  }
  return bySector
}

const scorer = (interests, affinity) => (s) => (interests.includes(s._sector.key) ? 10 : 0) + Math.min(5, affinity.get(s._sector.key) || 0)

/** Everything the ordering needs, as one memoized object. */
export function usePersonal() {
  const { readLog } = useReadLog()
  const { interests } = useInterests()
  const { saved } = useSaved()
  const opens = useStore(opensStore)
  const [order] = useOrder()
  const [role] = useRole()
  return useMemo(() => {
    const signals = { readLog, opens, saved }
    const affinity = affinityOf(signals)
    const behaviour = [...affinity.values()].some((v) => v > 0)
    const scoreFor = (exclude) => scorer(interests, affinityOf(signals, exclude))
    return { score: scorer(interests, affinity), scoreFor, interests, order, role, behaviour, readLog }
  }, [readLog, opens, saved, interests, order, role])
}

/** Stable sort by score: ties keep the published order. */
export function personalOrder(list, score) {
  return list
    .map((s, i) => ({ s, i, v: score(s) }))
    .sort((a, b) => b.v - a.v || a.i - b.i)
    .map((x) => x.s)
}

/**
 * The order an issue is shown in (S1, past issues, prev/next on a company page).
 * Returns { list, personal, differs } — differs: the reader's order is not the
 * published one, so the screen says so ("내 관심 순 ▾").
 */
export function useIssueOrder(issue) {
  const p = usePersonal()
  return useMemo(() => {
    const mine = personalOrder(issue, p.scoreFor(issue[0]?.date))
    const differs = mine.some((s, i) => s !== issue[i])
    return { list: p.order === 'editorial' ? issue : mine, personal: p.order === 'personal', differs }
  }, [issue, p])
}

/* ---------- "내 분야 지난 회사" (IA §1-8) ---------- */

/**
 * Up to `limit` earlier companies the reader hasn't read, by score then newest.
 * Returns { list, kind } — kind 'interests' | 'behaviour' | null (no signal: list empty).
 */
export function usePastPicks(excludeDate, limit = 3) {
  const p = usePersonal()
  return useMemo(() => {
    const kind = p.interests.length ? 'interests' : p.behaviour ? 'behaviour' : null
    if (!kind) return { list: [], kind }
    const list = startups
      .filter((s) => s.date !== excludeDate && !p.readLog[s.id] && s._stageGroup !== 'exit')
      .map((s) => ({ s, v: p.score(s) }))
      .filter((x) => x.v > 0)
      .sort((a, b) => b.v - a.v || b.s.date.localeCompare(a.s.date))
      .slice(0, limit)
      .map((x) => x.s)
    return { list, kind }
  }, [excludeDate, limit, p])
}

/* ---------- "○○라면" line (IA §1-5) ----------
   No generated text: for each role, the first existing field from the profile. */

const text = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null)
// "비공개 (발표문상 …)", "Undisclosed (…)": nothing to show, so the piece is left out
const known = (v) => (text(v) && !/^(비공개|미공개|undisclosed|unknown|n\/a)/i.test(v.trim()) ? v.trim() : null)
// "2026-10" → "2026.10" / "Oct 2026"
const when = (v) => {
  if (!isEn) return ym(v)
  const m = /^(\d{4})-(\d{2})/.exec(v)
  return m ? new Date(Date.UTC(+m[1], +m[2] - 1)).toLocaleString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }) : v
}
const amountMain = (v) => (cleanAmount(v) ? splitAmount(cleanAmount(v)).main : null)

// "11-50" → "11-50명", "51-100 (추정)" → "51-100명 (추정)"; anything else as written
const headcount = (v) => {
  const t = enDash(v)
  return isEn || /명/.test(t) ? t : t.replace(/^([\d,.\s–~+]*\d\+?)/, '$1명')
}

const PICKS = {
  founder: (s) => text(s.competitive_landscape?.key_differentiator) || text(s.competitive_landscape?.moat),
  investor: (s) => {
    const lr = s.funding?.latest_round || {}
    const round = [text(lr.stage), amountMain(lr.amount)].filter(Boolean).join(' ')
    const lead = known(lr.lead_investor) && `${L('리드', 'Lead')} ${known(lr.lead_investor)}`
    return [round, lead].filter(Boolean).join(' · ') || text(s.trending_reason?.growth_metrics)
  },
  pm: (s) => {
    const f = text(s.product?.key_features?.[0])
    return f ? `${L('핵심 기능', 'Key feature')}: ${f}` : text(s.product?.problem_statement)
  },
  job: (s) => {
    const lr = s.funding?.latest_round || {}
    const team = known(s.employee_count) && L(`팀 ${headcount(s.employee_count)}`, `Team of ${headcount(s.employee_count)}`)
    const raised =
      text(lr.stage) &&
      L(
        `${[text(lr.date) && when(lr.date), lr.stage.trim()].filter(Boolean).join(' ')} 유치`,
        `raised ${lr.stage.trim()}${text(lr.date) ? ` in ${when(lr.date)}` : ''}`,
      )
    return [team, raised].filter(Boolean).join(' · ') || text(s.team_highlights)
  },
}

/** { label, text } for the reader's role, or null (no role, "그냥 궁금해요", acquired/closed, no field). */
export function forRole(s, role) {
  if (!s || !PICKS[role]) return null
  if (s._correction && s._correction.kind !== 'note') return null
  // listed or acquired: "IPO · 리드 NYSE", "인수 유치" would misstate what happened
  if (s._stageGroup === 'exit' && (role === 'investor' || role === 'job')) return null
  const value = PICKS[role](s)
  return value ? { label: ROLES.find((r) => r.key === role).line, text: value } : null
}

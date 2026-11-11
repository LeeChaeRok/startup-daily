import { useEffect, useSyncExternalStore } from 'react'
import { formatUSD as fmtUSD, parseAmount, shortAmount } from './amount.js'
import { SECTORS as SECTOR_DEFS, canonicalSector, sectorFor } from './sectors.js'
import { isEn, L } from './i18n.js'

// sector labels in the reading language (the API uses sectors.js directly, in Korean)
const localSector = (s) => (isEn ? { ...s, label: s.en } : s)
export const SECTORS = SECTOR_DEFS.map(localSector)
/** A record's sector: its own pool key, or a guess from its (Korean) categories for older records. */
export const sectorOfRecord = (s) => localSector(sectorFor({ sector: s.sector, category: s._ko?.category ?? s.category }))
export { canonicalSector }

/* Data arrives at start-up (see load.js → initData); everything below reads the
   module-level bindings that initData fills. */

/** Some generated records lost their digits ("M+"); treat those as unknown. */
export function cleanAmount(text) {
  return typeof text === 'string' && /\d/.test(text) ? text : null
}

/** Approximate USD for a loose amount string, or null. */
export const parseAmountUSD = (text) => parseAmount(text)?.usd ?? null

/** Whole millions for summary figures ("≈$15M"); lists keep one decimal via shortAmount. */
export const formatUSD = (n) => (n == null ? '—' : n >= 1e6 && n < 1e9 ? `$${Math.round(n / 1e6)}M` : (fmtUSD(n) ?? '—'))

export function getDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

/** Short stage label: "Public (NASDAQ: RXRX)" → "상장사", "Series B" → "Series B". */
export function stageLabel(stage = '') {
  // pre-IPO / late stage must win over the generic "ipo" match below
  if (/pre-ipo|late stage|growth/i.test(stage)) return 'Growth'
  if (/인수|acquired/i.test(stage)) return 'M&A'
  if (/public|ipo|상장/i.test(stage)) return '상장사'
  const series = stage.match(/series\s*([a-z])/i)
  if (series) return `Series ${series[1].toUpperCase()}`
  if (/seed/i.test(stage)) return 'Seed'
  return stage || '단계 미공개'
}

export const STAGE_GROUPS = [
  { key: 'early', label: L('초기 (Seed·A)', 'Early (Seed–A)') },
  { key: 'b', label: 'Series B' },
  { key: 'c', label: 'Series C' },
  { key: 'late', label: L('Series D 이상', 'Series D+') },
  { key: 'exit', label: L('상장·M&A·종료', 'Public · M&A · Closed') },
]

const CORRECTION_KIND = (status = '') =>
  /중단|파산|폐업/.test(status) ? 'shutdown' : /인수/.test(status) ? 'acquired' : 'note'

function stageGroupOf(stage, correction) {
  if (correction && correction.kind !== 'note') return 'exit'
  if (stage === 'Seed' || stage === 'Series A') return 'early'
  if (stage === 'Series B') return 'b'
  if (stage === 'Series C') return 'c'
  if (stage === '상장사' || stage === 'M&A') return 'exit'
  return 'late'
}

export const REGIONS = [
  { key: 'kr', label: L('한국', 'Korea') },
  { key: 'us', label: L('미국', 'US') },
  { key: 'eu', label: L('유럽', 'Europe') },
  { key: 'asia', label: L('아시아·중동', 'Asia & Middle East') },
  { key: 'etc', label: L('기타', 'Other') },
]

function regionOf(countryKo = '') {
  const c = countryKo.split('/')[0].trim()
  if (c.includes('한국')) return 'kr'
  if (c.includes('미국')) return 'us'
  if (/독일|영국|핀란드|포르투갈|스위스|크로아티아|프랑스|스웨덴|네덜란드|스페인|이탈리아|덴마크|노르웨이|에스토니아|폴란드|아일랜드|벨기에|오스트리아/.test(c)) return 'eu'
  if (/일본|중국|홍콩|싱가포르|이스라엘|인도|대만|베트남|인도네시아|아랍|사우디/.test(c)) return 'asia'
  return 'etc'
}

/* "한국에서는" verdicts. Wording is deliberately hedged: these are search-based hypotheses. */
export const LENS_VERDICTS = {
  open: { label: '빈자리 가능성', badge: '한국 기회', tone: 'accent' },
  emerging: { label: '초기 단계', badge: '한국 기회', tone: 'accent' },
  crowded: { label: '경쟁 있음', badge: null, tone: 'muted' },
  constrained: { label: '규제·구조 장벽', badge: null, tone: 'warn' },
  unclear: { label: '근거 부족', badge: null, tone: 'muted' },
}
export const LENS_FILTER = ['open', 'emerging', 'crowded', 'constrained']

/** Listed, acquired or closed companies don't get a "한국에서는" analysis: there is no market entry to discuss.
    The analysis is written for Korean readers, so the English edition leaves it out. */
export const canAnalyze = (s) => !isEn && s._stageGroup !== 'exit'

export const isKorean = (s) => (s.headquarters?.country_ko || '').includes('한국')

const norm = (t) => (t || '').normalize('NFC').toLowerCase().replace(/\s+/g, '')

const localStage = (stage) =>
  isEn ? { 상장사: 'Public', '단계 미공개': 'Stage undisclosed' }[stage] || stage : stage

/* Corrections carry English text in status_en / note_en. */
const localCorrection = (c) => (isEn && c ? { ...c, status: c.status_en || c.status, note: c.note_en || c.note } : c)

/* "RegCell (레그셀)" → "RegCell", "Bionsight (BionSite)" → "Bionsight": the name, not the name and its gloss */
const PAREN = /^(.+?)\s*[(（](.+)[)）]\s*$/
function tidyNames(s) {
  const out = {}
  const ko = s.name_ko?.match(PAREN)
  if (ko) out.name_ko = ko[1].trim()
  const en = s.name_en?.match(PAREN)
  if (en) out.name_en = en[1].trim()
  return out
}

function prepare(raw, corrections, lensIndex, updates) {
  const now = Date.now()
  return raw
    .map((s) => {
      const category = Array.isArray(s.category) ? s.category : []
      const founders = Array.isArray(s.founders) ? s.founders : []
      const correction = corrections[s.id] ? localCorrection({ ...corrections[s.id], kind: CORRECTION_KIND(corrections[s.id].status) }) : null
      const stage = stageLabel(s._ko?.stage ?? s.company_stage)
      // amounts, sector and region are read from the Korean original (the English
      // edition keeps it under _ko); labels follow the reading language
      const raised = cleanAmount(s.funding?.total_raised)
      const raisedKo = cleanAmount(s._ko?.total_raised ?? s.funding?.total_raised)
      return {
        ...s,
        ...tidyNames(s),
        category,
        founders,
        _raised: raised,
        // lists compare amounts side by side, so they're always in USD; the full text (원 included) stays in _raised
        _raisedShort: shortAmount(raisedKo, { krw: false }),
        _raisedUSD: Number.isFinite(s.funding?.total_raised_usd) ? s.funding.total_raised_usd : parseAmountUSD(raisedKo),
        _domain: getDomain(s.website),
        _sector: sectorOfRecord(s),
        _stage: localStage(stage),
        _stageGroup: stageGroupOf(stage, correction),
        _region: regionOf(s._ko?.country_ko ?? s.headquarters?.country_ko),
        _correction: correction,
        _lens: isEn ? null : lensIndex[s.id] || null,
        // "그때 그 회사": verified events after the company was introduced, newest first
        _updates: [...(updates[s.id] || [])].sort((a, b) => (b.date || '').localeCompare(a.date || '')),
        // news the follow-up check found in the last two weeks (a dot on list rows)
        _hasNews: (updates[s.id] || []).some((u) => now - Date.parse(u.found || u.date) < 14 * 864e5),
        _search: {
          name: norm(`${s.name_ko} ${s.name_en} ${s._ko?.name_ko || ''}`),
          body: norm(`${s.tagline} ${category.join(' ')}`),
          founders: founders.map((f) => ({ label: f.name_ko || f.name_en, key: norm(`${f.name_ko} ${f.name_en}`) })),
          competitors: [
            ...(s.competitive_landscape?.direct_competitors || []).map((c) => ({ label: c.name, key: norm(c.name) })),
            ...(lensIndex[s.id]?.n || []).map((n) => ({ label: n, key: norm(n), lens: true })),
          ],
        },
      }
    })
    .sort((a, b) => b.date.localeCompare(a.date))
}

/** All public companies (in ?preview=pool, the whole pool), newest day first. */
export let startups = []
/** Issue dates, newest first. */
export let dates = []
export let correctionList = []
/** Weeks (Monday 'YYYY-MM-DD' keys) with their issue dates, newest first. */
export let weeks = []
export let stats = { issues: 0, companies: 0, first: null, last: null }
let issueCache = new Map()
let poolCache = new Map()
/** The data has sector-pool companies beyond the shared five (public pool, or ?preview=pool). */
export let poolLive = false
let context = { corrections: {}, lensIndex: {}, updates: {} }

let version = 0
const listeners = new Set()
const subscribe = (l) => (listeners.add(l), () => listeners.delete(l))
const notify = () => {
  version++
  listeners.forEach((l) => l())
}
/** Re-render on any data change (a day's full records arriving). */
export const useDataVersion = () => useSyncExternalStore(subscribe, () => version)

function index() {
  issueCache = new Map()
  poolCache = new Map()
  for (const s of startups) {
    if (!poolCache.has(s.date)) poolCache.set(s.date, [])
    poolCache.get(s.date).push(s)
    // the issue is the day's shared five; older records have no flag and all count
    if (s.featured === false) continue
    if (!issueCache.has(s.date)) issueCache.set(s.date, [])
    issueCache.get(s.date).push(s)
  }
  dates = [...issueCache.keys()]
  poolLive = startups.some((s) => s.featured === false)
}

export function initData({ startups: raw, corrections = {}, lensIndex = {}, updates = {} }) {
  context = { corrections, lensIndex, updates: updates || {} }
  startups = prepare(raw, corrections, lensIndex, context.updates)
  index()
  correctionList = startups
    .filter((s) => s._correction)
    .sort((a, b) => b._correction.checked.localeCompare(a._correction.checked))
  const byWeek = new Map()
  for (const d of dates) {
    const k = weekOf(d)
    if (!byWeek.has(k)) byWeek.set(k, [])
    byWeek.get(k).push(d)
  }
  weeks = [...byWeek.entries()].map(([key, ds]) => ({ key, dates: ds }))
  stats = { issues: dates.length, companies: startups.length, first: dates[dates.length - 1], last: dates[0] }
  notify()
}

/* Full records arrive one day at a time (days/<date>.json): the list fields are enough for
   every list; the detail page waits for its day. */
let loadDay = null
const dayState = new Map() // date → 'loading' | 'full' | 'failed'

export function setDayLoader(fn) {
  loadDay = fn
}

function requestDay(date) {
  const state = dayState.get(date)
  if (!loadDay || state === 'loading' || state === 'full') return
  dayState.set(date, 'loading')
  loadDay(date).then(
    (raw) => {
      const full = new Map(prepare(raw, context.corrections, context.lensIndex, context.updates).map((s) => [s.id, s]))
      startups = startups.map((s) => full.get(s.id) || s)
      index()
      dayState.set(date, 'full')
      notify()
    },
    () => {
      dayState.set(date, 'failed')
      notify()
    },
  )
}

/** 'lite' while the day's full records are on their way, then 'full' (or 'failed'). */
export function useDayLevel(date) {
  useDataVersion()
  useEffect(() => {
    if (date) requestDay(date)
  }, [date])
  const state = dayState.get(date)
  return state === 'full' ? 'full' : state === 'failed' ? 'failed' : 'lite'
}

/** Try a failed day again (the detail page's retry button). */
export function retryDay(date) {
  if (dayState.get(date) === 'failed') dayState.delete(date)
  requestDay(date)
  notify()
}

/** Monday of the week a 'YYYY-MM-DD' date falls in, as 'YYYY-MM-DD'. */
export function weekOf(ymd) {
  const [y, m, d] = ymd.split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1, d))
  t.setUTCDate(t.getUTCDate() - ((t.getUTCDay() + 6) % 7))
  return t.toISOString().slice(0, 10)
}

export function companiesOfWeek(key) {
  return (weeks.find((w) => w.key === key)?.dates || []).flatMap((d) => byDate(d))
}

/** Companies with follow-up news, the most recently found first. */
export function followUps(limit = 3) {
  return startups
    .filter((s) => s._updates.length)
    .sort((a, b) => (b._updates[0].found || b._updates[0].date).localeCompare(a._updates[0].found || a._updates[0].date))
    .slice(0, limit)
}

export const UPDATE_KINDS = {
  funding: L('새 투자', 'New funding'),
  acquired: L('인수됨', 'Acquired'),
  shutdown: L('서비스 종료', 'Shut down'),
  ipo: L('상장', 'IPO'),
  product: L('새 제품', 'New product'),
}

export function companiesOfSector(key) {
  const k = canonicalSector(key)
  return startups.filter((s) => s._sector.key === k)
}

/** The day's issue: its shared five ("모두의 5곳"). */
export function byDate(date) {
  return issueCache.get(date) || []
}

/** Every company of the day: the shared five first, then the rest of the sector pool. */
export function poolOf(date) {
  return poolCache.get(date) || []
}

export function byId(id) {
  return startups.find((s) => s.id === id)
}

/** Oldest issue is 제1호. */
export function issueNo(date) {
  const i = dates.indexOf(date)
  return i < 0 ? null : dates.length - i
}

export function sectorMix(list) {
  const counts = new Map()
  for (const s of list) counts.set(s._sector.label, (counts.get(s._sector.label) || 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1])
}

/**
 * Search across name, tagline, categories, founders and competitors.
 * Returns [{ startup, reason }] where reason explains non-obvious matches.
 */
export function search(query, list = startups) {
  const q = norm(query)
  if (!q) return list.map((startup) => ({ startup, reason: null }))
  const out = []
  for (const s of list) {
    if (s._search.name.includes(q) || s._search.body.includes(q)) {
      out.push({ startup: s, reason: null })
      continue
    }
    const f = s._search.founders.find((x) => x.key.includes(q))
    if (f) {
      out.push({ startup: s, reason: `창업자: ${f.label}` })
      continue
    }
    const c = s._search.competitors.find((x) => x.key.includes(q))
    if (c) out.push({ startup: s, reason: c.lens ? `비슷한 곳으로 언급: ${c.label}` : `경쟁사로 언급: ${c.label}` })
  }
  return out
}

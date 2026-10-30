/**
 * "그때 그 회사": revisit companies 90+ days after their issue and record what happened since
 * (new round, acquisition, shutdown, IPO, major launch).
 *
 *   select   — introduced 90+ days ago, last checked 90+ days ago, not already acquired/closed/listed;
 *              oldest first, at most 2 a day
 *   research — one web-search call per company (web: true), JSON events with source URLs
 *   vet      — code: source must open (or be a search hit behind a bot wall), event dated after
 *              the issue, short factual Korean title, no duplicates. The English title/detail
 *              come from the same call; when missing or still Korean they are left out and
 *              scripts/translate-en.mjs fills them later.
 *
 * Store (src/data/updates.json):
 *   { "updates": { "<id>": [{ date, kind, title_ko, title_en, detail_ko, detail_en, source_url, source_name, found }] },
 *     "checked": { "<id>": "YYYY-MM-DD" } }
 */
import { checkUrl, stripUrl } from './pipeline.mjs'
import { deepClean, extractJson } from './openrouter.mjs'

export const KINDS = ['funding', 'acquired', 'shutdown', 'ipo', 'product']
// events after which there is nothing left to follow
export const TERMINAL_KINDS = ['acquired', 'shutdown', 'ipo']
// corrections.json status values that mean the same ("인수 완료", "운영 중단", …)
const TERMINAL_STATUS = /인수|폐업|파산|청산|운영\s*중단|서비스\s*종료|상장|acquired|shut\s*down|closed|bankrupt|ipo|listed/i

export const MIN_DAYS = 90
export const DAILY_LIMIT = 2
export const MAX_TOKENS = 16000
export const BUDGET_MS = 240_000
const TITLE_MAX = 40
const TITLE_EN_MAX = 90
const PER_COMPANY = 5
const MAX_CHECKS = 8 // link checks per company

export const emptyStore = () => ({ updates: {}, checked: {} })

/* ---------- Dates ---------- */

const DAY = 86_400_000
const DATE_RE = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/

/** "2026-04-15" → epoch ms (UTC midnight); "2026-04" → first of the month; junk → NaN. */
function toMs(d) {
  const m = typeof d === 'string' ? d.trim().match(DATE_RE) : null
  return m ? Date.UTC(+m[1], +m[2] - 1, m[3] ? +m[3] : 1) : NaN
}

export const daysBetween = (from, to) => Math.floor((toMs(to) - toMs(from)) / DAY)

/** Event date strictly after the issue date and not in the future. A month-only date must be a later month. */
export function dateAfter(eventDate, introDate, today) {
  const m = typeof eventDate === 'string' ? eventDate.trim().match(DATE_RE) : null
  if (!m) return false
  const e = toMs(eventDate)
  if (Number.isNaN(e) || e > toMs(today)) return false
  return m[3] ? e > toMs(introDate) : eventDate.trim() > introDate.slice(0, 7)
}

/* ---------- Selection ---------- */

/** Already acquired / closed / listed, per manual corrections or an earlier follow-up. */
export function isFinished(id, { corrections = {}, store = emptyStore() } = {}) {
  if (TERMINAL_STATUS.test(corrections[id]?.status || '')) return true
  return (store.updates[id] || []).some((u) => TERMINAL_KINDS.includes(u.kind))
}

/**
 * Companies due for a follow-up, oldest first. Without a previous check the issue date
 * counts as the last check. → { targets, due } where `due` is every eligible company.
 */
export function selectTargets(records, { store = emptyStore(), corrections = {}, today, limit = DAILY_LIMIT, minDays = MIN_DAYS } = {}) {
  const seen = new Set()
  const due = []
  for (const r of records) {
    if (!r?.id || !r.date || seen.has(r.id)) continue
    seen.add(r.id)
    const last = store.checked[r.id] || r.date
    if (daysBetween(r.date, today) < minDays || daysBetween(last, today) < minDays) continue
    if (isFinished(r.id, { corrections, store })) continue
    due.push({ record: r, last })
  }
  due.sort((a, b) => a.last.localeCompare(b.last) || a.record.date.localeCompare(b.record.date) || a.record.id.localeCompare(b.record.id))
  return { targets: due.slice(0, Math.max(0, limit)).map((d) => d.record), due: due.map((d) => d.record) }
}

/* ---------- Prompt ---------- */

export const RULES = `You are a fact checker for a Korean startup publication. You report dated events with sources and nothing else.
- Every event must come with a URL you actually saw in your search results. Never construct or guess a URL.
- Report only what has already happened. No plans, rumors, forecasts or estimates.
- If you found nothing, return an empty list. An empty list is a good answer.`

export function followupPrompt(r, today) {
  const round = r.funding?.latest_round
  return `Company: ${r.name_en}${r.name_ko ? ` (${r.name_ko})` : ''}${r.website ? ` — ${r.website}` : ''}
Country: ${r.headquarters?.country_ko || r.headquarters?.country || ''}
What it does: ${r.tagline || r.product?.summary || ''}
We covered it on ${r.date}. Known then: stage ${r.company_stage || '?'}${round?.amount ? `, latest round ${round.stage || ''} ${round.amount} (${round.date || '?'})` : ''}.

Search for major events for this company dated AFTER ${r.date} and on or before ${today}:
- funding: a new funding round
- acquired: acquired by or merged into another company
- shutdown: service ended, company closed or bankrupt
- ipo: listed on a stock exchange
- product: a major new product or a major launch (not minor feature updates)
Skip anything on or before ${r.date}; we already covered it.

For each event:
- date: YYYY-MM-DD (YYYY-MM if the day is unknown)
- kind: funding | acquired | shutdown | ipo | product
- title_ko: Korean, 40 characters or fewer, the fact only. Example: "시리즈 B 4,000만 달러 유치"
- detail_ko: 1-2 Korean sentences with the specifics (amount, investors, acquirer, product name)
- title_en, detail_en: the same title and detail in English (official English names; amounts exact: 1억 = 100M)
- source_url: the article or announcement page you saw in search results (not a homepage)
- source_name: the publication or site name

Reply with ONLY a JSON object:
{"events": [{"date": "", "kind": "", "title_ko": "", "title_en": "", "detail_ko": "", "detail_en": "", "source_url": "https://…", "source_name": ""}]}`
}

/* ---------- Vetting ---------- */

const str = (v) => (typeof v === 'string' ? v.trim() : '')
const hasHangul = (s) => /[가-힣]/.test(s)
// English text with at most a few Korean proper-noun characters
const isEnglish = (s) => !!s && (s.match(/[가-힣]/g) || []).length <= s.replace(/\s/g, '').length * 0.3

/** title_en / detail_en when the model gave usable English for both; {} otherwise. */
function english(e) {
  const title = str(e?.title_en)
  const detail = str(e?.detail_en)
  if (!isEnglish(title) || title.length > TITLE_EN_MAX || (detail && !isEnglish(detail))) return {}
  return detail ? { title_en: title, detail_en: detail } : { title_en: title }
}
// the title states a fact; plans and guesses are not events
const SPECULATIVE = /예정|전망|추정|기대|가능성|루머|소문|검토|추진\s*중|할\s*듯|것으로\s*보/

const eventKey = (e) => `${e.kind}|${e.date}`
const urlKey = (e) => stripUrl(e.source_url)

function isArticleUrl(url) {
  try {
    const u = new URL(url)
    return /^https?:$/.test(u.protocol) && u.pathname.replace(/\/+$/, '') !== ''
  } catch {
    return false
  }
}

const hostName = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

/**
 * Keep events that pass every rule; `existing` are events already stored for this company.
 * → { events, dropped: [{ title, reason }] }
 */
export async function vetEvents(raw, record, { searched = new Set(), today, existing = [], found = today, fetchImpl, deadline = Infinity, log = () => {} } = {}) {
  const dropped = []
  const drop = (e, reason) => {
    dropped.push({ title: str(e?.title_ko) || '?', reason })
    log(`    drop "${str(e?.title_ko) || '?'}" (${record.id}): ${reason}`)
  }
  const keysUrl = new Set(existing.map(urlKey))
  const keysEvent = new Set(existing.map(eventKey))

  const candidates = []
  for (const e of Array.isArray(raw) ? raw : []) {
    const en = english(e)
    const ev = {
      date: str(e?.date),
      kind: str(e?.kind).toLowerCase(),
      title_ko: str(e?.title_ko),
      ...(en.title_en ? { title_en: en.title_en } : {}),
      detail_ko: str(e?.detail_ko),
      ...(en.detail_en ? { detail_en: en.detail_en } : {}),
      source_url: str(e?.source_url),
      source_name: str(e?.source_name),
    }
    if (!KINDS.includes(ev.kind)) drop(ev, `kind ${ev.kind || 'missing'}`)
    else if (!dateAfter(ev.date, record.date, today)) drop(ev, `date ${ev.date || 'missing'} not after ${record.date}`)
    else if (!ev.title_ko || ev.title_ko.length > TITLE_MAX || !hasHangul(ev.title_ko)) drop(ev, 'title missing, too long or not Korean')
    else if (SPECULATIVE.test(ev.title_ko) || SPECULATIVE.test(ev.detail_ko)) drop(ev, 'speculative wording')
    else if (!isArticleUrl(ev.source_url)) drop(ev, `source ${ev.source_url || 'missing'} is not an article URL`)
    else candidates.push(ev)
  }

  // links are checked together (time budget); duplicates are judged only among events whose
  // source opened, so a dead link can't shadow a good copy of the same event
  const list = candidates.slice(0, MAX_CHECKS)
  for (const ev of candidates.slice(MAX_CHECKS)) drop(ev, 'too many events')
  const left = deadline - Date.now()
  const checks = left < 3_000
    ? list.map(() => ({ verified: false, http_status: 'no time' }))
    : await Promise.all(list.map((ev) => checkUrl(ev.source_url, { searched, timeoutMs: Math.min(10_000, left - 1_000), fetchImpl })))
  const events = []
  list.forEach((ev, i) => {
    if (!checks[i].verified) return drop(ev, `source did not open (${checks[i].http_status})`)
    if (keysUrl.has(urlKey(ev)) || keysEvent.has(eventKey(ev))) return drop(ev, 'duplicate')
    if (events.length >= PER_COMPANY) return drop(ev, 'too many events')
    keysUrl.add(urlKey(ev))
    keysEvent.add(eventKey(ev))
    events.push({ ...ev, source_name: ev.source_name || hostName(ev.source_url), found })
  })
  return { events, dropped }
}

/* ---------- Research ---------- */

/** Reject when `ms` runs out; the request itself is also bounded by its own timeout. */
function within(promise, ms, what) {
  let t
  const timer = new Promise((_, reject) => {
    t = setTimeout(() => reject(new Error(`${what} timed out`)), Math.max(0, ms))
  })
  return Promise.race([promise, timer]).finally(() => clearTimeout(t))
}

/**
 * One company. → { ok, events, dropped }. `ok` false means the call failed and the company
 * should be tried again another day (not marked checked).
 */
export async function researchFollowup(llm, record, { today, existing = [], deadline = Date.now() + BUDGET_MS, fetchImpl, log = () => {} } = {}) {
  const searched = new Set()
  // leave ~25s of the budget for the link checks
  const llmMs = Math.min(180_000, deadline - Date.now() - 25_000)
  if (llmMs < 20_000) return { ok: false, events: [], dropped: [], error: 'no time left' }
  let raw
  try {
    const r = await within(
      llm.chat({ system: RULES, user: followupPrompt(record, today), web: true, maxResults: 8, maxTokens: MAX_TOKENS, timeoutMs: llmMs }),
      llmMs + 5_000,
      'follow-up research',
    )
    r.citations.forEach((c) => searched.add(stripUrl(c.url)))
    // no repair call: a broken answer is retried another day instead of paying twice now
    const parsed = deepClean(extractJson(r.text))
    raw = Array.isArray(parsed) ? parsed : parsed.events
    if (!Array.isArray(raw)) throw new Error('no events list')
    log(`  follow-up ${record.name_en} (${r.model}): ${raw.length} reported, ${r.citations.length} citations`)
  } catch (err) {
    log(`  follow-up ${record.name_en}: research failed (${err.message})`)
    return { ok: false, events: [], dropped: [], error: err.message }
  }
  const { events, dropped } = await vetEvents(raw, record, { searched, today, existing, fetchImpl, deadline, log })
  return { ok: true, events, dropped }
}

/* ---------- Store ---------- */

/** Fold one company's result into the store (pure). Events newest first; checked even with no events. */
export function applyResult(store, id, { ok, events = [] }, today) {
  if (!ok) return store
  const list = [...(store.updates[id] || []), ...events].sort((a, b) => b.date.localeCompare(a.date))
  return {
    updates: list.length ? { ...store.updates, [id]: list } : store.updates,
    checked: { ...store.checked, [id]: today },
  }
}

export function readStore(fs, file) {
  if (!fs.existsSync(file)) return emptyStore()
  const s = JSON.parse(fs.readFileSync(file, 'utf-8'))
  return { updates: s?.updates || {}, checked: s?.checked || {} }
}

/* ---------- Orchestration ---------- */

/**
 * Pick targets, research them in parallel within the time budget, rewrite updates.json.
 * `ids` forces those companies (skips the day/terminal rules). `dryRun` only reports targets.
 * Never throws for a single company.
 */
export async function runFollowups(
  llm,
  records,
  { updatesPath, correctionsPath, today, ids = null, limit = DAILY_LIMIT, dryRun = false, budgetMs = BUDGET_MS, fetchImpl, log = console.log },
) {
  const fs = await import('node:fs')
  const deadline = Date.now() + budgetMs
  const store = readStore(fs, updatesPath)
  const corrections = correctionsPath && fs.existsSync(correctionsPath) ? JSON.parse(fs.readFileSync(correctionsPath, 'utf-8')) : {}

  let targets
  let due
  if (ids?.length) {
    const byId = new Map(records.map((r) => [r.id, r]))
    for (const id of ids) if (!byId.has(id)) log(`  follow-up: unknown id ${id}`)
    targets = ids.filter((id) => byId.has(id)).map((id) => byId.get(id)).slice(0, Math.max(0, limit))
    due = targets
  } else {
    ;({ targets, due } = selectTargets(records, { store, corrections, today, limit }))
  }
  log(`follow-ups: ${due.length} due, ${targets.length} today${targets.length ? ` → ${targets.map((t) => `${t.id} (${t.date})`).join(', ')}` : ''}`)
  if (dryRun || !targets.length) return { store, targets, due, results: {} }

  const results = Object.fromEntries(
    await Promise.all(
      targets.map(async (r) => [r.id, await researchFollowup(llm, r, { today, existing: store.updates[r.id] || [], deadline, fetchImpl, log })]),
    ),
  )
  let next = store
  for (const [id, res] of Object.entries(results)) next = applyResult(next, id, res, today)
  fs.writeFileSync(updatesPath, JSON.stringify(next, null, 2) + '\n', 'utf-8')
  const added = Object.values(results).reduce((n, r) => n + r.events.length, 0)
  const checked = Object.values(results).filter((r) => r.ok).length
  log(`follow-ups: ${checked}/${targets.length} checked, ${added} new events`)
  return { store: next, targets, due, results }
}

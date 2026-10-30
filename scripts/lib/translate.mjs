/**
 * English edition of a company record (src/data/startups.en.json).
 *
 *   extract  — every Korean prose string in the record → { "product.summary": "…", "founders.0.role": "…" }
 *   translate — one JSON-mode call per record (no web), same keys back
 *   vet      — keys ⊆ requested, no Korean left (proper-noun slack), numbers and 억/만/조 amounts kept
 *   overlay  — the translated strings rebuilt into the record's shape (strings only), which
 *              src/lib/merge-en.js lays over the Korean record at build time
 *
 * A failed or cut-off answer is retried once on the next model (llm.models.slice(1)), and only
 * for the keys that failed.
 */
import { deepClean, extractJson } from './openrouter.mjs'

// identifiers, links and machine fields; name_ko stays Korean (the app shows name_en in English)
export const SKIP_KEYS = new Set([
  'id', 'date', 'website', 'logo_url', 'model', 'generated_at', 'website_check', 'name_en', 'name_ko',
  'linkedin', 'email', 'url', 'checked_at', 'http_status', 'verified', 'logo_svg_description',
])

const HANGUL = /[가-힣ㄱ-ㅎㅏ-ㅣ]/
const HANGUL_G = /[가-힣ㄱ-ㅎㅏ-ㅣ]/g
export const hasHangul = (s) => typeof s === 'string' && HANGUL.test(s)
const skipKey = (k) => SKIP_KEYS.has(k) || /_url$/.test(k)

/* ---------- Extract / overlay ---------- */

/** Korean prose strings of a record, keyed by dotted path ("funding.funding_history.0.note"). */
export function extractStrings(record) {
  const out = {}
  const walk = (v, path) => {
    if (typeof v === 'string') {
      if (hasHangul(v) && !/^https?:/i.test(v.trim())) out[path.join('.')] = v
    } else if (Array.isArray(v)) {
      v.forEach((x, i) => walk(x, [...path, String(i)]))
    } else if (v && typeof v === 'object') {
      for (const [k, x] of Object.entries(v)) if (!skipKey(k)) walk(x, [...path, k])
    }
  }
  walk(record, [])
  return out
}

/**
 * Rebuild { path: text } into the record's shape, strings only. Array slots that are not
 * translated are null (merge-en.js keeps the original there).
 */
export function buildOverlay(record, map) {
  const root = {}
  for (const [key, text] of Object.entries(map)) {
    const parts = key.split('.')
    let src = record
    let node = root
    parts.forEach((p, i) => {
      const last = i === parts.length - 1
      src = src?.[p]
      if (last) {
        node[p] = text
        return
      }
      if (node[p] == null) node[p] = Array.isArray(src) ? [] : {}
      node = node[p]
    })
  }
  // fill holes so the JSON has explicit nulls, not sparse arrays
  const fill = (v) => {
    if (Array.isArray(v)) return Array.from({ length: v.length }, (_, i) => (v[i] === undefined ? null : fill(v[i])))
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fill(x)]))
    return v
  }
  return fill(root)
}

/* ---------- Checks ---------- */

/** Share of non-space characters that are Hangul. */
export function hangulShare(s) {
  const chars = String(s).replace(/\s/g, '')
  return chars.length ? (chars.match(HANGUL_G) || []).length / chars.length : 0
}

export const MAX_HANGUL = 0.3

const UNIT = { 조: 1e12, 억: 1e8, 만: 1e4 }
const SUB = { 천: 1e3, 백: 1e2 }
const toNum = (s) => Number(String(s).replace(/,/g, ''))

/**
 * Korean money-style amounts → numbers. "약 131억 엔" → [13100000000], "1조 2,000억" → [1.2e12],
 * "5천만" → [5e7]. Consecutive groups ("1조 2,000억") are one amount.
 */
export function koreanAmounts(text) {
  const re = /(\d[\d,]*(?:\.\d+)?)\s*([천백])?\s*([조억만])/g
  const out = []
  let prevEnd = -1
  let m
  while ((m = re.exec(text))) {
    const v = toNum(m[1]) * (SUB[m[2]] || 1) * UNIT[m[3]]
    if (out.length && /^\s*$/.test(text.slice(prevEnd, m.index)) && UNIT[m[3]] < out.at(-1).unit) {
      out.at(-1).value += v
      out.at(-1).unit = UNIT[m[3]]
    } else {
      out.push({ value: v, unit: UNIT[m[3]] })
    }
    prevEnd = m.index + m[0].length
  }
  return out.map((a) => a.value)
}

const EN_UNIT = { trillion: 1e12, tn: 1e12, t: 1e12, billion: 1e9, bn: 1e9, b: 1e9, million: 1e6, mn: 1e6, m: 1e6, thousand: 1e3, k: 1e3 }

/** Amounts written in English: "¥13.1B", "KRW 16.3 billion", "1,400,000,000". */
export function englishAmounts(text) {
  const out = []
  const re = /(\d[\d,]*(?:\.\d+)?)\s*(trillion|billion|million|thousand|tn|bn|mn|[TBMKk])?(?![a-zA-Z])/g
  let m
  while ((m = re.exec(text))) {
    const n = toNum(m[1])
    if (m[2]) out.push(n * EN_UNIT[m[2].toLowerCase()])
    else if (n >= 1e4) out.push(n)
  }
  return out
}

/**
 * Arabic numbers the translation must keep: two digits or more (single digits often become
 * words), not part of a 억/만/조 amount (checked by value instead) and not a month ("10월"
 * → "October").
 */
export function plainNumbers(text) {
  const out = []
  const re = /\d[\d,]*(?:\.\d+)?/g
  let m
  while ((m = re.exec(text))) {
    const after = text.slice(m.index + m[0].length)
    if (/^\s*(?:[천백]\s*)?[조억만]/.test(after) || /^\s*월/.test(after)) continue
    const n = m[0].replace(/,/g, '').replace(/\.$/, '')
    if (n.replace(/\D/g, '').length >= 2) out.push(n)
  }
  return out
}

/**
 * Problems with one translated value → [] when fine.
 *   hard: missing, empty, too much Korean left
 *   soft: a number or a 억/만/조 amount not found in the translation
 */
export function checkValue(source, text) {
  if (typeof text !== 'string' || !text.trim()) return [{ hard: true, reason: 'missing' }]
  const problems = []
  if (hangulShare(text) > MAX_HANGUL) problems.push({ hard: true, reason: 'Korean left' })
  const flat = text.replace(/,/g, '')
  for (const n of plainNumbers(source)) if (!flat.includes(n)) problems.push({ hard: false, reason: `number ${n} lost` })
  const have = englishAmounts(text)
  for (const v of koreanAmounts(source)) {
    if (!have.some((h) => Math.abs(h - v) <= v * 0.01)) problems.push({ hard: false, reason: `amount ${v} not kept` })
  }
  return problems
}

/**
 * Vet a model answer against the request. → { good: {key: text}, bad: {key: [problems]}, extra: [keys] }
 * Keys the model invented are ignored (and reported); values are trimmed strings.
 */
export function vetTranslation(request, answer) {
  const good = {}
  const bad = {}
  const extra = Object.keys(answer || {}).filter((k) => !(k in request))
  for (const [key, source] of Object.entries(request)) {
    const text = typeof answer?.[key] === 'string' ? answer[key].trim() : answer?.[key]
    const problems = checkValue(source, text)
    if (problems.length) bad[key] = problems
    else good[key] = text
  }
  return { good, bad, extra }
}

/* ---------- Prompt ---------- */

export const RULES = `You translate a Korean startup publication into English for international readers.
- Natural, concise English in the style of a tech business newsletter. Translate meaning, not word by word.
- Keep every fact. Do not add, drop or soften anything. No commentary.
- Numbers and currencies exactly as in the source. Convert Korean units exactly: 1만 = 10K, 1억 = 100M, 1조 = 1T.
  "약 131억 엔" → "approx. ¥13.1B", "163억원" → "KRW 16.3B", "4,000만 달러" → "$40M", "비공개" → "Undisclosed", "(추정)" → "(est.)".
  Keep the source's currency; never convert to another currency.
- Dates: "2026년 10월" → "October 2026". Funding stages in English ("시리즈 B" → "Series B", "시드" → "Seed").
- Korean and Japanese companies and people: use their official English name; if you do not know it, romanize.
  When the source gives a Latin-script name in parentheses, use that name (and drop the Korean).
- Investors: their own official name as they write it (e.g. "Kolon Investment", "Sequoia Capital"); never translate a name's meaning.
- No Korean characters may remain in the output.
- Reply with ONLY a JSON object with exactly the same keys as the input and the English text as values.`

export function translatePrompt(record, request) {
  const names = [
    record.name_en && record.name_ko ? `${record.name_ko} = ${record.name_en}` : '',
    ...(record.founders || []).map((f) => (f?.name_ko && f?.name_en ? `${f.name_ko} = ${f.name_en}` : '')),
  ].filter(Boolean)
  return `Company: ${record.name_en || ''}${record.headquarters?.country ? ` (${record.headquarters.country})` : ''}
${names.length ? `Names: ${names.join('; ')}\n` : ''}
Translate every value of this JSON object into English. Keys are field paths; keep them unchanged.

${JSON.stringify(request, null, 1)}`
}

/* ---------- Model call ---------- */

// DeepSeek spends a lot on reasoning before the JSON; 16k cut off about a third of companies
const MAX_TOKENS = 32000

async function ask(llm, system, user, useModels, maxTokens = MAX_TOKENS) {
  const r = await llm.chat({ system, user, json: true, maxTokens, useModels })
  const parsed = deepClean(extractJson(r.text))
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new SyntaxError('answer is not a JSON object')
  return { answer: parsed, model: r.model }
}

/**
 * Translate a { key: korean } map. One call on the client's models; keys that fail (or the
 * whole call, when it is cut off or unparsable) go once more to llm.models.slice(1).
 * → { ok, map, failed: { key: [reasons] }, models: [] }
 *   ok is false when any key has a hard problem left; soft problems (numbers) after the
 *   retry are kept with the best text and reported in `warnings`.
 */
export async function translateMap(llm, request, { system = RULES, prompt, log = () => {}, label = '' } = {}) {
  const keys = Object.keys(request)
  if (!keys.length) return { ok: true, map: {}, failed: {}, warnings: {}, models: [] }
  const map = {}
  const softBest = {}
  const used = []
  let pending = request
  let lastBad = {}
  const rounds = [undefined, llm.models?.slice(1)]
  for (let round = 0; round < rounds.length; round++) {
    const useModels = rounds[round]
    if (round > 0 && !useModels?.length) break
    try {
      const { answer, model } = await ask(llm, system, prompt(pending), useModels)
      used.push(model)
      const { good, bad, extra } = vetTranslation(pending, answer)
      if (extra.length) log(`  ${label}: ignored ${extra.length} unexpected keys (${extra.slice(0, 3).join(', ')})`)
      Object.assign(map, good)
      for (const [k, probs] of Object.entries(bad)) if (probs.every((p) => !p.hard)) softBest[k] = answer[k].trim()
      lastBad = bad
    } catch (err) {
      log(`  ${label}: ${round ? 'retry' : 'attempt'} failed (${err.message})`)
      lastBad = Object.fromEntries(Object.keys(pending).map((k) => [k, [{ hard: true, reason: err.message }]]))
    }
    const left = Object.keys(lastBad)
    if (!left.length) break
    if (round < rounds.length - 1) {
      log(`  ${label}: retrying ${left.length}/${keys.length} keys (${summarize(lastBad)})`)
      pending = Object.fromEntries(left.map((k) => [k, request[k]]))
    }
  }
  const failed = {}
  const warnings = {}
  for (const [k, probs] of Object.entries(lastBad)) {
    if (k in softBest) {
      // only numbers looked off, even after the retry: keep the text, report it
      map[k] = softBest[k]
      warnings[k] = probs.map((p) => p.reason)
    } else {
      failed[k] = probs.map((p) => p.reason)
    }
  }
  return { ok: !Object.keys(failed).length, map, failed, warnings, models: [...new Set(used)] }
}

/** { key: [problem | reason] } → "Korean left ×3, number lost ×1" */
function summarize(bad) {
  const counts = {}
  for (const probs of Object.values(bad)) {
    for (const p of probs) {
      const r = (p.reason ?? p).replace(/ \S+ (lost|not kept)$/, ' $1')
      counts[r] = (counts[r] || 0) + 1
    }
  }
  return Object.entries(counts).map(([r, n]) => `${r} ×${n}`).join(', ')
}

/**
 * One company → { ok, overlay, failed, warnings, models }. `overlay` is the startups.en.json
 * value (null when ok is false: a half-English record is worse than the Korean fallback).
 */
export async function translateRecord(llm, record, { log = () => {} } = {}) {
  const request = extractStrings(record)
  const res = await translateMap(llm, request, { prompt: (req) => translatePrompt(record, req), log, label: record.id })
  return { ...res, overlay: res.ok ? buildOverlay(record, res.map) : null, keys: Object.keys(request).length }
}

/* ---------- Store ---------- */

export function readTranslations(fs, file) {
  if (!fs.existsSync(file)) return {}
  return JSON.parse(fs.readFileSync(file, 'utf-8')) || {}
}

/** Write translations in startups.json order (stable diffs); ids no longer in the data are kept at the end. */
export function writeTranslations(fs, file, store, order = []) {
  const out = {}
  for (const id of order) if (store[id]) out[id] = store[id]
  for (const id of Object.keys(store)) if (!(id in out)) out[id] = store[id]
  const tmp = `${file}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(out, null, 2) + '\n', 'utf-8')
  fs.renameSync(tmp, file)
}

export async function mapLimit(items, limit, fn) {
  const out = new Array(items.length)
  let i = 0
  await Promise.all(
    Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, async () => {
      while (i < items.length) {
        const idx = i++
        out[idx] = await fn(items[idx], idx)
      }
    }),
  )
  return out
}

/**
 * Translate records into the store file, saving after each company (an interrupted run picks
 * up where it stopped). Never throws for a single company. → { done, failed: [{ id, failed }], cost }
 */
export async function translateRecords(llm, records, { file, order, concurrency = 4, fs, log = console.log } = {}) {
  const store = readTranslations(fs, file)
  const done = []
  const failed = []
  await mapLimit(records, concurrency, async (r) => {
    try {
      const res = await translateRecord(llm, r, { log })
      if (res.ok) {
        store[r.id] = res.overlay
        writeTranslations(fs, file, store, order)
        done.push(r.id)
        const warn = Object.keys(res.warnings).length
        log(`  translated ${r.id}: ${res.keys} strings (${res.models.join(', ')})${warn ? `, ${warn} number warnings: ${JSON.stringify(res.warnings)}` : ''}`)
      } else {
        failed.push({ id: r.id, failed: res.failed })
        log(`  translate ${r.id} failed: ${Object.keys(res.failed).length}/${res.keys} keys (${summarize(res.failed)})`)
      }
    } catch (err) {
      failed.push({ id: r.id, failed: { _: [err.message] } })
      log(`  translate ${r.id} failed: ${err.message}`)
    }
  })
  return { done, failed, store }
}

/* ---------- Follow-up events (updates.json) ---------- */

/**
 * Fill title_en / detail_en for stored follow-up events that lack them (older entries, or a
 * research answer without English). One call for all of them. Mutates and returns the store.
 */
export async function translateUpdates(llm, store, { log = () => {} } = {}) {
  const request = {}
  for (const [id, events] of Object.entries(store.updates || {})) {
    events.forEach((e, i) => {
      if (!e.title_en && hasHangul(e.title_ko)) request[`${id}.${i}.title_en`] = e.title_ko
      if (!e.detail_en && hasHangul(e.detail_ko)) request[`${id}.${i}.detail_en`] = e.detail_ko
    })
  }
  if (!Object.keys(request).length) return { store, count: 0 }
  const res = await translateMap(llm, request, {
    prompt: (req) => `Translate every value of this JSON object into English. These are short news items about startups (a title and a 1-2 sentence detail). Keys are ids; keep them unchanged.\n\n${JSON.stringify(req, null, 1)}`,
    log,
    label: 'updates',
  })
  let count = 0
  for (const [key, text] of Object.entries(res.map)) {
    const [id, i, field] = key.split('.')
    const e = store.updates[id]?.[Number(i)]
    if (e) {
      e[field] = text
      count++
    }
  }
  return { store, count, failed: res.failed }
}

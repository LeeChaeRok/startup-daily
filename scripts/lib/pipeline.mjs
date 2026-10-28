/**
 * Pure post-processing for generated startup profiles: selection rules,
 * normalization, link verification and merging. No Claude API calls here,
 * so it can be exercised offline (see `--candidates` in generate-daily.mjs).
 */
import { parseAmount, splitAmount } from '../../src/lib/amount.js'

/* ---------- Selection rules ---------- */

// Concept: rising startups Korean readers don't know yet. Household names and
// companies that already dominate tech press are out, whatever the model says.
export const FAMOUS = [
  'OpenAI', 'Anthropic', 'Google', 'DeepMind', 'Meta', 'Microsoft', 'Apple', 'Amazon', 'Nvidia', 'Tesla', 'SpaceX',
  'xAI', 'Mistral', 'Cohere', 'Perplexity', 'Cursor', 'Anysphere', 'Hugging Face', 'Scale AI', 'Databricks',
  'Stripe', 'Revolut', 'Klarna', 'Figma', 'Notion', 'Canva', 'Airtable', 'Vercel', 'Supabase', 'Replit',
  'Glean', 'Wiz', 'LangChain', 'Mercury', 'Figure AI', 'Physical Intelligence', 'Character.AI', 'Midjourney',
  'Runway', 'ElevenLabs', 'Harvey', 'Ramp', 'Brex', 'Rippling', 'Deel', 'Chime', 'Plaid', 'Toss', 'Viva Republica',
  'Coupang', 'Kakao', 'Naver', 'Baemin', 'Woowa', 'Karrot', '당근', '토스', '쿠팡', '카카오', '네이버',
]

const norm = (s = '') => s.normalize('NFC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '')

export function isFamous(s) {
  const names = [s.name_en, s.name_ko].map(norm)
  return FAMOUS.some((f) => names.includes(norm(f)))
}

// Public, acquired, shut down or late-stage companies break the concept.
export function stageProblem(stage = '') {
  if (/public|ipo|nasdaq|nyse|kosdaq|kospi|상장/i.test(stage)) return 'listed'
  if (/acquired|인수|merger|spac/i.test(stage)) return 'acquired'
  if (/shut|bankrupt|insolv|파산|폐업|중단|chapter 11/i.test(stage)) return 'closed'
  if (/series\s*[d-z]\b|late stage|growth/i.test(stage)) return 'late'
  return null
}

/**
 * Split candidates into accepted / rejected with reasons. `existing` holds
 * every company ever published so the same company never runs twice.
 */
export function countryOf(c) {
  const k = (c?.headquarters?.country_ko || c?.country_ko || '').split('/')[0].trim()
  return k === '대한민국' || k === '남한' ? '한국' : k
}

export function selectCandidates(candidates, existing, want = 5, { maxPerCountry = 2 } = {}) {
  const seen = dedupIndex(existing)
  const perCountry = new Map()
  const accepted = []
  const rejected = []
  for (const c of candidates) {
    const dup = c?.name_en ? findDuplicate(c, seen) : null
    const reason =
      !c?.name_en
        ? 'incomplete'
        : dup
          ? `duplicate (${dup.by} ${dup.key} = ${dup.id})`
          : isFamous(c)
            ? 'famous'
            : stageProblem(c.company_stage) || (c.status && c.status !== 'active' ? `status:${c.status}` : null)
    if (reason) {
      rejected.push({ name: c?.name_en || '?', reason })
      continue
    }
    // an issue should span countries; extra companies from one country wait for another day
    const country = countryOf(c)
    if (country && (perCountry.get(country) || 0) >= maxPerCountry) {
      rejected.push({ name: c.name_en, reason: `country cap (${country})` })
      continue
    }
    if (accepted.length < want) {
      if (country) perCountry.set(country, (perCountry.get(country) || 0) + 1)
      accepted.push(c)
      addToIndex(seen, c)
    }
  }
  return { accepted, rejected }
}

/* ---------- Duplicate detection ---------- */

// Second-level labels under a ccTLD that act like a TLD: co.kr, co.jp, com.br, co.uk, or.jp …
const SLD = new Set(['co', 'com', 'or', 'ne', 'ac', 'go', 'org', 'net', 'gov', 'edu', 'gen', 'ltd', 'plc', 'biz', 'info'])
// Hosting platforms many companies share: compare the full host there, not the platform domain.
const SHARED = new Set([
  'github.io', 'notion.site', 'wixsite.com', 'webflow.io', 'vercel.app', 'netlify.app', 'pages.dev', 'framer.website',
  'framer.ai', 'carrd.co', 'super.site', 'medium.com', 'substack.com', 'linktr.ee', 'linkedin.com', 'blogspot.com',
  'wordpress.com', 'herokuapp.com', 'imweb.me', 'modoo.at', 'oopy.io', 'sites.google.com', 'google.com',
])

/** "https://www.k-oqt.com/en" → "k-oqt.com"; "shop.foo.co.kr" → "foo.co.kr". */
export function registrableDomain(url) {
  if (!url || typeof url !== 'string') return null
  let host
  try {
    host = new URL(/^[a-z][\w+.-]*:\/\//i.test(url) ? url : `https://${url}`).hostname.toLowerCase()
  } catch {
    return null
  }
  host = host.replace(/^www\d*\./, '').replace(/\.$/, '')
  const parts = host.split('.')
  if (parts.length < 2 || /^\d+$/.test(parts.at(-1))) return null
  const n = parts.length >= 3 && parts.at(-1).length === 2 && SLD.has(parts.at(-2)) ? 3 : 2
  const base = parts.slice(-n).join('.')
  if (SHARED.has(base) || SHARED.has(parts.slice(-3).join('.'))) return host
  return base
}

// Legal-form words at the end of a name ("Helical Fusion Co., Ltd.", "Celaid Therapeutics Inc.")
const LEGAL_TAIL =
  /[\s,.]*\b(?:inc|incorporated|corp|corporation|co|ltd|limited|llc|l\.l\.c|gmbh|ag|sa|s\.a|sas|sarl|bv|b\.v|nv|pte|pty|plc|kk|k\.k|oy|ab|as|srl|spa|ltda|s\.l|sl)\.?[\s,.]*$/i
// …and the Korean / Japanese ones anywhere ("주식회사 오큐티", "(주)오큐티", "株式会社Kinish")
const LEGAL_CJK = /주식회사|유한회사|유한책임회사|\(\s*주\s*\)|㈜|株式会社|有限会社|合同会社|\(\s*株\s*\)|㈱/g

/** "주식회사 오큐티" → "오큐티", "Helical Fusion Co., Ltd." → "helicalfusion". */
export function companyKey(name) {
  if (!name || typeof name !== 'string') return ''
  let s = name.normalize('NFKC').replace(LEGAL_CJK, ' ')
  for (let prev = ''; prev !== s; ) {
    prev = s
    s = s.replace(LEGAL_TAIL, '')
  }
  return norm(s)
}

/** Every name a company goes by: full name, and the name and alias of "Occu-T (OQT)" separately. */
export function nameKeys(c) {
  const keys = new Set()
  for (const name of [c?.name_en, c?.name_ko]) {
    if (!name || typeof name !== 'string') continue
    keys.add(companyKey(name))
    const m = name.match(/^(.*?)\s*[(（]([^)）]+)[)）]\s*(.*)$/)
    if (m) {
      keys.add(companyKey(`${m[1]} ${m[3]}`))
      keys.add(companyKey(m[2]))
    }
  }
  // very short keys ("ai", "x") would match unrelated companies
  return [...keys].filter((k) => k.length >= (/^[\x00-\x7f]+$/.test(k) ? 3 : 2))
}

/** Index of published companies by registrable domain and by normalized name. */
export function dedupIndex(records = []) {
  const index = { domains: new Map(), names: new Map() }
  for (const r of records) addToIndex(index, r)
  return index
}

export function addToIndex(index, r) {
  const id = r?.id || r?.name_en || '?'
  const d = registrableDomain(r?.website)
  if (d && !index.domains.has(d)) index.domains.set(d, id)
  for (const k of nameKeys(r)) if (!index.names.has(k)) index.names.set(k, id)
}

/** → { by: 'domain' | 'name', key, id } of the record `c` repeats, or null. */
export function findDuplicate(c, index) {
  const d = registrableDomain(c?.website)
  if (d && index.domains.has(d)) return { by: 'domain', key: d, id: index.domains.get(d) }
  for (const k of nameKeys(c)) if (index.names.has(k)) return { by: 'name', key: k, id: index.names.get(k) }
  return null
}

/**
 * Drop fresh profiles that repeat a published company or an earlier fresh one.
 * A fresh record with the same id and date as an existing one is a re-run of
 * that issue and replaces it, so it is not compared against itself.
 */
export function dropDuplicates(fresh, existing, { log = () => {} } = {}) {
  const replaced = (s) => fresh.some((f) => f.id === s.id && f.date === s.date)
  const index = dedupIndex(existing.filter((s) => !replaced(s)))
  const kept = []
  const dropped = []
  for (const f of fresh) {
    const dup = findDuplicate(f, index)
    if (dup) {
      dropped.push({ ...dup, name: f.name_en, id: f.id })
      log(`  drop duplicate ${f.name_en} (${f.id}): ${dup.by} ${dup.key} already published as ${dup.id}`)
      continue
    }
    kept.push(f)
    addToIndex(index, f)
  }
  return { kept, dropped }
}

/* ---------- Normalization ---------- */

const slug = (s) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')

/** Amount strings that lost their digits ("M+") are worse than nothing. */
export function cleanAmount(v) {
  return typeof v === 'string' && /\d/.test(v) ? v.trim() : null
}

const UNDISCLOSED = /^\s*(비공개|미공개|undisclosed|n\/a|unknown|알 수 없음)/i
const joinNotes = (...notes) => [...new Set(notes.map((n) => (typeof n === 'string' ? n.trim() : '')).filter(Boolean))].join(' / ') || null
const ratioOff = (a, b) => a > 0 && b > 0 && (a / b >= 2 || b / a >= 2)

/**
 * One funding amount → { amount, note, usd }. The amount keeps only the figure
 * ("3.23억 엔"); commentary and conversions move to the note. USD comes from the
 * figure itself (amount.js) — the model's number is kept only when it agrees
 * within 2×, and a conversion written next to the figure is never trusted over it.
 */
export function fixAmount(text, { note = null, usd = null, label = 'amount', log = () => {} } = {}) {
  const raw = typeof text === 'string' ? text.trim() : ''
  const modelUsd = usd == null || usd === '' ? null : Number(usd)
  const given = Number.isFinite(modelUsd) && modelUsd > 0 ? modelUsd : null
  if (!/\d/.test(raw)) {
    // "비공개 (보도 간 불일치 …)" keeps its explanation; digit-less junk ("M+") becomes 비공개
    const extra = UNDISCLOSED.test(raw) ? splitAmount(raw).note : null
    return { amount: '비공개', note: joinNotes(note, extra), usd: null }
  }
  let parsed = parseAmount(raw)
  // a unit amount.js does not know ("¥2億") leaves letters glued to the figure: don't cut there
  if (parsed && /^\p{L}/u.test(raw.slice(parsed.primary.index + parsed.primary.raw.length))) parsed = null
  if (!parsed) {
    if (UNDISCLOSED.test(raw)) return { amount: '비공개', note: joinNotes(note, splitAmount(raw).note), usd: null }
    return { amount: raw, note: joinNotes(note), usd: given }
  }
  const split = splitAmount(raw)
  const amount = split.note ? split.main : raw
  // "3.23억 엔 (약 $20.6M)": the original currency wins, the stray conversion stays in the note
  const conv = split.note ? parseAmount(split.note) : null
  if (conv && parsed.primary.cur !== 'USD' && conv.primary.cur === 'USD' && ratioOff(conv.usd, parsed.usd)) {
    log(`  ${label}: conversion "${conv.primary.raw}" disagrees with ${parsed.primary.raw}; keeping the original currency`)
  }
  let out = parsed.usd
  if (given && ratioOff(given, parsed.usd)) {
    log(`  ${label}: model USD ${Math.round(given)} vs parsed ${Math.round(parsed.usd)} from "${amount}"; using parsed`)
  } else if (given) {
    out = given
  }
  return { amount, note: joinNotes(note, split.note), usd: Math.round(out) }
}

export function normalize(c, { date, model, generatedAt, log = () => {} }) {
  const year = date.slice(0, 4)
  const f = c.funding || {}
  const name = c.name_en || '?'
  const fixRound = (r = {}, where) => {
    const a = fixAmount(r.amount, { note: r.note, usd: r.amount_usd, label: `${name} ${where}`, log })
    return {
      stage: r.stage || '',
      amount: a.amount,
      ...(a.note ? { note: a.note } : {}),
      ...(a.usd != null ? { amount_usd: a.usd } : {}),
      date: r.date || '',
      lead_investor: r.lead_investor || (Array.isArray(r.investors) ? r.investors[0] : '') || '',
      ...(r.notable_investors ? { notable_investors: r.notable_investors } : {}),
    }
  }
  const total = fixAmount(f.total_raised, { note: f.total_raised_note, usd: f.total_raised_usd, label: `${name} total_raised`, log })
  const { status, sources, ...rest } = c
  void status
  void sources
  return {
    ...rest,
    id: `${slug(c.name_en)}-${year}`,
    date,
    category: Array.isArray(c.category) ? c.category.slice(0, 3) : [],
    headquarters: { ...(c.headquarters || {}), country_ko: countryOf(c) || c.headquarters?.country_ko || '' },
    founders: Array.isArray(c.founders) ? c.founders.map(({ linkedin, ...p }) => (void linkedin, p)) : [],
    logo_url: '',
    funding: {
      ...f,
      total_raised: total.amount,
      total_raised_note: total.note,
      total_raised_usd: total.usd,
      latest_round: fixRound(f.latest_round, 'latest_round'),
      valuation_estimate: cleanAmount(f.valuation_estimate) || '비공개',
      funding_history: (f.funding_history || []).map((r, i) => fixRound(r, `funding_history[${i}]`)),
    },
    related_links: (c.related_links || []).map((l) => ({ title: l.title || l.label || '', url: l.url })),
    generated_at: generatedAt,
    model,
  }
}

/* ---------- Link verification ---------- */

/**
 * GET a URL (redirects followed). A page counts as verified when it answers
 * 2xx. 401/403/429 means a bot wall, not a missing page — it is accepted only
 * when the URL also appeared in the model's web search results, because then
 * we know it came from a real search rather than the model's imagination.
 */
export async function checkUrl(url, { searched = new Set(), hostLevel = false, timeoutMs = 12000, fetchImpl = fetch } = {}) {
  let status = 0
  try {
    const u = new URL(url)
    if (!/^https?:$/.test(u.protocol)) throw new Error('scheme')
    const res = await fetchImpl(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(timeoutMs),
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; StartupDailyLinkCheck/1.0)', accept: 'text/html,*/*' },
    })
    status = res.status
    res.body?.cancel?.().catch(() => {})
  } catch {
    status = 0
  }
  const walled = status === 401 || status === 403 || status === 429
  // A bot wall proves nothing by itself. Accept it only if this exact page — or, for company
  // homepages (hostLevel), this site — appeared in the model's real search results.
  const seen = searched.has(stripUrl(url)) || (hostLevel && [...searched].some((u) => u.split('/')[0] === stripUrl(url).split('/')[0]))
  const verified = (status >= 200 && status < 300) || (walled && seen)
  return { verified, http_status: status }
}

export function stripUrl(url) {
  try {
    const u = new URL(url)
    return `${u.hostname.replace(/^www\./, '')}${u.pathname.replace(/\/$/, '')}`
  } catch {
    return url
  }
}

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length)
  let i = 0
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++
        out[idx] = await fn(items[idx])
      }
    }),
  )
  return out
}

/**
 * Check website, media mentions and related links for every profile. Failed
 * media/related links are dropped; a failed website is kept but flagged, since
 * the company itself is real and the site may just block bots.
 */
export async function verifyLinks(profiles, { searched, checkedAt, fetchImpl, log = () => {} } = {}) {
  const urls = new Set()
  for (const p of profiles) {
    if (p.website) urls.add(p.website)
    for (const m of p.trending_reason?.media_mentions || []) if (m.url) urls.add(m.url)
    for (const l of p.related_links || []) if (l.url) urls.add(l.url)
  }
  const list = [...urls]
  const results = new Map(
    (await mapLimit(list, 8, (u) => checkUrl(u, { searched, fetchImpl }))).map((r, i) => [list[i], r]),
  )

  let kept = 0
  let dropped = 0
  const out = profiles.map((p) => {
    const tag = (url) => ({ ...results.get(url), checked_at: checkedAt })
    const mentions = (p.trending_reason?.media_mentions || []).filter((m) => {
      const ok = m.url && results.get(m.url)?.verified
      ok ? kept++ : dropped++
      if (!ok) log(`  drop mention ${p.name_en}: ${m.url} (${results.get(m.url)?.http_status ?? 'no url'})`)
      return ok
    })
    const related = (p.related_links || []).filter((l) => {
      const ok = l.url && results.get(l.url)?.verified
      ok ? kept++ : dropped++
      return ok
    })
    return {
      ...p,
      website_check: p.website ? tag(p.website) : null,
      trending_reason: { ...p.trending_reason, media_mentions: mentions.map((m) => ({ ...m, ...tag(m.url) })) },
      related_links: related.map((l) => ({ ...l, ...tag(l.url) })),
    }
  })
  return { profiles: out, kept, dropped }
}

/* ---------- Merge ---------- */

/**
 * Newest issue first; keep the last `retainIssues` issues so the bundle stays small.
 * Fresh profiles that repeat a published company (same domain or name) are dropped.
 */
export function merge(existing, fresh, retainIssues, { log } = {}) {
  const { kept } = dropDuplicates(fresh, existing, { log })
  const all = [...kept, ...existing.filter((s) => !kept.some((f) => f.id === s.id))]
  const dates = [...new Set(all.map((s) => s.date))].sort((a, b) => b.localeCompare(a))
  const keep = new Set(dates.slice(0, retainIssues))
  return all.filter((s) => keep.has(s.date)).sort((a, b) => b.date.localeCompare(a.date))
}

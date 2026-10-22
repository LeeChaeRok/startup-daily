/**
 * Pure post-processing for generated startup profiles: selection rules,
 * normalization, link verification and merging. No Claude API calls here,
 * so it can be exercised offline (see `--candidates` in generate-daily.mjs).
 */

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
  const seen = new Set(existing.flatMap((s) => [norm(s.name_en), norm(s.name_ko)]).filter(Boolean))
  const perCountry = new Map()
  const accepted = []
  const rejected = []
  for (const c of candidates) {
    const reason =
      !c?.name_en
        ? 'incomplete'
        : seen.has(norm(c.name_en)) || seen.has(norm(c.name_ko))
          ? 'duplicate'
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
      seen.add(norm(c.name_en))
      if (c.name_ko) seen.add(norm(c.name_ko))
    }
  }
  return { accepted, rejected }
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

export function normalize(c, { date, model, generatedAt }) {
  const year = date.slice(0, 4)
  const f = c.funding || {}
  const fixRound = (r = {}) => ({
    stage: r.stage || '',
    amount: cleanAmount(r.amount) || '비공개',
    date: r.date || '',
    lead_investor: r.lead_investor || (Array.isArray(r.investors) ? r.investors[0] : '') || '',
    ...(r.notable_investors ? { notable_investors: r.notable_investors } : {}),
  })
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
      total_raised: cleanAmount(f.total_raised) || '비공개',
      latest_round: fixRound(f.latest_round),
      valuation_estimate: cleanAmount(f.valuation_estimate) || '비공개',
      funding_history: (f.funding_history || []).map(fixRound),
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
export async function checkUrl(url, { searched = new Set(), timeoutMs = 12000, fetchImpl = fetch } = {}) {
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
  const verified = (status >= 200 && status < 300) || (walled && searched.has(stripUrl(url)))
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

/** Newest issue first; keep the last `retainIssues` issues so the bundle stays small. */
export function merge(existing, fresh, retainIssues) {
  const all = [...fresh, ...existing.filter((s) => !fresh.some((f) => f.id === s.id))]
  const dates = [...new Set(all.map((s) => s.date))].sort((a, b) => b.localeCompare(a))
  const keep = new Set(dates.slice(0, retainIssues))
  return all.filter((s) => keep.has(s.date)).sort((a, b) => b.date.localeCompare(a.date))
}

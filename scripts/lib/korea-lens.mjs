/**
 * "한국에서는": similar ideas/products/companies and the Korean opportunity for one profile.
 *
 *   A. research  — web search with Korean queries; output is facts with source URLs only
 *   B. write     — no web; writes the analysis from A's facts and may only name what A found
 *   C. guards    — code: verified links, no absolute claims, verdict bounded by evidence
 *
 * The riskiest sentence this feature can print is "nothing like this exists in Korea",
 * so the guards (not the model) decide how strong a verdict may be.
 */
import { checkUrl, stripUrl } from './pipeline.mjs'
import { parseOrRepair } from './openrouter.mjs'

export const VERDICTS = ['open', 'emerging', 'crowded', 'constrained', 'unclear']

const norm = (s = '') => s.normalize('NFC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '')

/* ---------- Prompts ---------- */

const FACT_RULES = `You are a research assistant for a Korean startup publication. You report facts with sources and nothing else.
- Every company, product or regulation you mention must come with a URL you actually saw in search results. Never construct or guess a URL.
- Search in Korean and in English. If you could not find something, say so in "gaps"; do not fill the gap from memory.
- "Not found in my searches" is not the same as "does not exist". Never claim absence.`

function researchPrompt(p) {
  return `Subject company: ${p.name_en} (${p.headquarters?.country_ko || ''}) — ${p.tagline}
What it does: ${p.product?.summary || ''}
Target customer: ${p.product?.target_customer || ''}
Business model: ${p.product?.business_model || ''}
Sectors: ${(p.category || []).join(', ')}

Task: find (1) similar ideas, products and companies anywhere in the world (3-6), and (2) what already exists in KOREA for the same job: Korean companies and products, plus any Korean regulation, licensing or market structure that shapes this business. Run at least two Korean-language searches (for example "국내 {기능} 서비스", "{분야} 한국 스타트업", "{분야} 규제").

Reply with ONLY this JSON object:
{
  "queries_run": ["every search query you ran"],
  "similar": [{"name": "", "country_ko": "", "kind": "company | product | idea", "relation": "direct | adjacent | analog", "fact": "what it is and how it compares, from the sources", "url": "https://…"}],
  "korean_players": [{"name": "", "relation": "direct | adjacent", "what": "what they offer", "url": "https://…"}],
  "regulation": {"note": "", "source_url": "https://…"},
  "market_facts": ["Korean market facts with the source in parentheses"],
  "gaps": "in Korean, at most 3 short sentences: the most important things you could NOT confirm"
}
Do not list ${p.name_en} itself as a Korean player. For korean_players, "direct" means it does the same job for the same customer as ${p.name_en}; anything looser is "adjacent".
Use an empty list or empty string when you have nothing. relation: direct = same job for the same customer; adjacent = neighboring job or customer; analog = same idea in a different industry.`
}

const WRITE_RULES = `You write the "한국에서는" section of a Korean startup publication, in Korean (proper nouns stay in English).
You are given verified research facts. Use ONLY the companies, products and facts listed there; never add a name, number or regulation that is not in the facts.
Tone: specific and measured. This is a hypothesis for readers to check, not advice.
Forbidden wording: any claim that something does not exist in Korea or that a company is the only one ("전무", "유일", "없다", "아무도"). Say "확인된 곳은 …" or "이번 조사에서는 확인되지 않았다" instead.`

function writePrompt(p, facts, feedback = '') {
  const direct = list(facts.korean_players).filter((x) => x?.relation === 'direct').length
  return `Company: ${p.name_ko || p.name_en} (${p.name_en}) — ${p.tagline}
Product: ${p.product?.summary || ''}

Research facts (JSON):
${JSON.stringify(facts)}

Direct Korean players found in the facts: ${direct}. Your headline and verdict must be consistent with that number.
${feedback ? `\nYour previous attempt was rejected: ${feedback}. Fix that and keep everything else.\n` : ''}
Reply with ONLY this JSON object:
{
  "verdict": "open | emerging | crowded | constrained | unclear",
  "headline": "one sentence, at most 60 characters",
  "similar": [{"name": "must match a name in the facts", "summary": "2 sentences: what is the same and what differs from ${p.name_en}"}],
  "search_gaps": "Korean, at most 2 sentences: what could not be confirmed and so should be checked first",
  "market_note": "2-3 sentences on how the Korean market differs (demand, buying structure, language, competition), grounded in the facts",
  "regulation_note": "only if the facts contain a regulation, else empty",
  "thesis": "3-4 sentences: why this could or could not work in Korea",
  "who": "who is best placed to build or bring it to Korea",
  "wedge": "the first narrow entry point",
  "barriers": ["2-3 concrete barriers"],
  "checks": ["3 things to verify within a month"]
}
verdict: open = no verified Korean player in the facts; emerging = one or two early players; crowded = several established players; constrained = regulation or market structure is the real barrier; unclear = the facts are too thin. When unsure, choose unclear.`
}

/* ---------- Guards ---------- */

// Absolute claims about Korea the model cannot know from search results.
const ABSOLUTE = [
  /(국내|한국)(에는|에서는|에|엔)?[^.。\n]{0,24}(없다|없습니다|없음|없는 상태|전무)/,
  /전무/,
  /유일(한|하게|무이)/,
  /아무도\s/,
  /(경쟁자|경쟁사|플레이어)[가는]?\s*(전혀\s*)?없/,
  /존재하지\s*않/,
]

export function absoluteClaims(entry) {
  const text = [
    entry.headline,
    entry.korea?.market_note,
    entry.opportunity?.thesis,
    entry.opportunity?.who,
    entry.opportunity?.wedge,
    ...(entry.similar || []).map((s) => s.summary),
  ]
    .filter(Boolean)
    .join('\n')
  return ABSOLUTE.filter((re) => re.test(text)).map((re) => re.source.slice(0, 30))
}

const hangul = (t = '') => (t.match(/[가-힣]/g) || []).length / Math.max(1, t.replace(/\s/g, '').length)

/**
 * Evidence bounds the verdict: players found decide emerging/crowded, and "open"
 * needs real search effort. The model's own pick only matters inside those bounds.
 */
export function boundVerdict(modelVerdict, { players, queries, gaps }) {
  let v = VERDICTS.includes(modelVerdict) ? modelVerdict : 'unclear'
  if (players >= 3 && v !== 'constrained') v = 'crowded' // `players` = direct Korean players only
  else if (players >= 1 && v !== 'constrained' && v !== 'crowded') v = 'emerging'
  else if (players >= 1 && v === 'crowded') v = 'emerging'
  if (players === 0 && v === 'crowded') v = 'unclear'
  if (v === 'open' && (queries < 2 || !gaps)) v = 'unclear'
  return v
}

const list = (v) => (Array.isArray(v) ? v : [])
const str = (v) => (typeof v === 'string' ? v.trim() : '')

/**
 * Turn A's facts + B's writing into the stored entry. Only names present in A
 * survive, and every link must open (or have appeared in a real search result).
 */
export async function assemble(facts, written, { searched, checkedAt, model, fetchImpl, subjectNames = [], log = () => {} }) {
  const known = new Map()
  for (const s of list(facts.similar)) if (s?.name && s.url) known.set(norm(s.name), s)
  const checks = new Map()
  const verify = async (url, hostLevel = true) => {
    if (!checks.has(`${url}|${hostLevel}`)) checks.set(`${url}|${hostLevel}`, await checkUrl(url, { searched, hostLevel, fetchImpl }))
    return checks.get(`${url}|${hostLevel}`)
  }

  const similar = []
  for (const w of list(written.similar)) {
    const src = known.get(norm(w?.name))
    if (!src) {
      log(`    drop similar "${w?.name}": not in research facts`)
      continue
    }
    const c = await verify(src.url)
    if (!c.verified) {
      log(`    drop similar "${src.name}": link ${c.http_status}`)
      continue
    }
    similar.push({
      name: src.name,
      country_ko: str(src.country_ko),
      kind: ['company', 'product', 'idea'].includes(src.kind) ? src.kind : 'company',
      relation: ['direct', 'adjacent', 'analog'].includes(src.relation) ? src.relation : 'analog',
      summary: str(w.summary) || str(src.fact),
      url: src.url,
      verified: true,
    })
  }

  const subject = new Set([norm(subjectNames[0]), norm(subjectNames[1])].filter(Boolean))
  const players = []
  for (const p of list(facts.korean_players)) {
    if (!p?.name || !p.url) continue
    if ([...subject].some((n) => norm(p.name).includes(n))) continue // the subject company itself
    const c = await verify(p.url)
    if (!c.verified) {
      log(`    drop Korean player "${p.name}": link ${c.http_status}`)
      continue
    }
    players.push({
      name: p.name,
      relation: p.relation === 'direct' ? 'direct' : 'adjacent',
      what: str(p.what),
      url: p.url,
      verified: true,
    })
  }
  const shownPlayers = [
    ...players.filter((p) => p.relation === 'direct').slice(0, 5),
    ...players.filter((p) => p.relation !== 'direct').slice(0, 2),
  ]

  let regulation = null
  const reg = facts.regulation
  if (str(written.regulation_note) && str(reg?.note)) {
    const c = reg.source_url ? await verify(reg.source_url, false) : { verified: false }
    regulation = { note: str(written.regulation_note), source_url: c.verified ? reg.source_url : null, estimate: !c.verified }
  }

  const queries = list(facts.queries_run).length
  const rawGaps = str(written.search_gaps) || str(facts.gaps)
  // concise and Korean, or a neutral line instead of printing a wall of English
  const gaps = rawGaps.length <= 400 && hangul(rawGaps) > 0.3 ? rawGaps : ''
  const direct = players.filter((p) => p.relation === 'direct').length
  const verdict = boundVerdict(written.verdict, { players: direct, queries, gaps: gaps || rawGaps })

  return {
    generated_at: checkedAt,
    model,
    verdict,
    headline: str(written.headline),
    similar,
    korea: {
      players: shownPlayers,
      direct_players: direct,
      market_note: str(written.market_note),
      regulation,
      search_gaps: gaps || '이번 조사에서 확인하지 못한 항목이 있을 수 있어요. 아래 체크리스트로 직접 확인해 주세요.',
      queries,
    },
    opportunity: {
      thesis: str(written.thesis),
      who: str(written.who),
      wedge: str(written.wedge),
      barriers: list(written.barriers).map(str).filter(Boolean).slice(0, 4),
      checks: list(written.checks).map(str).filter(Boolean).slice(0, 4),
    },
  }
}

export function validate(entry) {
  const problems = []
  if (!entry.headline || entry.headline.length > 90) problems.push('headline missing or too long')
  if (entry.similar.length < 2) problems.push(`only ${entry.similar.length} verified similar entries`)
  if (!entry.opportunity.thesis || !entry.opportunity.wedge) problems.push('thesis/wedge missing')
  if (!entry.opportunity.checks.length) problems.push('no checks')
  if (hangul(entry.opportunity.thesis) < 0.3) problems.push('thesis is not Korean')
  const abs = absoluteClaims(entry)
  if (abs.length) problems.push(`absolute claim (${abs.join(', ')})`)
  return problems
}

/* ---------- Orchestration ---------- */

/** Returns an entry, or null when the section should be left out. */
export async function buildKoreaLens(llm, profile, { searched = new Set(), checkedAt, fetchImpl, searchResults = 6, log = () => {} } = {}) {
  const name = profile.name_en
  let facts
  try {
    const r = await llm.chat({ system: FACT_RULES, user: researchPrompt(profile), web: true, maxResults: searchResults })
    r.citations.forEach((c) => searched.add(stripUrl(c.url)))
    facts = await parseOrRepair(llm, r.text)
  } catch (err) {
    log(`  korea-lens ${name}: research failed (${err.message})`)
    return null
  }

  let feedback = ''
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const w = await llm.chat({ system: WRITE_RULES, user: writePrompt(profile, facts, feedback), json: true, maxTokens: 8000 })
      const written = await parseOrRepair(llm, w.text)
      const entry = await assemble(facts, written, { searched, checkedAt, model: w.model, fetchImpl, subjectNames: [profile.name_en, profile.name_ko], log })
      const problems = validate(entry)
      if (!problems.length) {
        log(`  korea-lens ${name}: ${entry.verdict}, ${entry.similar.length} similar, ${entry.korea.players.length} KR players`)
        return entry
      }
      feedback = problems.join('; ')
      log(`  korea-lens ${name}: rejected (${feedback})${attempt === 0 ? ', retrying' : ''}`)
    } catch (err) {
      log(`  korea-lens ${name}: write failed (${err.message})`)
      feedback = 'invalid JSON'
    }
  }
  return null
}

/* ---------- Files ---------- */

/** Small index the list/search UI loads eagerly: { id: { v: verdict, n: [names] } }. */
export function buildIndex(lens) {
  return Object.fromEntries(
    Object.entries(lens).map(([id, e]) => [
      id,
      { v: e.verdict, n: [...new Set([...e.similar.map((s) => s.name), ...e.korea.players.map((p) => p.name)])] },
    ]),
  )
}

/**
 * Build entries for `profiles` (3 at a time), merge into the stored lens file, drop entries
 * for companies no longer in startups.json, and rewrite both files. Never throws for a single
 * company: a missing entry just means that company has no section.
 */
export async function updateLensFiles(llm, profiles, { lensPath, indexPath, allIds, fetchImpl, log = console.log }) {
  const fs = await import('node:fs')
  const stored = fs.existsSync(lensPath) ? JSON.parse(fs.readFileSync(lensPath, 'utf-8')) : {}
  const checkedAt = new Date().toISOString()
  const fresh = {}
  let i = 0
  await Promise.all(
    Array.from({ length: Math.min(3, profiles.length) }, async () => {
      while (i < profiles.length) {
        const p = profiles[i++]
        const entry = await buildKoreaLens(llm, p, { checkedAt, fetchImpl, log })
        if (entry) fresh[p.id] = entry
      }
    }),
  )
  const keep = new Set(allIds)
  const merged = Object.fromEntries(Object.entries({ ...stored, ...fresh }).filter(([id]) => keep.has(id)))
  fs.writeFileSync(lensPath, JSON.stringify(merged, null, 2) + '\n', 'utf-8')
  fs.writeFileSync(indexPath, JSON.stringify(buildIndex(merged)) + '\n', 'utf-8')
  log(`korea-lens: ${Object.keys(fresh).length}/${profiles.length} built, ${Object.keys(merged).length} stored`)
  return { fresh, merged }
}

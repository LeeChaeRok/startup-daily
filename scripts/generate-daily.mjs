#!/usr/bin/env node
/**
 * Daily startup issue generator (runs from GitHub Actions every morning KST).
 * LLM calls go through OpenRouter: DeepSeek V4 Flash first, Claude Haiku as fallback.
 *
 * Every day builds a sector pool (_workspace/14): up to 3 companies in each of the nine sectors
 * (src/lib/sectors.js), about 27 in all. The shared five ("모두의 5곳", the issue everyone sees,
 * shares and counts as 제N호) are picked from that pool and marked `featured`.
 *
 *   node scripts/generate-daily.mjs                 generate today's pool into src/data/days/<date>.json
 *   node scripts/generate-daily.mjs --out tmp.json  dry run: write only the day's records elsewhere
 *   node scripts/generate-daily.mjs --candidates c.json --out tmp.json
 *                                                   skip the LLM: run selection, link checks and the
 *                                                   featured pick on a JSON array of finished profiles
 *   --logos                                         also save logos into public/logos on a dry run
 *
 * Env: OPENROUTER_API_KEY (required unless --candidates)
 *      OPENROUTER_MODELS   comma-separated, first = primary (default: DeepSeek V4 Flash, then Haiku 5.5)
 *      ISSUE_DATE          YYYY-MM-DD (default: today in KST)
 *      POOL_SECTORS        comma-separated sector keys to generate (default: all nine)
 *      MAX_COST_USD        stop researching once the run has spent this much (default 3)
 *      YC_PICKS            Y Combinator leads mixed in a day (default 5, 0 turns them off)
 *      RESEARCH_PARALLEL   research calls at once (default 6; lower it if OpenRouter rate-limits)
 *      FOLLOWUPS           0 turns off the follow-up step (default on)
 *      TRANSLATE           0 turns off the English translation step (default on)
 *
 * Pipeline: per-sector discovery (web search) → selection rules → deep research per company
 * (web search, one call each, sectors interleaved so a budget stop hits them evenly) →
 * selection rules again → link verification → up to 3 per sector → featured five → day file →
 * English translation (scripts/lib/translate.mjs) → follow-ups on older featured companies
 * (scripts/lib/followups.mjs, max 2 a day) → pool-stats.json for the quality gates (§1-6).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { capPerSector, dropDuplicates, featureScore, merge, normalize, orderDay, pickFeatured, poolSector, selectCandidates, stripUrl, verifyLinks } from './lib/pipeline.mjs'
import { attachLogos } from './lib/logos.mjs'
import { createClient, modelsFromEnv, OpenRouterError, parseOrRepair } from './lib/openrouter.mjs'
import { updateLensFiles } from './lib/korea-lens.mjs'
import { readStore, runFollowups } from './lib/followups.mjs'
import { translateRecords, translateUpdates } from './lib/translate.mjs'
import { readAll, readEn, writeAll, writeEn } from './lib/store.mjs'
import { fetchYcCompanies, pickYc } from './lib/yc.mjs'
import { SECTORS, SECTOR_KEYS, sectorFor } from '../src/lib/sectors.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const META_PATH = path.join(here, '../src/data/meta.json')
const STATS_PATH = path.join(here, '../src/data/pool-stats.json')
const LENS_PATH = path.join(here, '../src/data/korea-lens.json')
const LENS_INDEX_PATH = path.join(here, '../src/data/korea-lens-index.json')
const LOGO_DIR = path.join(here, '../public/logos')
const UPDATES_PATH = path.join(here, '../src/data/updates.json')
const CORRECTIONS_PATH = path.join(here, '../src/data/corrections.json')

const FEATURED = 5
const PER_SECTOR = 3 // pool companies kept per sector
const DISCOVER = 6 // candidates asked per sector: selection rules and failed research drop some
const RESEARCH = 4 // researched per sector
const DISCOVER_PARALLEL = 3
const RESEARCH_PARALLEL = Number(process.env.RESEARCH_PARALLEL || 6)
const MAX_COST = Number(process.env.MAX_COST_USD || 3)
const YC_PICKS = Number(process.env.YC_PICKS ?? 5) // Y Combinator leads a day (scripts/lib/yc.mjs)

const args = process.argv.slice(2)
const flag = (name) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : null
}
const dryOut = flag('--out') ? path.resolve(flag('--out')) : null
const candidatesPath = flag('--candidates')
const live = !dryOut
const poolSectors = process.env.POOL_SECTORS ? process.env.POOL_SECTORS.split(',').map((k) => k.trim()).filter((k) => SECTOR_KEYS.includes(k)) : SECTOR_KEYS

// Today in Korea — the workflow runs at 20:07 UTC, which is already tomorrow in KST.
const kstToday = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10)
const date = process.env.ISSUE_DATE || kstToday

/* ---------- Prompts ---------- */

const RULES = `You research rising startups for "Startup Daily", a Korean publication whose readers want companies they have NOT heard of yet, explained in depth.

Selection rules (hard):
- Private and independent today: not listed, not acquired, not shut down, not in bankruptcy. Confirm with a search.
- Seed through Series C; strongly prefer Series B or earlier.
- Not famous: skip household names and companies that already dominate tech press (OpenAI, Cursor, Perplexity, Hugging Face, Stripe level).
- A real "why now" from the last 90 days before ${date}: a funding round, launch, notable customer or hiring signal, with a dated source.

Sources: every URL you output must be a page you actually saw in your search results. Never construct or guess a URL. If you have nothing real, leave the field empty.`

const SECTOR_LIST = SECTORS.map((x) => `${x.key} (${x.en}: ${x.hint})`).join('; ')

function discoveryPrompt(sector, avoid) {
  return `Find ${DISCOVER} candidate startups for the ${date} issue, all in one sector: ${sector.en} — ${sector.hint}.
Search broadly: recent funding announcements, launches, accelerator demo days, regional tech press (Korea, Japan, Europe, LatAm, India, Africa, North America). Spread them over at least 3 countries. Korea-based companies are welcome.
Do not include any of these already-covered companies: ${avoid.join(', ') || '—'}

"attention" rates the momentum of the news itself from 1 to 5 (5 = a large round or a launch the trade press is talking about this week), not how famous the company is.

Reply with ONLY a JSON object:
{"candidates": [{"name_en": "", "name_ko": "", "website": "https://…", "country_ko": "국가명", "company_stage": "Seed | Series A | Series B | Series C", "status": "active", "why_now": "one sentence with the date", "evidence_url": "https://…", "attention": 3}]}`
}

const PROFILE_SHAPE = `{
  "sector": "one key from the sector list",
  "name_en": "", "name_ko": "한국어 표기", "tagline": "한 줄 소개(40자 이내)",
  "category": ["분야1", "분야2"], "founded_year": 2023,
  "headquarters": {"city": "City", "country": "Country", "country_ko": "국가명"},
  "company_stage": "Seed | Series A | Series B | Series C", "status": "active | acquired | public | closed",
  "employee_count": "11-50", "website": "https://…",
  "founders": [{"name_en": "", "name_ko": "", "role": "", "background": "", "notable_achievement": ""}],
  "team_highlights": "",
  "product": {"summary": "", "problem_statement": "", "solution": "", "key_features": [""],
              "tech_stack_or_innovation": "", "target_customer": "", "business_model": ""},
  "competitive_landscape": {"direct_competitors": [{"name": "", "comparison": ""}],
              "key_differentiator": "", "moat": "", "competitive_position_summary": ""},
  "trending_reason": {"summary": "", "catalysts": [""], "growth_metrics": "",
              "media_mentions": [{"source": "", "title": "", "url": "https://…", "date": "YYYY-MM-DD"}]},
  "funding": {"total_raised": "$12M", "total_raised_note": "", "total_raised_usd": 12000000,
              "valuation_estimate": "$80M (추정)",
              "latest_round": {"stage": "", "amount": "$8M", "note": "", "date": "YYYY-MM", "lead_investor": "", "notable_investors": [""]},
              "funding_history": [{"stage": "", "amount": "", "note": "", "date": "YYYY-MM", "lead_investor": ""}]},
  "market_outlook": {"tam_sam_som": "", "market_trend": "", "growth_potential": "", "risks": [""], "risk_mitigation": ""},
  "related_links": [{"title": "", "url": "https://…"}],
  "editor_pick_comment": "한 줄 코멘트"
}`

function researchPrompt(c) {
  return `Research this company in depth for the ${date} issue: ${c.name_en}${c.website ? ` (${c.website})` : ''}${c.country_ko ? `, ${c.country_ko}` : ''}.
Lead: ${c.why_now || '—'}

Search for: the official site, founders and their backgrounds, the latest funding round and investors, what the product does and for whom, direct competitors, and press coverage from the last 90 days. Re-check that the company is still private and independent; set "status" accordingly.

Writing: all prose in Korean (proper nouns stay in English), concrete and specific, no hype. Numbers you could not confirm are marked "(추정)" in the note. media_mentions only lists articles you actually opened in search results.
- tagline: natural Korean a reader would say aloud — who it serves and what it does, at most one "·". Not a stack of nouns. Bad: "희귀 혈액암 표적 항체 치료제 개발 임상 단계 바이오텍". Good: "치료제가 없는 희귀 혈액암에 첫 항체 신약을 내는 바이오텍".
- editor_pick_comment: one sharp sentence that adds a judgment the other fields do not state (what to watch, who should care, the bet being made). Never restate the tagline or the funding amount.
- tagline ends in a noun (…플랫폼, …바이오텍, …를 만드는 회사), never "~하다", and never the words "재정의", "혁신".
- Prose fields are full sentences ending in "~한다/~했다", not clipped notes ("…발표. …높아짐.").
- Money in prose uses the same form as the funding fields: "$350M", "약 173억원" — not "3억5천만 달러".
- lead_investor: names only, several joined with ", " (never "and").

Funding amounts (strict):
- "total_raised" and every round "amount" hold the figure ONLY, in the currency the source reported: "$12.6M", "약 131억 엔", "약 173억원", "₹65 crore". Unknown → "비공개". Never a bare unit like "M+", never parentheses or sentences.
- Explanations go in "total_raised_note" / the round's "note": what is included (grants, loans), which source, disagreements between sources, a USD conversion. Empty string when there is nothing to add.
- "total_raised_usd" is a plain number in US dollars (12600000), or null when unknown. Convert from the original currency yourself; do not copy a conversion you cannot check.

"sector" is exactly one of these keys, the company's main market: ${SECTOR_LIST}.

Reply with ONLY a JSON object in this shape:
${PROFILE_SHAPE}`
}

/* ---------- LLM steps ---------- */

async function discover(llm, sector, avoid, searched) {
  let lastError
  // a cut-off or broken answer is tried once more on the next model (as in research)
  for (const useModels of [undefined, llm.models.slice(1)]) {
    if (useModels && !useModels.length) break
    try {
      // the model plans its own queries (several regions/languages) instead of one fixed search
      const r = await llm.chat({ system: RULES, user: discoveryPrompt(sector, avoid), web: 'tool', maxResults: 8, maxSearches: 8, maxTokens: 32000, useModels })
      r.citations.forEach((c) => searched.add(stripUrl(c.url)))
      const parsed = await parseOrRepair(llm, r.text)
      const list = Array.isArray(parsed) ? parsed : parsed.candidates
      if (!Array.isArray(list)) throw new Error('Discovery returned no candidate list')
      console.log(`Discovery ${sector.key} (${r.model}): ${list.length} candidates, ${r.citations.length} citations`)
      return list.map((c) => ({ ...c, _sector: sector.key }))
    } catch (err) {
      lastError = err
      console.log(`  discovery ${sector.key} ${useModels ? 'retry' : 'attempt'} failed: ${err.message}`)
    }
  }
  throw lastError
}

async function research(llm, candidate, searched) {
  // Korean companies are covered mostly by Korean-language sources, which the one-shot plugin misses
  const korean = /한국|대한민국/.test(candidate.country_ko || '')
  const call = (useModels) =>
    llm.chat({
      system: RULES,
      user: researchPrompt(candidate),
      web: korean ? 'tool' : true,
      maxResults: 8,
      maxSearches: 6,
      // reasoning models think before writing the long profile JSON; 16k was too tight (3/8 cut off)
      maxTokens: 32000,
      useModels,
    })
  for (const useModels of [undefined, llm.models.slice(1)]) {
    if (useModels && !useModels.length) break
    try {
      const r = await call(useModels)
      r.citations.forEach((c) => searched.add(stripUrl(c.url)))
      const profile = await parseOrRepair(llm, r.text)
      console.log(`  researched ${candidate.name_en} (${r.model}, ${r.citations.length} citations)`)
      return { ...profile, _model: r.model, _sector: candidate._sector, attention: candidate.attention }
    } catch (err) {
      // OpenRouter's own fallback only covers API errors; a cut-off or broken answer is retried
      // here on the next model in the list
      console.log(`  research ${useModels ? 'retry' : 'attempt'} failed for ${candidate.name_en}: ${err.message}`)
    }
  }
  return null
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

const isComplete = (p) => p?.name_en && p.tagline && p.product?.summary && p.trending_reason?.summary


/** Round-robin over sectors, so a budget stop leaves every sector with something. */
function interleave(groups) {
  const out = []
  for (let i = 0; groups.some((g) => i < g.length); i++) for (const g of groups) if (i < g.length) out.push(g[i])
  return out
}

const linkCount = (p) => (p.trending_reason?.media_mentions || []).length + (p.related_links || []).length
const bump = (obj, key) => (obj[key] = (obj[key] || 0) + 1)

/* ---------- Main ---------- */

async function main() {
  const existing = readAll()

  if (live && existing.some((s) => s.date === date)) {
    console.log(`Issue ${date} already exists. Skipping.`)
    return
  }

  // pool-stats.json: one entry per day, per sector (the quality gates in _workspace/14 §1-6)
  const stats = Object.fromEntries(
    poolSectors.map((k) => [k, { leads: 0, rejected: {}, researched: 0, research_failed: 0, links_dropped: 0, links_kept: 0, adopted: 0 }]),
  )
  const statOf = (k) => stats[k] || (stats[k] = { leads: 0, rejected: {}, researched: 0, research_failed: 0, links_dropped: 0, links_kept: 0, adopted: 0 })
  const searched = new Set()
  let profiles
  let llm = null
  let budgetStops = 0

  if (candidatesPath) {
    profiles = JSON.parse(fs.readFileSync(candidatesPath, 'utf-8')).map((p) => ({ ...p, _sector: poolSector(p) }))
    console.log(`Using ${profiles.length} profiles from ${candidatesPath} (no LLM call)`)
  } else {
    const models = modelsFromEnv()
    llm = createClient({ apiKey: process.env.OPENROUTER_API_KEY, models, log: console.log })
    console.log(`Pool ${date} via OpenRouter → ${models.join(' → ')} (sectors: ${poolSectors.join(', ')}, budget $${MAX_COST})`)

    // the avoid list is per sector: the full list would outgrow the prompt within weeks,
    // and duplicates from other sectors are caught by the selection rules anyway
    const sectors = poolSectors.map((k) => SECTORS.find((x) => x.key === k))
    const leadsBySector = await mapLimit(sectors, DISCOVER_PARALLEL, async (sector) => {
      const avoid = [...new Set(existing.filter((s) => sectorFor(s).key === sector.key).map((s) => s.name_en))]
      try {
        return await discover(llm, sector, avoid, searched)
      } catch (err) {
        console.log(`Discovery ${sector.key} failed: ${err.message}`)
        return []
      }
    })

    // up to five YC companies (scripts/lib/yc.mjs), each in another sector, go first in their
    // sector's leads, so the research cap can't push them out; the same selection rules apply.
    // They take a research slot the web discovery would have used, so the cost stays the same.
    if (YC_PICKS > 0) {
      try {
        const yc = pickYc(await fetchYcCompanies({ log: console.log }), {
          date,
          want: YC_PICKS,
          sectors: poolSectors,
          existingNames: existing.flatMap((s) => [s.name_en, s.name_ko]),
        })
        for (const lead of yc) {
          leadsBySector[sectors.findIndex((x) => x.key === lead._sector)].unshift(lead)
          console.log(`YC lead: ${lead.name_en} (${lead._sector})`)
        }
      } catch (err) {
        console.log(`YC leads skipped: ${err.message}`)
      }
    }

    // selection rules per sector, against everything published and everything picked so far today
    const picked = []
    const shortlists = leadsBySector.map((leads, i) => {
      const key = sectors[i].key
      statOf(key).leads = leads.length
      const { accepted, rejected } = selectCandidates(leads, [...existing, ...picked], RESEARCH, { maxPerCountry: 2 })
      for (const r of rejected) {
        console.log(`  reject lead ${r.name} (${key}): ${r.reason}`)
        bump(statOf(key).rejected, r.reason.split(' ')[0])
      }
      picked.push(...accepted)
      return accepted
    })
    const queue = interleave(shortlists)
    if (queue.length < 3) throw new Error(`Only ${queue.length} leads passed the selection rules`)

    console.log(`Researching ${queue.length} companies (${RESEARCH_PARALLEL} at a time)…`)
    profiles = (
      await mapLimit(queue, RESEARCH_PARALLEL, async (c) => {
        if (llm.cost() >= MAX_COST) {
          budgetStops++
          return null
        }
        const p = await research(llm, c, searched)
        statOf(c._sector).researched++
        if (!isComplete(p)) statOf(c._sector).research_failed++
        return p
      })
    ).filter(isComplete)
    if (budgetStops) console.log(`Budget $${MAX_COST} reached: ${budgetStops} companies not researched`)
  }

  // Deep research can surface an acquisition or listing the lead missed — apply the rules again.
  // Country spread is a rule for the five, not for the pool.
  const existingForDedup = existing.filter((s) => s.date !== date)
  const { accepted, rejected } = selectCandidates(profiles, existingForDedup, Infinity, { maxPerCountry: Infinity })
  for (const r of rejected) console.log(`  reject ${r.name}: ${r.reason}`)

  const generatedAt = new Date().toISOString()
  const normalized = accepted.map(({ _model, _sector, ...c }) => {
    const n = normalize(c, { date, model: _model || 'manual', generatedAt, log: console.log })
    return { ...n, sector: poolSector(c, _sector) }
  })
  // ids and names are final only now; catch a company already published under another id
  const { kept: unique } = dropDuplicates(normalized, existingForDedup, { log: console.log })
  const before = new Map(unique.map((p) => [p.id, linkCount(p)]))
  const { profiles: verified, kept, dropped } = await verifyLinks(unique, { searched, checkedAt: generatedAt, log: console.log })
  console.log(`Links: kept ${kept}, dropped ${dropped} unverifiable`)
  for (const p of verified) {
    statOf(p.sector).links_kept += linkCount(p)
    statOf(p.sector).links_dropped += before.get(p.id) - linkCount(p)
  }

  // strongest first within each sector, then at most PER_SECTOR each
  const ranked = verified
    .map((p, i) => ({ p, i, score: featureScore(p, date) }))
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .map(({ p }) => p)
  const { kept: pool, over } = capPerSector(ranked, PER_SECTOR)
  for (const p of over) console.log(`  over the sector cap: ${p.name_en} (${p.sector})`)
  for (const p of pool) statOf(p.sector).adopted++

  const featuredIds = pickFeatured(pool, { date, want: FEATURED })
  if (featuredIds.length < 3) throw new Error(`Only ${featuredIds.length} companies for the shared five`)
  const day = orderDay(pool, featuredIds)

  // Logos are saved into public/logos; a dry run skips them unless --logos.
  if (live || args.includes('--logos')) {
    try {
      const { ok, failed } = await attachLogos(day, { dir: LOGO_DIR, log: console.log })
      console.log(`Logos: ${ok} saved, ${failed} missing`)
    } catch (err) {
      console.log(`logos skipped: ${err.message}`)
    }
  }

  if (!live) {
    fs.writeFileSync(dryOut, JSON.stringify(day, null, 2) + '\n', 'utf-8')
    console.log(`Dry run: ${day.length} records → ${path.relative(process.cwd(), dryOut)}`)
    console.log(JSON.stringify({ featured: featuredIds, stats }, null, 2))
    if (llm) console.log(`OpenRouter cost: $${llm.cost().toFixed(4)}`)
    return
  }

  const merged = merge(existing, day, 0, { log: console.log })
  writeAll(merged)
  const issueDates = [...new Set(merged.map((s) => s.date))]
  const meta = {
    last_issue_date: issueDates[0],
    issue_count: issueDates.length,
    generated_at: generatedAt,
    models: [...new Set(day.map((p) => p.model))],
    pool_size: day.length,
  }
  fs.writeFileSync(META_PATH, JSON.stringify(meta, null, 2) + '\n', 'utf-8')

  // English edition of today's companies. A failure only leaves them Korean in the English app;
  // `npm run translate:en` picks them up later.
  const translate = llm && process.env.TRANSLATE !== '0'
  if (translate) {
    try {
      const { done, failed } = await translateRecords(llm, day, { store: readEn(), save: (s) => writeEn(s, merged), concurrency: 6, fs, log: console.log })
      console.log(`English: ${done.length} translated, ${failed.length} failed`)
    } catch (err) {
      console.log(`translation skipped: ${err.message}`)
    }
  }

  // "그때 그 회사": revisit companies 90+ days after their issue, featured ones only. Never blocks
  // the issue itself; bounded to 2 companies, 16k tokens each and 4 minutes in total.
  if (llm && process.env.FOLLOWUPS !== '0') {
    try {
      await runFollowups(llm, merged.filter((s) => s.featured !== false), { updatesPath: UPDATES_PATH, correctionsPath: CORRECTIONS_PATH, today: kstToday, log: console.log })
    } catch (err) {
      console.log(`follow-ups skipped: ${err.message}`)
    }
  }

  // follow-up events normally come with English; fill any that did not
  if (translate && fs.existsSync(UPDATES_PATH)) {
    try {
      const store = readStore(fs, UPDATES_PATH)
      const { count } = await translateUpdates(llm, store, { log: console.log })
      if (count) fs.writeFileSync(UPDATES_PATH, JSON.stringify(store, null, 2) + '\n', 'utf-8')
    } catch (err) {
      console.log(`update translation skipped: ${err.message}`)
    }
  }

  // Optional enrichment ("한국에서는"): a failure here must never block the issue itself.
  // Off by default: the analysis is built on demand from the app (api/korea-lens.mjs) to save cost.
  if (llm && process.env.KOREA_LENS_DAILY === '1') {
    try {
      const five = day.filter((s) => s.featured)
      await updateLensFiles(llm, five, { lensPath: LENS_PATH, indexPath: LENS_INDEX_PATH, allIds: merged.map((s) => s.id), log: console.log })
    } catch (err) {
      console.log(`korea-lens skipped: ${err.message}`)
    }
  }

  const statsFile = fs.existsSync(STATS_PATH) ? JSON.parse(fs.readFileSync(STATS_PATH, 'utf-8')) : { days: [] }
  statsFile.days = [
    { date, cost_usd: llm ? Number(llm.cost().toFixed(4)) : 0, budget_stops: budgetStops, pool: day.length, featured: featuredIds, sectors: stats },
    ...statsFile.days.filter((d) => d.date !== date),
  ].slice(0, 120)
  fs.writeFileSync(STATS_PATH, JSON.stringify(statsFile, null, 2) + '\n', 'utf-8')

  console.log(`Wrote ${day.length} pool records for ${date} (featured: ${featuredIds.join(', ')})`)
  console.log(day.map((p) => `  ${p.featured ? '★' : ' '} ${p.sector.padEnd(10)} ${p.name_en} (${p.company_stage}, ${p.headquarters?.country_ko})`).join('\n'))
  if (llm) console.log(`OpenRouter cost: $${llm.cost().toFixed(4)}`)
}

main().catch((err) => {
  if (err instanceof OpenRouterError) console.error(err.message)
  else console.error('Error:', err.message)
  process.exit(1)
})

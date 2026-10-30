#!/usr/bin/env node
/**
 * Daily startup issue generator (runs from GitHub Actions every morning KST).
 * LLM calls go through OpenRouter: DeepSeek V4 Flash first, Claude Haiku as fallback.
 *
 *   node scripts/generate-daily.mjs                 generate today's issue into src/data/startups.json
 *   node scripts/generate-daily.mjs --out tmp.json  write the merged result elsewhere (dry run)
 *   node scripts/generate-daily.mjs --candidates c.json --out tmp.json
 *                                                   skip the LLM: run selection, link checks and merge on a
 *                                                   JSON array of finished profiles (offline testing)
 *   --logos                                         also save logos into public/logos on a dry run
 *
 * Env: OPENROUTER_API_KEY (required unless --candidates)
 *      OPENROUTER_MODELS   comma-separated, first = primary (default: DeepSeek V4 Flash, then Haiku 5.5)
 *      ISSUE_DATE          YYYY-MM-DD (default: today in KST)
 *      FOLLOWUPS           0 turns off the follow-up step (default on)
 *      TRANSLATE           0 turns off the English translation step (default on)
 *      RETAIN_ISSUES       issues kept in startups.json (default 0 = all; follow-ups revisit old issues)
 *
 * Pipeline: discover candidates (web search) → selection rules → deep research per company
 * (web search, one call each) → selection rules again → link verification → merge →
 * English translation of the new companies (scripts/lib/translate.mjs) →
 * follow-ups on older companies (scripts/lib/followups.mjs, max 2 a day).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { dropDuplicates, merge, normalize, selectCandidates, stripUrl, verifyLinks } from './lib/pipeline.mjs'
import { attachLogos } from './lib/logos.mjs'
import { createClient, modelsFromEnv, OpenRouterError, parseOrRepair } from './lib/openrouter.mjs'
import { updateLensFiles } from './lib/korea-lens.mjs'
import { readStore, runFollowups } from './lib/followups.mjs'
import { translateRecords, translateUpdates } from './lib/translate.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const DATA_PATH = path.join(here, '../src/data/startups.json')
const META_PATH = path.join(here, '../src/data/meta.json')
const LENS_PATH = path.join(here, '../src/data/korea-lens.json')
const LENS_INDEX_PATH = path.join(here, '../src/data/korea-lens-index.json')
const LOGO_DIR = path.join(here, '../public/logos')
const UPDATES_PATH = path.join(here, '../src/data/updates.json')
const CORRECTIONS_PATH = path.join(here, '../src/data/corrections.json')
const EN_PATH = path.join(here, '../src/data/startups.en.json')

const WANT = 5
const DISCOVER = 12 // over-ask: selection rules and failed research drop some
const RESEARCH_PARALLEL = 3

const args = process.argv.slice(2)
const flag = (name) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : null
}
const outPath = flag('--out') ? path.resolve(flag('--out')) : DATA_PATH
const candidatesPath = flag('--candidates')
const retainIssues = Number(process.env.RETAIN_ISSUES || 0) // 0 = keep every issue

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

function discoveryPrompt(avoid) {
  return `Find ${DISCOVER} candidate startups for the ${date} issue. Search broadly: recent funding announcements, launches, accelerator demo days, regional tech press (Korea, Japan, Europe, LatAm, India, Africa, North America).

Cover at least 4 sectors and 4 countries. Korea-based companies are welcome.
Do not include any of these already-covered companies: ${avoid.join(', ')}

Reply with ONLY a JSON object:
{"candidates": [{"name_en": "", "name_ko": "", "website": "https://…", "country_ko": "국가명", "company_stage": "Seed | Series A | Series B | Series C", "status": "active", "why_now": "one sentence with the date", "evidence_url": "https://…"}]}`
}

const PROFILE_SHAPE = `{
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

Writing: all prose in Korean (proper nouns stay in English), concrete and specific, no hype. Numbers you could not confirm are marked "(추정)" in the note. media_mentions only lists articles you actually opened in search results. editor_pick_comment is one sharp sentence.

Funding amounts (strict):
- "total_raised" and every round "amount" hold the figure ONLY, in the currency the source reported: "$12.6M", "약 131억 엔", "약 173억원", "₹65 crore". Unknown → "비공개". Never a bare unit like "M+", never parentheses or sentences.
- Explanations go in "total_raised_note" / the round's "note": what is included (grants, loans), which source, disagreements between sources, a USD conversion. Empty string when there is nothing to add.
- "total_raised_usd" is a plain number in US dollars (12600000), or null when unknown. Convert from the original currency yourself; do not copy a conversion you cannot check.

Reply with ONLY a JSON object in this shape:
${PROFILE_SHAPE}`
}

/* ---------- LLM steps ---------- */

async function discover(llm, avoid, searched) {
  // the model plans its own queries (several regions/languages) instead of one fixed search
  const r = await llm.chat({ system: RULES, user: discoveryPrompt(avoid), web: 'tool', maxResults: 8, maxSearches: 10, maxTokens: 32000 })
  r.citations.forEach((c) => searched.add(stripUrl(c.url)))
  const parsed = await parseOrRepair(llm, r.text)
  const list = Array.isArray(parsed) ? parsed : parsed.candidates
  if (!Array.isArray(list)) throw new Error('Discovery returned no candidate list')
  console.log(`Discovery (${r.model}): ${list.length} candidates, ${r.citations.length} citations`)
  return list
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
      return { ...profile, _model: r.model }
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

/* ---------- Main ---------- */

async function main() {
  const existing = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'))

  if (!candidatesPath && existing.some((s) => s.date === date)) {
    console.log(`Issue ${date} already exists. Skipping.`)
    return
  }

  const searched = new Set()
  let profiles
  let llm = null

  if (candidatesPath) {
    profiles = JSON.parse(fs.readFileSync(candidatesPath, 'utf-8'))
    console.log(`Using ${profiles.length} profiles from ${candidatesPath} (no LLM call)`)
  } else {
    const models = modelsFromEnv()
    llm = createClient({ apiKey: process.env.OPENROUTER_API_KEY, models, log: console.log })
    console.log(`Issue ${date} via OpenRouter → ${models.join(' → ')}`)

    const avoid = [...new Set(existing.map((s) => s.name_en))]
    const leads = await discover(llm, avoid, searched)
    const { accepted: shortlist, rejected } = selectCandidates(leads, existing, WANT + 3, { maxPerCountry: 3 })
    for (const r of rejected) console.log(`  reject lead ${r.name}: ${r.reason}`)
    if (shortlist.length < 3) throw new Error(`Only ${shortlist.length} leads passed the selection rules`)

    console.log(`Researching ${shortlist.length} companies…`)
    profiles = (await mapLimit(shortlist, RESEARCH_PARALLEL, (c) => research(llm, c, searched))).filter(isComplete)
  }

  // Deep research can surface an acquisition or listing the lead missed — apply the rules again.
  const existingForDedup = candidatesPath ? existing.filter((s) => s.date !== date) : existing
  const { accepted, rejected } = selectCandidates(profiles, existingForDedup, WANT)
  for (const r of rejected) console.log(`  reject ${r.name}: ${r.reason}`)
  if (accepted.length < 3) throw new Error(`Only ${accepted.length} profiles passed the selection rules`)

  const generatedAt = new Date().toISOString()
  const normalized = accepted.map(({ _model, ...c }) =>
    normalize(c, { date, model: _model || 'manual', generatedAt, log: console.log }),
  )
  // ids and names are final only now; catch a company already published under another id
  const { kept: unique } = dropDuplicates(normalized, existing, { log: console.log })
  if (unique.length < 3) throw new Error(`Only ${unique.length} profiles left after duplicate checks`)
  const { profiles: verified, kept, dropped } = await verifyLinks(unique, {
    searched,
    checkedAt: generatedAt,
    log: console.log,
  })
  console.log(`Links: kept ${kept}, dropped ${dropped} unverifiable`)

  // Logos are saved into public/logos; a dry run (--out elsewhere) skips them unless --logos.
  if (outPath === DATA_PATH || args.includes('--logos')) {
    try {
      const { ok, failed } = await attachLogos(verified, { dir: LOGO_DIR, log: console.log })
      console.log(`Logos: ${ok} saved, ${failed} missing`)
    } catch (err) {
      console.log(`logos skipped: ${err.message}`)
    }
  }

  const merged = merge(existing, verified, retainIssues, { log: console.log })
  fs.writeFileSync(outPath, JSON.stringify(merged, null, 2) + '\n', 'utf-8')

  if (outPath === DATA_PATH) {
    const issueDates = [...new Set(merged.map((s) => s.date))]
    const meta = {
      last_issue_date: issueDates[0],
      issue_count: issueDates.length,
      generated_at: generatedAt,
      models: [...new Set(verified.map((p) => p.model))],
    }
    fs.writeFileSync(META_PATH, JSON.stringify(meta, null, 2) + '\n', 'utf-8')
  }

  // English edition of today's companies. A failure only leaves them Korean in the English app;
  // `npm run translate:en` picks them up later.
  const translate = llm && outPath === DATA_PATH && process.env.TRANSLATE !== '0'
  if (translate) {
    try {
      const { done, failed } = await translateRecords(llm, verified, { file: EN_PATH, order: merged.map((s) => s.id), concurrency: 4, fs, log: console.log })
      console.log(`English: ${done.length} translated, ${failed.length} failed`)
    } catch (err) {
      console.log(`translation skipped: ${err.message}`)
    }
  }

  // "그때 그 회사": revisit companies 90+ days after their issue. Never blocks the issue itself;
  // bounded to 2 companies, 16k tokens each and 4 minutes in total.
  if (llm && outPath === DATA_PATH && process.env.FOLLOWUPS !== '0') {
    try {
      await runFollowups(llm, merged, { updatesPath: UPDATES_PATH, correctionsPath: CORRECTIONS_PATH, today: kstToday, log: console.log })
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
  if (llm && outPath === DATA_PATH && process.env.KOREA_LENS_DAILY === '1') {
    try {
      await updateLensFiles(llm, verified, { lensPath: LENS_PATH, indexPath: LENS_INDEX_PATH, allIds: merged.map((s) => s.id), log: console.log })
    } catch (err) {
      console.log(`korea-lens skipped: ${err.message}`)
    }
  }

  console.log(`Wrote ${verified.length} profiles for ${date} → ${path.relative(process.cwd(), outPath)}`)
  console.log(verified.map((p) => `  ${p.name_en} (${p.company_stage}, ${p.headquarters?.country_ko})`).join('\n'))
  if (llm) console.log(`OpenRouter cost: $${llm.cost().toFixed(4)}`)
}

main().catch((err) => {
  if (err instanceof OpenRouterError) console.error(err.message)
  else console.error('Error:', err.message)
  process.exit(1)
})

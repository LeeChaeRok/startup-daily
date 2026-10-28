#!/usr/bin/env node
/**
 * "그때 그 회사" follow-ups: what happened to companies 90+ days after their issue.
 * Also runs inside generate-daily.mjs after the merge step.
 *
 *   node scripts/followups.mjs                 research today's targets (max 2) into src/data/updates.json
 *   node scripts/followups.mjs --dry-run       list due companies and today's targets, no LLM call
 *   node scripts/followups.mjs --ids a,b       research these ids regardless of the day rules
 *   node scripts/followups.mjs --limit N       targets per run (default 2)
 *
 * Env: OPENROUTER_API_KEY (required unless --dry-run), OPENROUTER_MODELS (see generate-daily.mjs)
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DAILY_LIMIT, runFollowups } from './lib/followups.mjs'
import { createClient, modelsFromEnv, OpenRouterError } from './lib/openrouter.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const DATA_PATH = path.join(here, '../src/data/startups.json')
const UPDATES_PATH = path.join(here, '../src/data/updates.json')
const CORRECTIONS_PATH = path.join(here, '../src/data/corrections.json')

const args = process.argv.slice(2)
const flag = (name) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : null
}
const dryRun = args.includes('--dry-run')
const ids = flag('--ids')?.split(',').map((s) => s.trim()).filter(Boolean) || null
const limit = flag('--limit') != null ? Number(flag('--limit')) : ids?.length || DAILY_LIMIT
const today = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10) // KST

async function main() {
  if (!Number.isInteger(limit) || limit < 0) throw new Error('--limit must be a non-negative integer')
  const records = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'))
  const llm = dryRun ? null : createClient({ apiKey: process.env.OPENROUTER_API_KEY, models: modelsFromEnv(), log: console.log })
  const { due } = await runFollowups(llm, records, {
    updatesPath: UPDATES_PATH,
    correctionsPath: CORRECTIONS_PATH,
    today,
    ids,
    limit,
    dryRun,
    log: console.log,
  })
  if (dryRun) {
    const byDate = {}
    for (const r of due) byDate[r.date] = (byDate[r.date] || 0) + 1
    console.log(`Due as of ${today}: ${due.length}`)
    for (const [d, n] of Object.entries(byDate)) console.log(`  ${d}: ${n}`)
  }
  if (llm) console.log(`OpenRouter cost: $${llm.cost().toFixed(4)}`)
}

main().catch((err) => {
  if (err instanceof OpenRouterError) console.error(err.message)
  else console.error('Error:', err.message)
  process.exit(1)
})

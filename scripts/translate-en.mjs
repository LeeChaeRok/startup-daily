#!/usr/bin/env node
/**
 * English edition: translate company records into src/data/startups.en.json (see
 * scripts/lib/translate.mjs) and fill title_en / detail_en of follow-up events in updates.json.
 * Also runs inside generate-daily.mjs for the new companies.
 *
 *   node scripts/translate-en.mjs                  companies not in startups.en.json yet (= --missing)
 *   node scripts/translate-en.mjs --all            every company again
 *   node scripts/translate-en.mjs --ids a,b        these companies (translated again if present)
 *   node scripts/translate-en.mjs --dry-run        list targets and string counts, no LLM call
 *   node scripts/translate-en.mjs --concurrency 4  companies in parallel (default 4)
 *   --limit N                                      at most N companies this run
 *   --no-updates                                   skip the follow-up events
 *
 * startups.en.json is saved after every company, so an interrupted run resumes with --missing.
 * Env: OPENROUTER_API_KEY (required unless --dry-run), OPENROUTER_MODELS (see generate-daily.mjs)
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient, modelsFromEnv, OpenRouterError } from './lib/openrouter.mjs'
import { extractStrings, readTranslations, translateRecords, translateUpdates } from './lib/translate.mjs'
import { readStore } from './lib/followups.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const DATA_PATH = path.join(here, '../src/data/startups.json')
const EN_PATH = path.join(here, '../src/data/startups.en.json')
const UPDATES_PATH = path.join(here, '../src/data/updates.json')

const args = process.argv.slice(2)
const flag = (name) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : null
}
const dryRun = args.includes('--dry-run')
const all = args.includes('--all')
const ids = flag('--ids')?.split(',').map((s) => s.trim()).filter(Boolean) || null
const concurrency = Number(flag('--concurrency') || 4)
const limit = flag('--limit') != null ? Number(flag('--limit')) : Infinity

async function main() {
  if (!Number.isInteger(concurrency) || concurrency < 1) throw new Error('--concurrency must be a positive integer')
  const records = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'))
  const have = readTranslations(fs, EN_PATH)

  let targets
  if (ids) {
    const byId = new Map(records.map((r) => [r.id, r]))
    for (const id of ids) if (!byId.has(id)) console.log(`unknown id ${id}`)
    targets = ids.filter((id) => byId.has(id)).map((id) => byId.get(id))
  } else {
    targets = all ? records : records.filter((r) => !have[r.id])
  }
  targets = targets.slice(0, limit)
  const strings = targets.reduce((n, r) => n + Object.keys(extractStrings(r)).length, 0)
  console.log(`translate: ${targets.length} companies (${Object.keys(have).length}/${records.length} already in English), ${strings} strings`)
  if (dryRun) {
    for (const r of targets) console.log(`  ${r.id}: ${Object.keys(extractStrings(r)).length} strings`)
    return
  }

  const llm = createClient({ apiKey: process.env.OPENROUTER_API_KEY, models: modelsFromEnv(), log: console.log })
  const { done, failed } = await translateRecords(llm, targets, {
    file: EN_PATH,
    order: records.map((r) => r.id),
    concurrency,
    fs,
    log: console.log,
  })
  console.log(`translate: ${done.length} done, ${failed.length} failed${failed.length ? ` (${failed.map((f) => f.id).join(', ')})` : ''}`)

  if (!args.includes('--no-updates') && fs.existsSync(UPDATES_PATH)) {
    const store = readStore(fs, UPDATES_PATH)
    const { count } = await translateUpdates(llm, store, { log: console.log })
    if (count) fs.writeFileSync(UPDATES_PATH, JSON.stringify(store, null, 2) + '\n', 'utf-8')
    console.log(`updates: ${count} English fields added`)
  }
  console.log(`OpenRouter cost: $${llm.cost().toFixed(4)}`)
  if (failed.length) process.exitCode = 2
}

main().catch((err) => {
  if (err instanceof OpenRouterError) console.error(err.message)
  else console.error('Error:', err.message)
  process.exit(1)
})

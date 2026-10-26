#!/usr/bin/env node
/**
 * Build "한국에서는" entries for existing companies.
 *   node scripts/backfill-korea-lens.mjs --issues 3          newest 3 issues, only companies without an entry
 *   node scripts/backfill-korea-lens.mjs --ids a-2026,b-2026  specific companies (rebuilds them)
 *   node scripts/backfill-korea-lens.mjs --issues 3 --out /tmp/lens.json   write elsewhere (dry run)
 * Env: OPENROUTER_API_KEY, OPENROUTER_MODELS
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient, lensModelsFromEnv } from './lib/openrouter.mjs'
import { updateLensFiles } from './lib/korea-lens.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const DATA = path.join(here, '../src/data/startups.json')
const LENS = path.join(here, '../src/data/korea-lens.json')
const INDEX = path.join(here, '../src/data/korea-lens-index.json')

const args = process.argv.slice(2)
const flag = (n) => (args.includes(n) ? args[args.indexOf(n) + 1] : null)
const out = flag('--out')
const lensPath = out ? path.resolve(out) : LENS
const indexPath = out ? path.resolve(out).replace(/\.json$/, '-index.json') : INDEX

const startups = JSON.parse(fs.readFileSync(DATA, 'utf-8'))
const stored = fs.existsSync(LENS) ? JSON.parse(fs.readFileSync(LENS, 'utf-8')) : {}
const ids = flag('--ids')?.split(',')
const dates = [...new Set(startups.map((s) => s.date))].sort().reverse().slice(0, Number(flag('--issues') || 3))
const targets = ids ? startups.filter((s) => ids.includes(s.id)) : startups.filter((s) => dates.includes(s.date) && !stored[s.id])

if (!targets.length) {
  console.log('Nothing to do.')
  process.exit(0)
}
const llm = createClient({ apiKey: process.env.OPENROUTER_API_KEY, models: lensModelsFromEnv(), log: console.log })
console.log(`Building ${targets.length} entries: ${targets.map((s) => s.name_en).join(', ')}`)
if (out && fs.existsSync(LENS) && !fs.existsSync(lensPath)) fs.copyFileSync(LENS, lensPath)
await updateLensFiles(llm, targets, { lensPath, indexPath, allIds: startups.map((s) => s.id) })
console.log(`OpenRouter cost: $${llm.cost().toFixed(4)}`)

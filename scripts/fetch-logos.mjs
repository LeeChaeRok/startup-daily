#!/usr/bin/env node
/**
 * Save company logos into public/logos and fill `logo_url` in src/data/startups.json.
 *
 *   node scripts/fetch-logos.mjs              companies without a stored logo (default, same as --missing)
 *   node scripts/fetch-logos.mjs --ids a,b    only these ids, fetched again even if a logo exists
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { attachLogos, storedLogo } from './lib/logos.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const DATA_PATH = path.join(here, '../src/data/startups.json')
const LOGO_DIR = path.join(here, '../public/logos')

const args = process.argv.slice(2)
const idsArg = args.includes('--ids') ? args[args.indexOf('--ids') + 1] : null
const ids = idsArg ? new Set(idsArg.split(',').map((s) => s.trim()).filter(Boolean)) : null

const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'))

// a record whose file is already on disk only needs its logo_url filled in
let relinked = 0
if (!ids) {
  for (const s of data) {
    const stored = storedLogo(LOGO_DIR, s.id)
    if (stored && s.logo_url !== stored) {
      s.logo_url = stored
      relinked++
    }
  }
}

const targets = ids
  ? data.filter((s) => ids.has(s.id))
  : data.filter((s) => !s.logo_url || !fs.existsSync(path.join(here, '../public', s.logo_url)))
if (ids) for (const id of ids) if (!data.some((s) => s.id === id)) console.log(`unknown id: ${id}`)

console.log(`Fetching logos for ${targets.length} companies${relinked ? ` (${relinked} relinked from disk)` : ''}…`)
const { ok, failed, results } = await attachLogos(targets, { dir: LOGO_DIR, log: console.log })

fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + '\n', 'utf-8')
console.log(`Logos: ${ok} saved, ${failed} missing`)
if (failed) console.log(`Missing: ${results.filter((r) => !r.ok).map((r) => r.id).join(', ')}`)

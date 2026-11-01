/**
 * Company records on disk, one file per day (see _workspace/14 §1-4):
 *
 *   src/data/days/YYYY-MM-DD.json      that day's records, full Korean profiles
 *                                       (the 5 featured ones first, then the rest of the pool)
 *   src/data/days-en/YYYY-MM-DD.json   English overlays for that day's records, { id: overlay }
 *
 * A single startups.json grew by the whole day on every run; with ~27 companies a day it would
 * pass 8 MB in a month. Scripts, the build and the API read through here instead.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
export const DAYS_DIR = path.join(here, '../../src/data/days')
export const EN_DIR = path.join(here, '../../src/data/days-en')

const DAY_FILE = /^\d{4}-\d{2}-\d{2}\.json$/
const write = (file, value) => {
  const text = JSON.stringify(value, null, 2) + '\n'
  if (fs.existsSync(file) && fs.readFileSync(file, 'utf-8') === text) return false
  const tmp = `${file}.tmp`
  fs.writeFileSync(tmp, text, 'utf-8')
  fs.renameSync(tmp, file)
  return true
}

/** Day files present, newest first. */
export function listDays(dir = DAYS_DIR) {
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((f) => DAY_FILE.test(f))
    .map((f) => f.slice(0, 10))
    .sort()
    .reverse()
}

export function readDay(date, dir = DAYS_DIR) {
  const file = path.join(dir, `${date}.json`)
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf-8')) : []
}

/** Every record, newest day first; within a day the file order (featured first). */
export function readAll(dir = DAYS_DIR) {
  return listDays(dir).flatMap((d) => readDay(d, dir))
}

/** Group by date and write each day; days that no longer have records are removed. */
export function writeAll(records, dir = DAYS_DIR) {
  fs.mkdirSync(dir, { recursive: true })
  const byDate = groupByDate(records)
  for (const [date, list] of byDate) write(path.join(dir, `${date}.json`), list)
  for (const d of listDays(dir)) if (!byDate.has(d)) fs.unlinkSync(path.join(dir, `${d}.json`))
}

export function groupByDate(records) {
  const byDate = new Map()
  for (const r of records) {
    if (!byDate.has(r.date)) byDate.set(r.date, [])
    byDate.get(r.date).push(r)
  }
  return byDate
}

/** All English overlays as one { id: overlay } map. */
export function readEn(dir = EN_DIR) {
  return Object.assign({}, ...listDays(dir).map((d) => readDay(d, dir)))
}

/**
 * Write overlays back into their day files, in record order. `records` decides each id's day;
 * overlays for ids that are no longer in the data are dropped.
 */
export function writeEn(store, records, dir = EN_DIR) {
  fs.mkdirSync(dir, { recursive: true })
  for (const [date, list] of groupByDate(records)) {
    const out = {}
    for (const r of list) if (store[r.id]) out[r.id] = store[r.id]
    const file = path.join(dir, `${date}.json`)
    if (Object.keys(out).length) write(file, out)
    else if (fs.existsSync(file)) fs.unlinkSync(file)
  }
}

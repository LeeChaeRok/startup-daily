/**
 * Company records for the API functions. They live in one file per day (src/data/days), which
 * the build publishes as /data/days/<date>.json; the functions read those published files
 * instead of bundling the data, so a function never needs a redeploy to see a new day.
 * Only public records are there (see vite.config.js), which is all an endpoint should accept.
 */
const ORIGIN = 'https://startup-daily.vercel.app'
const TTL = 10 * 60 * 1000
const cache = new Map()

async function getJSON(path) {
  const hit = cache.get(path)
  if (hit && Date.now() - hit.at < TTL) return hit.value
  const res = await fetch(`${ORIGIN}${path}`, { signal: AbortSignal.timeout(8000) })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`${path}: ${res.status}`)
  const value = await res.json()
  cache.set(path, { at: Date.now(), value })
  return value
}

const isDate = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d || '')

/** The full record for a public company id, or null. */
export async function companyById(id) {
  if (!/^[\w-]{1,120}$/.test(id || '')) return null
  const index = (await getJSON('/data/index.json')) || []
  const date = index.find((s) => s.id === id)?.date
  if (!isDate(date)) return null
  const day = (await getJSON(`/data/days/${date}.json`)) || []
  return day.find((s) => s.id === id) || null
}

/**
 * A day (the latest when `date` is missing) → { date, issue, pool }: the shared five, and every
 * public record of the day (the whole sector pool once it is public, else the same five).
 */
export async function issueOf(date) {
  const day = isDate(date) ? date : (await getJSON('/data/meta.json'))?.last_issue_date
  if (!isDate(day)) return { date: day, issue: [], pool: [] }
  const pool = (await getJSON(`/data/days/${day}.json`)) || []
  return { date: day, issue: pool.filter((s) => s.featured !== false), pool }
}

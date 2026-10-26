/**
 * On-demand "한국에서는" analysis for one company (GET /api/korea-lens?id=<company id>).
 *
 * Cost and abuse controls — this endpoint spends money per call:
 *  - only ids that exist in startups.json are accepted; the prompt is built here, never by the client
 *  - successful answers are cached at Vercel's edge for 30 days, so the first reader pays and
 *    everyone after is free (errors are never cached)
 *  - same-site requests only, a per-visitor rate limit, and a cap on concurrent generations
 *  - LENS_ENABLED=0 switches the whole thing off without a deploy
 * The OPENROUTER_API_KEY lives only in this project's environment variables.
 */
import startups from '../src/data/startups.json' with { type: 'json' }
import { createClient, lensModelsFromEnv } from '../scripts/lib/openrouter.mjs'
import { buildKoreaLens } from '../scripts/lib/korea-lens.mjs'

export const config = { maxDuration: 300 }

const SITE = 'https://startup-daily.vercel.app'
const MAX_CONCURRENT = 3
const PER_VISITOR = { limit: 4, windowMs: 10 * 60 * 1000 } // generations per visitor per window, per warm instance
const CACHE = 'public, s-maxage=2592000, stale-while-revalidate=31536000'

let running = 0
const hits = new Map()

function rateLimited(ip) {
  const now = Date.now()
  const recent = (hits.get(ip) || []).filter((t) => now - t < PER_VISITOR.windowMs)
  if (recent.length >= PER_VISITOR.limit) return true
  hits.set(ip, [...recent, now])
  if (hits.size > 5000) hits.clear()
  return false
}

function sameSite(req) {
  const from = req.headers.origin || req.headers.referer || ''
  if (!from) return false
  try {
    const h = new URL(from).hostname
    return h === 'startup-daily.vercel.app' || h === 'localhost' || h.endsWith('-li016010-3853s-projects.vercel.app')
  } catch {
    return false
  }
}

const send = (res, status, body, cache = 'no-store') => {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', cache)
  res.end(JSON.stringify(body))
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return send(res, 405, { error: 'method' })
  if (process.env.LENS_ENABLED === '0') return send(res, 503, { error: 'disabled', message: '지금은 분석 기능을 잠시 멈춰 두었어요.' })
  if (!process.env.OPENROUTER_API_KEY) return send(res, 503, { error: 'unconfigured', message: '분석 기능이 아직 설정되지 않았어요.' })
  if (!sameSite(req)) return send(res, 403, { error: 'origin' })

  const id = new URL(req.url, SITE).searchParams.get('id') || ''
  const startup = startups.find((s) => s.id === id)
  if (!startup) return send(res, 404, { error: 'unknown', message: '없는 회사예요.' })

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown'
  if (rateLimited(ip)) return send(res, 429, { error: 'rate', message: '짧은 시간에 너무 많이 요청했어요. 잠시 뒤에 다시 눌러 주세요.' })
  if (running >= MAX_CONCURRENT) return send(res, 429, { error: 'busy', message: '지금 분석 요청이 몰려 있어요. 잠시 뒤에 다시 눌러 주세요.' })

  running++
  try {
    const llm = createClient({ apiKey: process.env.OPENROUTER_API_KEY, models: lensModelsFromEnv() })
    const entry = await buildKoreaLens(llm, startup, { checkedAt: new Date().toISOString(), searchResults: 4 })
    if (!entry) return send(res, 422, { error: 'no-result', message: '이번에는 믿을 만한 분석을 만들지 못했어요. 나중에 다시 시도해 주세요.' })
    console.log(`korea-lens ${id}: ${entry.verdict}, cost $${llm.cost().toFixed(4)}`)
    return send(res, 200, { id, entry }, CACHE)
  } catch (err) {
    console.error(`korea-lens ${id} failed: ${err.message}`)
    return send(res, 502, { error: 'upstream', message: '분석 서버에 문제가 있었어요. 잠시 뒤에 다시 시도해 주세요.' })
  } finally {
    running--
  }
}

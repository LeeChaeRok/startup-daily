/**
 * Product events (POST /api/event) from src/lib/analytics.js. Written to the function log only,
 * one JSON line each ("[event] {...}"), until there is a store to count them in. Only the known
 * event names and a few short fields pass; nothing about the reader's network is kept.
 */
import { readBody, sameSite, send } from './_lib/http.mjs'

const NAMES = new Set([
  'app_open', 'detail_open', 'issue_complete', 'tab_switch',
  // hidden sectors (_workspace/15 §5)
  'sector_mute', 'sector_unmute', 'folded_expand', 'my_short',
])
const short = (v) => (typeof v === 'string' ? v.slice(0, 80) : typeof v === 'number' || typeof v === 'boolean' ? v : undefined)

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'method' })
  if (!sameSite(req)) return send(res, 403, { error: 'origin' })
  let body
  try {
    body = await readBody(req, 2000)
  } catch {
    return send(res, 400, { error: 'body' })
  }
  if (!NAMES.has(body?.name) || !/^[a-z0-9]{12}$/.test(body.device || '')) return send(res, 400, { error: 'invalid' })
  const data = Object.fromEntries(Object.entries(body.data || {}).slice(0, 6).map(([k, v]) => [k.slice(0, 24), short(v)]))
  console.log('[event]', JSON.stringify({ name: body.name, device: body.device, mine: body.mine === true, muted_n: Number.isInteger(body.muted_n) ? Math.min(body.muted_n, 9) : 0, data, at: new Date().toISOString() }))
  res.statusCode = 204
  res.end()
}

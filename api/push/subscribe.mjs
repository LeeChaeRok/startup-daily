/**
 * POST /api/push/subscribe { subscription, sectors?, onlyInterests? } — store or update.
 * POST /api/push/subscribe { endpoint, remove: true }                — forget it.
 * Subscriptions live in one Redis hash keyed by a hash of the endpoint; nothing else
 * about the reader is kept.
 */
import crypto from 'node:crypto'
import { redis, storeReady } from '../_lib/store.mjs'
import { readBody, sameSite, send } from '../_lib/http.mjs'

const KEY = 'push:subs'
const idOf = (endpoint) => crypto.createHash('sha256').update(endpoint).digest('hex').slice(0, 32)
const SECTOR_KEYS = /^[a-z]{2,12}$/

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'method' })
  if (!storeReady) return send(res, 503, { error: 'disabled' })
  if (!sameSite(req)) return send(res, 403, { error: 'origin' })
  let body
  try {
    body = await readBody(req)
  } catch {
    return send(res, 400, { error: 'body' })
  }
  const endpoint = body.subscription?.endpoint || body.endpoint
  if (typeof endpoint !== 'string' || !/^https:\/\//.test(endpoint) || endpoint.length > 1000) return send(res, 400, { error: 'endpoint' })

  if (body.remove) {
    await redis('HDEL', KEY, idOf(endpoint))
    return send(res, 200, { ok: true })
  }
  const keys = body.subscription?.keys
  if (!keys?.p256dh || !keys?.auth) return send(res, 400, { error: 'keys' })
  const record = {
    subscription: { endpoint, keys: { p256dh: String(keys.p256dh), auth: String(keys.auth) } },
    sectors: Array.isArray(body.sectors) ? body.sectors.filter((s) => SECTOR_KEYS.test(s)).slice(0, 12) : [],
    onlyInterests: Boolean(body.onlyInterests),
    updated: new Date().toISOString().slice(0, 10),
  }
  await redis('HSET', KEY, idOf(endpoint), JSON.stringify(record))
  return send(res, 200, { ok: true })
}

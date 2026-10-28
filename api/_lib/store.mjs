/**
 * Tiny Redis client over the Upstash REST API (no dependency). Configured by the Vercel
 * Marketplace Upstash integration (KV_REST_API_URL / KV_REST_API_TOKEN) or by
 * UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN. Without either, push is off.
 */
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN

export const storeReady = Boolean(URL_ && TOKEN)

export async function redis(...command) {
  const res = await fetch(URL_, {
    method: 'POST',
    headers: { authorization: `Bearer ${TOKEN}`, 'content-type': 'application/json' },
    body: JSON.stringify(command),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok || body.error) throw new Error(`redis ${command[0]}: ${body.error || res.status}`)
  return body.result
}

/**
 * POST /api/push/send { date } with "authorization: Bearer $PUSH_SEND_SECRET".
 * Called by the daily workflow right after a new issue is deployed: one notification
 * per subscriber, skipped for readers who asked for their sectors only when the issue
 * has none of them. Gone subscriptions (404/410) are removed.
 */
import webpush from 'web-push'
import { canonicalSector, sectorFor } from '../../src/lib/sectors.js'
import { issueOf } from '../_lib/data.mjs'
import { pickMine } from '../../src/lib/pick.js'
import { redis, storeReady } from '../_lib/store.mjs'
import { readBody, send } from '../_lib/http.mjs'

export const config = { maxDuration: 60 }
const KEY = 'push:subs'

const monthDay = (ymd) => {
  const [, m, d] = ymd.split('-').map(Number)
  return `${m}월 ${d}일`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'method' })
  const secret = process.env.PUSH_SEND_SECRET
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) return send(res, 401, { error: 'auth' })
  if (!storeReady || !process.env.VAPID_PRIVATE_KEY) return send(res, 503, { error: 'disabled' })

  const body = await readBody(req).catch(() => ({}))
  const { date, issue, pool } = await issueOf(body.date).catch(() => ({ date: body.date, issue: [], pool: [] }))
  if (!issue.length) return send(res, 404, { error: 'no issue', date })

  const sectors = issue.map(sectorFor)
  const labels = [...new Set(sectors.map((s) => s.label))].slice(0, 2).join('·')
  const payload = (count) =>
    JSON.stringify({
      title: `${monthDay(date)} 호 · ${issue.length}곳`,
      body: `${issue[0].name_ko}${issue.length > 1 ? ` 외 ${issue.length - 1}곳` : ''} · ${labels}`,
      url: '/#/',
      badge: count,
      tag: `issue-${date}`,
    })
  // with a public sector pool, a reader who follows sectors hears about their own five
  // (the same rule as the app's "내 5곳", src/lib/pick.js): "기후·에너지·푸드 리페어랩 외 4곳"
  const hasPool = pool.length > issue.length
  const minePayload = (sectorKeys, count) => {
    const mine = hasPool && sectorKeys?.length ? pickMine({ days: [pool], interests: sectorKeys }) : null
    const first = mine?.interest[0]
    if (!first) return payload(count)
    return JSON.stringify({
      title: `${monthDay(date)} · 내 5곳`,
      body: `${sectorFor(first).label} ${first.name_ko} 외 4곳`,
      url: '/#/',
      badge: count,
      tag: `issue-${date}`,
    })
  }

  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'https://startup-daily.vercel.app', process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY)
  const all = (await redis('HGETALL', KEY)) || []
  let sent = 0
  let failed = 0
  let skipped = 0
  // the whole public pool counts: with "내 5곳" there is something in their sectors
  const issueSectors = new Set(pool.map((s) => sectorFor(s).key))
  for (let i = 0; i < all.length; i += 2) {
    const id = all[i]
    let rec
    try {
      rec = JSON.parse(all[i + 1])
    } catch {
      continue
    }
    if (rec.onlyInterests && rec.sectors?.length && !rec.sectors.some((k) => issueSectors.has(canonicalSector(k)))) {
      skipped++
      continue
    }
    try {
      await webpush.sendNotification(rec.subscription, minePayload(rec.sectors, issue.length), { TTL: 12 * 3600, urgency: 'normal' })
      sent++
    } catch (err) {
      failed++
      if (err.statusCode === 404 || err.statusCode === 410) await redis('HDEL', KEY, id).catch(() => {})
    }
  }
  return send(res, 200, { date, sent, failed, skipped })
}

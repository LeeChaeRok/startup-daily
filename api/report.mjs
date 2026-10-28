/**
 * Reader error reports (POST /api/report) from the "틀린 내용 알리기" sheet.
 *
 * With REPORT_GITHUB_TOKEN set (a fine-grained token with Issues: write on this repo),
 * each report becomes a GitHub issue; without it the report is only written to the
 * function log. Same-site requests only, a small per-visitor limit, and nothing about
 * the reader (IP, user agent) is stored: the issue is public.
 */
import startups from '../src/data/startups.json' with { type: 'json' }

const REPO = 'LeeChaeRok/startup-daily'
const SITE = 'https://startup-daily.vercel.app'
const REASONS = { number: '숫자가 틀렸어요', status: '회사 상태가 바뀌었어요 (인수·폐업 등)', link: '링크가 안 열려요', other: '기타' }
const SECTIONS = { why: '왜 지금', product: '제품', competition: '경쟁', team: '팀', funding: '투자', market: '시장', korea: '한국에서는', sources: '출처와 신뢰' }
const PER_VISITOR = { limit: 5, windowMs: 10 * 60 * 1000 }
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
  try {
    const h = new URL(from).hostname
    return h === 'startup-daily.vercel.app' || h === 'localhost' || h.endsWith('-li016010-3853s-projects.vercel.app')
  } catch {
    return false
  }
}

const send = (res, status, body) => {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(body))
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body
  let raw = ''
  for await (const chunk of req) {
    raw += chunk
    if (raw.length > 8000) throw new Error('too large')
  }
  return JSON.parse(raw || '{}')
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'method' })
  if (!sameSite(req)) return send(res, 403, { error: 'origin' })
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown'
  if (rateLimited(ip)) return send(res, 429, { error: 'rate', message: '잠시 뒤에 다시 보내 주세요.' })

  let body
  try {
    body = await readBody(req)
  } catch {
    return send(res, 400, { error: 'body' })
  }
  const startup = startups.find((s) => s.id === body.id)
  const reason = REASONS[body.reason]
  const section = SECTIONS[body.section] || null
  const detail = typeof body.detail === 'string' ? body.detail.trim().slice(0, 500) : ''
  if (!startup || !reason) return send(res, 400, { error: 'invalid' })

  const title = `[제보] ${startup.name_ko || startup.name_en} · ${section || '전체'} · ${reason}`
  const text = [
    `- 회사: ${startup.name_ko} (${startup.name_en}) · \`${startup.id}\``,
    `- 호: ${startup.date}`,
    `- 섹션: ${section || '—'}`,
    `- 사유: ${reason}`,
    `- 페이지: ${SITE}/#/s/${startup.id}`,
    '',
    detail ? `> ${detail.replace(/\n/g, '\n> ')}` : '_(설명 없음)_',
  ].join('\n')

  const token = process.env.REPORT_GITHUB_TOKEN
  if (!token) {
    console.log('[report]', JSON.stringify({ title, id: startup.id, section: body.section, reason: body.reason, detail }))
    return send(res, 202, { ok: true })
  }
  try {
    const gh = await fetch(`https://api.github.com/repos/${REPO}/issues`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, accept: 'application/vnd.github+json', 'content-type': 'application/json' },
      body: JSON.stringify({ title, body: text }),
    })
    if (!gh.ok) throw new Error(`github ${gh.status}`)
    return send(res, 202, { ok: true })
  } catch (err) {
    console.log('[report] github failed, logged instead:', err.message, JSON.stringify({ title, detail }))
    return send(res, 202, { ok: true })
  }
}

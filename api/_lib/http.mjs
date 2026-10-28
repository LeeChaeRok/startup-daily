/** Shared bits for the small JSON endpoints. */
export const send = (res, status, body) => {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(body))
}

export function sameSite(req) {
  const from = req.headers.origin || req.headers.referer || ''
  try {
    const h = new URL(from).hostname
    return h === 'startup-daily.vercel.app' || h === 'localhost' || h.endsWith('.localhost') || h.endsWith('-li016010-3853s-projects.vercel.app')
  } catch {
    return false
  }
}

export async function readBody(req, max = 8000) {
  if (req.body && typeof req.body === 'object') return req.body
  let raw = ''
  for await (const chunk of req) {
    raw += chunk
    if (raw.length > max) throw new Error('too large')
  }
  return JSON.parse(raw || '{}')
}

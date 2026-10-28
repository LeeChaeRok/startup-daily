/**
 * Company logos, stored with the site (public/logos/{id}.{ext}) so the app does not
 * depend on third-party favicon services at read time.
 *
 * Lookup order: <link rel="apple-touch-icon"> → largest <link rel="icon"> →
 * /apple-touch-icon.png → Google s2 favicon (128px). A file is accepted only when
 * its bytes say PNG, JPEG or WebP (SVG and ICO are refused), it is ≤ 200 KB and
 * both sides are ≥ 64 px — read from the image header, no image library.
 */
import fs from 'node:fs'
import path from 'node:path'

export const MAX_BYTES = 200 * 1024
export const MIN_SIDE = 64
const TIMEOUT_MS = 8000
const HTML_MAX = 512 * 1024
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
const EXTS = ['png', 'jpg', 'webp']

/* ---------- Image headers ---------- */

/** Bytes → 'png' | 'jpg' | 'webp' | null (anything else, SVG and ICO included). */
export function sniffType(buf) {
  if (!buf || buf.length < 12) return null
  if (buf[0] === 0x89 && buf.toString('latin1', 1, 4) === 'PNG' && buf[4] === 0x0d && buf[5] === 0x0a) return 'png'
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg'
  if (buf.toString('latin1', 0, 4) === 'RIFF' && buf.toString('latin1', 8, 12) === 'WEBP') return 'webp'
  return null
}

/** → { width, height } from the header, or null when it cannot be read. */
export function imageSize(buf, type = sniffType(buf)) {
  try {
    if (type === 'png') {
      if (buf.toString('latin1', 12, 16) !== 'IHDR') return null
      return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
    }
    if (type === 'jpg') {
      let i = 2
      while (i + 9 < buf.length) {
        if (buf[i] !== 0xff) return null
        const marker = buf[i + 1]
        if (marker === 0xff) {
          i++
          continue
        }
        // standalone markers carry no length
        if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
          i += 2
          continue
        }
        const len = buf.readUInt16BE(i + 2)
        // SOF0–SOF15, except DHT (C4), JPG (C8) and DAC (CC)
        if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
          return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) }
        }
        i += 2 + len
      }
      return null
    }
    if (type === 'webp') {
      const chunk = buf.toString('latin1', 12, 16)
      if (chunk === 'VP8 ') {
        if (buf[23] !== 0x9d || buf[24] !== 0x01 || buf[25] !== 0x2a) return null
        return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff }
      }
      if (chunk === 'VP8L') {
        if (buf[20] !== 0x2f) return null
        const bits = buf.readUInt32LE(21)
        return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 }
      }
      if (chunk === 'VP8X') {
        return { width: buf.readUIntLE(24, 3) + 1, height: buf.readUIntLE(27, 3) + 1 }
      }
    }
  } catch {
    return null
  }
  return null
}

/** Accept or refuse downloaded bytes → { ok, type, width, height, reason }. */
export function checkImage(buf) {
  if (!buf?.length) return { ok: false, reason: 'empty' }
  if (buf.length > MAX_BYTES) return { ok: false, reason: `too large (${Math.round(buf.length / 1024)} KB)` }
  const type = sniffType(buf)
  if (!type) return { ok: false, reason: 'not png/jpeg/webp' }
  const size = imageSize(buf, type)
  if (!size) return { ok: false, type, reason: 'unreadable header' }
  if (size.width < MIN_SIDE || size.height < MIN_SIDE) return { ok: false, type, ...size, reason: `too small (${size.width}x${size.height})` }
  return { ok: true, type, ...size }
}

/* ---------- Discovery ---------- */

const attr = (tag, name) => tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'))?.slice(1).find((v) => v != null)

/** Icon URLs declared in the homepage HTML: apple-touch-icon first, then icons by size, largest first. */
export function iconLinks(html, baseUrl) {
  const touch = []
  const icons = []
  for (const [tag] of html.matchAll(/<link\b[^>]*>/gi)) {
    const rel = (attr(tag, 'rel') || '').toLowerCase().split(/\s+/)
    const href = attr(tag, 'href')
    if (!href || href.startsWith('data:')) continue
    let url
    try {
      url = new URL(href.replace(/&amp;/g, '&'), baseUrl).href
    } catch {
      continue
    }
    if (rel.includes('apple-touch-icon') || rel.includes('apple-touch-icon-precomposed')) touch.push(url)
    else if (rel.includes('icon')) {
      const sizes = (attr(tag, 'sizes') || '').match(/(\d+)\s*x\s*(\d+)/i)
      icons.push({ url, size: sizes ? Math.min(+sizes[1], +sizes[2]) : 0 })
    }
  }
  icons.sort((a, b) => b.size - a.size)
  return [...touch, ...icons.map((i) => i.url)]
}

async function get(url, fetchImpl, accept) {
  return fetchImpl(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { 'user-agent': UA, accept },
  })
}

/** Read at most `max` bytes; null when the body is larger. */
async function readCapped(res, max) {
  const len = Number(res.headers.get('content-length'))
  if (len > max) {
    res.body?.cancel?.().catch(() => {})
    return null
  }
  if (!res.body?.getReader) {
    const buf = Buffer.from(await res.arrayBuffer())
    return buf.length > max ? null : buf
  }
  const reader = res.body.getReader()
  const chunks = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.length
    if (total > max) {
      reader.cancel().catch(() => {})
      return null
    }
    chunks.push(value)
  }
  return Buffer.concat(chunks)
}

async function download(url, fetchImpl) {
  try {
    const res = await get(url, fetchImpl, 'image/png,image/webp,image/jpeg,image/*;q=0.8')
    if (!res.ok) {
      res.body?.cancel?.().catch(() => {})
      return { ok: false, reason: `HTTP ${res.status}` }
    }
    const buf = await readCapped(res, MAX_BYTES)
    if (!buf) return { ok: false, reason: 'too large' }
    const check = checkImage(buf)
    return check.ok ? { ...check, buf } : check
  } catch (err) {
    return { ok: false, reason: err.name === 'TimeoutError' ? 'timeout' : err.message }
  }
}

/**
 * Find a usable logo for a website → { ok, buf, type, width, height, source } or
 * { ok: false, tried: [{url, reason}] }.
 */
export async function findLogo(website, { fetchImpl = fetch } = {}) {
  let home
  try {
    home = new URL(/^https?:\/\//i.test(website) ? website : `https://${website}`)
  } catch {
    return { ok: false, tried: [{ url: website, reason: 'bad url' }] }
  }
  const candidates = []
  let base = home.href
  try {
    const res = await get(home.href, fetchImpl, 'text/html,*/*')
    base = res.url || base
    const html = res.ok ? await readCapped(res, HTML_MAX) : (res.body?.cancel?.().catch(() => {}), null)
    if (html) candidates.push(...iconLinks(html.toString('utf-8'), base))
  } catch {
    // homepage unreachable: the fixed paths below may still work
  }
  const origin = new URL(base).origin
  candidates.push(`${origin}/apple-touch-icon.png`)
  if (home.origin !== origin) candidates.push(`${home.origin}/apple-touch-icon.png`)
  candidates.push(`https://www.google.com/s2/favicons?domain=${new URL(base).hostname}&sz=128`)

  const tried = []
  for (const url of [...new Set(candidates)]) {
    // known-bad formats by extension save a request; content is still sniffed for the rest
    if (/\.(svg|ico)(\?|#|$)/i.test(url)) {
      tried.push({ url, reason: 'svg/ico' })
      continue
    }
    const r = await download(url, fetchImpl)
    if (r.ok) return { ...r, source: url }
    tried.push({ url, reason: r.reason })
  }
  return { ok: false, tried }
}

/* ---------- Storage ---------- */

/** Write public/logos/{id}.{ext}, removing any older file for the same id. → "/logos/{id}.{ext}" */
export function saveLogo(dir, id, logo) {
  fs.mkdirSync(dir, { recursive: true })
  for (const ext of EXTS) if (ext !== logo.type) fs.rmSync(path.join(dir, `${id}.${ext}`), { force: true })
  fs.writeFileSync(path.join(dir, `${id}.${logo.type}`), logo.buf)
  return `/logos/${id}.${logo.type}`
}

/** The stored logo file for an id, if any. */
export function storedLogo(dir, id) {
  const ext = EXTS.find((e) => fs.existsSync(path.join(dir, `${id}.${e}`)))
  return ext ? `/logos/${id}.${ext}` : ''
}

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length)
  let i = 0
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++
        out[idx] = await fn(items[idx])
      }
    }),
  )
  return out
}

/**
 * Fetch and store logos for profiles, setting `logo_url` in place ('' on failure).
 * Never throws for a single company. → { ok, failed, results }
 */
export async function attachLogos(profiles, { dir, fetchImpl = fetch, parallel = 6, log = () => {} } = {}) {
  const results = await mapLimit(profiles, parallel, async (p) => {
    if (!p.id || !p.website) {
      p.logo_url = ''
      log(`  logo ${p.id || p.name_en}: no website`)
      return { id: p.id, ok: false, reason: 'no website' }
    }
    try {
      const logo = await findLogo(p.website, { fetchImpl })
      if (!logo.ok) {
        p.logo_url = ''
        log(`  logo ${p.id}: none (${logo.tried.map((t) => t.reason).join('; ')})`)
        return { id: p.id, ok: false, reason: logo.tried.at(-1)?.reason }
      }
      p.logo_url = saveLogo(dir, p.id, logo)
      log(`  logo ${p.id}: ${logo.type} ${logo.width}x${logo.height} ← ${logo.source}`)
      return { id: p.id, ok: true, source: logo.source }
    } catch (err) {
      p.logo_url = ''
      log(`  logo ${p.id}: error ${err.message}`)
      return { id: p.id, ok: false, reason: err.message }
    }
  })
  const ok = results.filter((r) => r.ok).length
  return { ok, failed: results.length - ok, results }
}

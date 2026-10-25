import { useEffect, useMemo, useState } from 'react'
import Sheet from '../components/Sheet.jsx'
import { useToast } from '../components/toast-context.js'
import { byDate, byId, issueNo } from '../lib/data.js'
import { prefersReducedMotion, useFlag, useReadLog, useSaved } from '../lib/hooks.js'
import { monthDay } from '../lib/format.js'
import { canNativeShare, canonicalUrl, shareOrCopy } from '../lib/share.js'

const BASE_SECTIONS = [
  { id: 'why', label: '왜 지금' },
  { id: 'product', label: '제품' },
  { id: 'competition', label: '경쟁' },
  { id: 'team', label: '팀' },
  { id: 'funding', label: '투자' },
  { id: 'market', label: '시장' },
]
const KOREA_SECTION = { id: 'korea', label: '한국' }
const SOURCES_SECTION = { id: 'sources', label: '출처' }

/** The "한국" section exists only for companies that have a "한국에서는" analysis. */
export function sectionsFor(hasKorea) {
  return [...BASE_SECTIONS, ...(hasKorea ? [KOREA_SECTION] : []), SOURCES_SECTION]
}

/* Analyses that shipped with the site are loaded on demand (they are the bulk of the data).
   Others are generated when the reader asks, by /api/korea-lens, and kept on this device. */
const lensCache = new Map()
let lensFile = null
const deviceKey = (id) => `sd_lens:${id}`

function readDevice(id) {
  try {
    const raw = localStorage.getItem(deviceKey(id))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/**
 * Returns { lens, status, message, elapsed, run }.
 *   lens   — the analysis, or null/undefined while loading or absent
 *   status — 'ready' | 'loading' | 'idle' (nothing yet, can be requested) | 'error'
 */
export function useKoreaLens(id, hasStatic, canRequest) {
  const [, tick] = useState(0)
  const [request, setRequest] = useState({ status: 'idle', message: '', started: 0 })
  const [now, setNow] = useState(0)
  const rerender = () => tick((n) => n + 1)

  useEffect(() => {
    if (!hasStatic || lensCache.has(id)) return
    let live = true
    ;(lensFile ??= import('../data/korea-lens.json'))
      .then((m) => {
        lensCache.set(id, (m.default || m)[id] || null)
        if (live) rerender()
      })
      .catch(() => lensCache.set(id, null))
    return () => {
      live = false
    }
  }, [id, hasStatic])

  // while a request runs, tick once a second so the reader sees time passing
  useEffect(() => {
    if (request.status !== 'loading') return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [request.status])

  const run = async () => {
    if (!canRequest || request.status === 'loading') return
    const started = Date.now()
    setNow(started)
    setRequest({ status: 'loading', message: '', started })
    const ctl = new AbortController()
    const timer = setTimeout(() => ctl.abort(), 330_000)
    try {
      const res = await fetch(`/api/korea-lens?id=${encodeURIComponent(id)}`, { signal: ctl.signal })
      const type = res.headers.get('content-type') || ''
      const body = type.includes('json') ? await res.json() : null
      if (!res.ok || !body?.entry) {
        setRequest({ status: 'error', message: body?.message || '분석을 불러오지 못했어요. 잠시 뒤에 다시 시도해 주세요.', started })
        return
      }
      lensCache.set(id, body.entry)
      try {
        localStorage.setItem(deviceKey(id), JSON.stringify(body.entry))
      } catch {
        /* storage full or blocked: it just won't be remembered */
      }
      setRequest({ status: 'idle', message: '', started })
    } catch (err) {
      setRequest({
        status: 'error',
        message: err.name === 'AbortError' ? '시간이 너무 오래 걸려 멈췄어요. 다시 시도해 주세요.' : '네트워크에 문제가 있었어요. 다시 시도해 주세요.',
        started,
      })
    } finally {
      clearTimeout(timer)
    }
  }

  const cached = lensCache.has(id) ? lensCache.get(id) : hasStatic ? undefined : (lensCache.set(id, readDevice(id)), lensCache.get(id))
  const status = request.status === 'loading' ? 'loading' : cached ? 'ready' : hasStatic && cached === undefined ? 'loading' : request.status
  const elapsed = request.status === 'loading' ? Math.max(0, Math.round((now - request.started) / 1000)) : 0
  return { lens: cached || null, status, message: request.message, elapsed, run }
}

/** Ordered list this detail page belongs to: its issue, or the saved list. */
export function useContextList(startup, from) {
  const { saved } = useSaved()
  return useMemo(() => {
    if (!startup) return []
    if (from === 'saved') return saved.map(byId).filter(Boolean)
    return byDate(startup.date)
  }, [startup, from, saved])
}

export function useShare(startup) {
  const toast = useToast()
  const [manualUrl, setManualUrl] = useState(null)
  const share = async () => {
    const url = canonicalUrl(`/s/${startup.id}`)
    const r = await shareOrCopy({
      title: `${startup.name_ko} — Startup Daily`,
      text: `${startup.tagline} · 제${issueNo(startup.date)}호(${monthDay(startup.date)})`,
      url,
    })
    if (r === 'copied') toast('링크를 복사했어요')
    if (r === 'manual') setManualUrl(url)
  }
  const sheet = (
    <Sheet open={Boolean(manualUrl)} onClose={() => setManualUrl(null)} title="링크 복사">
      <p className="sheet__hint">아래 주소를 길게 눌러 복사하세요.</p>
      <input className="field" readOnly value={manualUrl || ''} onFocus={(e) => e.currentTarget.select()} autoFocus />
    </Sheet>
  )
  return { share, sheet, label: canNativeShare() ? '공유' : '링크 복사' }
}

/* Mark as read once the summary has been on screen for 5s while the tab is visible. */
export function useReadTracking(ref, id) {
  const { markRead } = useReadLog()
  const [, setIntro] = useFlag('sd_intro_dismissed', false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let timer = null
    const io = new IntersectionObserver(
      ([entry]) => {
        clearTimeout(timer)
        if (entry.isIntersecting && document.visibilityState === 'visible') {
          timer = setTimeout(() => {
            markRead(id)
            setIntro(true)
          }, 5000)
        }
      },
      { threshold: 0.4 },
    )
    io.observe(el)
    return () => {
      clearTimeout(timer)
      io.disconnect()
    }
  }, [ref, id, markRead, setIntro])
}

/* Which section is under the sticky nav. */
export function useActiveSection(idList) {
  const key = idList.join(',') // a new array each render must not re-create the observer
  const [active, setActive] = useState(idList[0])
  useEffect(() => {
    const els = key.split(',').map((id) => document.getElementById(id)).filter(Boolean)
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-120px 0px -60% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [key])
  return active
}

export function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
}


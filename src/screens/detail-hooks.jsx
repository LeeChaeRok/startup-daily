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

/* Full analyses are loaded on demand: they are the bulk of the data and only the detail page needs them. */
const lensCache = new Map()
let lensFile = null

/** undefined = loading, null = none for this company, object = the analysis. */
export function useKoreaLens(id, hasIndexEntry) {
  const [, tick] = useState(0)
  useEffect(() => {
    if (!hasIndexEntry || lensCache.has(id)) return
    let live = true
    ;(lensFile ??= import('../data/korea-lens.json'))
      .then((m) => {
        lensCache.set(id, (m.default || m)[id] || null)
        if (live) tick((n) => n + 1)
      })
      .catch(() => lensCache.set(id, null))
    return () => {
      live = false
    }
  }, [id, hasIndexEntry])
  if (!hasIndexEntry) return null
  return lensCache.has(id) ? lensCache.get(id) : undefined
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


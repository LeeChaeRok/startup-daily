import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import Icon from '../components/Icon.jsx'
import Sheet from '../components/Sheet.jsx'
import { useToast } from '../components/toast-context.js'
import { byDate, byId, issueNo } from '../lib/data.js'
import { prefersReducedMotion, useFlag, useReadLog, useSaved } from '../lib/hooks.js'
import { monthDay } from '../lib/format.js'
import { canNativeShare, canonicalUrl, shareOrCopy } from '../lib/share.js'
import { L } from '../lib/i18n.js'
import { useIssueOrder } from '../lib/personal.js'

const BASE_SECTIONS = [
  { id: 'why', label: L('왜 지금', 'Why now') },
  { id: 'product', label: L('제품', 'Product') },
  { id: 'competition', label: L('경쟁', 'Competition') },
  { id: 'team', label: L('팀', 'Team') },
  { id: 'funding', label: L('투자', 'Funding') },
  { id: 'market', label: L('시장', 'Market') },
]
const KOREA_SECTION = { id: 'korea', label: L('한국', 'Korea') }
const SOURCES_SECTION = { id: 'sources', label: L('출처', 'Sources') }

/** The "한국" section exists only for companies that have a "한국에서는" analysis. */
export function sectionsFor(hasKorea) {
  return [...BASE_SECTIONS, ...(hasKorea ? [KOREA_SECTION] : []), SOURCES_SECTION]
}

/* Analyses that shipped with the site come from /data/korea-lens.json, fetched on demand.
   Others are generated when the reader asks, by /api/korea-lens, and kept on this device.
   Requests live in this module, not in the screen: leaving the detail page and coming
   back must not lose a 2~3 minute generation or start a second, paid one. */
const lensCache = new Map() // id → entry | null (known absent)
const staticFailed = new Set() // ids whose shipped analysis could not be fetched (offline, …)
const requests = new Map() // id → { status: 'loading' | 'error', started, message }
const readyListeners = new Set()
const listeners = new Set()
let version = 0
let lensFile = null
const emit = () => {
  version++
  listeners.forEach((l) => l())
}
const subscribe = (l) => (listeners.add(l), () => listeners.delete(l))
const deviceKey = (id) => `sd_lens:${id}`

function readDevice(id) {
  try {
    const raw = localStorage.getItem(deviceKey(id))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function loadStatic(id) {
  staticFailed.delete(id)
  lensFile ??= fetch('/data/korea-lens.json')
    .then((res) => {
      if (!res.ok) throw new Error(String(res.status))
      return res.json()
    })
    .catch((err) => {
      lensFile = null // let the next attempt try again
      throw err
    })
  lensFile.then(
    (file) => {
      lensCache.set(id, file[id] || null)
      emit()
    },
    () => {
      staticFailed.add(id)
      emit()
    },
  )
}

async function requestLens(id) {
  if (requests.get(id)?.status === 'loading') return
  const started = Date.now()
  requests.set(id, { status: 'loading', started, message: '' })
  emit()
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), 330_000)
  const fail = (message) => {
    requests.set(id, { status: 'error', started, message })
    emit()
  }
  try {
    const res = await fetch(`/api/korea-lens?id=${encodeURIComponent(id)}`, { signal: ctl.signal })
    const type = res.headers.get('content-type') || ''
    const body = type.includes('json') ? await res.json() : null
    if (!res.ok || !body?.entry) return fail(body?.message || L('분석을 불러오지 못했어요. 잠시 뒤에 다시 시도해 주세요.', 'Couldn’t load the analysis. Please try again in a moment.'))
    lensCache.set(id, body.entry)
    try {
      localStorage.setItem(deviceKey(id), JSON.stringify(body.entry))
    } catch {
      /* storage full or blocked: it just won't be remembered */
    }
    requests.delete(id)
    emit()
    readyListeners.forEach((l) => l(id))
  } catch (err) {
    fail(
      err.name === 'AbortError'
        ? L('시간이 너무 오래 걸려 멈췄어요. 다시 시도해 주세요.', 'It took too long, so we stopped. Please try again.')
        : L('네트워크에 문제가 있었어요. 다시 시도해 주세요.', 'There was a network problem. Please try again.'),
    )
  } finally {
    clearTimeout(timer)
  }
}

/** True while any "한국에서는" generation is running (the updater waits for it). */
export const lensBusy = () => [...requests.values()].some((r) => r.status === 'loading')

/** Called with the id when a requested analysis arrives, wherever the reader is. */
export function onLensReady(listener) {
  readyListeners.add(listener)
  return () => readyListeners.delete(listener)
}

// what the reader sees during the 2~3 minutes, by elapsed time
const PHASES = [
  [0, L('비슷한 해외 제품을 찾는 중이에요', 'Looking for similar products abroad')],
  [40, L('한국에 이미 있는 곳을 검색하는 중이에요', 'Searching for companies already in Korea')],
  [120, L('링크를 확인하고 정리하는 중이에요', 'Checking links and writing it up')],
  [210, L('거의 다 됐어요. 조금만 더 기다려 주세요', 'Almost done. Just a little longer')],
]
const phaseAt = (sec) => PHASES.filter(([t]) => sec >= t).at(-1)[1]

/**
 * Returns { lens, status, message, elapsed, phase, run, retry }.
 *   status — 'ready' | 'loading' | 'idle' (nothing yet, can be requested) | 'error'
 *            | 'static-error' (a shipped analysis exists but could not be fetched)
 */
export function useKoreaLens(id, hasStatic, canRequest) {
  useSyncExternalStore(subscribe, () => version)
  const req = requests.get(id)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (hasStatic && !lensCache.has(id) && !staticFailed.has(id)) loadStatic(id)
  }, [id, hasStatic])

  // while a request runs, tick once a second so the reader sees time passing
  const loading = req?.status === 'loading'
  useEffect(() => {
    if (!loading) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [loading])

  if (!hasStatic && !lensCache.has(id)) lensCache.set(id, readDevice(id))
  const cached = lensCache.get(id)
  const elapsed = loading ? Math.max(0, Math.round((now - req.started) / 1000)) : 0
  let status
  if (cached) status = 'ready'
  else if (loading) status = 'loading'
  else if (hasStatic && staticFailed.has(id)) status = 'static-error'
  else if (hasStatic && cached === undefined) status = 'loading'
  else status = req?.status || 'idle'

  return {
    lens: cached || null,
    status,
    message: req?.message || '',
    elapsed,
    phase: loading ? phaseAt(elapsed) : '',
    run: () => canRequest && requestLens(id),
    retry: () => loadStatic(id),
  }
}

const NONE = []

/** Ordered list this detail page belongs to: its issue (in the reader's order, as on
    the issue screen), or the saved list. */
export function useContextList(startup, from) {
  const { saved } = useSaved()
  const issue = useIssueOrder(startup ? byDate(startup.date) : NONE).list
  return useMemo(() => {
    if (!startup) return []
    if (from === 'saved') return saved.map(byId).filter(Boolean)
    return issue
  }, [startup, from, saved, issue])
}

/** Public link for a company: /s/:id is a small static page with that company's link
    preview (title, summary) that forwards to the app. Dev has no such pages. */
export const shareUrl = (id) => (import.meta.env.PROD ? `${window.location.origin}/s/${id}` : canonicalUrl(`/s/${id}`))

export function useShare(startup) {
  const toast = useToast()
  const [manualUrl, setManualUrl] = useState(null)
  const [open, setOpen] = useState(false)
  const shareLink = async () => {
    setOpen(false)
    const url = shareUrl(startup.id)
    const r = await shareOrCopy({
      title: `${startup.name_ko} — Startup Daily`,
      text: L(
        `${startup.tagline} · 제${issueNo(startup.date)}호(${monthDay(startup.date)})`,
        `${startup.tagline} · Issue #${issueNo(startup.date)} (${monthDay(startup.date)})`,
      ),
      url,
    })
    if (r === 'copied') toast(L('링크를 복사했어요', 'Link copied'))
    if (r === 'manual') setManualUrl(url)
  }
  const shareImage = async () => {
    setOpen(false)
    const { shareCard } = await import('../lib/card.js')
    const r = await shareCard(startup)
    if (r === 'saved') toast(L('카드 이미지를 저장했어요', 'Card image saved'))
  }
  const sheet = (
    <>
      <Sheet open={open} onClose={() => setOpen(false)} title={L('공유하기', 'Share')}>
        <div className="share-options">
          <button type="button" className="btn btn--secondary" onClick={shareLink}>
            <Icon name="share" size={18} /> {canNativeShare() ? L('링크 공유', 'Share link') : L('링크 복사', 'Copy link')}
          </button>
          <button type="button" className="btn btn--secondary" onClick={shareImage}>
            <Icon name="image" size={18} />{' '}
            {canNativeShare() ? L('카드 이미지로 공유', 'Share as card image') : L('카드 이미지로 저장', 'Save as card image')}
          </button>
        </div>
        <p className="sheet__hint">
          {L(
            '카드 이미지에는 ‘AI가 공개 자료로 작성’ 표시가 함께 들어가요.',
            'Card images include a “Written by AI from public sources” label.',
          )}
        </p>
      </Sheet>
      <Sheet open={Boolean(manualUrl)} onClose={() => setManualUrl(null)} title={L('링크 복사', 'Copy link')}>
        <p className="sheet__hint">{L('아래 주소를 길게 눌러 복사하세요.', 'Press and hold the address below to copy it.')}</p>
        <input className="field" readOnly value={manualUrl || ''} onFocus={(e) => e.currentTarget.select()} autoFocus />
      </Sheet>
    </>
  )
  return { share: () => setOpen(true), sheet, label: L('공유', 'Share') }
}

/* Mark as read once the summary has been on screen for 2s while the tab is visible.
   Polled rather than observed: an observer only reports threshold crossings, so a
   detail opened in a background tab would never count once the reader looks at it. */
export function useReadTracking(ref, id) {
  const { markRead } = useReadLog()
  const [, setIntro] = useFlag('sd_intro_dismissed', false)
  useEffect(() => {
    let seen = 0
    const timer = setInterval(() => {
      const el = ref.current
      const r = el?.getBoundingClientRect()
      const onScreen = r && r.top < window.innerHeight * 0.85 && r.bottom > 0
      seen = onScreen && document.visibilityState === 'visible' ? seen + 1 : 0
      if (seen >= 4) {
        clearInterval(timer)
        markRead(id)
        setIntro(true)
      }
    }, 500)
    return () => clearInterval(timer)
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


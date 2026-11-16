import { useEffect, useLayoutEffect, useRef } from 'react'
import { DesktopNav, TabBar, TopBar } from './components/Chrome.jsx'
import Icon from './components/Icon.jsx'
import { ToastProvider } from './components/Toast.jsx'
import { useToast } from './components/toast-context.js'
import { EmptyState } from './components/ui.jsx'
import Today from './screens/Today.jsx'
import Detail from './screens/Detail.jsx'
import { onLensReady } from './screens/detail-hooks.jsx'
import Explore, { DatesView } from './screens/Explore.jsx'
import Saved from './screens/Saved.jsx'
import About from './screens/About.jsx'
import Settings from './screens/Settings.jsx'
import Contests from './screens/Contests.jsx'
import Yc from './screens/Yc.jsx'
import { byDate, byId, canonicalSector, dates, isYcPick, ycDates } from './lib/data.js'
import { navigate, useMediaQuery, useReadLog, useRoute } from './lib/hooks.js'
import { claimEntry, currentEntry, goBack, replaceHash, scrollMemory } from './lib/nav.js'
import { longDate, monthDay } from './lib/format.js'
import { onUpdate } from './lib/update.js'
import { isEn, L } from './lib/i18n.js'

/* ---------- Route → screen (spec v2 §3, IA §2-4) ---------- */

function resolve({ parts, params }) {
  const [head, arg] = parts
  if (!head) return { kind: 'today', date: dates[0], tab: 'today' }
  if (head === 'd' && dates.includes(arg)) return arg === dates[0] ? { kind: 'redirect', to: '#/' } : { kind: 'day', date: arg, tab: 'today' }
  if (head === 's' && byId(arg)) {
    const from = params.get('from')
    return { kind: 'detail', id: arg, from, tab: from === 'saved' ? 'saved' : from === 'explore' ? 'explore' : 'today' }
  }
  if (head === 'yc' && ycDates().length) return arg && !ycDates().includes(arg) ? { kind: 'redirect', to: '#/yc' } : { kind: 'yc', date: arg || ycDates()[0], tab: 'today' }
  if (head === 'explore') {
    const view = params.get('view')
    if (view === 'issues') return { kind: 'redirect', to: '#/explore?view=dates' }
    if (view === 'dates') return { kind: 'dates', tab: 'explore' }
    return { kind: 'explore', tab: 'explore' }
  }
  // contests are Korean-only; the English edition has no tab for them
  if (head === 'contests' && isEn) return { kind: 'redirect', to: '#/' }
  if (head === 'contests') return { kind: 'contests', tab: 'contests', sel: params.get('c') }
  if (head === 'saved') return { kind: 'saved', tab: 'saved' }
  if (head === 'settings') return { kind: 'settings', tab: null }
  if (head === 'about') return { kind: 'about', tab: null }
  // retired screens: 분야 모아 보기 → 탐색 filter, 주간 정리 → 날짜별
  if (head === 't' && arg) return { kind: 'redirect', to: `#/explore?sector=${encodeURIComponent(canonicalSector(arg))}` }
  if (head === 'w') return { kind: 'redirect', to: '#/explore?view=dates' }
  return { kind: 'missing', tab: null, head, arg }
}

/** Where the on-screen back goes when there is no in-app page behind (opened from a link). */
function parentOf(route) {
  if (route.kind === 'detail') {
    const s = byId(route.id)
    if (route.from === 'saved') return '/saved'
    if (route.from === 'explore') return '/explore'
    if (isYcPick(s)) return `/yc/${s.date}`
    return s.date === dates[0] ? '/' : `/d/${s.date}`
  }
  if (route.kind === 'dates') return '/explore'
  if (route.kind === 'contests') return '/contests'
  return '/'
}

function titleFor(r) {
  const t = (x) => `${x} — Startup Daily`
  if (r.kind === 'today') return L(`오늘의 스타트업 5곳 · ${monthDay(r.date)}`, `Today's five startups · ${monthDay(r.date)}`) + ' — Startup Daily'
  if (r.kind === 'day') return t(L(`${longDate(r.date)}의 5곳`, `Five startups · ${longDate(r.date)}`))
  if (r.kind === 'detail') return t(byId(r.id).name_ko)
  if (r.kind === 'yc') return t(L(`YC 새 배치 · ${monthDay(r.date)}`, `New at YC · ${monthDay(r.date)}`))
  if (r.kind === 'explore') return t(L('탐색', 'Explore'))
  if (r.kind === 'dates') return t(L('날짜별', 'By date'))
  if (r.kind === 'saved') return t(L('저장', 'Saved'))
  if (r.kind === 'contests') return t(L('공모전', 'Contests'))
  if (r.kind === 'about') return t(L('소개·선정 기준', 'About'))
  if (r.kind === 'settings') return t(L('설정', 'Settings'))
  return t(L('찾을 수 없음', 'Not found'))
}

/* ---------- Scroll and focus on route change (spec v2 §8-4, §8-8) ----------
   A new entry starts at the top with focus on its heading; an entry seen before
   (back/forward) gets its own scroll position back.                            */

function useRouteEffects(routeKey, title) {
  const prevKey = useRef(null)

  useEffect(() => {
    const onScroll = () => {
      const entry = currentEntry()
      if (entry) scrollMemory.set(entry.key, window.scrollY)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useLayoutEffect(() => {
    document.title = title
    const entry = claimEntry()
    if (entry.first) {
      prevKey.current = routeKey
      return
    }
    // same screen, different query (filters, search): keep the position
    if (prevKey.current === routeKey) return
    prevKey.current = routeKey
    const y = entry.fresh ? 0 : scrollMemory.get(entry.key) || 0
    window.scrollTo(0, y)
    // content that grows after paint (a list loading) gets one more try
    if (y) requestAnimationFrame(() => window.scrollY < y - 2 && window.scrollTo(0, y))
    document.querySelector('main h1')?.focus({ preventScroll: true })
  })
}

/* ---------- Background news: a new issue, a finished "한국에서는" request ---------- */

function Notifier() {
  const toast = useToast()
  useEffect(
    () =>
      onUpdate((kind, meta) => {
        const label = kind === 'issue' && meta?.last_issue_date ? L('새 다섯 곳이 도착했어요', 'Five new startups are here') : L('새 버전이 있어요', 'A new version is available')
        toast(label, { label: L('보기', 'View'), onClick: () => window.location.reload() }, 15000)
      }),
    [toast],
  )
  useEffect(
    () =>
      onLensReady((id) => {
        if (window.location.hash.startsWith(`#/s/${id}`)) return
        const s = byId(id)
        toast(L(`${s?.name_ko || '요청한 회사'} 한국 분석이 준비됐어요`, `Korea analysis is ready for ${s?.name_ko || 'the company you asked about'}`), { label: L('보기', 'View'), onClick: () => navigate(`/s/${id}`) }, 10000)
      }),
    [toast],
  )
  return null
}

/** App icon badge = today's companies not read yet (installed apps only). */
function useAppBadge() {
  const { isRead } = useReadLog()
  const unread = dates[0] ? byDate(dates[0]).filter((s) => !isRead(s.id)).length : 0
  useEffect(() => {
    if (!('setAppBadge' in navigator)) return
    ;(unread ? navigator.setAppBadge(unread) : navigator.clearAppBadge()).catch(() => {})
  }, [unread])
}

function NotFound({ head, arg }) {
  const nearDay = head === 'd' && /^\d{4}-\d{2}-\d{2}$/.test(arg || '')
  const nearest = nearDay ? [...dates].sort((a, b) => Math.abs(new Date(a) - new Date(arg)) - Math.abs(new Date(b) - new Date(arg)))[0] : null
  return (
    <div className="page">
      <EmptyState
        level={1}
        icon={nearDay ? 'calendar' : 'info'}
        title={nearDay ? L('이 날은 발행하지 않았어요', 'Nothing was published that day') : L('이 페이지를 찾을 수 없어요', 'Page not found')}
        action={
          nearest ? (
            <a className="btn btn--secondary" href={nearest === dates[0] ? '#/' : `#/d/${nearest}`}>
              {L(`가장 가까운 날 보기 (${monthDay(nearest)})`, `See the nearest day (${monthDay(nearest)})`)}
            </a>
          ) : (
            <a className="btn btn--secondary" href="#/">
              {L('오늘로 가기', 'Go to today')}
            </a>
          )
        }
      >
        {!nearDay && L('주소가 바뀌었거나 없는 회사예요.', 'The link may have changed, or this company doesn’t exist.')}
      </EmptyState>
    </div>
  )
}

const SUB_TITLE = {
  day: (r) => monthDay(r.date),
  yc: () => L('YC 새 배치', 'New at YC'),
  dates: () => L('날짜별', 'By date'),
  settings: () => L('설정', 'Settings'),
  about: () => L('소개', 'About'),
}

const ROOT_HASHES = ['', '#', '#/', '#/explore', '#/contests', '#/saved']

/* ---------- App ---------- */

export default function App() {
  const loc = useRoute()
  const route = resolve(loc)
  const desktop = useMediaQuery('(min-width: 1024px)')
  useAppBadge()
  const routeKey = `${route.kind}:${route.date || route.id || ''}:${route.from || ''}:${route.kind === 'contests' && !desktop ? route.sel || '' : ''}`
  useRouteEffects(routeKey, titleFor(route))

  // retired or duplicate addresses: swap the entry, so back doesn't bounce through them
  useEffect(() => {
    if (route.kind === 'redirect') replaceHash(route.to)
  }, [route.kind, route.to])
  if (route.kind === 'redirect') return null

  const back = { label: L('뒤로', 'Back'), onClick: () => goBack(parentOf(route)) }
  const atRoot = ROOT_HASHES.includes(window.location.hash)
  // screens that draw their own top bar (company page, a contest on a phone)
  const ownBar = route.kind === 'detail' || (route.kind === 'contests' && route.sel && !desktop)
  const hideTabs = desktop || ownBar || route.kind === 'settings' || route.kind === 'about'

  let content
  if (route.kind === 'today' || route.kind === 'day') content = <Today key={route.date} date={route.date} past={route.kind === 'day'} desktop={desktop} />
  else if (route.kind === 'detail') content = <Detail key={route.id} id={route.id} from={route.from} desktop={desktop} back={back} />
  else if (route.kind === 'yc') content = <Yc key={route.date} date={route.date} />
  else if (route.kind === 'explore') content = <Explore params={loc.params} desktop={desktop} />
  else if (route.kind === 'dates') content = <DatesView />
  else if (route.kind === 'saved') content = <Saved params={loc.params} />
  else if (route.kind === 'contests') content = <Contests params={loc.params} desktop={desktop} back={back} />
  else if (route.kind === 'about') content = <About params={loc.params} />
  else if (route.kind === 'settings') content = <Settings />
  else content = <NotFound head={route.head} arg={route.arg} />

  const layout = route.kind === 'detail' ? 'detail' : route.kind === 'contests' ? 'contests' : 'list'

  return (
    <ToastProvider>
      <Notifier />
      <a className="skip" href="#main" onClick={(e) => (e.preventDefault(), document.getElementById('main')?.focus())}>
        {L('본문으로 건너뛰기', 'Skip to content')}
      </a>
      {desktop ? (
        <DesktopNav section={route.tab} atRoot={atRoot} query={route.kind === 'explore' ? loc.params.get('q') || '' : ''} />
      ) : (
        !ownBar && <TopBar back={SUB_TITLE[route.kind] ? back : null} title={SUB_TITLE[route.kind]?.(route)} />
      )}
      <main id="main" tabIndex={-1} className={`shell shell--${layout} ${hideTabs ? '' : 'shell--tabs'}`}>
        {desktop && SUB_TITLE[route.kind] && (
          <div className="dback">
            <button type="button" className="btn btn--ghost" onClick={back.onClick}>
              <Icon name="back" size={18} /> {L('뒤로', 'Back')}
            </button>
          </div>
        )}
        {content}
      </main>
      {!hideTabs && <TabBar section={route.tab} atRoot={atRoot} />}
    </ToastProvider>
  )
}

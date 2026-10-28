import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AppHeader, Footer, TabBar } from './components/Chrome.jsx'
import { ToastProvider } from './components/Toast.jsx'
import { useToast } from './components/toast-context.js'
import { EmptyState } from './components/bits.jsx'
import StartupRow from './components/StartupRow.jsx'
import { IssueHeader, IssueList, IssueMobile, IssueOverview, IssueRail } from './screens/Issue.jsx'
import Detail, { DetailRail } from './screens/Detail.jsx'
import { onLensReady, useContextList } from './screens/detail-hooks.jsx'
import Explore from './screens/Explore.jsx'
import Saved from './screens/Saved.jsx'
import About from './screens/About.jsx'
import { byId, dates, issueNo } from './lib/data.js'
import { navigate, useMediaQuery, useRoute } from './lib/hooks.js'
import { claimEntry, currentEntry, scrollMemory } from './lib/nav.js'
import { longDate, monthDay } from './lib/format.js'
import { onUpdate } from './lib/update.js'

/* ---------- Route → screen ---------- */

function resolve({ parts, params }) {
  const [head, arg] = parts
  if (!head) return { kind: 'issue', date: dates[0], section: 'issue' }
  if (head === 'd' && dates.includes(arg)) return { kind: 'issue', date: arg, section: 'issue' }
  if (head === 's' && byId(arg)) return { kind: 'detail', id: arg, from: params.get('from'), section: params.get('from') === 'saved' ? 'saved' : 'issue' }
  if (head === 'explore') return { kind: 'explore', section: 'explore' }
  if (head === 'saved') return { kind: 'saved', section: 'saved' }
  if (head === 'about') return { kind: 'about', section: 'about' }
  return { kind: 'missing', section: null, head, arg }
}

function titleFor(r) {
  if (r.kind === 'issue') return `제${issueNo(r.date)}호 ${longDate(r.date)} — Startup Daily`
  if (r.kind === 'detail') return `${byId(r.id).name_ko} — Startup Daily`
  if (r.kind === 'explore') return '탐색 — Startup Daily'
  if (r.kind === 'saved') return '저장함 — Startup Daily'
  if (r.kind === 'about') return '소개·선정 기준 — Startup Daily'
  return '찾을 수 없음 — Startup Daily'
}

/* ---------- Scroll restoration + focus on route change ----------
   A new history entry (link, typed URL, navigate()) starts at the top; an
   entry seen before (back/forward) restores its own scroll position.      */

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
    // same screen, different query (explore filters): keep position
    if (prevKey.current === routeKey) return
    prevKey.current = routeKey
    window.scrollTo(0, entry.fresh ? 0 : scrollMemory.get(entry.key) || 0)
    document.querySelector('main h1')?.focus({ preventScroll: true })
  })
}

function goBackFrom(route) {
  if (currentEntry()?.depth > 0) window.history.back()
  else if (route.kind === 'detail') navigate(route.from === 'saved' ? '/saved' : `/d/${byId(route.id).date}`)
  else navigate('/')
}

/* ---------- Desktop side list ---------- */

function SideList({ route }) {
  const startup = route.kind === 'detail' ? byId(route.id) : null
  const ctx = useContextList(startup, route.from)
  if (route.kind === 'detail' && route.from === 'saved') {
    return (
      <aside className="split__list" aria-label="저장한 회사">
        <div className="side-head">
          <a href="#/saved" className="side-head__back">
            저장함
          </a>
        </div>
        <ul className="rows">
          {ctx.map((s) => (
            <StartupRow key={s.id} startup={s} compact selected={s.id === route.id} from="saved" />
          ))}
        </ul>
      </aside>
    )
  }
  const date = startup ? startup.date : route.date
  return (
    <aside className="split__list" aria-label="이 호의 회사">
      <IssueHeader date={date} compact />
      <IssueList date={date} selectedId={route.id} compact />
    </aside>
  )
}

function NotFound({ head, arg }) {
  if (head === 'd' && /^\d{4}-\d{2}-\d{2}$/.test(arg || '')) {
    // closest published issue to the requested date
    const target = new Date(arg).getTime()
    const nearest = [...dates].sort((a, b) => Math.abs(new Date(a) - target) - Math.abs(new Date(b) - target))[0]
    return (
      <div className="page">
        <EmptyState
          icon="calendar"
          level={1}
          title="이 날은 발행하지 않았어요"
          actions={
            <a className="btn btn--primary" href={nearest === dates[0] ? '#/' : `#/d/${nearest}`}>
              가장 가까운 호 보기 ({longDate(nearest).replace(/요일$/, '')})
            </a>
          }
        />
      </div>
    )
  }
  const guess = head === 's' ? arg?.replace(/-\d{4}$/, '').replace(/-/g, ' ') : null
  return (
    <div className="page">
      <EmptyState
        icon="info"
        level={1}
        title="이 페이지를 찾을 수 없어요"
        actions={
          <>
            <a className="btn btn--primary" href="#/">
              최신 호 보기
            </a>
            <a className="btn btn--secondary" href={`#/explore${guess ? `?q=${encodeURIComponent(guess)}` : ''}`}>
              {guess ? `‘${guess}’ 검색` : '탐색에서 찾기'}
            </a>
          </>
        }
      >
        주소가 바뀌었거나 없는 회사·호예요.
      </EmptyState>
    </div>
  )
}

/* ---------- Background news: a new issue, a finished "한국에서는" request ---------- */

function Notifier() {
  const toast = useToast()
  useEffect(
    () =>
      onUpdate((kind, meta) => {
        const label = kind === 'issue' && meta?.last_issue_date ? `${monthDay(meta.last_issue_date)} 호가 나왔어요` : '새 버전이 있어요'
        toast(label, { label: '새로고침', onClick: () => window.location.reload() }, 15000)
      }),
    [toast],
  )
  useEffect(
    () =>
      onLensReady((id) => {
        if (window.location.hash.startsWith(`#/s/${id}`)) return // already looking at it
        const s = byId(id)
        toast(`${s?.name_ko || '요청한 회사'} 한국 분석이 준비됐어요`, { label: '보기', onClick: () => navigate(`/s/${id}`) }, 10000)
      }),
    [toast],
  )
  return null
}

/* ---------- App ---------- */

export default function App() {
  const loc = useRoute()
  const route = resolve(loc)
  const desktop = useMediaQuery('(min-width: 1024px)')
  const wide = useMediaQuery('(min-width: 1280px)')
  const routeKey = `${route.kind}:${route.date || route.id || ''}:${route.from || ''}`
  useRouteEffects(routeKey, titleFor(route))

  const [scrolledPastHero, setScrolledPastHero] = useState(false)
  useEffect(() => {
    if (route.kind !== 'detail') return
    const onScroll = () => setScrolledPastHero(window.scrollY > 200)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [route.kind])

  const split = desktop && (route.kind === 'issue' || route.kind === 'detail')
  const showBack = !desktop && (route.kind === 'detail' || route.kind === 'about')

  let content
  if (route.kind === 'issue') content = desktop ? <IssueOverview date={route.date} wide={wide} /> : <IssueMobile date={route.date} />
  else if (route.kind === 'detail')
    content = <Detail key={route.id} id={route.id} from={route.from} desktop={desktop} wide={wide} />
  else if (route.kind === 'explore') content = <Explore params={loc.params} desktop={desktop} />
  else if (route.kind === 'saved') content = <Saved params={loc.params} />
  else if (route.kind === 'about') content = <About params={loc.params} />
  else content = <NotFound head={route.head} arg={route.arg} />

  const rail = wide && split && (route.kind === 'detail' ? <DetailRail key={route.id} id={route.id} /> : <IssueRail date={route.date} />)

  return (
    <ToastProvider>
      <Notifier />
      <a className="skip" href="#main" onClick={(e) => (e.preventDefault(), document.getElementById('main')?.focus())}>
        본문으로 건너뛰기
      </a>
      <AppHeader
        desktop={desktop}
        section={route.section}
        back={showBack ? { label: '뒤로', onClick: () => goBackFrom(route) } : null}
        title={route.kind === 'detail' ? { text: byId(route.id).name_ko, visible: scrolledPastHero } : null}
      />
      <div className={`shell ${split ? 'shell--split' : ''} ${rail ? 'shell--rail' : ''} shell--${route.kind}`}>
        {split && <SideList route={route} />}
        <main id="main" tabIndex={-1} className="shell__main">
          {content}
          {desktop && !split && route.kind !== 'about' && <Footer />}
        </main>
        {rail && <aside className="split__rail">{rail}</aside>}
      </div>
      {!desktop && route.kind !== 'detail' && <TabBar section={route.section} />}
    </ToastProvider>
  )
}


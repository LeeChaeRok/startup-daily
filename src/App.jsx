import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AppHeader, Footer, TabBar } from './components/Chrome.jsx'
import { ToastProvider } from './components/Toast.jsx'
import Onboarding from './components/Onboarding.jsx'
import { useToast } from './components/toast-context.js'
import { EmptyState } from './components/bits.jsx'
import StartupRow from './components/StartupRow.jsx'
import { IssueHeader, IssueList, IssueMobile, IssueOverview, IssueRail } from './screens/Issue.jsx'
import Detail, { DetailRail } from './screens/Detail.jsx'
import { onLensReady, useContextList } from './screens/detail-hooks.jsx'
import Explore from './screens/Explore.jsx'
import Saved from './screens/Saved.jsx'
import About from './screens/About.jsx'
import Settings from './screens/Settings.jsx'
import Weekly from './screens/Weekly.jsx'
import Sector from './screens/Sector.jsx'
import { SECTORS, byDate, byId, dates, issueNo, useDataLevel, weeks } from './lib/data.js'
import { navigate, useMediaQuery, useReadLog, useRoute } from './lib/hooks.js'
import { claimEntry, currentEntry, scrollMemory } from './lib/nav.js'
import { longDate, monthDay, weekLabel } from './lib/format.js'
import { onUpdate } from './lib/update.js'
import { L } from './lib/i18n.js'

/* ---------- Route → screen ---------- */

function resolve({ parts, params }) {
  const [head, arg] = parts
  if (!head) return { kind: 'issue', date: dates[0], section: 'issue' }
  if (head === 'd' && dates.includes(arg)) return { kind: 'issue', date: arg, section: 'issue' }
  if (head === 's' && byId(arg)) return { kind: 'detail', id: arg, from: params.get('from'), section: params.get('from') === 'saved' ? 'saved' : 'issue' }
  if (head === 'explore') return { kind: 'explore', section: 'explore' }
  if (head === 'saved') return { kind: 'saved', section: 'saved' }
  if (head === 'about') return { kind: 'about', section: 'about' }
  if (head === 'settings') return { kind: 'settings', section: 'about' }
  if (head === 'w' && weeks.some((w) => w.key === arg)) return { kind: 'weekly', week: arg, section: 'explore' }
  if (head === 't' && arg) return { kind: 'sector', sector: arg, section: 'explore' }
  return { kind: 'missing', section: null, head, arg }
}

function titleFor(r) {
  if (r.kind === 'issue') return L(`제${issueNo(r.date)}호 ${longDate(r.date)}`, `Issue ${issueNo(r.date)} · ${longDate(r.date)}`) + ' — Startup Daily'
  if (r.kind === 'detail') return `${byId(r.id).name_ko} — Startup Daily`
  if (r.kind === 'explore') return `${L('탐색', 'Explore')} — Startup Daily`
  if (r.kind === 'saved') return `${L('저장함', 'Saved')} — Startup Daily`
  if (r.kind === 'about') return `${L('소개·선정 기준', 'About and how we pick')} — Startup Daily`
  if (r.kind === 'settings') return `${L('설정', 'Settings')} — Startup Daily`
  if (r.kind === 'weekly') return `${L(`${weekLabel(r.week)} 주간 정리`, weekLabel(r.week))} — Startup Daily`
  if (r.kind === 'sector') {
    const label = SECTORS.find((s) => s.key === r.sector)?.label
    return `${L(`${label || '분야'} 모아 보기`, label || 'Sector')} — Startup Daily`
  }
  return `${L('찾을 수 없음', 'Not found')} — Startup Daily`
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
      <aside className="split__list" aria-label={L('저장한 회사', 'Saved companies')}>
        <div className="side-head">
          <a href="#/saved" className="side-head__back">
            {L('저장함', 'Saved')}
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
    <aside className="split__list" aria-label={L('이 호의 회사', 'Companies in this issue')}>
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
          title={L('이 날은 발행하지 않았어요', 'No issue on this date')}
          actions={
            <a className="btn btn--primary" href={nearest === dates[0] ? '#/' : `#/d/${nearest}`}>
              {L(`가장 가까운 호 보기 (${longDate(nearest).replace(/요일$/, '')})`, `See the nearest issue (${monthDay(nearest)})`)}
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
        title={L('이 페이지를 찾을 수 없어요', 'Page not found')}
        actions={
          <>
            <a className="btn btn--primary" href="#/">
              {L('최신 호 보기', 'See the latest issue')}
            </a>
            <a className="btn btn--secondary" href={`#/explore${guess ? `?q=${encodeURIComponent(guess)}` : ''}`}>
              {guess ? L(`‘${guess}’ 검색`, `Search for “${guess}”`) : L('탐색에서 찾기', 'Search in Explore')}
            </a>
          </>
        }
      >
        {L('주소가 바뀌었거나 없는 회사·호예요.', 'The link may have changed, or this company or issue doesn’t exist.')}
      </EmptyState>
    </div>
  )
}

/** A company page opened before the full records arrived (usually a fraction of a second). */
function DetailPending({ failed }) {
  if (failed) {
    return (
      <EmptyState
        icon="explore"
        title={L('회사 정보를 불러오지 못했어요', 'Couldn’t load this company')}
        actions={
          <button type="button" className="btn btn--primary" onClick={() => window.location.reload()}>
            {L('다시 시도', 'Try again')}
          </button>
        }
      >
        {L('인터넷 연결을 확인해 주세요.', 'Check your connection and try again.')}
      </EmptyState>
    )
  }
  return (
    <div className="boot__body" aria-busy="true">
      <div className="boot__line boot__line--title" />
      <div className="boot__line boot__line--sub" />
      <div className="boot__row" />
      <div className="boot__row" />
    </div>
  )
}

/* ---------- Background news: a new issue, a finished "한국에서는" request ---------- */

function Notifier() {
  const toast = useToast()
  useEffect(
    () =>
      onUpdate((kind, meta) => {
        const label = kind === 'issue' && meta?.last_issue_date ? L(`${monthDay(meta.last_issue_date)} 호가 나왔어요`, `New issue: ${monthDay(meta.last_issue_date)}`) : L('새 버전이 있어요', 'A new version is available')
        toast(label, { label: L('새로고침', 'Reload'), onClick: () => window.location.reload() }, 15000)
      }),
    [toast],
  )
  useEffect(
    () =>
      onLensReady((id) => {
        if (window.location.hash.startsWith(`#/s/${id}`)) return // already looking at it
        const s = byId(id)
        toast(L(`${s?.name_ko || '요청한 회사'} 한국 분석이 준비됐어요`, `Korea analysis is ready for ${s?.name_ko || 'the company you asked about'}`), { label: L('보기', 'View'), onClick: () => navigate(`/s/${id}`) }, 10000)
      }),
    [toast],
  )
  return null
}

/** App icon badge = companies in the latest issue not read yet (installed apps only). */
function useAppBadge() {
  const { isRead } = useReadLog()
  const unread = dates[0] ? byDate(dates[0]).filter((s) => !isRead(s.id)).length : 0
  useEffect(() => {
    if (!('setAppBadge' in navigator)) return
    ;(unread ? navigator.setAppBadge(unread) : navigator.clearAppBadge()).catch(() => {})
  }, [unread])
}

/* ---------- App ---------- */

export default function App() {
  const loc = useRoute()
  const route = resolve(loc)
  const desktop = useMediaQuery('(min-width: 1024px)')
  const wide = useMediaQuery('(min-width: 1280px)')
  const dataLevel = useDataLevel()
  useAppBadge()
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
  const showBack = !desktop && (route.kind === 'detail' || route.kind === 'about' || route.kind === 'settings')

  let content
  if (route.kind === 'issue') content = desktop ? <IssueOverview date={route.date} wide={wide} /> : <IssueMobile date={route.date} />
  else if (route.kind === 'detail')
    content =
      dataLevel === 'full' ? (
        <Detail key={route.id} id={route.id} from={route.from} desktop={desktop} wide={wide} />
      ) : (
        <DetailPending failed={dataLevel === 'failed'} />
      )
  else if (route.kind === 'explore') content = <Explore params={loc.params} desktop={desktop} />
  else if (route.kind === 'saved') content = <Saved params={loc.params} />
  else if (route.kind === 'about') content = <About params={loc.params} />
  else if (route.kind === 'settings') content = <Settings />
  else if (route.kind === 'weekly') content = <Weekly week={route.week} />
  else if (route.kind === 'sector') content = <Sector sector={route.sector} />
  else content = <NotFound head={route.head} arg={route.arg} />

  const rail = wide && split && dataLevel === 'full' && (route.kind === 'detail' ? <DetailRail key={route.id} id={route.id} /> : <IssueRail date={route.date} />)

  return (
    <ToastProvider>
      <Notifier />
      {/* the taste sheet (role and sectors); opened from the issue screen and 설정 */}
      <Onboarding />
      <a className="skip" href="#main" onClick={(e) => (e.preventDefault(), document.getElementById('main')?.focus())}>
        {L('본문으로 건너뛰기', 'Skip to content')}
      </a>
      <AppHeader
        desktop={desktop}
        section={route.section}
        back={showBack ? { label: L('뒤로', 'Back'), onClick: () => goBackFrom(route) } : null}
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


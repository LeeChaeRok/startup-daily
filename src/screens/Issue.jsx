import { useEffect, useId, useRef, useState } from 'react'
import { LastWeekCard } from './Weekly.jsx'
import { FollowUpSection } from '../components/FollowUp.jsx'
import Icon from '../components/Icon.jsx'
import Logo from '../components/Logo.jsx'
import StartupRow from '../components/StartupRow.jsx'
import ForRoleLine from '../components/ForRoleLine.jsx'
import { AiNote, CorrectionBadge, MarkAllRead, Meta, ProgressRing } from '../components/bits.jsx'
import { Footer } from '../components/Chrome.jsx'
import { byDate, dates, followUps, formatUSD, issueNo, sectorMix, stats } from '../lib/data.js'
import { buildQuery, localDate, useFlag, useInterests, useMuted, useReadLog } from '../lib/hooks.js'
import { daysSince, dotDate, longDate, monthDay, numClass, pad2, readMinutes, shortDate } from '../lib/format.js'
import { canonicalUrl, shareOrCopy } from '../lib/share.js'
import { currentEntry } from '../lib/nav.js'
import { useIssueOrder, useOrder, usePastPicks, useRole, useTastePrompt } from '../lib/personal.js'
import { maybeAskTaste, openTaste } from '../lib/taste.js'
import { useHomeTab, useMyIssue } from '../lib/my-issue.js'
import { track } from '../lib/analytics.js'
import { load } from '../lib/storage.js'
import { useToast } from '../components/toast-context.js'
import { sectorHue } from '../lib/sectors.js'
import { L } from '../lib/i18n.js'

const plural = (n, one, many = `${one}s`) => (n === 1 ? one : many)

function useIssue(date) {
  const list = byDate(date)
  const { isRead, readLog } = useReadLog()
  const done = list.filter((s) => isRead(s.id)).length
  return { list, done, readLog }
}

/** "새 호" badge: the latest issue counts as seen after 4 seconds on screen. */
function useIsNew(date) {
  const [lastSeen, setLastSeen] = useFlag('sd_last_issue', null)
  const latest = date === dates[0]
  useEffect(() => {
    if (latest && lastSeen !== date) {
      const t = setTimeout(() => setLastSeen(date), 4000)
      return () => clearTimeout(t)
    }
  }, [latest, lastSeen, date, setLastSeen])
  return latest && lastSeen && lastSeen < date
}

/** "최신 호" honestly: only say 오늘 when the issue really is today. */
export function IssueHeader({ date, compact = false }) {
  const { list, done } = useIssue(date)
  const latest = date === dates[0]
  const gap = daysSince(dates[0])
  const idx = dates.indexOf(date)
  const isNew = useIsNew(date)

  const eyebrow = latest
    ? gap === 0
      ? L('오늘의 스타트업', "Today's startups")
      : L('최신 호', 'Latest issue')
    : L('지난 호', 'Past issue')

  return (
    <header className={`issue-head ${compact ? 'issue-head--compact' : ''}`}>
      <div className="issue-head__rule" aria-hidden="true" />
      <div className="issue-head__top">
        <p className="eyebrow">
          {eyebrow} · {L('제', 'Issue #')}
          <span className="mono">{issueNo(date)}</span>
          {L('호', '')}
          {isNew && <span className="badge badge--accent">{L('새 호', 'New')}</span>}
        </p>
        <ProgressRing done={done} total={list.length} />
      </div>
      {compact ? (
        <h2 className="issue-head__title">{longDate(date)}</h2>
      ) : (
        <h1 className="issue-head__title" tabIndex={-1}>
          {longDate(date)}
        </h1>
      )}
      <p className="issue-head__sub">
        {L(
          <>
            스타트업 <span className="num">{list.length}</span>곳 · 요약 읽기 약{' '}
            <span className="num">{readMinutes(list)}</span>분
          </>,
          <>
            <span className="num">{list.length}</span> {plural(list.length, 'startup')} ·{' '}
            <span className="num">{readMinutes(list)}</span>-min read
          </>,
        )}
        {done === list.length && list.length > 0 && (
          <span className="issue-head__done">
            <Icon name="check" size={16} /> {L('완독', 'All read')}
          </span>
        )}
      </p>
      {!compact && done > 0 && <MarkAllRead list={list} />}
      {latest && gap >= 2 && !compact && (
        <p className="issue-head__stale">
          {L(`${monthDay(date)} 이후 새 호가 없어요.`, `No new issue since ${monthDay(date)}.`)}{' '}
          <a href="#/explore?view=issues">{L('지난 호 보기', 'See past issues')}</a>
        </p>
      )}
      {!latest && !compact && <IssueNav idx={idx} />}
    </header>
  )
}

function IssueNav({ idx }) {
  return (
    <nav className="issue-nav" aria-label={L('호 이동', 'Issue navigation')}>
      {dates[idx + 1] ? (
        <a className="issue-nav__link" href={`#/d/${dates[idx + 1]}`}>
          <Icon name="chevronLeft" size={16} /> {L('이전 호', 'Previous')} <span className="mono">{shortDate(dates[idx + 1])}</span>
        </a>
      ) : (
        <span />
      )}
      {dates[idx - 1] && (
        <a className="issue-nav__link" href={idx - 1 === 0 ? '#/' : `#/d/${dates[idx - 1]}`}>
          {L('다음 호', 'Next')} <span className="mono">{shortDate(dates[idx - 1])}</span> <Icon name="chevronRight" size={16} />
        </a>
      )}
    </nav>
  )
}

/** Desktop side list: the issue in the reader's order (same as prev/next on a company page). */
export function IssueList({ date, selectedId, compact }) {
  const { list } = useIssueOrder(byDate(date))
  return (
    <ol className="rows" aria-label={L(`제${issueNo(date)}호 스타트업 목록`, `Startups in issue #${issueNo(date)}`)}>
      {list.map((s, i) => (
        <StartupRow key={s.id} startup={s} rank={i + 1} compact={compact} selected={s.id === selectedId} />
      ))}
    </ol>
  )
}

export function SectorMix({ list, label = L('이 호의 분야', 'Sectors in this issue') }) {
  const mix = sectorMix(list)
  return (
    <p className="sector-mix">
      <span className="sector-mix__label">{label}</span>
      <Meta
        items={mix.map(([label, n]) => (
          <span key={label} className="sector-mix__item">
            {label} <span className="num">{n}</span>
          </span>
        ))}
      />
    </p>
  )
}

/** Next unread: this issue first, then the newest issue that still has one. */
function useContinue(date) {
  const { isRead } = useReadLog()
  const here = byDate(date).find((s) => !isRead(s.id))
  if (here) return { startup: here, date }
  for (const d of dates) {
    const s = byDate(d).find((x) => !isRead(x.id))
    if (s) return { startup: s, date: d }
  }
  return null
}

function useIssueShare(date) {
  const toast = useToast()
  return async () => {
    const list = byDate(date)
    const mix = sectorMix(list)
      .slice(0, 3)
      .map(([l, n]) => `${l} ${n}`)
      .join(' · ')
    const r = await shareOrCopy({
      title: L(`Startup Daily 제${issueNo(date)}호`, `Startup Daily issue #${issueNo(date)}`),
      text: L(
        `${monthDay(date)} · ${mix} · ${list.length}곳`,
        `${monthDay(date)} · ${mix} · ${list.length} ${plural(list.length, 'startup')}`,
      ),
      url: canonicalUrl(`/d/${date}`),
    })
    if (r === 'copied') toast(L('링크를 복사했어요', 'Link copied'))
    if (r === 'manual') toast(L('복사하지 못했어요. 주소창의 링크를 이용해 주세요', "Couldn't copy. Use the link in the address bar"))
  }
}

/** Desktop: the completion card (share, keep reading elsewhere). */
function ContinueCard({ date }) {
  const next = useContinue(date)
  const { list, done } = useIssue(date)
  const { readLog } = useReadLog()
  const totalRead = Object.keys(readLog).length

  const share = useIssueShare(date)

  if (done === list.length && list.length > 0) {
    return (
      <section className="card card--done" aria-labelledby="done-title">
        <h2 id="done-title" className="card__title">
          <Icon name="check" size={18} />
          <span>{L(`제${issueNo(date)}호를 다 읽었어요`, `You've read all of issue #${issueNo(date)}`)}</span>
        </h2>
        <p className="card__text">
          {L(
            <>
              지금까지 <span className="num">{stats.companies}</span>곳 중 <span className="num">{totalRead}</span>곳을
              읽었어요.
            </>,
            <>
              So far you've read <span className="num">{totalRead}</span> of{' '}
              <span className="num">{stats.companies}</span> startups.
            </>,
          )}
        </p>
        <div className="card__actions">
          <button type="button" className="btn btn--secondary" onClick={share}>
            <Icon name="share" size={18} /> {L('이 호 공유', 'Share this issue')}
          </button>
          {next ? (
            <a className="btn btn--primary" href={`#/s/${next.startup.id}`}>
              {L('이어 읽기', 'Keep reading')} <Icon name="arrowRight" size={18} />
            </a>
          ) : (
            <a className="btn btn--primary" href="#/explore?view=issues">
              {L('지난 호 보기', 'See past issues')}
            </a>
          )}
        </div>
        {next && next.date !== date && (
          <p className="card__hint">
            {L(
              `다음은 제${issueNo(next.date)}호(${monthDay(next.date)})의 ${next.startup.name_ko}`,
              `Up next: ${next.startup.name_ko}, from issue #${issueNo(next.date)} (${monthDay(next.date)})`,
            )}
          </p>
        )}
      </section>
    )
  }

  // before that, "where to start" is the hero's job (Preview on desktop)
  return null
}

export function PastIssues({ current, limit = 3, title = L('지난 호', 'Past issues') }) {
  const { isRead } = useReadLog()
  const list = dates.filter((d) => d !== current).slice(0, limit)
  return (
    <section className="past" aria-labelledby="past-title">
      <div className="section-head">
        <h2 id="past-title" className="section-head__title">
          {title}
        </h2>
        <a href="#/explore?view=issues" className="section-head__more">
          {L(
            <>
              전체 <span className="num">{stats.issues}</span>호
            </>,
            <>
              All <span className="num">{stats.issues}</span> issues
            </>,
          )}
        </a>
      </div>
      <ul className="issue-rows">
        {list.map((d) => (
          <IssueRowItem key={d} date={d} isRead={isRead} />
        ))}
      </ul>
    </section>
  )
}

export function IssueRowItem({ date, isRead, showSectors = false }) {
  const items = byDate(date)
  const done = items.filter((s) => isRead(s.id)).length
  return (
    <li>
      <a className="issue-row" href={date === dates[0] ? '#/' : `#/d/${date}`}>
        <span className="issue-row__date">
          <span className="num">{issueNo(date)}</span>
          {L('호', '')}
        </span>
        <span className="issue-row__main">
          <span className="issue-row__title">
            {longDate(date).replace(/요일$/, '')}
            {/* the number sits in the left column; the grid layout has no left column */}
            <span className="issue-row__no">
              {' '}
              · {L('제', '#')}
              <span className="num">{issueNo(date)}</span>
              {L('호', '')}
            </span>
          </span>
          <span className="issue-row__stack" aria-hidden="true">
            {items.slice(0, 5).map((s) => (
              <Logo key={s.id} startup={s} size={22} />
            ))}
            {items.length > 5 && <span className="issue-row__more mono">+{items.length - 5}</span>}
          </span>
          {showSectors && (
            <Meta
              className="issue-row__sectors"
              items={sectorMix(items)
                .slice(0, 3)
                .map(([l, n]) => (
                  <span key={l} className="sector-mix__item">
                    {l} {n}
                  </span>
                ))}
            />
          )}
        </span>
        <span className="issue-row__status">
          {done === items.length ? (
            <span className="issue-row__done">
              <Icon name="check" size={16} /> {L('완독', 'All read')}
            </span>
          ) : (
            <>
              <span className="num">{items.length}</span>
              {L('곳', '')}
              {done > 0 && <> · {done} {L('읽음', 'read')}</>}
            </>
          )}
        </span>
      </a>
    </li>
  )
}

function NumbersStrip({ list }) {
  const countries = new Set(list.map((s) => s.headquarters?.country_ko).filter(Boolean))
  const known = list.filter((s) => s._raisedUSD != null)
  const sum = known.reduce((n, s) => n + s._raisedUSD, 0)
  const unknown = list.length - known.length
  return (
    <section className="numbers" aria-labelledby="numbers-title">
      <div className="section-head section-head--plain">
        <h2 id="numbers-title" className="section-head__title">
          {L('이 호의 숫자', 'This issue in numbers')}
        </h2>
      </div>
      <dl className="numbers__grid">
        <div>
          <dt>{L('소개 기업', 'Startups')}</dt>
          <dd>
            <span className="mono">{list.length}</span>
            {L(<small>곳</small>, null)}
          </dd>
        </div>
        <div>
          <dt>{L('국가', 'Countries')}</dt>
          <dd>
            <span className="mono">{countries.size}</span>
            {L(<small>개국</small>, null)}
          </dd>
        </div>
        <div>
          <dt>{L('분야', 'Sectors')}</dt>
          <dd>
            <span className="mono">{sectorMix(list).length}</span>
            {L(<small>개</small>, null)}
          </dd>
        </div>
        <div>
          <dt>
            {L('누적 투자 합', 'Total raised (sum)')} <span className="tag tag--warn">{L('추정', 'est.')}</span>
          </dt>
          <dd>
            <span className="mono">≈{formatUSD(sum)}</span>
            {unknown > 0 && (
              <small className="numbers__aside">{L(`${unknown}곳 미공개`, `${unknown} undisclosed`)}</small>
            )}
          </dd>
        </div>
      </dl>
    </section>
  )
}

/** Where the issue's hero points: the first unread company in the reader's order.
    `mine`: the reader's own five ("내 5곳"), already in their order. */
function useHeroPick(date, mine = null, skip = null, editorial = false) {
  const { isRead } = useReadLog()
  const { muted } = useMuted()
  const published = useIssueOrder(byDate(date))
  // next to "내 5곳" the shared five keeps the published order (hidden sectors still last):
  // personalizing is the tab's job, not a second ordering control
  const asPublished = () => {
    const l = byDate(date)
    return { list: [...l.filter((s) => !muted.includes(s._sector.key)), ...l.filter((s) => muted.includes(s._sector.key))], personal: false, differs: false }
  }
  const order = mine ? { list: mine, personal: true, differs: false } : editorial ? asPublished() : published
  // folded rows (hidden sectors) never become the hero
  const idx = order.list.findIndex((s) => !isRead(s.id) && !skip?.has(s.id))
  return { ...order, hero: idx >= 0 ? order.list[idx] : null, rank: idx + 1 }
}

/** Desktop center column: the same pick as the mobile hero. */
function Preview({ startup: s, rank, resume }) {
  if (!s) return null
  return (
    <article className="preview" aria-labelledby="preview-title">
      <p className="kicker">
        {resume && <strong className="kicker__resume">{L('이어 읽기', 'Keep reading')} · </strong>}
        <span className="mono">{pad2(rank)}</span> · {s._sector.label} · {s.headquarters?.country_ko}
      </p>
      <div className="preview__name">
        <Logo startup={s} size={56} />
        <div>
          <h2 id="preview-title" className="preview__title">
            {s.name_ko}
          </h2>
          {s.name_en && s.name_en !== s.name_ko && (
            <p className="preview__en" lang="en">
              {s.name_en}
            </p>
          )}
        </div>
      </div>
      <p className="preview__tagline">{s.tagline}</p>
      <div className="block">
        <h3 className="block__label">{L('왜 지금', 'Why now')}</h3>
        <p className="block__text">{s.trending_reason?.summary || s.trending_reason?.catalysts?.[0]}</p>
      </div>
      {s.editor_pick_comment && (
        <blockquote className="quote">
          <p>{s.editor_pick_comment}</p>
          <footer>
            {L('한 줄 코멘트', 'One-line take')} <span className="tag">{L('AI 작성', 'By AI')}</span>
          </footer>
        </blockquote>
      )}
      <ForRoleLine startup={s} variant="detail" />
      <a className="link-cta" href={`#/s/${s.id}`}>
        {L('전체 읽기', 'Read')} <Icon name="arrowRight" size={16} />
      </a>
    </article>
  )
}

/* ---------- Mobile issue (S1, S2): title → progress → hero → rows ---------- */

/** Has the reader ever finished a whole issue? The brand line shows until then. */
function IssueTitle({ date }) {
  const latest = date === dates[0]
  const isNew = useIsNew(date)
  return (
    <header className="issue-title">
      <h1 className="issue-title__h" tabIndex={-1}>
        {monthDay(date)} · {L('제', 'Issue #')}
        <span className="mono">{issueNo(date)}</span>
        {L('호', '')}
        {isNew && <span className="badge badge--accent">{L('새 호', 'New')}</span>}
      </h1>
      {!latest && <IssueNav idx={dates.indexOf(date)} />}
    </header>
  )
}

/** "아직 모르는, 지금 뜨는 스타트업 5곳 · 2/5" + one cell per company, in published order. */
function IssueProgress({ date, list = byDate(date), folded = 0, mine = false, discovery = false }) {
  const { isRead } = useReadLog()
  const done = list.filter((s) => isRead(s.id)).length
  const all = list.length > 0 && done === list.length
  const n = list.length
  return (
    <div className="issue-progress">
      <p className="issue-progress__text">
        <span className="issue-progress__count">
          {mine ? (
            discovery ? (
              L(
                <>
                  고른 분야에서 <span className="num">{n - 1}</span>곳, 관심 밖에서 <span className="num">1</span>곳
                </>,
                <>
                  <span className="num">{n - 1}</span> from your sectors, <span className="num">1</span> from outside
                </>,
              )
            ) : (
              L(
                <>
                  고른 분야에서 <span className="num">{n}</span>곳
                </>,
                <>
                  <span className="num">{n}</span> from your sectors
                </>,
              )
            )
          ) : L(
            <>
              아직 모르는, 지금 뜨는 스타트업 <span className="num">{n}</span>곳
            </>,
            <>
              <span className="num">{n}</span> {plural(n, 'startup')} you haven't heard of yet
            </>,
          )}
        </span>
        <span className="issue-progress__read">
          <span className="sr-only">{L(`${n}곳 중 ${done}곳 읽음`, `${done} of ${n} read`)}</span>
          <span aria-hidden="true">
            {done}/{n}
          </span>
          {all && <Icon name="check" size={16} className="issue-progress__check" />}
          {folded > 0 && <span className="issue-progress__folded">{L(` · ${folded}곳 접힘`, ` · ${folded} folded`)}</span>}
        </span>
      </p>
      <span className="issue-progress__bar" aria-hidden="true">
        {list.map((s) => (
          <span key={s.id} className={isRead(s.id) ? 'is-read' : ''} style={sectorHue(s._sector.key)} />
        ))}
      </span>
    </div>
  )
}

/** "내 관심 순 ▾": says the order is the reader's, and switches back to the published one. */
function OrderHead({ personal }) {
  const [, setOrder] = useOrder()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return
    const onDown = (e) => !ref.current?.contains(e.target) && setOpen(false)
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      ref.current?.querySelector('button')?.focus()
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    ref.current?.querySelector('[role="menuitem"]')?.focus()
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const pick = (fn) => () => {
    setOpen(false)
    fn()
  }
  return (
    <div className="order-head" ref={ref}>
      <button type="button" className="order-head__btn" aria-haspopup="menu" aria-expanded={open} aria-controls={menuId} onClick={() => setOpen(!open)}>
        {personal ? L('내 관심 순', 'In your order') : L('발행 순', 'As published')}
        <Icon name="chevronDown" size={16} />
      </button>
      {open && (
        <ul className="order-head__menu" role="menu" id={menuId}>
          <li role="none">
            <button type="button" role="menuitem" onClick={pick(() => setOrder(personal ? 'editorial' : 'personal'))}>
              {personal ? L('발행 순으로 보기', 'Show as published') : L('내 관심 순으로 보기', 'Show in your order')}
            </button>
          </li>
          <li role="none">
            <button type="button" role="menuitem" onClick={pick(() => openTaste('edit'))}>
              {L('역할·분야 바꾸기', 'Change role and sectors')}
            </button>
          </li>
        </ul>
      )}
    </div>
  )
}

/* The first unread company, three things: what it is, what it does, why it matters.
   Stage, amount, English name and the "○○라면" line wait on the company page. */
function Hero({ startup: s, resume, discovery, from }) {
  return (
    <a className="hero" href={`#/s/${s.id}${from ? `?from=${from}` : ''}`}>
      <span className="hero__kicker">
        {resume && <strong>{L('이어 읽기', 'Keep reading')} · </strong>}
        {discovery && <strong>{L('오늘의 발견', "Today's find")} · </strong>}
        {s._sector.label}
        {s.headquarters?.country_ko && <> · {s.headquarters.country_ko}</>}
        <CorrectionBadge correction={s._correction} />
      </span>
      <span className="hero__id">
        <Logo startup={s} size={44} />
        <span className="hero__name">{s.name_ko || s.name_en}</span>
      </span>
      {s.tagline && <span className="hero__tagline">{s.tagline}</span>}
      {(s._stage || s._raisedShort) && (
        <span className="hero__facts">
          {s._stage && <span>{s._stage}</span>}
          {s._raisedShort && (
            <span>
              {L('누적', 'Raised')} <b className={numClass(s._raisedShort)}>{s._raisedShort}</b>
            </span>
          )}
          {s.founded_year && <span>{L(`${s.founded_year}년 설립`, `Founded ${s.founded_year}`)}</span>}
        </span>
      )}
      {/* why now is the concrete reason to read today; the AI one-liner only when it is missing */}
      {s.trending_reason?.summary ? (
        <span className="hero__why">
          <strong>{L('왜 지금', 'Why now')}</strong> {s.trending_reason.summary}
        </span>
      ) : s.editor_pick_comment && (
        <span className="hero__comment">
          {/* first, so the two-line clamp never hides it */}
          <span className="hero__ai">
            <span className="sr-only">{L('AI 코멘트: ', 'AI take: ')}</span>
            <span aria-hidden="true">AI</span>
          </span>
          {s.editor_pick_comment}
        </span>
      )}
    </a>
  )
}

/** Small company line for the cards (past picks). */
function MiniRow({ startup: s }) {
  return (
    <li>
      <a className="mini-row" href={`#/s/${s.id}`}>
        <Logo startup={s} size={32} />
        <span className="mini-row__body">
          <span className="mini-row__name">{s.name_ko || s.name_en}</span>
          <span className="mini-row__meta">
            {s._sector.label} · {L(`${monthDay(s.date)} 호`, `${monthDay(s.date)} issue`)}
          </span>
        </span>
        <Icon name="chevronRight" size={16} />
      </a>
    </li>
  )
}

/** State C: the whole issue read. Takes the hero's place. */
/** The close of a day: what the five added up to (the progress bar above already shows it in color). */
function DaySum({ list }) {
  if (list.length < 2) return null
  const mix = sectorMix(list)
  const countries = new Set(list.map((s) => s.headquarters?.country_ko).filter(Boolean)).size
  const known = list.filter((s) => s._raisedUSD != null)
  const sum = known.reduce((n, s) => n + s._raisedUSD, 0)
  return (
    <div className="day-sum">
      <p className="day-sum__line">
        <strong>{L(`오늘 읽은 ${list.length}곳`, `Today's ${list.length}`)}</strong> ·{' '}
        {mix.map(([label, n]) => (n > 1 ? `${label} ${n}` : label)).join(', ')}
        {countries > 1 && L(` · ${countries}개국`, ` · ${countries} countries`)}
        {known.length > 0 && L(` · 누적 투자 합 ≈${formatUSD(sum)}`, ` · ≈${formatUSD(sum)} raised in all`)}
      </p>
    </div>
  )
}

function DoneCard({ date, picks }) {
  const latest = date === dates[0]
  const share = useIssueShare(date)
  const news = picks.kind ? [] : followUps(3)
  const label =
    picks.kind === 'interests'
      ? L('내 분야 지난 회사', 'More in your sectors')
      : picks.kind === 'behaviour'
        ? L('최근 읽은 분야의 지난 회사', "More like what you've read")
        : L('그때 그 회사', 'Where are they now')
  const shown = picks.kind ? picks.list : news
  const past = dates.find((d) => d < date)
  return (
    <section className="state-card" aria-labelledby="done-title">
      <h2 id="done-title" className="state-card__title">
        <Icon name="check" size={20} className="state-card__check" />
        {L(`제${issueNo(date)}호를 다 읽었어요`, `You've read all of issue #${issueNo(date)}`)}
      </h2>
      <DaySum list={byDate(date)} />
      {latest && daysSince(date) < 2 && <p className="state-card__text">{L('다음 호는 내일 나와요', 'The next issue is out tomorrow')}</p>}
      {shown.length > 0 ? (
        <>
          <h3 className="state-card__label">{label}</h3>
          <ul className="mini-rows">
            {shown.map((s) => (
              <MiniRow key={s.id} startup={s} />
            ))}
          </ul>
        </>
      ) : (
        past && (
          <p className="state-card__text">
            <a className="state-card__link" href={`#/d/${past}`}>
              {L(`제${issueNo(past)}호 읽기`, `Read issue #${issueNo(past)}`)} <Icon name="chevronRight" size={16} />
            </a>
          </p>
        )
      )}
      <button type="button" className="btn btn--secondary state-card__share" onClick={share}>
        <Icon name="share" size={18} /> {L('이 호 공유', 'Share this issue')}
      </button>
    </section>
  )
}

/** State D: no new issue for two days or more. No streaks, no "you missed it". */
function StaleCard({ date }) {
  const { interests } = useInterests()
  return (
    <section className="state-card state-card--wait" aria-labelledby="stale-title">
      <h2 id="stale-title" className="state-card__title">
        {L('다음 호를 준비하고 있어요', "We're working on the next issue")}
      </h2>
      <p className="state-card__text">
        {L(`${monthDay(date)} 이후 새 호가 없어요.`, `No new issue since ${monthDay(date)}.`)}{' '}
        {interests.length
          ? L('그동안 내 분야 지난 회사를 읽어 보세요.', 'Meanwhile, catch up on earlier companies in your sectors.')
          : L('그동안 지난 호를 읽어 보세요.', 'Meanwhile, catch up on past issues.')}
      </p>
      <a className="state-card__link" href={`#/explore${interests.length ? buildQuery({ sector: interests }) : '?view=issues'}`}>
        {interests.length ? L('내 분야 지난 회사', 'Earlier companies in your sectors') : L('지난 호 보기', 'See past issues')}{' '}
        <Icon name="chevronRight" size={16} />
      </a>
    </section>
  )
}

/** After a skipped taste sheet: one line at the end of the list, on one day only. */
function TasteCard() {
  const [role] = useRole()
  const [prompt, setPrompt] = useTastePrompt()
  const today = localDate()
  const eligible = !role && (prompt.dismissed > 0 || load('sd_onboarded', false))
  const visible = eligible && (!prompt.card || prompt.card === today)
  useEffect(() => {
    if (visible && !prompt.card) setPrompt({ card: today })
  }, [visible, prompt.card, setPrompt, today])
  if (!visible) return null
  return (
    <button type="button" className="taste-card" onClick={() => openTaste('ask')}>
      {load('sd_interests', []).length
        ? L('하는 일을 고르면 회사마다 내 입장의 한 줄을 붙여요', "Pick what you do and we'll add a line for you on each company")
        : L('역할과 분야를 고르면 순서를 맞춰 드려요', "Pick a role and sectors and we'll order each issue for you")}
      <Icon name="chevronRight" size={16} />
    </button>
  )
}

/** "내 5곳 | 모두의 5곳": only when the day has a pool and the reader follows a sector. */
function HomeTabs({ tab, setTab }) {
  const pick = (k) => () => {
    if (k === tab) return
    setTab(k)
    track('tab_switch', { tab: k })
  }
  return (
    <div className="segmented home-tabs" role="group" aria-label={L('오늘의 5곳 보기', "Today's five")}>
      {[
        ['mine', L('내 5곳', 'My five')],
        ['all', L('모두의 5곳', "Everyone's five")],
      ].map(([k, label]) => (
        <button key={k} type="button" aria-pressed={tab === k} className="segmented__tab" onClick={pick(k)}>
          {label}
        </button>
      ))}
    </div>
  )
}

/** "내 5곳" read to the end: what is left in the reader's sectors today. */
function MyDoneCard({ date, more, list }) {
  const { interests } = useInterests()
  const share = useIssueShare(date)
  return (
    <section className="state-card" aria-labelledby="my-done-title">
      <h2 id="my-done-title" className="state-card__title">
        <Icon name="check" size={20} className="state-card__check" />
        {L('내 5곳을 다 읽었어요', "You've read your five")}
      </h2>
      <DaySum list={list} />
      {more > 0 ? (
        <a className="state-card__link" href={`#/explore${buildQuery({ sector: interests })}`}>
          {L(`오늘 내 분야에 ${more}곳 더 있어요`, `${more} more in your sectors today`)} <Icon name="chevronRight" size={16} />
        </a>
      ) : (
        <p className="state-card__text">{L('다음 5곳은 내일 나와요', 'Your next five are out tomorrow')}</p>
      )}
      <button type="button" className="btn btn--secondary state-card__share" onClick={share}>
        <Icon name="share" size={18} /> {L('이 호 공유', 'Share this issue')}
      </button>
    </section>
  )
}

/** The shared five's companies from hidden sectors, folded into one line (_workspace/15 §2-3). */
function FoldedRow({ list, onExpand }) {
  const sectors = [...new Set(list.map((s) => s._sector.label))].join(' · ')
  return (
    <li className="row row--folded">
      <button type="button" className="row-folded" onClick={onExpand} aria-label={L(`숨긴 분야 ${list.length}곳 펼치기`, `Show ${list.length} from hidden sectors`)}>
        <Icon name="eyeOff" size={16} />
        <span className="row-folded__text">
          {L(`숨긴 분야 ${list.length}곳`, `${list.length} from hidden sectors`)} · {sectors}
        </span>
        <span className="row-folded__show">
          {L('보기', 'Show')} <Icon name="chevronDown" size={16} />
        </span>
      </button>
    </li>
  )
}

/** "내 5곳" came out short: hidden sectors, or a thin day in the reader's sectors. */
function ShortCard({ n, hidden }) {
  return (
    <button type="button" className="taste-card short-card" onClick={() => openTaste('edit')}>
      {hidden
        ? L(`숨긴 분야가 많아 오늘은 ${n}곳이에요 · 분야 설정`, `Fewer today (${n}) because of hidden sectors · Sectors`)
        : L(`오늘 내 분야는 ${n}곳이에요 · 분야 설정`, `${n} in your sectors today · Sectors`)}
      <Icon name="chevronRight" size={16} />
    </button>
  )
}

/* ---------- Screens ---------- */

export function IssueMobile({ date }) {
  const { isRead, readLog } = useReadLog()
  const { interests } = useInterests()
  const { muted, unmute } = useMuted()
  const [role] = useRole()
  const [prompt, setPrompt] = useTastePrompt()
  const my = useMyIssue(date)
  const [tab, setTab] = useHomeTab()
  const mine = my.available && tab === 'mine'
  // the shared five keeps all five; hidden sectors fold into one line, unless that would
  // leave fewer than three open (then they only move down, see personal.js)
  const [expanded, setExpanded] = useState(() => new Set())
  const shared = byDate(date)
  const hiddenHere = mine ? [] : shared.filter((s) => muted.includes(s._sector.key))
  const foldable = hiddenHere.length > 0 && shared.length - hiddenHere.length >= 3
  const folded = foldable ? hiddenHere.filter((s) => !expanded.has(s.id)) : []
  const foldedIds = new Set(folded.map((s) => s.id))
  const { list, hero, personal, differs } = useHeroPick(date, mine ? my.list : null, foldedIds, my.available)
  const issue = (mine ? my.list : shared).filter((s) => !foldedIds.has(s.id))
  const latest = date === dates[0]
  const done = issue.filter((s) => isRead(s.id)).length
  const finished = issue.length > 0 && done === issue.length
  const toast = useToast()
  // issue_complete: once, when the last unread company of the shown five is read
  // (not when switching to a tab that was already finished)
  const wasFinished = useRef(null)
  useEffect(() => {
    const key = `${date}:${mine}`
    if (wasFinished.current?.key === key && !wasFinished.current.finished && finished) track('issue_complete', { date, tab: mine ? 'mine' : 'all' })
    wasFinished.current = { key, finished }
  }, [finished, date, mine])
  useEffect(() => {
    if (my.repicked) toast(L('분야 설정을 바꿔 오늘의 5곳을 다시 골랐어요', 'Your sectors changed, so we picked your five again'))
  }, [my.repicked, toast])
  useEffect(() => {
    if (!mine || !my.short) return
    const key = `sd_my_short_${date}`
    try {
      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, '1')
    } catch {
      // private mode: count it again, harmless
    }
    track('my_short', { n: my.list.length, discovery: Boolean(my.discoveryId), date })
  }, [mine, my.short, my.list.length, my.discoveryId, date])
  const expand = () => {
    setExpanded(new Set(hiddenHere.map((s) => s.id)))
    track('folded_expand', { sector: [...new Set(folded.map((s) => s._sector.key))].join(','), date })
  }
  const shownHidden = hiddenHere.filter((s) => !foldedIds.has(s.id))
  const ask = useRef(null)
  ask.current = () => maybeAskTaste({ prompt, setPrompt, role, interests })

  // the taste sheet asks once on its own, and only after a first read: coming back here
  // from a company page. Scrolling the list never interrupts (the list's TasteCard stays).
  useEffect(() => {
    if (!latest) return
    if (currentEntry()?.depth > 0 && Object.keys(readLog).length > 0) ask.current()
    // once per visit to the screen, not on every read-log change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latest, date])

  const picks = usePastPicks(date)
  const rows = (hero ? list.filter((s) => s !== hero) : list).filter((s) => !foldedIds.has(s.id))
  return (
    <div className="page page--issue">
      <IssueTitle date={date} />
      {my.available && <HomeTabs tab={tab} setTab={setTab} />}
      {latest && daysSince(date) >= 2 && <StaleCard date={date} />}
      <IssueProgress date={date} list={issue} folded={folded.length} mine={mine} discovery={mine && Boolean(my.discoveryId)} />
      {!my.available && (differs || !personal) && <OrderHead personal={personal} />}
      {hero ? (
        <Hero startup={hero} resume={done > 0} discovery={mine && hero.id === my.discoveryId} from={mine ? 'mine' : undefined} />
      ) : (
        finished && (mine ? <MyDoneCard date={date} more={my.more} list={issue} /> : <DoneCard date={date} picks={picks} />)
      )}
      <ul
        className="rows rows--issue"
        aria-label={mine ? L('내 5곳', 'My five') : L(`제${issueNo(date)}호 스타트업 목록`, `Startups in issue #${issueNo(date)}`)}
      >
        {rows.map((s) => (
          <StartupRow
            key={s.id}
            startup={s}
            issue
            from={mine ? 'mine' : undefined}
            reason={
              mine && s.id === my.discoveryId
                ? L('오늘의 발견 · 관심 밖에서 하나', "Today's find · one from outside your sectors")
                : muted.includes(s._sector.key)
                  ? L('숨긴 분야', 'Hidden sector')
                  : null
            }
          />
        ))}
        {folded.length > 0 && <FoldedRow list={folded} onExpand={expand} />}
      </ul>
      {foldable && shownHidden.length > 0 && (
        <p className="unhide-line">
          {[...new Set(shownHidden.map((s) => s._sector.key))].map((k) => {
            const label = shownHidden.find((s) => s._sector.key === k)._sector.label
            return (
              <button
                key={k}
                type="button"
                className="text-btn"
                onClick={() => {
                  unmute(k)
                  track('sector_unmute', { sector: k, source: 'folded_row' })
                  toast(L(`${label} 분야를 다시 보여요`, `${label} is shown again`))
                }}
              >
                {L(`${label} 다시 보기`, `Show ${label} again`)}
              </button>
            )
          })}
        </p>
      )}
      {mine && my.short && <ShortCard n={my.list.length} hidden={muted.length > 0} />}
      {done > 0 && <MarkAllRead list={issue} />}
      {latest && <TasteCard />}
      {latest && <LastWeekCard />}
      {/* when the done card already lists them, don't repeat */}
      {latest && !(finished && !picks.kind) && <FollowUpSection />}
      <PastIssues current={date} />
      <p className="footnote">
        <Icon name="info" size={16} />
        <span>
          {L('AI가 공개 자료로 작성하고 모든 사실을 사람이 확인하지는 않아요.', 'Written by AI from public sources; not every fact is checked by a person.')}
        </span>
      </p>
      <p className="data-range">
        {L('데이터', 'Data')} <span className="mono">{dotDate(stats.first)}</span>–
        <span className="mono">{dotDate(stats.last)}</span> ·{' '}
        {L(
          `${stats.issues}호 · ${stats.companies}곳`,
          `${stats.issues} ${plural(stats.issues, 'issue')} · ${stats.companies} ${plural(stats.companies, 'startup')}`,
        )}
      </p>
      <Footer />
    </div>
  )
}

/** Desktop center column for #/ and #/d/:date. */
export function IssueOverview({ date, wide }) {
  const list = byDate(date)
  const { hero, rank, list: ordered } = useHeroPick(date)
  const { isRead } = useReadLog()
  const resume = list.some((s) => isRead(s.id))
  return (
    <div className="overview">
      <IssueHeader date={date} />
      {/* with the ≥1280 rail, the notice lives in its "이 서비스는" box */}
      {!wide && <AiNote />}
      <NumbersStrip list={list} />
      <SectorMix list={list} />
      <ContinueCard date={date} />
      {date === dates[0] && <LastWeekCard />}
      <Preview startup={hero || ordered[0]} rank={hero ? rank : 1} resume={Boolean(hero) && resume} />
      {date === dates[0] && <FollowUpSection />}
      {/* without the ≥1280 rail, past issues and the footer move under the article */}
      {!wide && (
        <>
          <PastIssues current={date} />
          <Footer />
        </>
      )}
    </div>
  )
}

export function IssueRail({ date }) {
  return (
    <div className="rail">
      <PastIssues current={date} limit={5} />
      <section className="rail__box" aria-labelledby="trust-title">
        <h2 id="trust-title" className="rail__title">
          {L('이 서비스는', 'About this service')}
        </h2>
        <p>
          {L(
            'AI가 공개 자료로 작성하고, 모든 사실을 사람이 검증하지는 않아요. 오류가 확인되면 정정 기록에 남깁니다.',
            'Written by AI from public sources; not every fact is checked by a person. Confirmed errors are logged in Corrections.',
          )}
        </p>
        <p className="rail__links">
          <a href="#/about">{L('선정 기준', 'How we pick')}</a> ·{' '}
          <a href="#/about?sec=corrections">{L('정정 기록', 'Corrections')}</a>
        </p>
      </section>
      <Footer />
    </div>
  )
}

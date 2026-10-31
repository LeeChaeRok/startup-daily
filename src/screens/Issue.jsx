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
import { buildQuery, localDate, useFlag, useInterests, useReadLog } from '../lib/hooks.js'
import { daysSince, dotDate, longDate, monthDay, numClass, pad2, readMinutes, shortDate } from '../lib/format.js'
import { canonicalUrl, shareOrCopy } from '../lib/share.js'
import { currentEntry } from '../lib/nav.js'
import { useIssueOrder, useOrder, usePastPicks, useRole, useTastePrompt } from '../lib/personal.js'
import { maybeAskTaste, openTaste } from '../lib/taste.js'
import { load } from '../lib/storage.js'
import { useToast } from '../components/toast-context.js'
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

export function SectorMix({ list }) {
  const mix = sectorMix(list)
  return (
    <p className="sector-mix">
      <span className="sector-mix__label">{L('이 호의 분야', 'Sectors in this issue')}</span>
      <Meta
        items={mix.map(([label, n]) => (
          <span key={label}>
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
        <span className="issue-row__date mono">{shortDate(date).split(' ')[0]}</span>
        <span className="issue-row__main">
          <span className="issue-row__title">
            {longDate(date).replace(/요일$/, '')} · {L('제', '#')}
            <span className="num">{issueNo(date)}</span>
            {L('호', '')}
          </span>
          <span className="issue-row__stack" aria-hidden="true">
            {items.slice(0, 5).map((s) => (
              <Logo key={s.id} startup={s} size={22} />
            ))}
            {items.length > 5 && <span className="issue-row__more mono">+{items.length - 5}</span>}
          </span>
          {showSectors && (
            <span className="issue-row__sectors">
              {sectorMix(items)
                .slice(0, 3)
                .map(([l, n]) => `${l} ${n}`)
                .join(' · ')}
            </span>
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

/** Where the issue's hero points: the first unread company in the reader's order. */
function useHeroPick(date) {
  const { isRead } = useReadLog()
  const order = useIssueOrder(byDate(date))
  const idx = order.list.findIndex((s) => !isRead(s.id))
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
function everFinished(readLog) {
  return dates.some((d) => {
    const list = byDate(d)
    return list.length > 0 && list.every((s) => readLog[s.id])
  })
}

function IssueTitle({ date }) {
  const { readLog } = useReadLog()
  const latest = date === dates[0]
  const isNew = useIsNew(date)
  const readCount = Object.keys(readLog).length
  return (
    <header className="issue-title">
      <h1 className="issue-title__h" tabIndex={-1}>
        {monthDay(date)} · {L('제', 'Issue #')}
        <span className="mono">{issueNo(date)}</span>
        {L('호', '')}
        {isNew && <span className="badge badge--accent">{L('새 호', 'New')}</span>}
      </h1>
      {latest && !everFinished(readLog) && (
        <p className="issue-title__brand">{L('아직 모르는, 지금 뜨는 스타트업', "Startups you haven't heard of yet")}</p>
      )}
      {latest && readCount === 0 && (
        <p className="issue-title__ai">
          <a href="#/about?sec=how">{L('AI가 공개 자료로 작성 · 링크 확인됨', 'Written by AI from public sources · links checked')}</a>
        </p>
      )}
      {!latest && <IssueNav idx={dates.indexOf(date)} />}
    </header>
  )
}

/** "오늘 5곳 · 약 4분 / 5곳 중 2곳 읽음" + one cell per company, in published order. */
function IssueProgress({ date }) {
  const { isRead } = useReadLog()
  const list = byDate(date)
  const done = list.filter((s) => isRead(s.id)).length
  const all = list.length > 0 && done === list.length
  const today = date === dates[0] && daysSince(date) === 0
  const n = list.length
  return (
    <div className="issue-progress">
      <p className="issue-progress__text">
        <span className="issue-progress__count">
          {L(
            <>
              {today ? '오늘' : '이 호'} <span className="num">{n}</span>곳
            </>,
            <>
              <span className="num">{n}</span> {plural(n, 'startup')}
              {today ? ' today' : ''}
            </>,
          )}
        </span>
        <span className="issue-progress__min">
          {' '}
          · {L('약', 'about')} <span className="num">{readMinutes(list)}</span>
          {L('분', ' min')}
        </span>
        <span className="issue-progress__read">
          <span>
            {L(
              <>
                <span className="num">{n}</span>곳 중 <span className="mono issue-progress__done">{done}</span>곳 읽음
              </>,
              <>
                <span className="mono issue-progress__done">{done}</span> of <span className="num">{n}</span> read
              </>,
            )}
          </span>
          {all && <Icon name="check" size={16} className="issue-progress__check" />}
        </span>
      </p>
      <span className="issue-progress__bar" aria-hidden="true">
        {list.map((s) => (
          <span key={s.id} className={isRead(s.id) ? 'is-read' : ''} />
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

function Hero({ startup: s, rank, resume, heroRef }) {
  const stage = s._correction ? null : s._stage
  return (
    <a className="hero" href={`#/s/${s.id}`} ref={heroRef}>
      <span className="hero__kicker">
        {resume && <strong>{L('이어 읽기', 'Keep reading')} · </strong>}
        <span className="mono hero__rank">{pad2(rank)}</span>
        <span className="hero__sector">{s._sector.label}</span>
        {s.headquarters?.country_ko && <> · {s.headquarters.country_ko}</>}
      </span>
      <span className="hero__id">
        <Logo startup={s} size={48} />
        <span className="hero__names">
          <span className="hero__name">{s.name_ko || s.name_en}</span>
          {s.name_en && s.name_en !== s.name_ko && (
            <span className="hero__en" lang="en">
              {s.name_en}
            </span>
          )}
        </span>
      </span>
      {s.tagline && <span className="hero__tagline">{s.tagline}</span>}
      {s.editor_pick_comment && (
        <span className="hero__comment">
          <span className="hero__comment-label">{L('AI 코멘트', 'AI take')}</span> {s.editor_pick_comment}
        </span>
      )}
      <ForRoleLine startup={s} />
      <span className="hero__foot">
        <span className="hero__meta">
          <Meta
            items={[
              stage,
              s._raisedShort ? (
                <span key="r">
                  {L('누적', 'Raised')} <span className={`hero__amount ${numClass(s._raisedShort)}`}>{s._raisedShort}</span>
                </span>
              ) : null,
            ]}
          />
          <CorrectionBadge correction={s._correction} />
        </span>
        <span className="hero__cta">
          {L('읽기', 'Read')} <Icon name="arrowRight" size={16} />
        </span>
      </span>
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

/* ---------- Screens ---------- */

export function IssueMobile({ date }) {
  const { isRead, readLog } = useReadLog()
  const { interests } = useInterests()
  const [role] = useRole()
  const [prompt, setPrompt] = useTastePrompt()
  const { list, hero, rank, personal, differs } = useHeroPick(date)
  const issue = byDate(date)
  const latest = date === dates[0]
  const done = issue.filter((s) => isRead(s.id)).length
  const finished = issue.length > 0 && done === issue.length
  const heroRef = useRef(null)
  const ask = useRef(null)
  ask.current = () => maybeAskTaste({ prompt, setPrompt, role, interests })

  // the taste sheet asks once on its own: coming back here after reading a company,
  // or once the hero has scrolled away
  useEffect(() => {
    if (!latest) return
    if (currentEntry()?.depth > 0 && Object.keys(readLog).length > 0) ask.current()
    const onScroll = () => {
      const r = heroRef.current?.getBoundingClientRect()
      if (r && r.bottom < 0) {
        window.removeEventListener('scroll', onScroll)
        ask.current()
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
    // once per visit to the screen, not on every read-log change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latest, date])

  const picks = usePastPicks(date)
  const rows = hero ? list.filter((s) => s !== hero) : list
  return (
    <div className="page page--issue">
      <IssueTitle date={date} />
      {latest && daysSince(date) >= 2 && <StaleCard date={date} />}
      <IssueProgress date={date} />
      {(differs || !personal) && <OrderHead personal={personal} />}
      {hero ? <Hero startup={hero} rank={rank} resume={done > 0} heroRef={heroRef} /> : finished && <DoneCard date={date} picks={picks} />}
      <ul className="rows rows--issue" aria-label={L(`제${issueNo(date)}호 스타트업 목록`, `Startups in issue #${issueNo(date)}`)}>
        {rows.map((s) => (
          <StartupRow key={s.id} startup={s} rank={list.indexOf(s) + 1} issue />
        ))}
      </ul>
      {done > 0 && <MarkAllRead list={issue} />}
      {latest && <TasteCard />}
      {latest && <LastWeekCard />}
      {/* when the done card already lists them, don't repeat */}
      {latest && !(finished && !picks.kind) && <FollowUpSection />}
      <PastIssues current={date} />
      <p className="footnote">
        <Icon name="info" size={16} />
        <span>
          {L('AI가 공개 자료로 작성하고 모든 사실을 사람이 확인하지는 않아요', 'Written by AI from public sources; not every fact is checked by a person')} ·{' '}
          <a href="#/about?sec=corrections">{L('정정 기록', 'Corrections')} ›</a>
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

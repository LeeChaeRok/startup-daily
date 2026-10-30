import { useEffect } from 'react'
import { LastWeekCard } from './Weekly.jsx'
import { FollowUpSection } from '../components/FollowUp.jsx'
import Icon from '../components/Icon.jsx'
import Logo from '../components/Logo.jsx'
import StartupRow from '../components/StartupRow.jsx'
import { AiNote, MarkAllRead, Meta, ProgressRing } from '../components/bits.jsx'
import { Footer } from '../components/Chrome.jsx'
import { byDate, dates, formatUSD, issueNo, sectorMix, stats } from '../lib/data.js'
import { useFlag, useReadLog } from '../lib/hooks.js'
import { daysSince, dotDate, longDate, monthDay, readMinutes, shortDate } from '../lib/format.js'
import { canonicalUrl, shareOrCopy } from '../lib/share.js'
import { useToast } from '../components/toast-context.js'
import { L } from '../lib/i18n.js'

const plural = (n, one, many = `${one}s`) => (n === 1 ? one : many)

function useIssue(date) {
  const list = byDate(date)
  const { isRead, readLog } = useReadLog()
  const done = list.filter((s) => isRead(s.id)).length
  return { list, done, readLog }
}

/** "최신 호" honestly: only say 오늘 when the issue really is today. */
export function IssueHeader({ date, compact = false }) {
  const { list, done } = useIssue(date)
  const [lastSeen, setLastSeen] = useFlag('sd_last_issue', null)
  const latest = date === dates[0]
  const gap = daysSince(dates[0])
  const idx = dates.indexOf(date)
  const isNew = latest && lastSeen && lastSeen < date

  useEffect(() => {
    if (latest && lastSeen !== date) {
      const t = setTimeout(() => setLastSeen(date), 4000)
      return () => clearTimeout(t)
    }
  }, [latest, lastSeen, date, setLastSeen])

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
      {!latest && !compact && (
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
      )}
    </header>
  )
}

export function IssueList({ date, selectedId, compact }) {
  const list = byDate(date)
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

function ContinueCard({ date }) {
  const next = useContinue(date)
  const { list, done } = useIssue(date)
  const { readLog } = useReadLog()
  const toast = useToast()
  const totalRead = Object.keys(readLog).length

  if (done === list.length && list.length > 0) {
    const share = async () => {
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

  if (!next) return null
  const n = byDate(next.date).indexOf(next.startup) + 1
  return (
    <a className="card card--continue" href={`#/s/${next.startup.id}`}>
      <span className="card__kicker">{done === 0 ? L('여기서 시작', 'Start here') : L('이어 읽기', 'Keep reading')}</span>
      <span className="card__row">
        <span className="mono card__rank">{String(n).padStart(2, '0')}</span>
        <span className="card__name">{next.startup.name_ko}</span>
        <Icon name="arrowRight" size={20} />
      </span>
      <span className="card__text">{next.startup.tagline}</span>
    </a>
  )
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

function IntroCard() {
  const [dismissed, setDismissed] = useFlag('sd_intro_dismissed', false)
  if (dismissed) return null
  return (
    <aside className="intro intro--line" aria-label={L('처음 오셨나요', 'New here?')}>
      <p>
        <strong>{L('처음 오셨나요?', 'New here?')}</strong>{' '}
        {L(
          '한국에 아직 덜 알려진 해외 스타트업을 하루 한 묶음으로 소개해요.',
          "A handful of under-the-radar startups from around the world, every day — the ones you haven't heard of yet.",
        )}
      </p>
      <button type="button" className="icon-btn icon-btn--sm" onClick={() => setDismissed(true)} aria-label={L('안내 닫기', 'Dismiss')}>
        <Icon name="close" size={18} />
      </button>
    </aside>
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

function Preview({ startup: s }) {
  if (!s) return null
  return (
    <article className="preview" aria-labelledby="preview-title">
      <p className="kicker">
        <span className="mono">01</span> · {s._sector.label} · {s.headquarters?.country_ko}
      </p>
      <div className="preview__name">
        <Logo startup={s} size={56} />
        <div>
          <h2 id="preview-title" className="preview__title">
            {s.name_ko}
          </h2>
          <p className="preview__en" lang="en">
            {s.name_en}
          </p>
        </div>
      </div>
      <p className="preview__tagline">{s.tagline}</p>
      <div className="block">
        <h3 className="block__label">{L('왜 지금', 'Why now')}</h3>
        <p className="block__text">{s.trending_reason?.summary}</p>
      </div>
      {s.editor_pick_comment && (
        <blockquote className="quote">
          <p>{s.editor_pick_comment}</p>
          <footer>
            {L('한 줄 코멘트', 'One-line take')} <span className="tag">{L('AI 작성', 'By AI')}</span>
          </footer>
        </blockquote>
      )}
      <a className="link-cta" href={`#/s/${s.id}`}>
        {L('전체 읽기', 'Read')} <Icon name="arrowRight" size={16} />
      </a>
    </article>
  )
}

/* ---------- Screens ---------- */

export function IssueMobile({ date }) {
  const list = byDate(date)
  return (
    <div className="page page--issue">
      {date === dates[0] && <IntroCard />}
      <IssueHeader date={date} />
      <AiNote />
      <SectorMix list={list} />
      <IssueList date={date} />
      <ContinueCard date={date} />
      {date === dates[0] && <LastWeekCard />}
      {date === dates[0] && <FollowUpSection />}
      <PastIssues current={date} />
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
  return (
    <div className="overview">
      <IssueHeader date={date} />
      <AiNote />
      <NumbersStrip list={list} />
      <SectorMix list={list} />
      <ContinueCard date={date} />
      {date === dates[0] && <LastWeekCard />}
      <Preview startup={list[0]} />
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

/* YC 새 배치 (#/yc, #/yc/:date): each day's Y Combinator companies (scripts/lib/yc.mjs), built
   from the same parts as the issue — title, reading progress, company rows, past days — so the two
   tabs read as one publication. YC shows only in a row badge ("YC F26") and the section names. */
import { useState } from 'react'
import Icon from '../components/Icon.jsx'
import StartupRow from '../components/StartupRow.jsx'
import Logo from '../components/Logo.jsx'
import { Footer } from '../components/Chrome.jsx'
import { ycDates, ycOf, ycShort } from '../lib/data.js'
import { longDate, monthDay, shortDate } from '../lib/format.js'
import { useFlag, useReadLog } from '../lib/hooks.js'
import { useMarkSeen, useSeen } from '../lib/seen.js'
import { track } from '../lib/analytics.js'
import { L } from '../lib/i18n.js'
import { IssueProgress } from './Issue.jsx'

const SHORT = 5
const LONG = 10
const PAST = 5

const ycBadge = (s) => `YC ${ycShort(s.yc?.batch)}`
const dayHref = (date) => (date === ycDates()[0] ? '#/yc' : `#/yc/${date}`)

function useShown(date) {
  const all = ycOf(date)
  const [ten, setTen] = useFlag('sd_yc_ten', false)
  const max = Math.min(all.length, LONG)
  return { all, max, ten, setTen, shown: all.slice(0, ten ? max : SHORT) }
}

/** The issue's YC section: three rows and a link to the day in the YC tab. */
export function YcIssueSection({ date }) {
  const all = ycOf(date)
  if (!all.length) return null
  return (
    <section className="past yc-peek" aria-labelledby="yc-peek-title">
      <div className="section-head">
        <h2 id="yc-peek-title" className="section-head__title">
          {L('YC 새 배치', 'New at Y Combinator')}
        </h2>
        <a href={dayHref(date)} className="section-head__more">
          {L(`${Math.min(all.length, LONG)}곳 보기`, `See ${Math.min(all.length, LONG)}`)}
        </a>
      </div>
      <ul className="rows rows--peek">
        {all.slice(0, 3).map((s) => (
          <StartupRow key={s.id} startup={s} compact badge={ycBadge(s)} />
        ))}
      </ul>
    </section>
  )
}

function YcNav({ date }) {
  const ds = ycDates()
  const i = ds.indexOf(date)
  if (i < 0 || (!ds[i + 1] && !ds[i - 1])) return null
  return (
    <nav className="issue-nav" aria-label={L('날짜 이동', 'Day navigation')}>
      {ds[i + 1] ? (
        <a className="issue-nav__link" href={dayHref(ds[i + 1])}>
          <Icon name="chevronLeft" size={16} /> {L('이전 날', 'Previous')} <span className="mono">{shortDate(ds[i + 1])}</span>
        </a>
      ) : (
        <span />
      )}
      {ds[i - 1] && (
        <a className="issue-nav__link" href={dayHref(ds[i - 1])}>
          {L('다음 날', 'Next')} <span className="mono">{shortDate(ds[i - 1])}</span> <Icon name="chevronRight" size={16} />
        </a>
      )}
    </nav>
  )
}

/** One day of the YC tab, as the issue's past-issue row: date, logos, how far the reader got. */
export function YcDayRow({ date, selected = false }) {
  const { isRead } = useReadLog()
  const isSeen = useSeen('yc')
  const items = ycOf(date).slice(0, LONG)
  const done = items.filter((s) => isRead(s.id)).length
  const seen = isSeen(date)
  return (
    <li>
      <a className={`issue-row issue-row--day ${seen ? 'is-seen' : ''} ${selected ? 'is-selected' : ''}`} href={dayHref(date)} aria-current={selected ? 'page' : undefined}>
        <span className="issue-row__main">
          <span className="issue-row__title">{longDate(date).replace(/요일$/, '')}</span>
          <span className="issue-row__stack" aria-hidden="true">
            {items.slice(0, 5).map((s) => (
              <Logo key={s.id} startup={s} size={22} />
            ))}
            {items.length > 5 && <span className="issue-row__more mono">+{items.length - 5}</span>}
          </span>
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
              {done > 0 ? <> · {done} {L('읽음', 'read')}</> : seen && <span className="seen-tag"> · {L('봤음', 'Seen')}</span>}
            </>
          )}
        </span>
      </a>
    </li>
  )
}

function YcPastDays({ current }) {
  const [all, setAll] = useState(false)
  const ds = ycDates().filter((d) => d !== current)
  if (!ds.length) return null
  return (
    <section className="past" aria-labelledby="yc-past-title">
      <div className="section-head">
        <h2 id="yc-past-title" className="section-head__title">
          {L('지난 날', 'Earlier days')}
        </h2>
        {ds.length > PAST && (
          <button type="button" className="section-head__more text-reset" aria-expanded={all} onClick={() => setAll(!all)}>
            {all ? L('접기', 'Fewer') : L(`전체 ${ds.length}일`, `All ${ds.length} days`)}
          </button>
        )}
      </div>
      <ul className="issue-rows">
        {(all ? ds : ds.slice(0, PAST)).map((d) => (
          <YcDayRow key={d} date={d} />
        ))}
      </ul>
    </section>
  )
}

/** #/yc and #/yc/:date: the phone screen, and the centre column on desktop. */
export default function Yc({ date, desktop }) {
  useMarkSeen('yc', date)
  const { all, max, ten, setTen, shown } = useShown(date)
  const batches = [...new Set(all.map((s) => s.yc?.batch).filter(Boolean))]
  if (!all.length) {
    return (
      <div className="page page--issue">
        <p className="page-note">{L('아직 YC 회사가 없어요.', 'No YC companies yet.')}</p>
      </div>
    )
  }
  const toggle = () => {
    setTen(!ten)
    track('yc_toggle', { ten: !ten, date })
  }
  return (
    <div className="page page--issue page--yc">
      <header className="issue-title">
        <h1 className="issue-title__h" tabIndex={-1}>
          {monthDay(date)} · {L('YC 새 배치', 'New at YC')}
        </h1>
        <YcNav date={date} />
      </header>
      <IssueProgress
        date={date}
        list={shown}
        label={L(
          <>
            YC {batches.map(ycShort).join('·')} 배치에서 <span className="num">{shown.length}</span>곳
          </>,
          <>
            <span className="num">{shown.length}</span> from YC {batches.map(ycShort).join(' · ')}
          </>,
        )}
      />
      <ul className="rows rows--issue" aria-label={L(`${monthDay(date)} YC 새 배치`, `YC companies, ${monthDay(date)}`)}>
        {shown.map((s) => (
          <StartupRow key={s.id} startup={s} issue badge={ycBadge(s)} />
        ))}
      </ul>
      {max > SHORT && (
        <p className="yc-more">
          <button type="button" className="section-head__more text-reset" aria-expanded={ten} onClick={toggle}>
            {ten ? L(`${SHORT}곳만 보기`, `Show ${SHORT} only`) : L(`${max - SHORT}곳 더 보기`, `Show ${max - SHORT} more`)}
          </button>
        </p>
      )}
      <p className="footnote">
        <Icon name="info" size={16} />
        <span>
          {L(
            '오늘의 5곳과 겹치지 않는 별도 목록이에요. AI가 공개 자료로 작성하고 모든 사실을 사람이 확인하지는 않아요.',
            'A separate list, never the same as the issue’s five. Written by AI from public sources; not every fact is checked by a person.',
          )}
        </span>
      </p>
      {!desktop && <YcPastDays current={date} />}
      {!desktop && <Footer />}
    </div>
  )
}

/** Desktop side list on #/yc: every YC day, the open one marked. */
export function YcDaysSide({ date }) {
  return (
    <aside className="split__list" aria-label={L('YC 새 배치 날짜', 'YC days')}>
      <p className="split__label">{L('YC 새 배치', 'New at YC')}</p>
      <ul className="issue-rows issue-rows--side">
        {ycDates().map((d) => (
          <YcDayRow key={d} date={d} selected={d === date} />
        ))}
      </ul>
    </aside>
  )
}

/** Desktop side list beside a YC company: that day's YC list, like the issue list beside one of the five. */
export function YcDaySide({ date, selectedId }) {
  const { shown } = useShown(date)
  const list = shown.some((s) => s.id === selectedId) ? shown : ycOf(date).slice(0, LONG)
  return (
    <aside className="split__list" aria-label={L('이 날의 YC 새 배치', 'YC companies this day')}>
      <div className="side-head">
        <a href={dayHref(date)} className="side-head__back">
          {monthDay(date)} · {L('YC 새 배치', 'New at YC')}
        </a>
      </div>
      <ol className="rows">
        {list.map((s, i) => (
          <StartupRow key={s.id} startup={s} rank={i + 1} compact selected={s.id === selectedId} />
        ))}
      </ol>
    </aside>
  )
}

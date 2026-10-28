import { useState } from 'react'
import Icon from '../components/Icon.jsx'
import StartupRow from '../components/StartupRow.jsx'
import { Footer } from '../components/Chrome.jsx'
import { SectorMix } from './Issue.jsx'
import { companiesOfWeek, weeks } from '../lib/data.js'
import { useInterests, useReadLog, useSaved } from '../lib/hooks.js'
import { weekLabel } from '../lib/format.js'

const TOP = 3

/** "지난주 스타트업": one week of issues regrouped — biggest rounds, your sectors, what you missed. */
export default function Weekly({ week }) {
  const list = companiesOfWeek(week)
  const idx = weeks.findIndex((w) => w.key === week)
  const { isRead } = useReadLog()
  const { isSaved } = useSaved()
  const { interests } = useInterests()
  const [showUnread, setShowUnread] = useState(false)

  const biggest = list
    .filter((s) => s._raisedUSD != null && s._stageGroup !== 'exit')
    .sort((a, b) => b._raisedUSD - a._raisedUSD)
    .slice(0, TOP)
  const mine = list.filter((s) => interests.includes(s._sector.key))
  const unread = list.filter((s) => !isRead(s.id))
  const saved = list.filter((s) => isSaved(s.id))
  const issues = weeks[idx]?.dates.length || 0

  return (
    <div className="page page--weekly">
      <header className="issue-head">
        <div className="issue-head__rule" aria-hidden="true" />
        <p className="eyebrow">주간 정리</p>
        <h1 className="issue-head__title" tabIndex={-1}>
          {weekLabel(week)}
        </h1>
        <p className="issue-head__sub">
          <span className="num">{issues}</span>호 · 스타트업 <span className="num">{list.length}</span>곳 · 읽음{' '}
          <span className="num">{list.length - unread.length}</span>곳
        </p>
      </header>
      <SectorMix list={list} />

      {biggest.length > 0 && (
        <section className="weekly__sec" aria-labelledby="w-big">
          <h2 id="w-big" className="weekly__title">
            가장 큰 투자 {biggest.length}곳
          </h2>
          <ol className="rows">
            {biggest.map((s) => (
              <StartupRow key={s.id} startup={s} showDate />
            ))}
          </ol>
        </section>
      )}

      {mine.length > 0 && (
        <section className="weekly__sec" aria-labelledby="w-mine">
          <h2 id="w-mine" className="weekly__title">
            내 관심 분야 {mine.length}곳
          </h2>
          <ol className="rows">
            {mine.map((s) => (
              <StartupRow key={s.id} startup={s} showDate />
            ))}
          </ol>
        </section>
      )}

      <section className="weekly__sec" aria-labelledby="w-unread">
        <h2 id="w-unread" className="weekly__title">
          {unread.length ? `아직 안 읽은 ${unread.length}곳` : `이번 주 ${list.length}곳을 모두 읽었어요`}
        </h2>
        {unread.length > 0 && (
          <>
            {showUnread && (
              <ol className="rows">
                {unread.map((s) => (
                  <StartupRow key={s.id} startup={s} showDate />
                ))}
              </ol>
            )}
            <button type="button" className="text-btn weekly__more" aria-expanded={showUnread} onClick={() => setShowUnread(!showUnread)}>
              {showUnread ? '접기' : '펼쳐 보기'} <Icon name={showUnread ? 'chevronUp' : 'chevronDown'} size={16} />
            </button>
          </>
        )}
      </section>

      {saved.length > 0 && (
        <section className="weekly__sec" aria-labelledby="w-saved">
          <h2 id="w-saved" className="weekly__title">
            내가 저장한 {saved.length}곳
          </h2>
          <ol className="rows">
            {saved.map((s) => (
              <StartupRow key={s.id} startup={s} showDate />
            ))}
          </ol>
        </section>
      )}

      <nav className="issue-nav" aria-label="주 이동">
        {weeks[idx + 1] ? (
          <a className="issue-nav__link" href={`#/w/${weeks[idx + 1].key}`}>
            <Icon name="chevronLeft" size={16} /> {weekLabel(weeks[idx + 1].key)}
          </a>
        ) : (
          <span />
        )}
        {weeks[idx - 1] && (
          <a className="issue-nav__link" href={`#/w/${weeks[idx - 1].key}`}>
            {weekLabel(weeks[idx - 1].key)} <Icon name="chevronRight" size={16} />
          </a>
        )}
      </nav>
      <Footer />
    </div>
  )
}

/** Home card on Monday and Tuesday: last week at a glance, with what is still unread. */
export function LastWeekCard() {
  const { isRead } = useReadLog()
  const day = new Date().getDay()
  const last = weeks[0]?.key && weeks.find((w) => w.key < mondayToday())
  if (!(day === 1 || day === 2) || !last) return null
  const list = companiesOfWeek(last.key)
  const unread = list.filter((s) => !isRead(s.id)).length
  return (
    <a className="weekly-card" href={`#/w/${last.key}`}>
      <span className="eyebrow">지난주 스타트업</span>
      <span className="weekly-card__text">
        {unread ? `지난주 ${list.length}곳 중 ${unread}곳을 아직 못 봤어요` : `지난주 ${list.length}곳을 모두 읽었어요`}
      </span>
      <Icon name="arrowRight" size={18} />
    </a>
  )
}

function mondayToday() {
  const t = new Date()
  t.setDate(t.getDate() - ((t.getDay() + 6) % 7))
  const p = (n) => String(n).padStart(2, '0')
  return `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())}`
}

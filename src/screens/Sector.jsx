import { useState } from 'react'
import Logo from '../components/Logo.jsx'
import StartupRow from '../components/StartupRow.jsx'
import { Footer } from '../components/Chrome.jsx'
import { EmptyState } from '../components/bits.jsx'
import { SECTORS, companiesOfSector } from '../lib/data.js'
import { monthDay, numClass } from '../lib/format.js'
import { L } from '../lib/i18n.js'

const plural = (n, one, many = `${one}s`) => (n === 1 ? one : many)

export const MIN_SECTOR = 3

const ym = (d) => d?.slice(0, 7).replace('-', '.')

/** Side-by-side figures; the first column stays put while the rest scroll on phones. */
export function CompareTable({ list, current }) {
  const rows = [
    [L('설립', 'Founded'), (s) => s.founded_year || '—'],
    [L('단계', 'Stage'), (s) => (s._correction ? s._correction.status : s._stage)],
    [L('누적 투자', 'Raised'), (s) => s._raisedShort || L('미공개', 'Undisclosed')],
    [L('본사', 'HQ'), (s) => s.headquarters?.country_ko || '—'],
    [L('소개', 'Featured'), (s) => L(`${monthDay(s.date)} 호`, monthDay(s.date))],
  ]
  return (
    <div className="cmp-wrap">
      <table className="cmp">
        <caption className="sr-only">{L('같은 분야 회사 비교', 'Companies in this sector, compared')}</caption>
        <thead>
          <tr>
            <th scope="col" className="cmp__corner">
              <span className="sr-only">{L('항목', 'Field')}</span>
            </th>
            {list.map((s) => (
              <th key={s.id} scope="col" className={s.id === current ? 'is-current' : ''}>
                <a href={`#/s/${s.id}`} className="cmp__co">
                  <Logo startup={s} size={28} />
                  <span>{s.name_ko}</span>
                </a>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, get]) => (
            <tr key={label}>
              <th scope="row">{label}</th>
              {list.map((s) => {
                const v = get(s)
                return (
                  <td key={s.id} className={`${numClass(v)} ${s.id === current ? 'is-current' : ''}`}>
                    {v}
                  </td>
                )
              })}
            </tr>
          ))}
          <tr>
            <th scope="row">{L('차별점', 'What sets it apart')}</th>
            {list.map((s) => (
              <td key={s.id} className={`cmp__text ${s.id === current ? 'is-current' : ''}`}>
                {s.competitive_landscape?.key_differentiator || s.tagline}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      <p className="cmp__foot">{L('수치는 각 회사를 소개한 날 기준이에요.', 'Figures are as of the day each company was featured.')}</p>
    </div>
  )
}

/** #/t/:sector — every company in one sector, newest first, plus a comparison table. */
export default function Sector({ sector }) {
  const meta = SECTORS.find((s) => s.key === sector)
  const list = companiesOfSector(sector)
  const [view, setView] = useState('list')
  if (!meta || list.length < MIN_SECTOR) {
    return (
      <div className="page">
        <EmptyState
          icon="explore"
          title={L('모아 볼 회사가 아직 적어요', 'Not enough companies here yet')}
          level={1}
          actions={
            <a className="btn btn--primary" href="#/explore">
              {L('탐색으로', 'Go to Explore')}
            </a>
          }
        >
          {L(
            `한 분야에 ${MIN_SECTOR}곳 이상 쌓이면 모아 보기가 열려요.`,
            `A sector page opens once it has ${MIN_SECTOR} or more companies.`,
          )}
        </EmptyState>
      </div>
    )
  }
  const span = `${ym(list.at(-1).date)} ~ ${ym(list[0].date)}`
  return (
    <div className="page page--sector">
      <header className="issue-head">
        <div className="issue-head__rule" aria-hidden="true" />
        <p className="eyebrow">{L('분야별로 모아 보기', 'Browse by sector')}</p>
        <h1 className="issue-head__title" tabIndex={-1}>
          {meta.label}
        </h1>
        <p className="issue-head__sub">
          <span className="num">{list.length}</span>
          {L('곳', ` ${plural(list.length, 'company', 'companies')}`)} · <span className="mono">{span}</span>
        </p>
      </header>
      <div className="segmented" role="group" aria-label={L('보기', 'View')}>
        {[
          ['list', L('목록', 'List')],
          ['compare', L('비교 표', 'Compare')],
        ].map(([k, label]) => (
          <button key={k} type="button" aria-pressed={view === k} className="segmented__tab" onClick={() => setView(k)}>
            {label}
          </button>
        ))}
      </div>
      {view === 'list' ? (
        <ol className="rows">
          {list.map((s) => (
            <StartupRow key={s.id} startup={s} showDate />
          ))}
        </ol>
      ) : (
        <CompareTable list={list} />
      )}
      <Footer />
    </div>
  )
}

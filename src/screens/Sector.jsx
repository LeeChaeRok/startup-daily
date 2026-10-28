import { useState } from 'react'
import Logo from '../components/Logo.jsx'
import StartupRow from '../components/StartupRow.jsx'
import { Footer } from '../components/Chrome.jsx'
import { EmptyState } from '../components/bits.jsx'
import { SECTORS, companiesOfSector } from '../lib/data.js'
import { monthDay, numClass } from '../lib/format.js'

export const MIN_SECTOR = 3

const ym = (d) => d?.slice(0, 7).replace('-', '.')

/** Side-by-side figures; the first column stays put while the rest scroll on phones. */
export function CompareTable({ list, current }) {
  const rows = [
    ['설립', (s) => s.founded_year || '—'],
    ['단계', (s) => (s._correction ? s._correction.status : s._stage)],
    ['누적 투자', (s) => s._raisedShort || '미공개'],
    ['본사', (s) => s.headquarters?.country_ko || '—'],
    ['소개', (s) => `${monthDay(s.date)} 호`],
  ]
  return (
    <div className="cmp-wrap">
      <table className="cmp">
        <caption className="sr-only">같은 분야 회사 비교</caption>
        <thead>
          <tr>
            <th scope="col" className="cmp__corner">
              <span className="sr-only">항목</span>
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
            <th scope="row">차별점</th>
            {list.map((s) => (
              <td key={s.id} className={`cmp__text ${s.id === current ? 'is-current' : ''}`}>
                {s.competitive_landscape?.key_differentiator || s.tagline}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      <p className="cmp__foot">수치는 각 회사를 소개한 날 기준이에요.</p>
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
        <EmptyState icon="explore" title="모아 볼 회사가 아직 적어요" level={1} actions={<a className="btn btn--primary" href="#/explore">탐색으로</a>}>
          한 분야에 {MIN_SECTOR}곳 이상 쌓이면 모아 보기가 열려요.
        </EmptyState>
      </div>
    )
  }
  const span = `${ym(list.at(-1).date)} ~ ${ym(list[0].date)}`
  return (
    <div className="page page--sector">
      <header className="issue-head">
        <div className="issue-head__rule" aria-hidden="true" />
        <p className="eyebrow">분야별로 모아 보기</p>
        <h1 className="issue-head__title" tabIndex={-1}>
          {meta.label}
        </h1>
        <p className="issue-head__sub">
          <span className="num">{list.length}</span>곳 · <span className="mono">{span}</span>
        </p>
      </header>
      <div className="segmented" role="group" aria-label="보기">
        {[
          ['list', '목록'],
          ['compare', '비교 표'],
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

import { useEffect, useMemo, useRef, useState } from 'react'
import Icon from '../components/Icon.jsx'
import Logo from '../components/Logo.jsx'
import StartupRow from '../components/StartupRow.jsx'
import Sheet from '../components/Sheet.jsx'
import { CorrectionBadge, EmptyState, SaveButton } from '../components/bits.jsx'
import { IssueRowItem } from './Issue.jsx'
import { startups, LENS_FILTER, LENS_VERDICTS, REGIONS, SECTORS, STAGE_GROUPS, search, stats, weeks } from '../lib/data.js'
import { MIN_SECTOR } from './Sector.jsx'
import { buildQuery, navigate, useInterests, useReadLog } from '../lib/hooks.js'
import { monthDay, numClass, weekLabel } from '../lib/format.js'
import { isEn, L } from '../lib/i18n.js'

const plural = (n, one, many = `${one}s`) => (n === 1 ? one : many)

const SORTS = [
  { key: 'date', label: L('최신 발행순', 'Newest') },
  { key: 'raised', label: L('누적 투자 큰 순', 'Most raised') },
  { key: 'founded', label: L('설립 최근순', 'Newest founded') },
  { key: 'name', label: L('이름순', 'Name') },
]

const GROUPS = [
  { key: 'sector', label: L('분야', 'Sector'), options: SECTORS.map(({ key, label }) => ({ key, label })), field: (s) => s._sector.key },
  { key: 'stage', label: L('단계', 'Stage'), options: STAGE_GROUPS, field: (s) => s._stageGroup },
  { key: 'region', label: L('지역', 'Region'), options: REGIONS, field: (s) => s._region },
  {
    key: 'korea',
    label: L('한국 시장 (AI 가설)', 'Korean market (AI hypothesis)'),
    options: LENS_FILTER.map((key) => ({ key, label: LENS_VERDICTS[key].label })),
    field: (s) => s._lens?.v,
  },
  // the Korea-market read only exists in the Korean edition
].filter((g) => !(isEn && g.key === 'korea'))

const list = (v) => (v ? v.split(',').filter(Boolean) : [])

function sortBy(rows, key) {
  const r = [...rows]
  if (key === 'raised') r.sort((a, b) => (b.startup._raisedUSD ?? -1) - (a.startup._raisedUSD ?? -1))
  else if (key === 'founded') r.sort((a, b) => (b.startup.founded_year || 0) - (a.startup.founded_year || 0))
  else if (key === 'name') r.sort((a, b) => (a.startup.name_ko || '').localeCompare(b.startup.name_ko || '', L('ko', 'en')))
  return r
}

function applyFilters(rows, filters, except) {
  return rows.filter(({ startup }) =>
    GROUPS.every((g) => g.key === except || !filters[g.key].length || filters[g.key].includes(g.field(startup))),
  )
}

function readState(params) {
  return {
    view: params.get('view') === 'issues' ? 'issues' : 'companies',
    q: params.get('q') || '',
    sector: list(params.get('sector')),
    stage: list(params.get('stage')),
    region: list(params.get('region')),
    korea: list(params.get('korea')),
    unread: params.get('unread') === '1',
    sort: params.get('sort') || 'date',
  }
}

/** Explore state lives in the hash so back/forward and shared links restore it. */
function useExploreState(params) {
  const state = readState(params)
  const update = (patch, replace = false) => {
    // read the live URL, not this render's snapshot: a debounced search
    // update must not undo a filter picked in the meantime
    const live = readState(new URLSearchParams(window.location.hash.split('?')[1] || ''))
    const next = { ...live, ...patch }
    navigate(
      `/explore${buildQuery({
        view: next.view === 'issues' ? 'issues' : null,
        q: next.q,
        sector: next.sector,
        stage: next.stage,
        region: next.region,
        korea: next.korea,
        unread: next.unread ? '1' : null,
        sort: next.sort === 'date' ? null : next.sort,
      })}`,
      { replace },
    )
  }
  return [state, update]
}

function FilterGroups({ state, update, base, idPrefix }) {
  return GROUPS.map((g) => {
    const counted = applyFilters(base, state, g.key)
    return (
      <fieldset key={g.key} className="filter-group">
        <legend className="filter-group__title">{g.label}</legend>
        {g.options.map((o) => {
          const n = counted.filter(({ startup }) => g.field(startup) === o.key).length
          const checked = state[g.key].includes(o.key)
          if (!n && !checked) return null
          const id = `${idPrefix}-${g.key}-${o.key}`
          return (
            <label key={o.key} className="check" htmlFor={id}>
              <input
                id={id}
                type="checkbox"
                checked={checked}
                onChange={() =>
                  update({ [g.key]: checked ? state[g.key].filter((x) => x !== o.key) : [...state[g.key], o.key] })
                }
              />
              <span className="check__label">{o.label}</span>
              <span className="check__count num">{n}</span>
            </label>
          )
        })}
      </fieldset>
    )
  })
}

function ActiveFilters({ state, update }) {
  const chips = GROUPS.flatMap((g) =>
    state[g.key].map((k) => ({ group: g.key, key: k, label: g.options.find((o) => o.key === k)?.label || k })),
  )
  if (!chips.length) return null
  return (
    <div className="active-filters">
      {chips.map((c) => (
        <button
          key={`${c.group}-${c.key}`}
          type="button"
          className="chip chip--on"
          onClick={() => update({ [c.group]: state[c.group].filter((x) => x !== c.key) })}
          aria-label={L(`${c.label} 필터 해제`, `Remove filter: ${c.label}`)}
        >
          {c.label} <Icon name="close" size={14} />
        </button>
      ))}
      <button type="button" className="text-btn" onClick={() => update({ sector: [], stage: [], region: [], korea: [] })}>
        {L('모두 지우기', 'Clear all')}
      </button>
    </div>
  )
}

function ResultsTable({ rows, sort, update }) {
  const { isRead } = useReadLog()
  const th = (key, label) => (
    <th scope="col" aria-sort={sort === key ? (key === 'name' ? 'ascending' : 'descending') : undefined}>
      <button type="button" className={`th-btn ${sort === key ? 'is-on' : ''}`} onClick={() => update({ sort: key })}>
        {label}
        {sort === key && <Icon name="chevronDown" size={14} />}
      </button>
    </th>
  )
  return (
    <table className="results">
      <caption className="sr-only">{L('검색 결과', 'Search results')}</caption>
      <thead>
        <tr>
          {th('name', L('회사', 'Company'))}
          <th scope="col">{L('분야', 'Sector')}</th>
          <th scope="col">{L('단계', 'Stage')}</th>
          <th scope="col">{L('지역', 'Region')}</th>
          {th('raised', L('누적 투자', 'Raised'))}
          {th('founded', L('설립', 'Founded'))}
          {th('date', L('발행', 'Issue'))}
          <th scope="col">
            <span className="sr-only">{L('저장', 'Save')}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map(({ startup: s, reason }) => (
          <tr key={s.id} className={isRead(s.id) ? 'is-read' : ''}>
            <td>
              <a href={`#/s/${s.id}`} className="results__company">
                <Logo startup={s} size={32} />
                <span>
                  <span className="results__name">
                    {s.name_ko}
                    {isRead(s.id) && <Icon name="check" size={14} label={L('읽음', 'Read')} />}
                  </span>
                  <span className="results__tagline">{reason || s.tagline}</span>
                </span>
              </a>
            </td>
            <td>{s._sector.label}</td>
            <td>{s._correction ? <CorrectionBadge correction={s._correction} /> : s._stage}</td>
            <td>{s.headquarters?.country_ko}</td>
            <td className="results__num">
              {s._raisedShort ? (
                <span className={numClass(s._raisedShort)} title={s._raised}>
                  {s._raisedShort}
                </span>
              ) : (
                <span className="muted">{L('미공개', 'Undisclosed')}</span>
              )}
            </td>
            <td className="results__num mono">{s.founded_year}</td>
            <td className="results__num">{monthDay(s.date)}</td>
            <td>
              <SaveButton startup={s} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/** "분야별로 모아 보기": one chip per sector with enough companies to be worth a page. */
function SectorShelf() {
  const counts = new Map()
  for (const s of startups) counts.set(s._sector.key, (counts.get(s._sector.key) || 0) + 1)
  const shelf = SECTORS.filter((s) => (counts.get(s.key) || 0) >= MIN_SECTOR)
  if (!shelf.length) return null
  return (
    <nav className="shelf" aria-label={L('분야별로 모아 보기', 'Browse by sector')}>
      <span className="shelf__label">{L('분야별로 모아 보기', 'Browse by sector')}</span>
      <div className="shelf__chips">
        {shelf.map((s) => (
          <a key={s.key} className="chip" href={`#/t/${s.key}`}>
            {s.label} <span className="num muted">{counts.get(s.key)}</span>
          </a>
        ))}
      </div>
    </nav>
  )
}

function IssuesView({ desktop }) {
  const { isRead, readLog } = useReadLog()
  const readCount = Object.keys(readLog).filter((id) => startups.some((s) => s.id === id)).length
  return (
    <div className="issues-view">
      <p className="issues-view__sum">
        {L(
          <>
            전체 <span className="num">{stats.issues}</span>호 · <span className="num">{stats.companies}</span>곳 · 읽음{' '}
            <span className="num">{readCount}</span>곳
          </>,
          <>
            <span className="num">{stats.issues}</span> {plural(stats.issues, 'issue')} ·{' '}
            <span className="num">{stats.companies}</span> {plural(stats.companies, 'startup')} ·{' '}
            <span className="num">{readCount}</span> read
          </>,
        )}
      </p>
      {weeks.map(({ key, dates: ds }) => (
        <section key={key} className="week">
          <h2 className="week__title">
            <a href={`#/w/${key}`}>
              {weekLabel(key)} <span className="week__more">{L('주간 정리 →', 'Weekly recap →')}</span>
            </a>
          </h2>
          <ul className={`issue-rows ${desktop ? 'issue-rows--grid' : ''}`}>
            {ds.map((d) => (
              <IssueRowItem key={d} date={d} isRead={isRead} showSectors />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

export default function Explore({ params, desktop }) {
  const [state, update] = useExploreState(params)
  const [sheet, setSheet] = useState(false)
  const [draft, setDraft] = useState(state.q)
  const inputRef = useRef(null)

  // keep the field in sync when the hash changes from outside (back/forward, header search)
  useEffect(() => setDraft(state.q), [state.q])

  const focus = params.get('focus')
  useEffect(() => {
    if (focus) inputRef.current?.focus()
  }, [focus])

  // debounce typing into the URL (replace, so each keystroke isn't a history entry)
  useEffect(() => {
    if (draft === state.q) return
    const t = setTimeout(() => update({ q: draft }, true), 250)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft])

  const { isRead } = useReadLog()
  const { interests } = useInterests()
  const interestOn = interests.length > 0 && interests.length === state.sector.length && interests.every((k) => state.sector.includes(k))
  const base = useMemo(() => search(state.q), [state.q])
  const filtered = sortBy(applyFilters(base, state), state.sort)
  const rows = state.unread ? filtered.filter(({ startup }) => !isRead(startup.id)) : filtered
  const activeCount = state.sector.length + state.stage.length + state.region.length + state.korea.length

  return (
    <div className={`page page--explore ${desktop ? 'page--explore-desktop' : ''}`}>
      <h1 className="page-title" tabIndex={-1}>
        {L('탐색', 'Explore')}
      </h1>
      <form className="searchbar" role="search" onSubmit={(e) => e.preventDefault()}>
        <Icon name="explore" size={20} />
        <label htmlFor="explore-q" className="sr-only">
          {L('회사, 분야, 창업자, 경쟁사 검색', 'Search companies, sectors, founders, competitors')}
        </label>
        <input
          id="explore-q"
          ref={inputRef}
          type="search"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={L('회사, 분야, 창업자, 경쟁사', 'Companies, sectors, founders, competitors')}
          autoComplete="off"
          enterKeyHint="search"
        />
        {draft && (
          <button type="button" className="icon-btn" onClick={() => setDraft('')} aria-label={L('검색어 지우기', 'Clear search')}>
            <Icon name="close" size={18} />
          </button>
        )}
      </form>

      <div className="segmented" role="group" aria-label={L('보기', 'View')}>
        {[
          ['companies', L('회사', 'Companies')],
          ['issues', L('지난 호', 'Issues')],
        ].map(([k, label]) => (
          <button
            key={k}
            type="button"
            aria-pressed={state.view === k}
            className="segmented__tab"
            onClick={() => update({ view: k })}
          >
            {label}
          </button>
        ))}
      </div>

      {state.view === 'issues' ? (
        <IssuesView desktop={desktop} />
      ) : (
        <div className="explore">
          <SectorShelf />
          {desktop && (
            <aside className="explore__filters" aria-label={L('필터', 'Filters')}>
              <FilterGroups state={state} update={update} base={base} idPrefix="side" />
            </aside>
          )}
          <div className="explore__results">
            <div className="explore__bar">
              {!desktop && (
                <button type="button" className="chip" onClick={() => setSheet(true)}>
                  <Icon name="filter" size={16} /> {L('필터', 'Filters')}{activeCount > 0 && <span className="num"> {activeCount}</span>}
                </button>
              )}
              {interests.length > 0 && (
                <button
                  type="button"
                  className={`chip ${interestOn ? 'chip--on' : ''}`}
                  aria-pressed={interestOn}
                  onClick={() => update({ sector: interestOn ? [] : interests })}
                >
                  {L('내 관심 분야', 'My sectors')}
                </button>
              )}
              <button
                type="button"
                className={`chip ${state.unread ? 'chip--on' : ''}`}
                aria-pressed={state.unread}
                onClick={() => update({ unread: !state.unread })}
              >
                {L('안 읽은 곳만', 'Unread only')}
              </button>
              <label className="select">
                <span className="sr-only">{L('정렬', 'Sort')}</span>
                <select value={state.sort} onChange={(e) => update({ sort: e.target.value })}>
                  {SORTS.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <Icon name="chevronDown" size={16} />
              </label>
              <p className="explore__count" aria-live="polite">
                {L(
                  <>
                    결과 <span className="num">{rows.length}</span>곳
                  </>,
                  <>
                    <span className="num">{rows.length}</span> {plural(rows.length, 'result')}
                  </>,
                )}
              </p>
            </div>
            <ActiveFilters state={state} update={update} />

            {rows.length === 0 ? (
              <EmptyState
                icon="explore"
                title={
                  state.unread && filtered.length
                    ? L('조건에 맞는 곳은 모두 읽었어요', "You've read everything that matches")
                    : state.q
                      ? L(`‘${state.q}’에 맞는 회사가 없어요`, `No companies match “${state.q}”`)
                      : L('조건에 맞는 회사가 없어요', 'No companies match these filters')
                }
                actions={
                  <>
                    <button
                      type="button"
                      className="btn btn--secondary"
                      onClick={() => update({ q: '', sector: [], stage: [], region: [], korea: [], unread: false })}
                    >
                      {L('조건 지우기', 'Clear filters')}
                    </button>
                    <a className="btn btn--primary" href="#/">
                      {L('최신 호 보기', 'See the latest issue')}
                    </a>
                  </>
                }
              >
                {L('철자를 확인하거나 필터를 줄여 보세요.', 'Check the spelling or try fewer filters.')}
              </EmptyState>
            ) : desktop ? (
              <div className="results-wrap">
                <ResultsTable rows={rows} sort={state.sort} update={update} />
              </div>
            ) : (
              <ul className="rows">
                {rows.map(({ startup, reason }) => (
                  <StartupRow key={startup.id} startup={startup} showDate reason={reason} />
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {!desktop && (
        <Sheet
          open={sheet}
          onClose={() => setSheet(false)}
          title={L('필터', 'Filters')}
          footer={
            <>
              <button type="button" className="btn btn--secondary" onClick={() => update({ sector: [], stage: [], region: [], korea: [] }, true)}>
                {L('초기화', 'Reset')}
              </button>
              <button type="button" className="btn btn--primary" onClick={() => setSheet(false)}>
                <span>
                  {L(
                    <>
                      <span className="num">{rows.length}</span>곳 보기
                    </>,
                    <>
                      Show <span className="num">{rows.length}</span> {plural(rows.length, 'result')}
                    </>,
                  )}
                </span>
              </button>
            </>
          }
        >
          <FilterGroups state={state} update={(p) => update(p, true)} base={base} idPrefix="sheet" />
        </Sheet>
      )}
    </div>
  )
}

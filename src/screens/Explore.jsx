import { useEffect, useMemo, useRef, useState } from 'react'
import Icon from '../components/Icon.jsx'
import Logo from '../components/Logo.jsx'
import StartupRow from '../components/StartupRow.jsx'
import Sheet from '../components/Sheet.jsx'
import { CorrectionBadge, EmptyState, SaveButton } from '../components/bits.jsx'
import { IssueRowItem } from './Issue.jsx'
import { startups, LENS_FILTER, LENS_VERDICTS, REGIONS, SECTORS, STAGE_GROUPS, dates, search, stats } from '../lib/data.js'
import { buildQuery, navigate, useReadLog } from '../lib/hooks.js'
import { monthDay, numClass, weekLabel } from '../lib/format.js'

const SORTS = [
  { key: 'date', label: '최신 발행순' },
  { key: 'raised', label: '누적 투자 큰 순' },
  { key: 'founded', label: '설립 최근순' },
  { key: 'name', label: '이름순' },
]

const GROUPS = [
  { key: 'sector', label: '분야', options: SECTORS.map(({ key, label }) => ({ key, label })), field: (s) => s._sector.key },
  { key: 'stage', label: '단계', options: STAGE_GROUPS, field: (s) => s._stageGroup },
  { key: 'region', label: '지역', options: REGIONS, field: (s) => s._region },
  {
    key: 'korea',
    label: '한국 시장 (AI 가설)',
    options: LENS_FILTER.map((key) => ({ key, label: LENS_VERDICTS[key].label })),
    field: (s) => s._lens?.v,
  },
]

const list = (v) => (v ? v.split(',').filter(Boolean) : [])

function sortBy(rows, key) {
  const r = [...rows]
  if (key === 'raised') r.sort((a, b) => (b.startup._raisedUSD ?? -1) - (a.startup._raisedUSD ?? -1))
  else if (key === 'founded') r.sort((a, b) => (b.startup.founded_year || 0) - (a.startup.founded_year || 0))
  else if (key === 'name') r.sort((a, b) => (a.startup.name_ko || '').localeCompare(b.startup.name_ko || '', 'ko'))
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
          aria-label={`${c.label} 필터 해제`}
        >
          {c.label} <Icon name="close" size={14} />
        </button>
      ))}
      <button type="button" className="text-btn" onClick={() => update({ sector: [], stage: [], region: [], korea: [] })}>
        모두 지우기
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
      <caption className="sr-only">검색 결과</caption>
      <thead>
        <tr>
          {th('name', '회사')}
          <th scope="col">분야</th>
          <th scope="col">단계</th>
          <th scope="col">지역</th>
          {th('raised', '누적 투자')}
          {th('founded', '설립')}
          {th('date', '발행')}
          <th scope="col">
            <span className="sr-only">저장</span>
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
                    {isRead(s.id) && <Icon name="check" size={14} label="읽음" />}
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
                <span className="muted">미공개</span>
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

function IssuesView({ desktop }) {
  const { isRead, readLog } = useReadLog()
  const groups = useMemo(() => {
    const m = new Map()
    for (const d of dates) {
      const w = weekLabel(d)
      if (!m.has(w)) m.set(w, [])
      m.get(w).push(d)
    }
    return [...m.entries()]
  }, [])
  return (
    <div className="issues-view">
      <p className="issues-view__sum">
        전체 <span className="num">{stats.issues}</span>호 · <span className="num">{stats.companies}</span>곳 · 읽음{' '}
        <span className="num">{Object.keys(readLog).filter((id) => startups.some((s) => s.id === id)).length}</span>곳
      </p>
      {groups.map(([label, ds]) => (
        <section key={label} className="week">
          <h2 className="week__title">{label}</h2>
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
  const base = useMemo(() => search(state.q), [state.q])
  const filtered = sortBy(applyFilters(base, state), state.sort)
  const rows = state.unread ? filtered.filter(({ startup }) => !isRead(startup.id)) : filtered
  const activeCount = state.sector.length + state.stage.length + state.region.length + state.korea.length

  return (
    <div className={`page page--explore ${desktop ? 'page--explore-desktop' : ''}`}>
      <h1 className="page-title" tabIndex={-1}>
        탐색
      </h1>
      <form className="searchbar" role="search" onSubmit={(e) => e.preventDefault()}>
        <Icon name="explore" size={20} />
        <label htmlFor="explore-q" className="sr-only">
          회사, 분야, 창업자, 경쟁사 검색
        </label>
        <input
          id="explore-q"
          ref={inputRef}
          type="search"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="회사, 분야, 창업자, 경쟁사"
          autoComplete="off"
          enterKeyHint="search"
        />
        {draft && (
          <button type="button" className="icon-btn" onClick={() => setDraft('')} aria-label="검색어 지우기">
            <Icon name="close" size={18} />
          </button>
        )}
      </form>

      <div className="segmented" role="group" aria-label="보기">
        {[
          ['companies', '회사'],
          ['issues', '지난 호'],
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
          {desktop && (
            <aside className="explore__filters" aria-label="필터">
              <FilterGroups state={state} update={update} base={base} idPrefix="side" />
            </aside>
          )}
          <div className="explore__results">
            <div className="explore__bar">
              {!desktop && (
                <button type="button" className="chip" onClick={() => setSheet(true)}>
                  <Icon name="filter" size={16} /> 필터{activeCount > 0 && <span className="num"> {activeCount}</span>}
                </button>
              )}
              <button
                type="button"
                className={`chip ${state.unread ? 'chip--on' : ''}`}
                aria-pressed={state.unread}
                onClick={() => update({ unread: !state.unread })}
              >
                안 읽은 곳만
              </button>
              <label className="select">
                <span className="sr-only">정렬</span>
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
                결과 <span className="num">{rows.length}</span>곳
              </p>
            </div>
            <ActiveFilters state={state} update={update} />

            {rows.length === 0 ? (
              <EmptyState
                icon="explore"
                title={
                  state.unread && filtered.length
                    ? '조건에 맞는 곳은 모두 읽었어요'
                    : state.q
                      ? `‘${state.q}’에 맞는 회사가 없어요`
                      : '조건에 맞는 회사가 없어요'
                }
                actions={
                  <>
                    <button
                      type="button"
                      className="btn btn--secondary"
                      onClick={() => update({ q: '', sector: [], stage: [], region: [], korea: [], unread: false })}
                    >
                      조건 지우기
                    </button>
                    <a className="btn btn--primary" href="#/">
                      최신 호 보기
                    </a>
                  </>
                }
              >
                철자를 확인하거나 필터를 줄여 보세요.
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
          title="필터"
          footer={
            <>
              <button type="button" className="btn btn--secondary" onClick={() => update({ sector: [], stage: [], region: [], korea: [] }, true)}>
                초기화
              </button>
              <button type="button" className="btn btn--primary" onClick={() => setSheet(false)}>
                <span>
                  <span className="num">{rows.length}</span>곳 보기
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

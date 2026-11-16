/* 탐색 (#/explore) — spec v2 §3 "탐색", IA §3-4.
   One search line, one row of chips, results as two-line rows. With nothing asked yet it shows
   ways in: by sector, by date, YC. Filters and the query live in the hash (replaced, not pushed),
   so back leaves the screen instead of undoing filters one by one, and returning restores them. */
import { useEffect, useMemo, useRef, useState } from 'react'
import Icon from '../components/Icon.jsx'
import Sheet from '../components/Sheet.jsx'
import { CompanyRow } from '../components/Company.jsx'
import { Chip, ChipRow, ChipWrap, EmptyState, PageTitle, SectionHeader } from '../components/ui.jsx'
import { LENS_FILTER, LENS_VERDICTS, REGIONS, SECTORS, STAGE_GROUPS, dates, isYcPick, search, startups, ycShort } from '../lib/data.js'
import { buildQuery, setQuery, useInterests, useReadLog } from '../lib/hooks.js'
import { readEntryState, writeEntryState } from '../lib/nav.js'
import { monthDay } from '../lib/format.js'
import { isEn, L } from '../lib/i18n.js'
import { rememberExplore } from './detail-hooks.jsx'
import { DayRow } from './Today.jsx'

const PAGE = 30

const SORTS = [
  { key: 'date', label: L('최신순', 'Newest') },
  { key: 'raised', label: L('누적 투자 큰 순', 'Most raised') },
  { key: 'name', label: L('이름순', 'Name') },
]

const GROUPS = [
  { key: 'sector', label: L('분야', 'Sector'), options: SECTORS.map(({ key, label }) => ({ key, label, dot: `var(--sd-sector-${key})` })), field: (s) => s._sector.key },
  { key: 'stage', label: L('단계', 'Stage'), options: STAGE_GROUPS, field: (s) => s._stageGroup },
  { key: 'region', label: L('지역', 'Region'), options: REGIONS, field: (s) => s._region },
  { key: 'korea', label: L('한국 시장 (AI 가설)', 'Korean market (AI)'), options: LENS_FILTER.map((key) => ({ key, label: LENS_VERDICTS[key].label })), field: (s) => s._lens?.v },
].filter((g) => !(isEn && g.key === 'korea'))

const listOf = (v) => (v ? v.split(',').filter(Boolean) : [])

function readState(params) {
  return {
    q: params.get('q') || '',
    sector: listOf(params.get('sector')),
    stage: listOf(params.get('stage')),
    region: listOf(params.get('region')),
    korea: listOf(params.get('korea')),
    yc: params.get('yc') === '1',
    unread: params.get('unread') === '1',
    sort: SORTS.some((s) => s.key === params.get('sort')) ? params.get('sort') : 'date',
  }
}

function useExploreState(params) {
  const state = readState(params)
  const update = (patch) => {
    // the live URL, not this render's copy: a debounced search must not undo a chip tapped meanwhile
    const live = readState(new URLSearchParams(window.location.hash.split('?')[1] || ''))
    const n = { ...live, ...patch }
    writeEntryState('more', PAGE)
    setQuery(
      `/explore${buildQuery({
        q: n.q,
        sector: n.sector,
        stage: n.stage,
        region: n.region,
        korea: n.korea,
        yc: n.yc ? '1' : null,
        unread: n.unread ? '1' : null,
        sort: n.sort === 'date' ? null : n.sort,
      })}`,
    )
  }
  return [state, update]
}

function passes(st, state, except) {
  return GROUPS.every((g) => g.key === except || !state[g.key].length || state[g.key].includes(g.field(st)))
}

function sortRows(rows, key) {
  const r = [...rows]
  if (key === 'raised') r.sort((a, b) => (b.startup._raisedUSD ?? -1) - (a.startup._raisedUSD ?? -1))
  else if (key === 'name') r.sort((a, b) => (a.startup.name_ko || '').localeCompare(b.startup.name_ko || '', L('ko', 'en')))
  return r
}

function FilterSheet({ open, onClose, state, update, base, count }) {
  const clear = () => update({ sector: [], stage: [], region: [], korea: [], yc: false, unread: false, sort: 'date' })
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={L('필터', 'Filters')}
      footer={
        <>
          <button type="button" className="btn btn--secondary" onClick={clear}>
            {L('초기화', 'Reset')}
          </button>
          <button type="button" className="btn btn--primary" onClick={onClose}>
            {L(`${count}곳 보기`, `Show ${count}`)}
          </button>
        </>
      }
    >
      <div className="opt">
        <p className="opt__title">{L('정렬', 'Sort')}</p>
        <ChipWrap label={L('정렬', 'Sort')}>
          {SORTS.map((o) => (
            <Chip key={o.key} on={state.sort === o.key} onClick={() => update({ sort: o.key })}>
              {o.label}
            </Chip>
          ))}
        </ChipWrap>
      </div>
      {GROUPS.map((g) => {
        const pool = base.filter(({ startup }) => passes(startup, state, g.key))
        return (
          <div className="opt" key={g.key}>
            <p className="opt__title">{g.label}</p>
            <ChipWrap label={g.label}>
              {g.options.map((o) => {
                const n = pool.filter(({ startup }) => g.field(startup) === o.key).length
                const on = state[g.key].includes(o.key)
                if (!n && !on) return null
                return (
                  <Chip key={o.key} on={on} dot={o.dot} count={n} onClick={() => update({ [g.key]: on ? state[g.key].filter((x) => x !== o.key) : [...state[g.key], o.key] })}>
                    {o.label}
                  </Chip>
                )
              })}
            </ChipWrap>
          </div>
        )
      })}
    </Sheet>
  )
}

function Browse({ update }) {
  const counts = new Map()
  for (const s of startups) counts.set(s._sector.key, (counts.get(s._sector.key) || 0) + 1)
  const ycCount = startups.filter(isYcPick).length
  return (
    <>
      <SectionHeader id="b-sector" title={L('분야별', 'By sector')} />
      <div className="sgrid" role="list" aria-labelledby="b-sector">
        {SECTORS.filter((s) => counts.get(s.key)).map((s) => (
          <button key={s.key} type="button" role="listitem" className="scard" onClick={() => update({ sector: [s.key] })} style={{ '--mono-bg': `var(--sd-sector-${s.key}-soft)`, '--mono-fg': `var(--sd-sector-${s.key})`, border: 0, textAlign: 'left' }}>
            <span className="scard__mono" aria-hidden="true">
              {[...s.label][0]}
            </span>
            <span className="scard__body">
              <span className="scard__label">{s.label}</span>
              <span className="scard__n num">{L(`${counts.get(s.key)}곳`, `${counts.get(s.key)}`)}</span>
            </span>
          </button>
        ))}
      </div>
      <SectionHeader id="b-date" title={L('날짜별', 'By date')} more={L('전체 날짜', 'All days')} moreHref="#/explore?view=dates" />
      <ul className="daylist daylist--page" aria-labelledby="b-date">
        {dates.slice(0, 5).map((d) => (
          <DayRow key={d} kind="issue" date={d} />
        ))}
      </ul>
      {ycCount > 0 && (
        <>
          <SectionHeader id="b-yc" title="Y Combinator" />
          <button type="button" className="linkrow" style={{ width: '100%', border: 0, textAlign: 'left' }} onClick={() => update({ yc: true })}>
            <span className="linkrow__body">
              <span className="linkrow__title">{L(`YC 회사 ${ycCount}곳 모두 보기`, `All ${ycCount} YC companies`)}</span>
              <span className="linkrow__sub">{L('최근 배치에서 매일 골라요', 'Picked daily from the newest batches')}</span>
            </span>
            <Icon name="chevronRight" size={20} />
          </button>
        </>
      )}
    </>
  )
}

export default function Explore({ params }) {
  const [state, update] = useExploreState(params)
  const [sheet, setSheet] = useState(false)
  const [draft, setDraft] = useState(state.q)
  const [more, setMore] = useState(() => readEntryState('more', PAGE))
  const inputRef = useRef(null)
  const { isRead } = useReadLog()
  const { interests } = useInterests()

  // follow the hash when it changes from elsewhere (header search, back/forward)
  const [seenQ, setSeenQ] = useState(state.q)
  if (seenQ !== state.q) {
    setSeenQ(state.q)
    setDraft(state.q)
  }
  // a new question starts from the first page of results
  const pkey = params.toString()
  const [seenKey, setSeenKey] = useState(pkey)
  if (seenKey !== pkey) {
    setSeenKey(pkey)
    setMore(PAGE)
  }
  useEffect(() => {
    if (draft === state.q) return
    const t = setTimeout(() => update({ q: draft.trim() ? draft : '' }), 220)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft])
  useEffect(() => {
    if (params.get('focus')) inputRef.current?.focus()
  }, [params])

  const base = useMemo(() => search(state.q), [state.q])
  const rows = useMemo(() => {
    let r = base.filter(({ startup }) => passes(startup, state))
    if (state.yc) r = r.filter(({ startup }) => isYcPick(startup))
    if (state.unread) r = r.filter(({ startup }) => !isRead(startup.id))
    return sortRows(r, state.sort)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, params.toString(), isRead])
  useEffect(() => rememberExplore(rows.map((r) => r.startup.id)), [rows])

  const filterCount = GROUPS.reduce((n, g) => n + state[g.key].length, 0) + (state.sort !== 'date' ? 1 : 0)
  const asking = Boolean(state.q || filterCount || state.yc || state.unread)
  const sectorChips = [...new Set([...interests, ...(() => {
    const c = new Map()
    for (const s of startups) c.set(s._sector.key, (c.get(s._sector.key) || 0) + 1)
    return [...c.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k)
  })()])].filter((k) => SECTORS.some((s) => s.key === k)).slice(0, 4)
  const lastFilter = [...GROUPS].reverse().find((g) => state[g.key].length)
  const shownN = Math.max(PAGE, more)

  return (
    <div className="page">
      <PageTitle title={L('탐색', 'Explore')} />
      <form className="search" role="search" onSubmit={(e) => (e.preventDefault(), inputRef.current?.blur())}>
        <Icon name="explore" size={20} />
        <label htmlFor="explore-q" className="sr-only">
          {L('회사, 분야, 창업자, 투자사 검색', 'Search companies, sectors, founders, investors')}
        </label>
        <input
          id="explore-q"
          ref={inputRef}
          type="search"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={L('회사·분야·창업자·경쟁사', 'Companies, sectors, founders')}
          autoComplete="off"
          enterKeyHint="search"
        />
        {draft && (
          <button type="button" className="btn-icon" onClick={() => (setDraft(''), update({ q: '' }))} aria-label={L('검색어 지우기', 'Clear search')}>
            <Icon name="close" size={18} />
          </button>
        )}
      </form>
      <div className="explore-bar">
        <ChipRow label={L('빠른 필터', 'Quick filters')}>
          <Chip on={filterCount > 0} icon="sliders" onClick={() => setSheet(true)} label={L(`필터${filterCount ? ` ${filterCount}개 적용` : ''}`, `Filters${filterCount ? `, ${filterCount} on` : ''}`)}>
            {L('필터', 'Filters')}
            {filterCount > 0 && <span className="num">{filterCount}</span>}
          </Chip>
          <Chip on={state.yc} onClick={() => update({ yc: !state.yc })}>
            YC
          </Chip>
          {sectorChips.map((k) => {
            const sec = SECTORS.find((s) => s.key === k)
            const on = state.sector.length === 1 && state.sector[0] === k
            return (
              <Chip key={k} on={on} dot={`var(--sd-sector-${k})`} onClick={() => update({ sector: on ? [] : [k] })}>
                {sec.label}
              </Chip>
            )
          })}
          <Chip on={state.unread} onClick={() => update({ unread: !state.unread })}>
            {L('안 읽은 곳', 'Unread')}
          </Chip>
        </ChipRow>
      </div>

      {!asking ? (
        <Browse update={update} />
      ) : (
        <>
          <div className="rhead">
            <p className="rhead__count" aria-live="polite">
              {L(`${rows.length}곳`, `${rows.length} ${rows.length === 1 ? 'company' : 'companies'}`)}
            </p>
            <button type="button" className="sortbtn" onClick={() => setSheet(true)} aria-haspopup="dialog">
              {SORTS.find((s) => s.key === state.sort)?.label}
              <Icon name="chevronDown" size={16} />
            </button>
          </div>
          {rows.length === 0 ? (
            <EmptyState
              icon="explore"
              title={state.q ? L(`‘${state.q}’에 맞는 회사가 없어요`, `No companies match “${state.q}”`) : L('조건에 맞는 회사가 없어요', 'No companies match')}
              action={
                lastFilter ? (
                  <button type="button" className="btn btn--secondary" onClick={() => update({ [lastFilter.key]: [] })}>
                    {L(`‘${lastFilter.label}’ 조건 빼기`, `Drop the ${lastFilter.label.toLowerCase()} filter`)}
                  </button>
                ) : (
                  <button type="button" className="btn btn--secondary" onClick={() => (setDraft(''), update({ q: '', yc: false, unread: false }))}>
                    {L('조건 지우기', 'Clear')}
                  </button>
                )
              }
            >
              {L('철자를 확인하거나, 분야·창업자 이름으로 찾아보세요.', 'Check the spelling, or try a sector or founder name.')}
            </EmptyState>
          ) : (
            <>
              <ul className="group">
                {rows.slice(0, shownN).map(({ startup: s, reason }) => (
                  <CompanyRow
                    key={s.id}
                    startup={s}
                    from="explore"
                    dot={!state.sector.length}
                    badge={isYcPick(s) ? `YC ${ycShort(s.yc?.batch)}` : null}
                    sub={reason ? <span className="reason">{reason}</span> : `${s.tagline}`}
                    value={state.sort === 'date' ? monthDay(s.date) : undefined}
                  />
                ))}
              </ul>
              {rows.length > shownN && (
                <div className="morebtn">
                  <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={() => {
                      const n = shownN + PAGE
                      setMore(n)
                      writeEntryState('more', n)
                    }}
                  >
                    {L(`${Math.min(PAGE, rows.length - shownN)}곳 더 보기`, `Show ${Math.min(PAGE, rows.length - shownN)} more`)}
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
      <FilterSheet open={sheet} onClose={() => setSheet(false)} state={state} update={update} base={base} count={rows.length} />
    </div>
  )
}

/** #/explore?view=dates — every day, newest first, grouped by month. */
export function DatesView() {
  const months = []
  for (const d of dates) {
    const k = d.slice(0, 7)
    if (months.at(-1)?.k !== k) months.push({ k, days: [] })
    months.at(-1).days.push(d)
  }
  return (
    <div className="page">
      <PageTitle title={L('날짜별', 'By date')} sub={L(`지금까지 ${dates.length}일`, `${dates.length} days so far`)} />
      {months.map((m) => (
        <section key={m.k} className="month" aria-label={m.k}>
          <h2 className="month__title num">{isEn ? m.k.replace('-', '.') : `${+m.k.slice(0, 4)}년 ${+m.k.slice(5)}월`}</h2>
          <ul className="daylist daylist--page">
            {m.days.map((d) => (
              <DayRow key={d} kind="issue" date={d} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

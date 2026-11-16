/* 공모전 (#/contests, #/contests?c=<id>) — spec v2 §3 "공모전", IA §3-5·3-6.
   Deadline groups with a D-day badge per row, one row of chips, everything else in one sheet.
   Phone: a contest opens as its own page (pushed, so back returns to the list where it was).
   Desktop: list on the left, the contest on the right (replaced, no history per click).
   Filters live in the hash and are replaced, like 탐색. */
import { useMemo, useState } from 'react'
import Icon from '../components/Icon.jsx'
import Sheet from '../components/Sheet.jsx'
import { TopBar } from '../components/Chrome.jsx'
import { Chip, ChipRow, ChipWrap, Dday, EmptyState, PageTitle, SkeletonRows } from '../components/ui.jsx'
import { useToast } from '../components/toast-context.js'
import { buildQuery, navigate, setQuery } from '../lib/hooks.js'
import { L } from '../lib/i18n.js'
import { monthDay } from '../lib/format.js'
import { canonicalUrl, shareOrCopy } from '../lib/share.js'
import { PRIZES, TOPICS, WHOS, daysLeft, prizeByKey, prizeCell, prizeValue, today, topicOf, useContests, useSavedContests, whoByKey, whoLabel, won } from '../lib/contests.js'

const SORTS = [
  { key: 'deadline', label: L('마감 임박 순', 'Closing soonest') },
  { key: 'new', label: L('새로 올라온 순', 'Newest') },
  { key: 'prize', label: L('상금 큰 순', 'Biggest prize') },
]
const WD = L(['일', '월', '화', '수', '목', '금', '토'], ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'])
const dateWithDay = (ymd) => `${monthDay(ymd)} (${WD[new Date(`${ymd}T00:00:00`).getDay()]})`
const QUICK_TOPICS = ['창업·비즈니스', 'AI·데이터·SW']

function group(n) {
  if (n === 0) return { key: 0, label: L('오늘 마감', 'Closing today') }
  if (n <= 6) return { key: 1, label: L('7일 안에 마감', 'Within 7 days') }
  if (n <= 13) return { key: 2, label: L('2주 안에 마감', 'Within 2 weeks') }
  return { key: 3, label: L('그 이후', 'Later') }
}

function readParams(params) {
  return {
    topics: (params.get('topic') || '').split(',').filter((t) => TOPICS.some((x) => x.key === t)),
    who: whoByKey(params.get('who')).key,
    prize: prizeByKey(params.get('prize')).key,
    sort: SORTS.some((s) => s.key === params.get('sort')) ? params.get('sort') : 'deadline',
    savedOnly: params.get('saved') === '1',
    sel: params.get('c'),
  }
}

const queryOf = (n) =>
  buildQuery({
    who: n.who === 'all' ? null : n.who,
    topic: n.topics,
    prize: n.prize === 'all' ? null : n.prize,
    sort: n.sort === 'deadline' ? null : n.sort,
    saved: n.savedOnly ? 1 : null,
    c: n.sel,
  })

/* ---------- Row ---------- */

function ContestSave({ c }) {
  const { isSaved, toggle } = useSavedContests()
  const toast = useToast()
  const on = isSaved(c.id)
  return (
    <button
      type="button"
      className={`btn-icon save ${on ? 'is-on' : ''}`}
      aria-pressed={on}
      aria-label={on ? L(`${c.title} 저장 취소`, `Unsave ${c.title}`) : L(`${c.title} 저장`, `Save ${c.title}`)}
      onClick={() => {
        toggle(c.id)
        toast(on ? L('저장을 취소했어요', 'Removed from saved') : L('저장했어요 · 저장 탭에서 마감 순으로 볼 수 있어요', 'Saved · see it in Saved by deadline'), { label: L('되돌리기', 'Undo'), onClick: () => toggle(c.id) })
      }}
    >
      <Icon name={on ? 'bookmarkFill' : 'bookmark'} size={22} />
    </button>
  )
}

export function ContestRow({ c, now, selected = false, onPick, href, closed = false }) {
  const n = daysLeft(c.deadline, now)
  const [amount, label] = prizeCell(c)
  const body = (
    <>
      <Dday n={n} closed={closed} />
      <span className="crow__body">
        <span className="crow__title">{c.title}</span>
        <span className="crow__meta">
          {c.host && <span className="crow__host">{c.host}</span>}
          <span className="num">{amount ? `${label === L('1등', '1st prize') ? L('최고 ', 'Top ') : ''}${amount}` : label}</span>
        </span>
      </span>
    </>
  )
  return (
    <li className={`crow ${selected ? 'is-selected' : ''} ${closed ? 'is-closed' : ''}`}>
      {href ? (
        <a className="crow__btn" href={href}>
          {body}
        </a>
      ) : (
        <button type="button" className="crow__btn" aria-current={selected || undefined} onClick={() => onPick(c)}>
          {body}
        </button>
      )}
      <ContestSave c={c} />
    </li>
  )
}

/* ---------- Detail ---------- */

/** An all-day event on the deadline with a reminder three days before, as an .ics data link. */
function icsHref(c) {
  const d = c.deadline.replaceAll('-', '')
  const next = new Date(`${c.deadline}T00:00:00`)
  next.setDate(next.getDate() + 1)
  const end = `${next.getFullYear()}${String(next.getMonth() + 1).padStart(2, '0')}${String(next.getDate()).padStart(2, '0')}`
  const esc = (t = '') => t.replace(/[\\;,]/g, (m) => `\\${m}`).replace(/\n/g, ' ')
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Startup Daily//Contests//KO',
    'BEGIN:VEVENT',
    `UID:contest-${c.id}@startup-daily`,
    `DTSTAMP:${d}T000000Z`,
    `DTSTART;VALUE=DATE:${d}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${esc(`[마감] ${c.title}`)}`,
    `DESCRIPTION:${esc([c.host, c.sites[0]?.url].filter(Boolean).join(' · '))}`,
    `URL:${c.sites[0]?.url || ''}`,
    'BEGIN:VALARM',
    'TRIGGER:-P3D',
    'ACTION:DISPLAY',
    `DESCRIPTION:${esc(`마감 3일 전: ${c.title}`)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`
}

export function ContestBody({ c, now, inPane = false }) {
  const n = daysLeft(c.deadline, now)
  const [amount, label] = prizeCell(c)
  const sub = c.prize_top && c.prize_total ? L(`총상금 ${won(c.prize_total)}`, `${won(c.prize_total)} in total`) : !c.prize_total && c.prize_band ? L(`규모 ${c.prize_band}`, `Range: ${c.prize_band}`) : null
  const target = c.target && !/^(기타|제한\s*없음|대상 제한 없음)$/.test(c.target) && c.target.replace(/\s/g, '') !== whoLabel(c).replace(/\s/g, '') ? c.target : null
  return (
    <div className="cd">
      <p className="cd__when">
        <Dday n={n} />
        <span className="num">{L(`${dateWithDay(c.deadline)} 마감`, `Closes ${dateWithDay(c.deadline)}`)}</span>
      </p>
      {inPane ? <h2 className="cd__title">{c.title}</h2> : <h1 className="cd__title" tabIndex={-1}>{c.title}</h1>}
      {c.host && <p className="cd__host">{c.host}</p>}
      <dl className="cd__facts">
        <div>
          <dt>{L('상금', 'Prize')}</dt>
          <dd className="num">
            {amount ? `${amount} · ${label}` : label}
            {sub && <small>{sub}</small>}
          </dd>
        </div>
        <div>
          <dt>{L('참가 대상', 'Who')}</dt>
          <dd>
            {c.who?.length ? whoLabel(c) : L('공고에 없음', 'Not stated')}
            {target && <small>{target}</small>}
          </dd>
        </div>
        <div>
          <dt>{L('주제', 'Topic')}</dt>
          <dd>{topicOf(c.topic).short}</dd>
        </div>
        <div>
          <dt>{L('접수', 'Dates')}</dt>
          <dd className="num">
            {c.posted ? `${monthDay(c.posted)} ~ ${monthDay(c.deadline)}` : `~ ${monthDay(c.deadline)}`}
            <small>
              <a href={icsHref(c)} download={`contest-${c.id}.ics`} style={{ color: 'var(--sd-accent)', fontWeight: 600 }}>
                {L('캘린더에 추가', 'Add to calendar')}
              </a>
            </small>
          </dd>
        </div>
        <div>
          <dt>{L('올라온 곳', 'Listed on')}</dt>
          <dd>
            <ul className="cd__sites">
              {c.sites.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer">
                    {s.site}
                    <Icon name="external" size={14} />
                  </a>
                  {s.posted && <span className="num">{L(`${monthDay(s.posted)} 등록`, `posted ${monthDay(s.posted)}`)}</span>}
                </li>
              ))}
            </ul>
          </dd>
        </div>
      </dl>
      {inPane && (
        <div className="cd__cta">
          <a className="btn btn--primary btn--lg" href={c.sites[0].url} target="_blank" rel="noopener noreferrer">
            {L('원문에서 자세히 보기', 'Open the original notice')} <Icon name="external" size={16} />
          </a>
        </div>
      )}
      <p className="cd__note">{L('상금·대상·주제는 공고에서 자동으로 뽑았어요. 접수 전에 원문에서 꼭 확인하세요.', 'Prize, eligibility and topic are extracted automatically. Check the original notice before applying.')}</p>
    </div>
  )
}

function ContestPage({ c, now, back }) {
  const toast = useToast()
  const share = async () => {
    const r = await shareOrCopy({ title: c.title, text: L(`${c.title} · ${monthDay(c.deadline)} 마감`, `${c.title} · closes ${monthDay(c.deadline)}`), url: canonicalUrl(`/contests?c=${c.id}`) })
    if (r === 'copied') toast(L('링크를 복사했어요', 'Link copied'))
  }
  return (
    <>
      <TopBar
        back={back}
        title={c.title}
        titleVisible={false}
        actions={
          <button type="button" className="btn-icon" onClick={share} aria-label={L('공유', 'Share')}>
            <Icon name="share" size={22} />
          </button>
        }
      />
      <ContestBody c={c} now={now} />
      <div className="actionbar" role="toolbar" aria-label={L('이 공모전', 'This contest')}>
        <ContestSave c={c} />
        <a className="btn btn--primary" href={c.sites[0].url} target="_blank" rel="noopener noreferrer">
          <span>{L(`${c.sites[0].site}에서 원문 보기`, `Open on ${c.sites[0].site}`)}</span>
          <Icon name="external" size={18} />
        </a>
      </div>
    </>
  )
}

/* ---------- Filters ---------- */

function FilterSheet({ open, onClose, f, go, pool, count }) {
  const counts = (dim, test) => pool(dim).filter(test).length
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={L('필터', 'Filters')}
      footer={
        <>
          <button type="button" className="btn btn--secondary" onClick={() => go({ who: 'all', topics: [], prize: 'all', savedOnly: false, sort: 'deadline' })}>
            {L('초기화', 'Reset')}
          </button>
          <button type="button" className="btn btn--primary" onClick={onClose}>
            {L(`${count}건 보기`, `Show ${count}`)}
          </button>
        </>
      }
    >
      <div className="opt">
        <p className="opt__title">{L('정렬', 'Sort')}</p>
        <ChipWrap label={L('정렬', 'Sort')}>
          {SORTS.map((s) => (
            <Chip key={s.key} on={f.sort === s.key} onClick={() => go({ sort: s.key })}>
              {s.label}
            </Chip>
          ))}
        </ChipWrap>
      </div>
      <div className="opt">
        <p className="opt__title">{L('참가 대상', 'Who can enter')}</p>
        <p className="opt__hint">{L('누구나 참가하는 공모전도 함께 나와요.', 'Includes contests open to everyone.')}</p>
        <ChipWrap label={L('참가 대상', 'Who can enter')}>
          {WHOS.map((w) => (
            <Chip key={w.key} on={f.who === w.key} count={counts('who', w.test)} onClick={() => go({ who: w.key })}>
              {w.label}
            </Chip>
          ))}
        </ChipWrap>
      </div>
      <div className="opt">
        <p className="opt__title">{L('주제 (여러 개)', 'Topics (any)')}</p>
        <ChipWrap label={L('주제', 'Topic')}>
          {TOPICS.map((t) => {
            const on = f.topics.includes(t.key)
            const n = counts('topic', (c) => c.topic === t.key)
            if (!n && !on) return null
            return (
              <Chip key={t.key} on={on} count={n} onClick={() => go({ topics: on ? f.topics.filter((x) => x !== t.key) : [...f.topics, t.key] })}>
                {t.short}
              </Chip>
            )
          })}
        </ChipWrap>
      </div>
      <div className="opt">
        <p className="opt__title">{L('상금', 'Prize')}</p>
        <ChipWrap label={L('상금', 'Prize')}>
          {PRIZES.map((p) => (
            <Chip key={p.key} on={f.prize === p.key} count={counts('prize', p.test)} onClick={() => go({ prize: p.key })}>
              {p.label}
            </Chip>
          ))}
        </ChipWrap>
      </div>
    </Sheet>
  )
}

/* ---------- Screen ---------- */

export default function Contests({ params, desktop, back }) {
  const { status, doc, retry } = useContests()
  const f = readParams(params)
  const { isSaved, saved } = useSavedContests()
  const [sheet, setSheet] = useState(false)
  const now = today()

  const go = (patch) => setQuery(`/contests${queryOf({ ...f, ...patch, sel: patch.sel !== undefined ? patch.sel : desktop ? f.sel : null })}`)
  const pick = (c) => (desktop ? setQuery(`/contests${queryOf({ ...f, sel: c.id })}`) : navigate(`/contests${queryOf({ ...f, sel: c.id })}`))

  const open = useMemo(() => (doc ? doc.items.filter((c) => c.deadline >= now) : []), [doc, now])
  const preds = {
    who: whoByKey(f.who).test,
    topic: (c) => !f.topics.length || f.topics.includes(c.topic),
    prize: prizeByKey(f.prize).test,
    saved: (c) => !f.savedOnly || isSaved(c.id),
  }
  const pool = (dim) => open.filter((c) => Object.entries(preds).every(([k, p]) => k === dim || p(c)))
  const list = useMemo(() => {
    const xs = open.filter((c) => Object.values(preds).every((p) => p(c)))
    if (f.sort === 'prize') return xs.sort((a, b) => prizeValue(b) - prizeValue(a) || a.deadline.localeCompare(b.deadline))
    if (f.sort === 'new') return xs.sort((a, b) => (b.posted || '').localeCompare(a.posted || '') || a.deadline.localeCompare(b.deadline))
    return xs.sort((a, b) => a.deadline.localeCompare(b.deadline) || prizeValue(b) - prizeValue(a))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, params.toString(), saved])

  if (status === 'loading')
    return (
      <div className="page">
        <PageTitle title={L('공모전', 'Contests')} />
        <SkeletonRows n={6} />
      </div>
    )
  if (status === 'failed')
    return (
      <div className="page">
        <EmptyState level={1} icon="info" title={L('공모전 목록을 불러오지 못했어요', 'Couldn’t load contests')} action={<button type="button" className="btn btn--secondary" onClick={retry}>{L('다시 시도', 'Try again')}</button>}>
          {L('인터넷 연결을 확인해 주세요.', 'Check your connection and try again.')}
        </EmptyState>
      </div>
    )

  // a phone opening one contest
  if (!desktop && f.sel) {
    const c = doc.items.find((x) => x.id === f.sel)
    if (!c)
      return (
        <>
          <TopBar back={back} title="" titleVisible={false} actions={<span />} />
          <div className="page">
            <EmptyState level={1} icon="trophy" title={L('이 공모전은 목록에서 내려갔어요', 'This contest is no longer listed')} action={<a className="btn btn--secondary" href="#/contests">{L('공모전 보기', 'See contests')}</a>}>
              {L('마감이 지났거나 원래 사이트에서 내려간 공모전이에요.', 'It has closed or was taken down by the listing site.')}
            </EmptyState>
          </div>
        </>
      )
    return <ContestPage c={c} now={now} back={back} />
  }

  const closingWeek = open.filter((c) => daysLeft(c.deadline, now) <= 6).length
  const savedOpen = open.filter((c) => isSaved(c.id)).sort((a, b) => a.deadline.localeCompare(b.deadline))
  const filterCount = (f.who !== 'all') + f.topics.filter((t) => !QUICK_TOPICS.includes(t)).length + (f.prize !== 'all' && f.prize !== 'cash') + (f.sort !== 'deadline')
  const selected = desktop ? list.find((c) => c.id === f.sel) || list[0] : null

  const groups = []
  if (f.sort === 'deadline') {
    for (const c of list) {
      const g = group(daysLeft(c.deadline, now))
      if (groups.at(-1)?.key !== g.key) groups.push({ ...g, items: [] })
      groups.at(-1).items.push(c)
    }
  } else groups.push({ key: 'all', label: SORTS.find((s) => s.key === f.sort).label, items: list })

  const listPart = (
    <div className="page">
      <PageTitle
        eyebrow={<span className="num">{L(`${monthDay(doc.updated)} 갱신`, `Updated ${monthDay(doc.updated)}`)}</span>}
        title={L('공모전', 'Contests')}
        sub={L(`접수 중 ${open.length}건 · 7일 안에 마감 ${closingWeek}건`, `${open.length} open · ${closingWeek} closing within 7 days`)}
      />
      {savedOpen.length > 0 && (
        <a className="linkrow csaved" href="#/saved?tab=contests">
          <Icon name="bookmarkFill" size={20} />
          <span className="linkrow__body">
            <span className="linkrow__title">{L(`저장한 공모전 ${savedOpen.length}건`, `${savedOpen.length} saved`)}</span>
            <span className="linkrow__sub num">
              {L('가장 빠른 마감 ', 'Next deadline ')}
              {daysLeft(savedOpen[0].deadline, now) === 0 ? L('오늘', 'today') : `D-${daysLeft(savedOpen[0].deadline, now)}`}
            </span>
          </span>
          <Icon name="chevronRight" size={20} />
        </a>
      )}
      <ChipRow label={L('빠른 필터', 'Quick filters')}>
        <Chip on={filterCount > 0} icon="sliders" onClick={() => setSheet(true)}>
          {L('필터', 'Filters')}
          {filterCount > 0 && <span className="num">{filterCount}</span>}
        </Chip>
        <Chip on={f.who === 'univ'} onClick={() => go({ who: f.who === 'univ' ? 'all' : 'univ' })}>
          {L('대학생', 'Students')}
        </Chip>
        {QUICK_TOPICS.map((t) => {
          const on = f.topics.includes(t)
          return (
            <Chip key={t} on={on} onClick={() => go({ topics: on ? f.topics.filter((x) => x !== t) : [...f.topics, t] })}>
              {topicOf(t).short}
            </Chip>
          )
        })}
        <Chip on={f.prize === 'cash'} onClick={() => go({ prize: f.prize === 'cash' ? 'all' : 'cash' })}>
          {L('상금 있음', 'Cash prize')}
        </Chip>
      </ChipRow>
      <div className="rhead">
        <p className="rhead__count" aria-live="polite">
          {L(`${list.length}건`, `${list.length} ${list.length === 1 ? 'contest' : 'contests'}`)}
        </p>
        <button type="button" className="sortbtn" onClick={() => setSheet(true)} aria-haspopup="dialog">
          {SORTS.find((s) => s.key === f.sort).label}
          <Icon name="chevronDown" size={16} />
        </button>
      </div>
      {list.length === 0 ? (
        <EmptyState icon="trophy" title={L('조건에 맞는 공모전이 없어요', 'No contests match')} action={<button type="button" className="btn btn--secondary" onClick={() => go({ who: 'all', topics: [], prize: 'all', savedOnly: false })}>{L('조건 지우기', 'Clear filters')}</button>} />
      ) : (
        groups.map((g) => (
          <section key={g.key} className="cgroup" aria-label={g.label}>
            <h2 className="cgroup__head">
              {g.label}
              <span className="num">{L(`${g.items.length}건`, g.items.length)}</span>
            </h2>
            <ul className="group">
              {g.items.map((c) => (
                <ContestRow key={c.id} c={c} now={now} selected={selected?.id === c.id} onPick={pick} />
              ))}
            </ul>
          </section>
        ))
      )}
      <p className="ctrust">
        {L(
          `${doc.sources.join('·')}에 올라온 공고를 매일 모아 같은 공모전은 하나로 합쳤어요.`,
          `Collected daily from ${doc.sources.length} Korean listing sites, one row per contest. Contest details are in Korean.`,
        )}{' '}
        <a href="#/about?sec=contests" style={{ color: 'var(--sd-accent)', fontWeight: 600 }}>
          {L('모으는 방법', 'How')}
        </a>
      </p>
      <FilterSheet open={sheet} onClose={() => setSheet(false)} f={f} go={go} pool={pool} count={list.length} />
    </div>
  )

  if (!desktop) return listPart
  return (
    <div className="contests-split">
      {listPart}
      <aside className="cpane" aria-label={L('공모전 상세', 'Contest details')}>
        {selected ? <ContestBody key={selected.id} c={selected} now={now} inPane /> : <p className="cpane__empty">{L('공모전을 고르면 여기에 나와요.', 'Pick a contest to see it here.')}</p>}
      </aside>
    </div>
  )
}

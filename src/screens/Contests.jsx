import { useMemo, useState } from 'react'
import Icon from '../components/Icon.jsx'
import Sheet from '../components/Sheet.jsx'
import { EmptyState } from '../components/bits.jsx'
import { buildQuery, navigate } from '../lib/hooks.js'
import { currentEntry } from '../lib/nav.js'
import { L } from '../lib/i18n.js'
import { monthDay } from '../lib/format.js'
import {
  PRIZES, TOPICS, WHOS, daysLeft, ddayLabel, deadlineGroup, isStartupTopic, prizeByKey, prizeCell, prizeValue,
  today, topicColor, topicOf, useContests, useSavedContests, whoByKey, whoLabel, won,
} from '../lib/contests.js'

/* #/contests?who=univ&topic=a,b&prize=3m&sort=prize&saved=1&c=<id>
   Filters live in the URL (replace), like 탐색. Opening a contest pushes ?c= on phones,
   so the back gesture closes the sheet; on desktop it fills the right pane. */

const SORTS = [
  { key: 'deadline', label: L('마감 임박 순', 'Closing soonest') },
  { key: 'prize', label: L('상금 큰 순', 'Biggest prize') },
  { key: 'new', label: L('새로 올라온 순', 'Newest') },
]
const WD = L(['일', '월', '화', '수', '목', '금', '토'], ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'])
const dateWithDay = (ymd) => `${monthDay(ymd)} (${WD[new Date(`${ymd}T00:00:00`).getDay()]})`
const dotMD = (ymd) => `${+ymd.slice(5, 7)}.${+ymd.slice(8, 10)}`

function readParams(params) {
  const topics = (params.get('topic') || '').split(',').filter((t) => TOPICS.some((x) => x.key === t))
  return {
    topics,
    who: whoByKey(params.get('who')).key,
    prize: prizeByKey(params.get('prize')).key,
    sort: SORTS.some((s) => s.key === params.get('sort')) ? params.get('sort') : 'deadline',
    savedOnly: params.get('saved') === '1',
    sel: params.get('c'),
  }
}

export default function Contests({ params, desktop }) {
  const { status, doc, retry } = useContests()
  const f = readParams(params)
  const { isSaved, toggle } = useSavedContests()
  const now = today()

  const go = (patch, { push = false } = {}) => {
    const next = { ...f, ...patch }
    navigate(
      `/contests${buildQuery({
        who: next.who === 'all' ? null : next.who,
        topic: next.topics,
        prize: next.prize === 'all' ? null : next.prize,
        sort: next.sort === 'deadline' ? null : next.sort,
        saved: next.savedOnly ? 1 : null,
        c: next.sel,
      })}`,
      { replace: !push },
    )
  }

  // closed contests drop off by the reader's own date
  const open = useMemo(() => (doc ? doc.items.filter((c) => c.deadline >= now) : []), [doc, now])
  // one predicate per filter; each chip's count applies every filter but its own
  const preds = {
    who: whoByKey(f.who).test,
    topic: (c) => !f.topics.length || f.topics.includes(c.topic),
    prize: prizeByKey(f.prize).test,
    saved: (c) => !f.savedOnly || isSaved(c.id),
  }
  const except = (dim) => open.filter((c) => Object.entries(preds).every(([k, p]) => k === dim || p(c)))

  const list = useMemo(() => {
    const xs = open.filter((c) => Object.values(preds).every((p) => p(c)))
    const startupFirst = (c) => (f.topics.length || isStartupTopic(c.topic) ? 0 : 1)
    if (f.sort === 'prize') return xs.sort((a, b) => prizeValue(b) - prizeValue(a) || a.deadline.localeCompare(b.deadline))
    if (f.sort === 'new') return xs.sort((a, b) => b.posted.localeCompare(a.posted) || a.deadline.localeCompare(b.deadline))
    return xs.sort((a, b) => a.deadline.localeCompare(b.deadline) || startupFirst(a) - startupFirst(b) || prizeValue(b) - prizeValue(a))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, params.toString(), isSaved])

  if (status === 'loading') {
    return (
      <div className="boot__body" aria-busy="true">
        <div className="boot__line boot__line--title" />
        <div className="boot__line boot__line--sub" />
        <div className="boot__row" />
        <div className="boot__row" />
      </div>
    )
  }
  if (status === 'failed') {
    return (
      <div className="page">
        <EmptyState
          icon="info"
          level={1}
          title={L('공모전 목록을 불러오지 못했어요', 'Couldn’t load contests')}
          actions={
            <button type="button" className="btn btn--primary" onClick={retry}>
              {L('다시 시도', 'Try again')}
            </button>
          }
        >
          {L('인터넷 연결을 확인해 주세요.', 'Check your connection and try again.')}
        </EmptyState>
      </div>
    )
  }

  const selected = open.find((c) => c.id === f.sel) || (desktop ? list[0] : null)
  const closingThisWeek = open.filter((c) => daysLeft(c.deadline, now) <= 6).length
  const filtered = f.topics.length || f.prize !== 'all' || f.who !== 'all' || f.savedOnly
  const savedCount = open.filter((c) => isSaved(c.id)).length

  const pick = (c) => go({ sel: c.id }, { push: !desktop })

  return (
    <div className="contests">
      <div className="contests__main page">
        <header className="contests__head">
          <div className="issue-head__rule" />
          <span className="eyebrow">{L(`${monthDay(doc.updated)} 갱신`, `Updated ${monthDay(doc.updated)}`)}</span>
          <h1 className="issue-head__title" tabIndex={-1}>
            {L('공모전', 'Contests')}
          </h1>
          <p className="contests__sub">
            {L(
              <>
                지금 접수 중인 <strong>{open.length}건</strong>, 그중 이번 주 마감 <strong>{closingThisWeek}건</strong>.
              </>,
              <>
                <strong>{open.length}</strong> open in Korea, <strong>{closingThisWeek}</strong> closing this week.
              </>,
            )}
          </p>
        </header>

        <Filters f={f} open={open} except={except} go={go} count={list.length} filtered={filtered} savedCount={savedCount} desktop={desktop} />

        {list.length === 0 ? (
          <p className="contests__empty">
            {f.savedOnly && !savedCount
              ? L('저장한 공모전이 없어요. 공모전을 열어 저장해 보세요.', 'Nothing saved yet. Open a contest to save it.')
              : L('조건에 맞는 공모전이 없어요. 조건을 하나씩 풀어 보세요.', 'No contests match. Try loosening a filter.')}
          </p>
        ) : (
          <ContestList list={list} sort={f.sort} selectedId={desktop ? selected?.id : null} onPick={pick} now={now} />
        )}

        <p className="contests__trust">
          {L(
            `${doc.sources.join('·')}에 올라온 공고를 모아 같은 공모전은 하나로 합쳤습니다. 상금·주제·참가 대상은 공고문에서 자동으로 뽑았으니, 접수 전에 원문에서 꼭 확인하세요.`,
            `Collected from ${doc.sources.length} Korean listing sites, one row per contest; details are in Korean. Prizes, topics and eligibility are extracted automatically, so check the original notice before applying.`,
          )}
        </p>
      </div>

      {desktop ? (
        <aside className="contests__pane" aria-label={L('공모전 상세', 'Contest details')}>
          {selected ? (
            <ContestDetail key={selected.id} c={selected} now={now} saved={isSaved(selected.id)} onSave={() => toggle(selected.id)} />
          ) : (
            <p className="contests__pane-empty">{L('공모전을 고르면 상금, 자격, 원문 링크가 여기에 나와요.', 'Pick a contest to see its prize, eligibility and links.')}</p>
          )}
        </aside>
      ) : (
        <Sheet
          open={!!selected}
          onClose={() => (currentEntry()?.depth > 0 ? window.history.back() : go({ sel: null }))}
          title={selected?.title || ''}
          className="sheet--contest"
          footer={
            selected && (
              <>
                <button type="button" className={`btn btn--secondary ${isSaved(selected.id) ? 'is-on' : ''}`} aria-pressed={isSaved(selected.id)} onClick={() => toggle(selected.id)}>
                  <Icon name={isSaved(selected.id) ? 'bookmarkFill' : 'bookmark'} size={18} />
                  {isSaved(selected.id) ? L('저장됨', 'Saved') : L('저장', 'Save')}
                </button>
                <a className="btn btn--primary" href={selected.sites[0].url} target="_blank" rel="noopener noreferrer">
                  {L('원문 공고 보기', 'Open the notice')}
                </a>
              </>
            )
          }
        >
          {selected && <ContestFacts c={selected} now={now} />}
        </Sheet>
      )}
    </div>
  )
}

/* ---------- Filters: who (one) × topic (several) × prize (one), counts cross-applied.
   Desktop shows every option as chip rows; phones get one row of buttons, each opening
   its options in a bottom sheet, so the list starts near the top of the screen. ---------- */

function useGroups({ f, except, go }) {
  const inWho = except('who')
  const inTopic = except('topic')
  const inPrize = except('prize')
  const topicCount = {}
  inTopic.forEach((c) => (topicCount[c.topic] = (topicCount[c.topic] || 0) + 1))
  const flipTopic = (key) => go({ topics: f.topics.includes(key) ? f.topics.filter((t) => t !== key) : [...f.topics, key], sel: null })
  const topicName = f.topics.length ? (f.topics.length === 1 ? TOPICS.find((t) => t.key === f.topics[0])?.short : L(`${TOPICS.find((t) => t.key === f.topics[0])?.short} 외 ${f.topics.length - 1}`, `${f.topics.length} topics`)) : null

  return [
    {
      key: 'who',
      label: L('참가 대상', 'Who'),
      value: f.who === 'all' ? null : whoByKey(f.who).label,
      reset: () => go({ who: 'all', sel: null }),
      options: WHOS.map((w) => ({
        key: w.key,
        label: w.label,
        n: inWho.filter(w.test).length,
        on: f.who === w.key,
        pick: () => go({ who: f.who === w.key ? 'all' : w.key, sel: null }),
      })),
    },
    {
      key: 'topic',
      label: L('주제', 'Topic'),
      multi: true,
      value: topicName,
      reset: () => go({ topics: [], sel: null }),
      options: [
        { key: 'all', label: L('전체', 'All'), n: inTopic.length, on: !f.topics.length, pick: () => go({ topics: [], sel: null }) },
        ...TOPICS.map((t) => ({
          key: t.key,
          label: t.short,
          color: topicColor(t.key),
          n: topicCount[t.key] || 0,
          on: f.topics.includes(t.key),
          pick: () => flipTopic(t.key),
        })),
      ],
    },
    {
      key: 'prize',
      label: L('상금', 'Prize'),
      value: f.prize === 'all' ? null : prizeByKey(f.prize).label,
      reset: () => go({ prize: 'all', sel: null }),
      options: PRIZES.map((p) => ({
        key: p.key,
        label: p.label,
        n: inPrize.filter(p.test).length,
        on: f.prize === p.key,
        pick: () => go({ prize: f.prize === p.key ? 'all' : p.key, sel: null }),
      })),
    },
  ]
}

function Chips({ group, wrap }) {
  return (
    <div className={`cfilters__chips ${wrap ? 'cfilters__chips--wrap' : ''}`} role="group" aria-label={group.label}>
      {group.options.map((o) => (
        <button
          key={o.key}
          type="button"
          className="chip cchip"
          aria-pressed={o.on}
          disabled={!o.n && !o.on}
          onClick={o.pick}
          style={o.color ? { '--c': o.color } : undefined}
        >
          {o.color && <span className="cchip__sw" aria-hidden="true" />}
          {o.label} <span className="cchip__n mono">{o.n}</span>
        </button>
      ))}
    </div>
  )
}

function Filters({ f, open, except, go, count, filtered, savedCount, desktop }) {
  const groups = useGroups({ f, except, go })
  const [sheet, setSheet] = useState(null)
  const active = groups.find((g) => g.key === sheet)
  const clear = () => go({ who: 'all', topics: [], prize: 'all', savedOnly: false, sel: null })

  const bar = (
    <div className="cfilters__bar">
      <span className="cfilters__count" aria-live="polite">
        <strong className="num">{count}</strong>
        {L('건', count === 1 ? ' contest' : ' contests')}
        {count !== open.length && <span className="cfilters__of">{L(` / ${open.length}`, ` of ${open.length}`)}</span>}
      </span>
      {filtered && (
        <button type="button" className="cfilters__reset" onClick={clear}>
          {L('필터 해제', 'Clear')}
        </button>
      )}
      <label className="sr-only" htmlFor="cf-sort">
        {L('정렬', 'Sort')}
      </label>
      <select id="cf-sort" className="cfilters__sort" value={f.sort} onChange={(e) => go({ sort: e.target.value })}>
        {SORTS.map((s) => (
          <option key={s.key} value={s.key}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  )

  const saved = savedCount > 0 && (
    <button type="button" className="chip cchip cfilters__savedchip" aria-pressed={f.savedOnly} onClick={() => go({ savedOnly: !f.savedOnly, sel: null })}>
      <Icon name={f.savedOnly ? 'bookmarkFill' : 'bookmark'} size={14} />
      {L(`저장 ${savedCount}`, `Saved ${savedCount}`)}
    </button>
  )

  if (desktop) {
    return (
      <div className="cfilters">
        {groups.map((g) => (
          <div className="cfilters__row" key={g.key}>
            <span className="cfilters__label">{g.label}</span>
            <Chips group={g} />
          </div>
        ))}
        <div className="cfilters__bar-wrap">
          {saved}
          {bar}
        </div>
      </div>
    )
  }

  return (
    <div className="cfilters cfilters--m">
      <div className="cfilters__pills">
        {groups.map((g) => (
          <button key={g.key} type="button" className={`cpill ${g.value ? 'is-set' : ''}`} aria-haspopup="dialog" onClick={() => setSheet(g.key)}>
            <span className="cpill__k">{g.label}</span>
            {g.value && <span className="cpill__v">{g.value}</span>}
            <Icon name="chevronDown" size={14} />
          </button>
        ))}
        {saved}
      </div>
      {bar}
      <Sheet
        open={!!active}
        onClose={() => setSheet(null)}
        title={active?.label || ''}
        className="sheet--cfilter"
        footer={
          active && (
            <>
              <button type="button" className="btn btn--secondary" onClick={active.reset} disabled={!active.value}>
                {L('초기화', 'Reset')}
              </button>
              <button type="button" className="btn btn--primary" onClick={() => setSheet(null)}>
                {L(
                  <>
                    <span>
                      <span className="num">{count}</span>건 보기
                    </span>
                  </>,
                  <>
                    Show <span className="num">{count}</span>
                  </>,
                )}
              </button>
            </>
          )
        }
      >
        {active && (
          <>
            {active.multi && <p className="cfilters__hint">{L('여러 개를 고를 수 있어요.', 'Pick as many as you like.')}</p>}
            {active.key === 'who' && <p className="cfilters__hint">{L('고른 대상이 참가할 수 있는 공모전이에요. 누구나 참가하는 공모전도 함께 나와요.', 'Contests this group can enter, including ones open to everyone.')}</p>}
            <Chips group={active} wrap />
          </>
        )}
      </Sheet>
    </div>
  )
}

/* ---------- List ---------- */

function ContestList({ list, sort, selectedId, onPick, now }) {
  if (sort !== 'deadline') {
    return (
      <ul className="crows crows--flat">
        {list.map((c) => (
          <ContestRow key={c.id} c={c} selected={c.id === selectedId} onPick={onPick} now={now} />
        ))}
      </ul>
    )
  }
  const groups = []
  for (const c of list) {
    const g = deadlineGroup(c.deadline, now)
    if (groups.at(-1)?.key !== g.key) groups.push({ ...g, items: [] })
    groups.at(-1).items.push(c)
  }
  return groups.map((g) => (
    <section key={g.key} aria-label={g.label}>
      <h2 className="crows__group">
        {g.label}
        <span className="num">{L(`${g.items.length}건`, g.items.length)}</span>
      </h2>
      <ul className="crows">
        {g.items.map((c) => (
          <ContestRow key={c.id} c={c} selected={c.id === selectedId} onPick={onPick} now={now} />
        ))}
      </ul>
    </section>
  ))
}

/** One contest row. With `href` it is a link (the saved list), otherwise a button that opens the detail. */
export function ContestRow({ c, selected, onPick, now, href, closed = false }) {
  const n = daysLeft(c.deadline, now)
  const [amount, label] = prizeCell(c)
  const fresh = daysLeft(c.posted, now) >= -1
  const Tag = href ? 'a' : closed ? 'div' : 'button'
  return (
    <li className={`crow ${selected ? 'is-selected' : ''} ${closed ? 'is-closed' : ''}`}>
      <Tag {...(href ? { href } : closed ? {} : { type: 'button', onClick: () => onPick(c) })} className="crow__btn" aria-current={selected || undefined}>
        <span className={`crow__dday ${n <= 3 && !closed ? 'is-soon' : ''}`}>
          <span className="crow__n mono">{closed ? L('마감', 'Closed') : ddayLabel(n)}</span>
          <span className="crow__date mono">{dotMD(c.deadline)}</span>
        </span>
        <span className="crow__body">
          <span className="crow__title">{c.title}</span>
          <span className="crow__meta">
            {c.host && <span className="crow__host">{c.host}</span>}
            <span className="crow__topic" style={{ '--c': topicColor(c.topic) }}>
              <span className="cchip__sw" aria-hidden="true" />
              {topicOf(c.topic).short}
            </span>
            {c.who?.length > 0 && !c.who.includes('any') && <span className="crow__who">{whoLabel(c)}</span>}
            {fresh && <span className="crow__new">{L('새로', 'New')}</span>}
          </span>
        </span>
        <span className="crow__prize">
          {amount ? (
            <>
              <span className="crow__amount num">{amount}</span>
              <span className="crow__plabel">{label}</span>
            </>
          ) : (
            <span className="crow__na">{label}</span>
          )}
        </span>
      </Tag>
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

function ContestFacts({ c, now }) {
  const n = daysLeft(c.deadline, now)
  const [amount, label] = prizeCell(c)
  const sub = c.prize_top && c.prize_total ? L(`총상금 ${won(c.prize_total)}`, `${won(c.prize_total)} in total`) : !c.prize_total && c.prize_band ? L(`규모 ${c.prize_band}`, `Range: ${c.prize_band}`) : null
  return (
    <div className="cdetail">
      <p className="cdetail__line">
        <span className="crow__topic" style={{ '--c': topicColor(c.topic) }}>
          <span className="cchip__sw" aria-hidden="true" />
          {topicOf(c.topic).short}
        </span>
        {c.host && <span className="cdetail__host">{c.host}</span>}
      </p>
      <div className="cdetail__key">
        <div>
          <div className="cdetail__k">{L('접수 마감', 'Deadline')}</div>
          <div className={`cdetail__v mono ${n <= 3 ? 'is-soon' : ''}`}>{ddayLabel(n)}</div>
          <div className="cdetail__vsub">{dateWithDay(c.deadline)}</div>
          <a className="cdetail__cal" href={icsHref(c)} download={`contest-${c.id}.ics`}>
            <Icon name="calendar" size={14} />
            {L('캘린더에 추가', 'Add to calendar')}
          </a>
        </div>
        <div>
          <div className="cdetail__k">{amount ? L(`${label} 상금`, `Prize (${label})`) : L('상금', 'Prize')}</div>
          <div className="cdetail__v num">{amount || <span className="cdetail__vna">{label}</span>}</div>
          {sub && <div className="cdetail__vsub">{sub}</div>}
        </div>
      </div>
      <dl className="cdetail__facts">
        <div>
          <dt>{L('참가 대상', 'Who can enter')}</dt>
          <dd>
            {c.who?.length > 0 && <strong className="cdetail__who">{whoLabel(c)}</strong>}
            {/* the notice's own words, unless they only repeat the bold label (일반인 / 누구나) */}
            {c.target && !/^(기타|제한\s*없음|대상 제한 없음)$/.test(c.target) && c.target.replace(/\s/g, '') !== whoLabel(c).replace(/\s/g, '')
              ? c.target
              : !c.who?.length && L('공고에 없음', 'Not stated')}
          </dd>
        </div>
        <div>
          <dt>{L('올라온 곳', 'Listed on')}</dt>
          <dd>
            <ul className="cdetail__sites">
              {c.sites.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer">
                    {s.site}
                    <Icon name="external" size={14} />
                  </a>
                  {s.posted && <span className="mono">{L(`${dotMD(s.posted)} 등록`, `posted ${dotMD(s.posted)}`)}</span>}
                </li>
              ))}
            </ul>
          </dd>
        </div>
      </dl>
    </div>
  )
}

function ContestDetail({ c, now, saved, onSave }) {
  return (
    <article className="cpane">
      <h2 className="cpane__title">{c.title}</h2>
      <ContestFacts c={c} now={now} />
      <div className="cpane__actions">
        <a className="btn btn--primary" href={c.sites[0].url} target="_blank" rel="noopener noreferrer">
          {L('원문 공고 보기', 'Open the notice')}
          <Icon name="external" size={16} />
        </a>
        <button type="button" className={`btn btn--secondary ${saved ? 'is-on' : ''}`} aria-pressed={saved} onClick={onSave}>
          <Icon name={saved ? 'bookmarkFill' : 'bookmark'} size={18} />
          {saved ? L('저장됨', 'Saved') : L('저장', 'Save')}
        </button>
      </div>
    </article>
  )
}

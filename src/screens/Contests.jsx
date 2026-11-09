import { useMemo } from 'react'
import Icon from '../components/Icon.jsx'
import Sheet from '../components/Sheet.jsx'
import { EmptyState } from '../components/bits.jsx'
import { buildQuery, navigate } from '../lib/hooks.js'
import { currentEntry } from '../lib/nav.js'
import { L } from '../lib/i18n.js'
import { monthDay } from '../lib/format.js'
import {
  PRIZES, TOPICS, daysLeft, ddayLabel, deadlineGroup, isStartupTopic, prizeByKey, prizeCell, prizeValue,
  today, topicColor, topicOf, useContests, useSavedContests, won,
} from '../lib/contests.js'

/* #/contests?topic=a,b&prize=3m&sort=prize&saved=1&c=<id>
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
  const byTopic = (c) => !f.topics.length || f.topics.includes(c.topic)
  const byPrize = prizeByKey(f.prize).test
  const bySaved = (c) => !f.savedOnly || isSaved(c.id)

  const list = useMemo(() => {
    const xs = open.filter((c) => byTopic(c) && byPrize(c) && bySaved(c))
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
  const filtered = f.topics.length || f.prize !== 'all' || f.savedOnly
  const savedCount = open.filter((c) => isSaved(c.id)).length

  const pick = (c) => go({ sel: c.id }, { push: !desktop })

  return (
    <div className="contests">
      <div className="contests__main page">
        <header className="contests__head">
          <div className="issue-head__rule" />
          <span className="eyebrow mono">{L(`${monthDay(doc.updated)} 갱신`, `Updated ${monthDay(doc.updated)}`)}</span>
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
          <p className="contests__src">
            {L(
              `${doc.sources.join('·')}에 올라온 공고를 모아, 같은 공모전은 하나로 합쳤습니다.`,
              `Collected from ${doc.sources.length} Korean listing sites, one row per contest. Contest details are in Korean.`,
            )}
          </p>
        </header>

        <Filters f={f} open={open} byTopic={byTopic} byPrize={byPrize} bySaved={bySaved} go={go} count={list.length} filtered={filtered} savedCount={savedCount} />

        {list.length === 0 ? (
          <p className="contests__empty">
            {f.savedOnly && !savedCount
              ? L('저장한 공모전이 없어요. 공모전을 열어 저장해 보세요.', 'Nothing saved yet. Open a contest to save it.')
              : L('조건에 맞는 공모전이 없어요. 상금 조건을 낮추거나 주제를 더 골라 보세요.', 'No contests match. Lower the prize or add topics.')}
          </p>
        ) : (
          <ContestList list={list} sort={f.sort} selectedId={desktop ? selected?.id : null} onPick={pick} now={now} />
        )}

        <p className="contests__trust">
          {L(
            '상금과 주제는 공고문에서 자동으로 뽑았습니다. 금액·자격·마감은 접수 전에 원문에서 꼭 확인하세요.',
            'Prizes and topics are extracted automatically. Check the amount, eligibility and deadline in the original notice before applying.',
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

/* ---------- Filters: topic (several) × prize (one), counts cross-applied ---------- */

function Filters({ f, open, byTopic, byPrize, bySaved, go, count, filtered, savedCount }) {
  const inPrize = open.filter((c) => byPrize(c) && bySaved(c))
  const inTopic = open.filter((c) => byTopic(c) && bySaved(c))
  const topicCount = {}
  inPrize.forEach((c) => (topicCount[c.topic] = (topicCount[c.topic] || 0) + 1))
  const present = new Set(open.map((c) => c.topic))

  const flipTopic = (key) => go({ topics: f.topics.includes(key) ? f.topics.filter((t) => t !== key) : [...f.topics, key], sel: null })

  return (
    <div className="cfilters">
      <div className="cfilters__row">
        <span className="cfilters__label" id="cf-topic">
          {L('주제', 'Topic')}
        </span>
        <div className="cfilters__chips" role="group" aria-labelledby="cf-topic">
          <button type="button" className="chip cchip" aria-pressed={!f.topics.length} onClick={() => go({ topics: [], sel: null })}>
            {L('전체', 'All')} <span className="cchip__n mono">{inPrize.length}</span>
          </button>
          {TOPICS.filter((t) => present.has(t.key)).map((t) => {
            const n = topicCount[t.key] || 0
            const on = f.topics.includes(t.key)
            return (
              <button key={t.key} type="button" className="chip cchip" aria-pressed={on} disabled={!n && !on} onClick={() => flipTopic(t.key)} style={{ '--c': topicColor(t.key) }}>
                <span className="cchip__sw" aria-hidden="true" />
                {t.short} <span className="cchip__n mono">{n}</span>
              </button>
            )
          })}
        </div>
      </div>
      <div className="cfilters__row">
        <span className="cfilters__label" id="cf-prize">
          {L('상금', 'Prize')}
        </span>
        <div className="cfilters__chips" role="group" aria-labelledby="cf-prize">
          {PRIZES.map((p) => {
            const n = inTopic.filter(p.test).length
            const on = f.prize === p.key
            return (
              <button key={p.key} type="button" className="chip cchip" aria-pressed={on} disabled={!n && !on} onClick={() => go({ prize: on ? 'all' : p.key, sel: null })}>
                {p.label} <span className="cchip__n mono">{n}</span>
              </button>
            )
          })}
        </div>
      </div>
      <div className="cfilters__bar">
        <span className="cfilters__count" aria-live="polite">
          <strong className="num">{count}</strong>
          {L('건', count === 1 ? ' contest' : ' contests')}
        </span>
        {savedCount > 0 && (
          <label className="cfilters__saved">
            <input type="checkbox" checked={f.savedOnly} onChange={(e) => go({ savedOnly: e.target.checked, sel: null })} />
            {L(`저장한 것 ${savedCount}`, `Saved ${savedCount}`)}
          </label>
        )}
        {filtered && (
          <button type="button" className="cfilters__reset" onClick={() => go({ topics: [], prize: 'all', savedOnly: false, sel: null })}>
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

function ContestRow({ c, selected, onPick, now }) {
  const n = daysLeft(c.deadline, now)
  const [amount, label] = prizeCell(c)
  const fresh = daysLeft(c.posted, now) >= -1
  return (
    <li className={`crow ${selected ? 'is-selected' : ''}`}>
      <button type="button" className="crow__btn" onClick={() => onPick(c)} aria-current={selected || undefined}>
        <span className={`crow__dday ${n <= 3 ? 'is-soon' : ''}`}>
          <span className="crow__n mono">{ddayLabel(n)}</span>
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
      </button>
    </li>
  )
}

/* ---------- Detail ---------- */

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
          <dd>{c.target || L('공고에 없음', 'Not stated')}</dd>
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

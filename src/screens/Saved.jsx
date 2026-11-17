/* 저장 (#/saved, ?tab=contests) — spec v2 §3 "저장", IA §3-7.
   Companies (news first, then most recently saved) and contests (by deadline, closed ones folded).
   Below the companies, the ones read lately, so a company is found again without saving it. */
import { useMemo, useState } from 'react'
import Icon from '../components/Icon.jsx'
import { CompanyRow } from '../components/Company.jsx'
import { EmptyState, PageTitle, Segmented, SkeletonRows } from '../components/ui.jsx'
import { byId, isYcPick, ycShort } from '../lib/data.js'
import { setQuery, useReadLog, useSaved } from '../lib/hooks.js'
import { monthDay } from '../lib/format.js'
import { isEn, L } from '../lib/i18n.js'
import { today, useContests, useSavedContests } from '../lib/contests.js'
import { ContestRow } from './Contests.jsx'

function Fold({ title, count, children, initial = false }) {
  const [open, setOpen] = useState(initial)
  return (
    <section className="fold">
      <button type="button" className="fold__btn" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span>
          {title} <span className="num muted">{count}</span>
        </span>
        <Icon name="chevronDown" size={18} />
      </button>
      {open && children}
    </section>
  )
}

function RecentRead() {
  const { readLog } = useReadLog()
  const { saved } = useSaved()
  const list = Object.entries(readLog)
    .sort((a, b) => b[1].localeCompare(a[1]))
    .map(([id]) => byId(id))
    .filter((s) => s && !saved.includes(s.id))
    .slice(0, 20)
  if (!list.length) return null
  return (
    <Fold title={L('최근 읽은 회사', 'Recently read')} count={list.length}>
      <ul className="group">
        {list.map((s) => (
          <CompanyRow key={s.id} startup={s} value={monthDay(s.date)} />
        ))}
      </ul>
    </Fold>
  )
}

function Companies() {
  const { saved } = useSaved()
  const items = useMemo(() => {
    const list = saved.map(byId).filter(Boolean)
    return [...list.filter((s) => s._hasNews), ...list.filter((s) => !s._hasNews)]
  }, [saved])
  if (!items.length)
    return (
      <>
        <EmptyState icon="bookmark" title={L('아직 저장한 회사가 없어요', 'Nothing saved yet')} action={<a className="btn btn--secondary" href="#/">{L('오늘의 스타트업 보기', 'See today’s startups')}</a>}>
          {L('회사 화면의 책갈피를 누르면 여기에 모여요. 이 기기에만 저장돼요.', 'Tap the bookmark on a company page and it collects here. Saved on this device only.')}
        </EmptyState>
        <RecentRead />
      </>
    )
  return (
    <>
      <ul className="group" aria-label={L('저장한 회사', 'Saved companies')}>
        {items.map((s) => (
          <CompanyRow key={s.id} startup={s} from="saved" badge={isYcPick(s) ? `YC ${ycShort(s.yc?.batch)}` : null} />
        ))}
      </ul>
      <RecentRead />
      <p className="small-note">{L('저장과 읽은 기록은 이 기기에만 있어요.', 'Saves and reading history stay on this device.')}</p>
    </>
  )
}

function Contests() {
  const { saved } = useSavedContests()
  const { status, doc, retry } = useContests()
  const now = today()
  if (!saved.length)
    return (
      <EmptyState icon="trophy" title={L('아직 저장한 공모전이 없어요', 'No saved contests yet')} action={<a className="btn btn--secondary" href="#/contests">{L('공모전 둘러보기', 'Browse contests')}</a>}>
        {L('공모전 목록의 책갈피를 누르면 마감 순으로 모여요.', 'Tap the bookmark on a contest and it collects here by deadline.')}
      </EmptyState>
    )
  if (status === 'loading') return <SkeletonRows n={Math.min(saved.length, 4)} />
  if (status === 'failed')
    return <EmptyState icon="alert" title={L('공모전을 불러오지 못했어요', "Couldn't load contests")} action={<button type="button" className="btn btn--secondary" onClick={retry}>{L('다시 시도', 'Try again')}</button>} />
  const map = new Map(doc.items.map((c) => [c.id, c]))
  const found = saved.map((id) => map.get(id)).filter(Boolean)
  const open = found.filter((c) => c.deadline >= now).sort((a, b) => a.deadline.localeCompare(b.deadline))
  const closed = found.filter((c) => c.deadline < now).sort((a, b) => b.deadline.localeCompare(a.deadline))
  const gone = saved.length - found.length
  return (
    <>
      {open.length > 0 ? (
        <ul className="group" aria-label={L('저장한 공모전', 'Saved contests')}>
          {open.map((c) => (
            <ContestRow key={c.id} c={c} now={now} href={`#/contests?c=${c.id}`} />
          ))}
        </ul>
      ) : (
        <EmptyState icon="trophy" title={L('접수 중인 저장 공모전이 없어요', 'None of your saved contests are open')} action={<a className="btn btn--secondary" href="#/contests">{L('공모전 둘러보기', 'Browse contests')}</a>} />
      )}
      {closed.length > 0 && (
        <Fold title={L('마감된 공모전', 'Closed')} count={closed.length}>
          <ul className="group">
            {closed.map((c) => (
              <ContestRow key={c.id} c={c} now={now} closed href={`#/contests?c=${c.id}`} />
            ))}
          </ul>
        </Fold>
      )}
      {gone > 0 && <p className="small-note">{L(`목록에서 내려간 공모전 ${gone}건은 보여 드릴 수 없어요.`, `${gone} saved ${gone === 1 ? 'contest is' : 'contests are'} no longer listed.`)}</p>}
    </>
  )
}

export default function Saved({ params }) {
  const { saved } = useSaved()
  const { saved: contests } = useSavedContests()
  // the English edition has no contests tab, so only companies
  const tab = !isEn && params.get('tab') === 'contests' ? 'contests' : 'companies'
  return (
    <div className="page">
      <PageTitle title={L('저장', 'Saved')} />
      {!isEn && (
        <div className="saved-seg">
          <Segmented
            label={L('저장한 항목', 'Saved items')}
            value={tab}
            onChange={(k) => setQuery(`/saved${k === 'contests' ? '?tab=contests' : ''}`)}
            options={[
              { key: 'companies', label: L('회사', 'Companies'), count: saved.length },
              { key: 'contests', label: L('공모전', 'Contests'), count: contests.length },
            ]}
          />
        </div>
      )}
      {tab === 'contests' ? <Contests /> : <Companies />}
    </div>
  )
}

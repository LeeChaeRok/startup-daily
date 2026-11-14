import { useMemo, useState } from 'react'
import StartupRow from '../components/StartupRow.jsx'
import Icon from '../components/Icon.jsx'
import { EmptyState } from '../components/bits.jsx'
import { useToast } from '../components/toast-context.js'
import { byId } from '../lib/data.js'
import { buildQuery, localDate, navigate, useReadLog, useSaved } from '../lib/hooks.js'
import { canonicalUrl, copyText } from '../lib/share.js'
import { L } from '../lib/i18n.js'
import { today, useContests, useSavedContests } from '../lib/contests.js'
import { ContestRow } from './Contests.jsx'

const SORTS = [
  { key: 'saved', label: L('저장순', 'Recently saved') },
  { key: 'date', label: L('발행순', 'Newest issue') },
  { key: 'sector', label: L('분야별', 'By sector') },
]

/** Saved contests: the ids kept by the 공모전 tab, matched against the current list. */
function SavedContests() {
  const { saved } = useSavedContests()
  const { status, doc, retry } = useContests()
  const now = today()
  if (!saved.length)
    return (
      <EmptyState
        icon="bookmark"
        title={L('아직 저장한 공모전이 없어요', 'No saved contests yet')}
        actions={
          <a className="btn btn--primary" href="#/contests">
            {L('공모전 보기', 'See contests')}
          </a>
        }
      >
        {L('공모전 화면의 저장 버튼을 누르면 여기에 모여요.', 'Tap Save on a contest and it will show up here.')}
      </EmptyState>
    )
  if (status === 'loading') return <p className="page-note">{L('공모전을 불러오는 중…', 'Loading contests…')}</p>
  if (status === 'failed')
    return (
      <EmptyState icon="alert" title={L('공모전을 불러오지 못했어요', "Couldn't load contests")} actions={<button type="button" className="btn btn--secondary" onClick={retry}>{L('다시 시도', 'Try again')}</button>} />
    )
  const byIdMap = new Map(doc.items.map((c) => [c.id, c]))
  const found = saved.map((id) => byIdMap.get(id)).filter(Boolean)
  const open = found.filter((c) => c.deadline >= now).sort((a, b) => a.deadline.localeCompare(b.deadline))
  const closed = found.filter((c) => c.deadline < now).sort((a, b) => b.deadline.localeCompare(a.deadline))
  const gone = saved.length - found.length
  return (
    <>
      {open.length > 0 && (
        <ul className="crows">
          {open.map((c) => (
            <ContestRow key={c.id} c={c} now={now} href={`#/contests?c=${c.id}`} />
          ))}
        </ul>
      )}
      {closed.length > 0 && (
        <section className="saved-closed" aria-labelledby="saved-closed-title">
          <h2 id="saved-closed-title" className="saved-closed__title">
            {L(`마감된 공모전 ${closed.length}`, `Closed ${closed.length}`)}
          </h2>
          <ul className="crows">
            {closed.map((c) => (
              <ContestRow key={c.id} c={c} now={now} closed />
            ))}
          </ul>
        </section>
      )}
      {gone > 0 && (
        <p className="page-note saved-gone">
          <Icon name="info" size={16} /> {L(`목록에서 내려간 공모전 ${gone}건은 보여 드릴 수 없어요.`, `${gone} removed ${gone === 1 ? 'contest is' : 'contests are'} no longer listed.`)}
        </p>
      )}
    </>
  )
}

export default function Saved({ params }) {
  const { saved } = useSaved()
  const { saved: savedContests } = useSavedContests()
  const tab = params.get('tab') === 'contests' ? 'contests' : 'companies'
  // Rows un-saved here stay visible (with an empty bookmark) until the user
  // leaves, so focus isn't lost and undo has something to point at.
  const [shown, setShown] = useState(saved)
  const [prevSaved, setPrevSaved] = useState(saved)
  if (saved !== prevSaved) {
    setPrevSaved(saved)
    setShown((s) => [...saved.filter((id) => !s.includes(id)), ...s])
  }
  const { isRead } = useReadLog()
  const toast = useToast()
  const sort = params.get('sort') || 'saved'
  const unread = params.get('unread') === '1'

  const items = useMemo(() => {
    let list = shown.map(byId).filter(Boolean)
    if (unread) list = list.filter((s) => !isRead(s.id))
    if (sort === 'date') list = [...list].sort((a, b) => b.date.localeCompare(a.date))
    if (sort === 'sector') list = [...list].sort((a, b) => a._sector.label.localeCompare(b._sector.label, L('ko', 'en')))
    return list
  }, [shown, unread, sort, isRead])

  const set = (patch) =>
    navigate(`/saved${buildQuery({ tab: tab === 'contests' ? 'contests' : null, sort: sort === 'saved' ? null : sort, unread: unread ? 1 : null, ...patch })}`, {
      replace: true,
    })

  const copyLinks = async () => {
    const text = saved
      .map(byId)
      .filter(Boolean)
      .map((s) => `${s.name_ko} — ${s.tagline} ${canonicalUrl(`/s/${s.id}`)}`)
      .join('\n')
    toast(
      (await copyText(text))
        ? L(`${saved.length}곳의 링크를 복사했어요`, `Copied ${saved.length} ${saved.length === 1 ? 'link' : 'links'}`)
        : L('복사하지 못했어요', "Couldn't copy"),
    )
  }

  const downloadJson = () => {
    const data = {
      exported_at: new Date().toISOString(),
      items: saved
        .map(byId)
        .filter(Boolean)
        .map((s) => ({ id: s.id, name_ko: s.name_ko, name_en: s.name_en, url: canonicalUrl(`/s/${s.id}`), date: s.date })),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `startup-daily-saved-${localDate()}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  }

  return (
    <div className="page page--saved">
      <h1 className="page-title" tabIndex={-1}>
        {L('저장함', 'Saved')}{' '}
        {saved.length + savedContests.length > 0 && <span className="mono page-title__count">{saved.length + savedContests.length}</span>}
      </h1>
      <div className="segmented saved-tabs" role="group" aria-label={L('저장한 항목 종류', 'Saved items')}>
        {[
          ['companies', L('회사', 'Companies'), saved.length],
          ['contests', L('공모전', 'Contests'), savedContests.length],
        ].map(([k, label, n]) => (
          <button
            key={k}
            type="button"
            className="segmented__tab"
            aria-pressed={tab === k}
            onClick={() => navigate(`/saved${k === 'contests' ? '?tab=contests' : ''}`, { replace: true })}
          >
            {label} <span className="mono">{n}</span>
          </button>
        ))}
      </div>
      <p className="page-note">
        <Icon name="info" size={16} /> {L('이 기기의 브라우저에만 저장돼요.', 'Saved only in this browser on this device.')}
      </p>

      {tab === 'contests' ? (
        <SavedContests />
      ) : shown.length === 0 ? (
        <EmptyState
          icon="bookmark"
          title={L('아직 저장한 회사가 없어요', 'Nothing saved yet')}
          actions={
            <a className="btn btn--primary" href="#/">
              {L('최신 호 보기', 'See the latest issue')}
            </a>
          }
        >
          {L('회사 상세 화면의 저장 버튼을 누르면 여기에 모여요.', 'Tap Save on any company page and it will show up here.')}
        </EmptyState>
      ) : (
        <>
          <div className="toolbar">
            <label className="select">
              <span className="sr-only">{L('정렬', 'Sort')}</span>
              <select value={sort} onChange={(e) => set({ sort: e.target.value === 'saved' ? null : e.target.value })}>
                {SORTS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
              <Icon name="chevronDown" size={16} />
            </label>
            <label className="toggle">
              <input type="checkbox" checked={unread} onChange={(e) => set({ unread: e.target.checked ? 1 : null })} />
              <span>{L('안 읽은 곳만', 'Unread only')}</span>
            </label>
          </div>

          {items.length === 0 ? (
            <EmptyState icon="check" title={L('저장한 회사를 모두 읽었어요', "You've read everything you saved")}>
              {L('‘안 읽은 것만’을 끄면 전체 목록이 보여요.', 'Turn off “Unread only” to see the full list.')}
            </EmptyState>
          ) : (
            <ul className="rows rows--saved">
              {items.flatMap((s, i) => {
                const head = sort === 'sector' && s._sector.label !== items[i - 1]?._sector.label ? s._sector.label : null
                const row = <StartupRow key={s.id} startup={s} showDate showSave from="saved" />
                return head
                  ? [
                      <li key={`h-${head}`} className="rows__group">
                        {head}
                      </li>,
                      row,
                    ]
                  : [row]
              })}
            </ul>
          )}

          <section className="export" aria-labelledby="export-title">
            <h2 id="export-title" className="section-head__title">
              {L('내보내기', 'Export')}
            </h2>
            <div className="export__actions">
              <button type="button" className="btn btn--secondary" onClick={copyLinks}>
                <Icon name="copy" size={18} /> {L('링크 목록 복사', 'Copy links')}
              </button>
              <button type="button" className="btn btn--secondary" onClick={downloadJson}>
                <Icon name="download" size={18} /> {L('JSON 파일로 저장', 'Download JSON')}
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

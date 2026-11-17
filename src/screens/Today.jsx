/* 오늘 (#/) and a past day (#/d/:date) — spec v2 §3 "오늘", IA §3-1.
   The whole day as one list of same-format cards: the five, then up to ten new YC companies
   (badged). Then at most three conditional blocks, then one line. */
import { useEffect, useState } from 'react'
import Icon from '../components/Icon.jsx'
import Logo from '../components/Logo.jsx'
import Sheet from '../components/Sheet.jsx'
import { CompanyCard, CompanyRow } from '../components/Company.jsx'
import { FooterLine } from '../components/Chrome.jsx'
import { Badge, Chip, ChipWrap, LogoStack, PageTitle, SectionHeader } from '../components/ui.jsx'
import { useToast } from '../components/toast-context.js'
import { usePush } from '../components/usePush.js'
import { SECTORS, UPDATE_KINDS, dates, dayList, followUps, isYcPick, poolLive, stats, ycShort } from '../lib/data.js'
import { localDate, useFlag, useInterests, useReadLog } from '../lib/hooks.js'
import { daysSince, longDate, monthDay, parseDate, readMinutes } from '../lib/format.js'
import { useMarkSeen, useSeen, useSeenCount } from '../lib/seen.js'
import { currentEntry, leaveSheetTo, replaceHash, sheetBack, whenSettled } from '../lib/nav.js'
import { canonicalUrl, shareOrCopy } from '../lib/share.js'
import { track } from '../lib/analytics.js'
import { L } from '../lib/i18n.js'

const RECENT = 14
const dayGap = (a, b) => Math.round((parseDate(b) - parseDate(a)) / 864e5)
const shortWeekday = (ymd) => longDate(ymd).replace(/요일$/, '')
const dayHref = (kind, d) => (d === dates[0] ? '#/' : `#/d/${d}`)

/* ---------- Moving between days ----------
   From today the first step pushes, so back returns to today. Further steps between past days
   replace. Stepping onto today again pops back to it instead of stacking a second today.
   (A YC day is a sub-page already: every step replaces.) */

function goDay(kind, href, { fromRoot = false } = {}) {
  const go = () => {
    if (window.location.hash === href) return
    const cameFromRoot = Boolean(history.state?.sd_dayFromRoot)
    if (fromRoot) {
      window.location.hash = href
      history.replaceState({ ...(history.state || {}), sd_dayFromRoot: true }, '')
    } else if (kind === 'issue' && href === '#/') {
      if (cameFromRoot && currentEntry()?.depth > 0) history.back()
      else replaceHash('#/')
    } else {
      replaceHash(href)
      if (cameFromRoot) history.replaceState({ ...(history.state || {}), sd_dayFromRoot: true }, '')
    }
  }
  if (history.state?.sdSheet) sheetBack().then(go)
  else whenSettled(go)
}

function useDaySteps(kind, date, past) {
  const all = dates
  const i = all.indexOf(date)
  const older = i >= 0 ? all[i + 1] || null : null
  const newer = i > 0 ? all[i - 1] : null
  const fromRoot = kind === 'issue' && !past
  const step = (d) => d && goDay(kind, dayHref(kind, d), { fromRoot })
  return { older, newer, step }
}

const dayName = (d) => (d === dates[0] ? L('오늘', 'today') : monthDay(d))

/** ‹ date ▾ › — one tap to the day before or after; the date itself opens the list. ←/→ keys too. */
export function DayNav({ kind = 'issue', date, past = false, onOpen }) {
  const { older, newer, step } = useDaySteps(kind, date, past)
  useEffect(() => {
    const onKey = (e) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return
      if (e.target.closest?.('input, textarea, select, [contenteditable], dialog')) return
      const to = e.key === 'ArrowLeft' ? older : e.key === 'ArrowRight' ? newer : null
      if (to) step(to)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })
  return (
    <span className="daynav">
      <button type="button" className="btn-icon daynav__step" disabled={!older} onClick={() => step(older)} aria-label={older ? L(`이전 날, ${monthDay(older)}`, `Previous day, ${monthDay(older)}`) : L('이전 날 없음', 'No earlier day')}>
        <Icon name="chevronLeft" size={20} />
      </button>
      <button type="button" className="datebtn" aria-haspopup="dialog" onClick={onOpen} aria-label={L(`${longDate(date)}, 날짜 목록 열기`, `${longDate(date)}, open the list of days`)}>
        <span className="num">{longDate(date)}</span>
        <Icon name="chevronDown" size={16} />
      </button>
      <button type="button" className="btn-icon daynav__step" disabled={!newer} onClick={() => step(newer)} aria-label={newer ? L(`다음 날, ${dayName(newer)}`, `Next day, ${dayName(newer)}`) : L('다음 날 없음', 'No later day')}>
        <Icon name="chevronRight" size={20} />
      </button>
    </span>
  )
}

/** Under the cards: where to go once the day is done. */
export function DayPager({ kind = 'issue', date, past = false }) {
  const { older, newer, step } = useDaySteps(kind, date, past)
  if (!older && !newer) return null
  const what = (d) => L(`${monthDay(d)} ${dayList(d).length}곳`, monthDay(d))
  return (
    <nav className="daypager" aria-label={L('다른 날', 'Other days')}>
      {older ? (
        <button type="button" className="daypager__btn" onClick={() => step(older)}>
          <Icon name="chevronLeft" size={18} />
          <span>
            <span className="daypager__k">{L('이전 날', 'Previous day')}</span>
            <span className="daypager__v num">{what(older)}</span>
          </span>
        </button>
      ) : (
        <span />
      )}
      {newer && (
        <button type="button" className="daypager__btn daypager__btn--next" onClick={() => step(newer)}>
          <span>
            <span className="daypager__k">{L('다음 날', 'Next day')}</span>
            <span className="daypager__v num">{newer === dates[0] ? L('오늘의 스타트업', 'Today’s startups') : what(newer)}</span>
          </span>
          <Icon name="chevronRight" size={18} />
        </button>
      )}
    </nav>
  )
}

/* ---------- Date sheet: the recent days, with what the reader has done with each ---------- */

function DayState({ list, seen }) {
  const { isRead } = useReadLog()
  const done = list.filter((s) => isRead(s.id)).length
  if (list.length && done === list.length)
    return (
      <span className="dayrow__state is-done">
        <Icon name="check" size={14} /> {L('다 읽음', 'All read')}
      </span>
    )
  if (done) return <span className="dayrow__state">{L(`${done}곳 읽음`, `${done} read`)}</span>
  if (seen) return <span className="dayrow__state is-seen">{L('봤음', 'Seen')}</span>
  return <span className="dayrow__state">{L('안 봄', 'New')}</span>
}

export function DayRow({ kind, date, current, onPick }) {
  const isSeen = useSeen(kind)
  const list = dayList(date)
  const href = dayHref(kind, date)
  return (
    <li>
      <a
        className="dayrow"
        href={href}
        aria-current={current ? 'page' : undefined}
        onClick={
          onPick &&
          ((e) => {
            e.preventDefault()
            onPick(href)
          })
        }
      >
        <span className="dayrow__date num">{shortWeekday(date)}</span>
        <span className="dayrow__mid">
          <LogoStack>
            {list.slice(0, 3).map((s) => (
              <Logo key={s.id} startup={s} size={22} />
            ))}
          </LogoStack>
          <span className="num">{L(`${list.length}곳`, `${list.length}`)}</span>
        </span>
        <DayState list={list} seen={isSeen(date)} />
      </a>
    </li>
  )
}

/** kind: 'issue' (the five) | 'yc'. Moving between past days replaces the entry, so back returns to today. */
export function DaySheet({ kind = 'issue', date, open, onClose, replace = false }) {
  const all = dates
  const pick = (href) => goDay(kind, href, { fromRoot: kind === 'issue' && !replace })
  return (
    <Sheet open={open} onClose={onClose} title={L('날짜', 'Days')}>
      <ul className="daylist">
        {all.slice(0, RECENT).map((d) => (
          <DayRow key={d} kind={kind} date={d} current={d === date} onPick={pick} />
        ))}
      </ul>
      {kind === 'issue' && all.length > RECENT && (
        <button type="button" className="btn btn--ghost" style={{ marginTop: 8 }} onClick={() => leaveSheetTo('#/explore?view=dates')}>
          {L(`전체 ${all.length}일 보기`, `All ${all.length} days`)} <Icon name="chevronRight" size={16} />
        </button>
      )}
    </Sheet>
  )
}

/* ---------- Blocks ---------- */

function InterestsSheet({ open, onClose }) {
  const { isInterest, toggle } = useInterests()
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={L('관심 분야', 'Sectors you follow')}
      footer={
        <button type="button" className="btn btn--primary" onClick={onClose}>
          {L('완료', 'Done')}
        </button>
      }
    >
      <p className="sheet__hint">{L('고른 분야는 탐색에서 먼저 보이고, 알림을 고를 때도 쓰여요. 이 기기에만 저장돼요.', 'Your sectors come first in Explore and can narrow alerts. Saved on this device only.')}</p>
      <ChipWrap label={L('분야', 'Sectors')}>
        {SECTORS.map((s) => (
          <Chip key={s.key} on={isInterest(s.key)} onClick={() => toggle(s.key)} dot={`var(--sd-sector-${s.key})`}>
            {s.label}
          </Chip>
        ))}
      </ChipWrap>
    </Sheet>
  )
}

/** Five read: one line of closure, one suggestion at most, and sharing the day. */
function DoneCard({ date, list }) {
  const toast = useToast()
  const push = usePush()
  const seenDays = useSeenCount('issue')
  const { interests } = useInterests()
  const [sectors, setSectors] = useState(false)
  const share = async () => {
    const r = await shareOrCopy({
      title: L(`${monthDay(date)} 스타트업 ${list.length}곳`, `${list.length} startups · ${monthDay(date)}`),
      text: L(`${monthDay(date)} 스타트업 ${list.length}곳: ${list.map((s) => s.name_ko).join(', ')}`, `${list.length} startups on ${monthDay(date)}: ${list.map((s) => s.name_ko).join(', ')}`),
      url: canonicalUrl(`/d/${date}`),
    })
    if (r === 'copied') toast(L('링크를 복사했어요', 'Link copied'))
    track('share_day', { date, result: r })
  }
  const askAlert = push.status === 'off' && seenDays >= 2
  const askSectors = !askAlert && !interests.length
  return (
    <section className="done" aria-labelledby="done-title">
      <span className="done__icon" aria-hidden="true">
        <Icon name="checkCircle" size={28} />
      </span>
      <h2 id="done-title" className="done__title">
        {L(`오늘 ${list.length}곳 끝`, `That’s today’s ${list.length}`)}
      </h2>
      <p className="done__text">{L('내일 아침 새 회사들이 와요.', 'New ones arrive tomorrow morning.')}</p>
      <div className="done__actions">
        <button type="button" className="btn btn--secondary" onClick={share}>
          <Icon name="share" size={18} /> {L('오늘 목록 공유', 'Share today’s list')}
        </button>
      </div>
      {askAlert && (
        <div className="done__ask">
          <p>{L('내일 아침 새 회사들이 오면 알려 드릴까요?', 'Want a heads-up when tomorrow’s list arrives?')}</p>
          <button type="button" className="btn btn--primary" disabled={push.busy} onClick={() => push.enable()}>
            <Icon name="bell" size={18} /> {L('알림 켜기', 'Turn on alerts')}
          </button>
        </div>
      )}
      {askSectors && (
        <div className="done__ask">
          <p>{L('관심 분야를 고르면 탐색에서 먼저 보여 드려요.', 'Pick the sectors you follow and they come first in Explore.')}</p>
          <button type="button" className="btn btn--ghost" onClick={() => setSectors(true)}>
            {L('관심 분야 고르기', 'Pick sectors')}
          </button>
        </div>
      )}
      <InterestsSheet open={sectors} onClose={() => setSectors(false)} />
    </section>
  )
}

function LinkRow({ href, title, sub, logos }) {
  return (
    <a className="linkrow" href={href}>
      {logos?.length > 0 && (
        <LogoStack>
          {logos.slice(0, 3).map((s) => (
            <Logo key={s.id} startup={s} size={28} />
          ))}
        </LogoStack>
      )}
      <span className="linkrow__body">
        <span className="linkrow__title">{title}</span>
        {sub && <span className="linkrow__sub">{sub}</span>}
      </span>
      <Icon name="chevronRight" size={20} />
    </a>
  )
}

function useBlocks(date, past) {
  const { isRead, readLog } = useReadLog()
  const { interests } = useInterests()
  const blocks = []
  const returning = Object.keys(readLog).length > 0
  if (!past) {
    const prev = dates[dates.indexOf(date) + 1]
    const missed = prev ? dayList(prev).filter((s) => !isRead(s.id)) : []
    if (returning && missed.length && daysSince(prev) <= 3) {
      blocks.push({
        key: 'missed',
        node: (
          <LinkRow
            href={`#/d/${prev}`}
            logos={missed}
            title={dayGap(prev, date) === 1 ? L(`어제 놓친 ${missed.length}곳`, `${missed.length} you missed yesterday`) : L(`지난번 놓친 ${missed.length}곳`, `${missed.length} you missed last time`)}
            sub={longDate(prev)}
          />
        ),
      })
    }
  }
  if (!past) {
    const news = followUps(6).filter((s) => s._hasNews).slice(0, 2)
    if (news.length) {
      blocks.push({
        key: 'news',
        node: (
          <div>
            <SectionHeader id="news-title" title={L('그때 그 회사', 'Where are they now')} note={L('소개한 뒤 생긴 새 소식', 'News since we covered them')} />
            <ul className="group" aria-labelledby="news-title">
              {news.map((s) => {
                const u = s._updates[0]
                return (
                  <CompanyRow
                    key={s.id}
                    startup={s}
                    value={null}
                    sub={
                      <span className="news-line">
                        <Badge tone="accent">{UPDATE_KINDS[u.kind] || L('소식', 'News')}</Badge>
                        <span>{L(u.title_ko, u.title_en || u.title_ko)}</span>
                      </span>
                    }
                  />
                )
              })}
            </ul>
          </div>
        ),
      })
    }
    if (poolLive && interests.length) {
      const labels = SECTORS.filter((s) => interests.includes(s.key)).map((s) => s.label)
      blocks.push({
        key: 'mine',
        node: <LinkRow href={`#/explore?sector=${interests.join(',')}`} title={L('내 분야에서 더 보기', 'More in your sectors')} sub={labels.slice(0, 3).join(' · ')} />,
      })
    }
  }
  return blocks.slice(0, 3)
}

/* ---------- Screen ---------- */

export default function Today({ date, past = false }) {
  useMarkSeen('issue', date)
  const list = dayList(date)
  const { isRead } = useReadLog()
  const left = list.filter((s) => !isRead(s.id))
  const [intro, setIntro] = useFlag('sd_intro_dismissed', false)
  const [sheet, setSheet] = useState(false)
  const blocks = useBlocks(date, past)
  const today = localDate()
  const stale = !past && date < today
  const minutes = readMinutes(left.length ? left : list)

  const sub = !list.length
    ? null
    : left.length === list.length
      ? L(`${list.length}곳 · 요약만 약 ${minutes}분`, `${list.length} startups · about ${minutes} min`)
      : left.length
        ? L(`${left.length}곳 남음 · 약 ${minutes}분`, `${left.length} left · about ${minutes} min`)
        : L('다 읽었어요', 'All read')

  return (
    <div className="page">
      {!past && !intro && (
        <div className="intro" role="note">
          <p>{L('매일 아침, 아직 덜 알려졌지만 지금 뜨는 스타트업과 YC 새 회사를 왜 뜨는지와 함께 요약해 드려요.', 'Every morning: startups you probably haven’t heard of yet, plus new YC companies, and why they matter now.')}</p>
          <button type="button" className="btn-icon" onClick={() => setIntro(true)} aria-label={L('안내 닫기', 'Dismiss')}>
            <Icon name="close" size={18} />
          </button>
        </div>
      )}
      <PageTitle
        eyebrow={
          <>
            <DayNav kind="issue" date={date} past={past} onOpen={() => setSheet(true)} />
            {stale && daysSince(date) === 1 && <span className="tag-past">{L('어제 분', 'Yesterday’s')}</span>}
            {past && <span className="tag-past">{L('지난 날', 'Earlier')}</span>}
          </>
        }
        title={past ? L(`${monthDay(date)}의 스타트업 ${list.length}곳`, `${list.length} startups · ${monthDay(date)}`) : L(`오늘의 스타트업 ${list.length}곳`, `Today’s ${list.length} startups`)}
        sub={sub}
      >
        {stale && new Date().getHours() < 12 && <p className="ptitle__sub muted">{L('오늘 목록은 오전 중에 올라와요.', 'Today’s list arrives later this morning.')}</p>}
        {past && (
          <button type="button" className="chip" style={{ marginTop: 12 }} onClick={() => goDay('issue', '#/')}>
            {L('오늘로', 'Back to today')}
          </button>
        )}
      </PageTitle>

      <ol className="cards" aria-label={L(`${monthDay(date)}의 스타트업`, `Startups for ${monthDay(date)}`)}>
        {list.map((s, i) => (
          <CompanyCard key={s.id} startup={s} rank={i + 1} from="today" badge={isYcPick(s) ? `YC ${ycShort(s.yc?.batch)}` : undefined} />
        ))}
      </ol>
      <DayPager kind="issue" date={date} past={past} />

      {(blocks.length > 0 || (!past && list.length > 0 && !left.length)) && (
        <div className="blocks">
          {!past && list.length > 0 && !left.length && <DoneCard date={date} list={list} />}
          {blocks.map((b) => (
            <div key={b.key}>{b.node}</div>
          ))}
        </div>
      )}

      <FooterLine days={stats.issues} />
      <DaySheet kind="issue" date={date} open={sheet} onClose={() => setSheet(false)} replace={past} />
    </div>
  )
}

/* 공모전 (contests): Korean contest notices collected from six listing sites, merged so
   one contest is one row (_workspace/16_contests). Fetched only when the tab opens:
   /data/contests.json = { updated, from, to, sources, items[] }.

   Contest text stays Korean in the English edition; only the interface is translated. */
import { useEffect, useState } from 'react'
import { createStore, localDate, useStore } from './hooks.js'
import { L } from './i18n.js'

let cache = null
let pending = null
const load = () => {
  pending ??= fetch('/data/contests.json')
    .then((r) => {
      if (!r.ok) throw new Error(`contests.json: ${r.status}`)
      return r.json()
    })
    .then((doc) => (cache = doc))
    .finally(() => (pending = null))
  return pending
}

/** { status: 'loading' | 'ready' | 'failed', doc, retry } */
export function useContests() {
  const [state, setState] = useState(() => (cache ? { status: 'ready', doc: cache } : { status: 'loading', doc: null }))
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    if (cache) return
    let alive = true
    load().then(
      (doc) => alive && setState({ status: 'ready', doc }),
      () => alive && setState({ status: 'failed', doc: null }),
    )
    return () => {
      alive = false
    }
  }, [attempt])
  const retry = () => {
    setState({ status: 'loading', doc: null })
    setAttempt((n) => n + 1)
  }
  return { ...state, retry }
}

/* ---------- Topics ---------- */

// startup-adjacent topics first: this is a startup reader's tab
export const TOPICS = [
  { key: '창업·비즈니스', short: L('창업·비즈니스', 'Startups'), hue: 'infra' },
  { key: 'AI·데이터·SW', short: L('AI·데이터·SW', 'AI & software'), hue: 'ai' },
  { key: '정책·아이디어 제안', short: L('정책·아이디어', 'Policy & ideas'), hue: 'mobility' },
  { key: '광고·마케팅·네이밍', short: L('광고·마케팅', 'Marketing'), hue: 'fintech' },
  { key: '디자인·캐릭터·미술', short: L('디자인·미술', 'Design & art'), hue: 'robotics' },
  { key: '영상·사진·숏폼', short: L('영상·사진', 'Video & photo'), hue: 'consumer' },
  { key: '문학·글·시나리오', short: L('글·시나리오', 'Writing'), hue: 'enterprise' },
  { key: '음악·공연·예체능', short: L('음악·공연', 'Music & stage'), hue: 'health' },
  { key: '건축·도시·공간', short: L('건축·도시', 'Architecture'), hue: 'climate' },
  { key: '과학·학술·논문', short: L('과학·학술', 'Science'), hue: 'health' },
  { key: '기타', short: L('기타', 'Other'), hue: null },
]
const TOPIC = Object.fromEntries(TOPICS.map((t) => [t.key, t]))
export const topicOf = (key) => TOPIC[key] || TOPIC['기타']
export const topicColor = (key) => (topicOf(key).hue ? `var(--sd-sector-${topicOf(key).hue})` : 'var(--sd-ink-3)')
export const isStartupTopic = (key) => key === TOPICS[0].key || key === TOPICS[1].key

/* ---------- Who can enter ---------- */

// c.who: ['any'] = open to everyone, else some of kid/teen/univ/adult, [] = not stated.
// A group filter keeps contests that group can enter, so open-to-all ones stay in.
const WHO_LABEL = {
  kid: L('어린이', 'Kids'),
  teen: L('청소년', 'Teens'),
  univ: L('대학생', 'Students'),
  adult: L('일반인', 'Adults'),
}
export const WHOS = [
  { key: 'all', label: L('전체', 'Anyone'), test: () => true },
  { key: 'univ', label: L('대학(원)생', 'University'), test: (c) => c.who?.includes('any') || c.who?.includes('univ') },
  { key: 'adult', label: L('일반인·직장인', 'Adults'), test: (c) => c.who?.includes('any') || c.who?.includes('adult') },
  { key: 'teen', label: L('청소년', 'Teens'), test: (c) => c.who?.includes('any') || c.who?.includes('teen') },
  { key: 'kid', label: L('어린이', 'Kids'), test: (c) => c.who?.includes('any') || c.who?.includes('kid') },
  { key: 'open', label: L('제한 없는 것만', 'Open to all only'), test: (c) => c.who?.includes('any') },
]
export const whoByKey = (key) => WHOS.find((w) => w.key === key) || WHOS[0]
/** Short audience label for a row: 누구나, or 대학생·일반인. */
export const whoLabel = (c) =>
  c.who?.includes('any') ? L('누구나', 'Anyone') : (c.who || []).map((k) => WHO_LABEL[k]).filter(Boolean).join('·')

/* ---------- Prize ---------- */

/** The number a contest is ranked by: 1st prize, else the total. */
export const prizeValue = (c) => c.prize_top ?? c.prize_total ?? 0

// one threshold at a time; they nest, so a single choice is enough
export const PRIZES = [
  { key: 'all', label: L('전체', 'Any'), test: () => true },
  { key: '1m', label: L('100만원 이상', '₩1M+'), test: (c) => prizeValue(c) >= 1e6 },
  { key: '3m', label: L('300만원 이상', '₩3M+'), test: (c) => prizeValue(c) >= 3e6 },
  { key: '10m', label: L('1천만원 이상', '₩10M+'), test: (c) => prizeValue(c) >= 1e7 },
  { key: 'kind', label: L('상품·상장·특전', 'Non-cash'), test: (c) => !prizeValue(c) && ['상품', '상장', '채용·인턴'].includes(c.prize_kind) },
]
export const prizeByKey = (key) => PRIZES.find((p) => p.key === key) || PRIZES[0]

export function won(n) {
  if (n == null) return null
  if (n >= 1e8) {
    const e = n / 1e8
    return L(`${Number.isInteger(e) ? e : e.toFixed(1)}억원`, `₩${(n / 1e6).toLocaleString('en-US', { maximumFractionDigits: 0 })}M`)
  }
  if (n >= 1e4) return L(`${Math.round(n / 1e4).toLocaleString('ko-KR')}만원`, n >= 1e6 ? `₩${+(n / 1e6).toFixed(1)}M` : `₩${Math.round(n / 1e3)}K`)
  return L(`${n.toLocaleString('ko-KR')}원`, `₩${n.toLocaleString('en-US')}`)
}

/** [amount or null, label] for the list's right column. */
export function prizeCell(c) {
  if (c.prize_top) return [won(c.prize_top), L('1등', '1st prize')]
  if (c.prize_total) return [won(c.prize_total), L('총상금', 'total')]
  if (c.prize_kind === '상품') return [null, L('상품', 'Goods')]
  if (c.prize_kind === '상장') return [null, L('상장', 'Certificate')]
  if (c.prize_kind === '채용·인턴') return [null, L('채용 특전', 'Hiring perk')]
  if (c.prize_band) return [null, L('규모만 공개', 'Range only')]
  return [null, L('상금 미공개', 'Not stated')]
}

/* ---------- Dates ---------- */

const dayMs = 864e5
const at = (ymd) => new Date(`${ymd}T00:00:00`)
export const today = () => localDate()
export const daysLeft = (deadline, from = today()) => Math.round((at(deadline) - at(from)) / dayMs)
export const ddayLabel = (n) => (n === 0 ? L('오늘', 'Today') : `D-${n}`)

/** Deadline groups for the 마감 임박 order. */
export function deadlineGroup(deadline, from = today()) {
  const n = daysLeft(deadline, from)
  if (n <= 6) return { key: 0, label: L('이번 주 마감', 'Closing this week') }
  const d = at(deadline)
  const f = at(from)
  if (d.getFullYear() === f.getFullYear() && d.getMonth() === f.getMonth()) return { key: 1, label: L('이번 달 마감', 'Closing this month') }
  if (d < new Date(f.getFullYear(), f.getMonth() + 2, 1)) return { key: 2, label: L('다음 달 마감', 'Closing next month') }
  return { key: 3, label: L('그 뒤', 'Later') }
}

/* ---------- Saved contests (separate from saved companies) ---------- */

const savedStore = createStore('sd_saved_contests', [], Array.isArray)
export function useSavedContests() {
  const saved = useStore(savedStore)
  return {
    isSaved: (id) => saved.includes(id),
    toggle: (id) => savedStore.set((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev])),
  }
}

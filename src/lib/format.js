const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

/** 'YYYY-MM-DD' → local Date (no UTC shift). */
export function parseDate(ymd) {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** "4월 27일 월요일" */
export function longDate(ymd) {
  const d = parseDate(ymd)
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${WEEKDAYS[d.getDay()]}요일`
}

/** "4월 27일" */
export function monthDay(ymd) {
  const d = parseDate(ymd)
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
}

/** "4.27 월" */
export function shortDate(ymd) {
  const d = parseDate(ymd)
  return `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, '0')} ${WEEKDAYS[d.getDay()]}`
}

/** "2026.04.27" */
export function dotDate(ymd) {
  return ymd.replaceAll('-', '.')
}

/** Whole days between an issue date and today (local). */
export function daysSince(ymd, now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((today - parseDate(ymd)) / 86400000)
}

/** Monday-start week label: "4월 넷째 주" */
export function weekLabel(ymd) {
  const d = parseDate(ymd)
  const monday = new Date(d)
  monday.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  const nth = Math.ceil(monday.getDate() / 7)
  const names = ['첫째', '둘째', '셋째', '넷째', '다섯째']
  return `${monday.getMonth() + 1}월 ${names[nth - 1] || `${nth}번째`} 주`
}

/** Plex Mono has no Hangul: use it only for pure-ASCII figures. */
export function numClass(text) {
  return /^[\x20-\x7E]+$/.test(String(text ?? '')) ? 'mono' : 'num'
}

/** Rough read time of the summary layer for an issue (500 chars / min). */
export function readMinutes(list) {
  const chars = list.reduce(
    (n, s) =>
      n +
      (s.tagline?.length || 0) +
      (s.trending_reason?.summary?.length || 0) +
      (s.product?.summary?.length || 0) +
      (s.editor_pick_comment?.length || 0),
    0,
  )
  return Math.max(1, Math.ceil(chars / 500))
}

/** "2024-07" → "2024.07" */
export function ym(text = '') {
  return text.replaceAll('-', '.')
}

export function enDash(text = '') {
  return text.replace(/(\d)\s*-\s*(\d)/g, '$1–$2')
}

/** lang="en" only for text that is actually Latin; Korean names stay ko. */
export function langOf(text) {
  return /^[\x20-\x7E\u00C0-\u024F’–—]+$/.test(String(text ?? '')) ? 'en' : undefined
}

export function pad2(n) {
  return String(n).padStart(2, '0')
}

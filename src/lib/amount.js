/**
 * Funding amounts arrive as free text from the generator:
 *   "$32M", "약 131억 엔(보조금·융자 포함, 약 $83.8M). 일문 발표는 …",
 *   "₩17B+", "4,650만 달러", "₹120 crore", "R$ 50M (누적, 자사 발표)", "비공개 (…)".
 * parseAmount() reads the first amount as the primary figure, keeps the rest as a
 * note, and converts to USD for sorting and totals. Shared by the app and the
 * generator scripts, so it has no imports.
 */

// rough rates, only for ordering and summary totals (never shown as exact)
const USD_PER = { USD: 1, KRW: 1 / 1400, JPY: 1 / 150, EUR: 1.08, GBP: 1.27, INR: 1 / 84, BRL: 1 / 5.5, CNY: 1 / 7.2, CHF: 1.13, SGD: 0.75, CAD: 0.73, AUD: 0.66 }

const SCALE = { million: 1e6, billion: 1e9, K: 1e3, M: 1e6, B: 1e9, T: 1e12, 천: 1e3, 만: 1e4, 억: 1e8, 조: 1e12, crore: 1e7, lakh: 1e5, mn: 1e6, bn: 1e9 }

const NUM = String.raw`(\d+(?:[.,]\d+)*)`
const UNIT = String.raw`\s*(million|billion|crore|lakh|mn|bn|K|M|B|T|조|억|만|천)?(?![A-Za-z])`

// prefix-symbol amounts: $32M, US$10.1M, R$ 50M, ¥490M, ₩17B, €8.5M, £3M, ₹120 crore, S$, C$, A$, CHF 5M
const PREFIX = new RegExp(String.raw`(US\$|R\$|S\$|C\$|A\$|CHF|USD|KRW|JPY|EUR|GBP|INR|CNY|BRL|\$|¥|₩|€|£|₹)\s*` + NUM + UNIT, 'i')
const PREFIX_CUR = { USD: 'USD', KRW: 'KRW', JPY: 'JPY', EUR: 'EUR', GBP: 'GBP', INR: 'INR', CNY: 'CNY', BRL: 'BRL', 'US$': 'USD', $: 'USD', 'R$': 'BRL', 'S$': 'SGD', 'C$': 'CAD', 'A$': 'AUD', CHF: 'CHF', '¥': 'JPY', '₩': 'KRW', '€': 'EUR', '£': 'GBP', '₹': 'INR' }

// suffix-word amounts: 131억 엔, 4,650만 달러, 335억원, 10M 달러, 120 crore 루피, 5,000만 위안
const SUFFIX = new RegExp(NUM + UNIT + String.raw`\s*(달러|엔|원|유로|파운드|루피|위안|헤알|USD|JPY|KRW|EUR|GBP|INR|CNY|BRL)`, 'i')
const SUFFIX_CUR = { 달러: 'USD', 엔: 'JPY', 원: 'KRW', 유로: 'EUR', 파운드: 'GBP', 루피: 'INR', 위안: 'CNY', 헤알: 'BRL' }

const UNDISCLOSED = /^\s*(비공개|미공개|undisclosed|not disclosed|n\/a|unknown|알 수 없음)/i

function toNumber(s) {
  // "1,000" → 1000; "3.23" stays; a lone comma decimal ("8,5") is rare enough to ignore
  return parseFloat(s.replace(/,/g, ''))
}

function scaleOf(u) {
  if (!u) return 1
  return SCALE[u] ?? SCALE[u.toUpperCase()] ?? SCALE[u.toLowerCase()] ?? 1
}

/** All amounts in the text, in order of appearance. */
function findAmounts(text) {
  const out = []
  const scan = (re, pick) => {
    const g = new RegExp(re.source, 'gi')
    for (const m of text.matchAll(g)) {
      const a = pick(m)
      if (a && Number.isFinite(a.value)) out.push({ ...a, index: m.index, raw: m[0].trim() })
    }
  }
  scan(PREFIX, (m) => {
    const cur = PREFIX_CUR[m[1].toUpperCase()] || PREFIX_CUR[m[1]]
    return cur && { cur, value: toNumber(m[2]) * scaleOf(m[3]) }
  })
  scan(SUFFIX, (m) => {
    const word = m[3]
    const cur = SUFFIX_CUR[word] || word.toUpperCase()
    return USD_PER[cur] && { cur, value: toNumber(m[1]) * scaleOf(m[2]) }
  })
  // "약 6,500만 엔" and "¥6,500만" can both match the same span; keep the earliest per position
  out.sort((a, b) => a.index - b.index)
  return out.filter((a, i) => i === 0 || a.index >= out[i - 1].index + out[i - 1].raw.length)
}

/**
 * → { usd, primary: {cur, value, raw}, text, note, approx, plus } or null when there is no amount.
 * usd prefers the primary figure; a USD conversion in the text is used only when it
 * agrees with the primary within 2× (the generator sometimes converts wrongly).
 */
export function parseAmount(text) {
  if (!text || typeof text !== 'string' || UNDISCLOSED.test(text)) return null
  const all = findAmounts(text)
  if (!all.length) return null
  const primary = all[0]
  let usd = primary.value * USD_PER[primary.cur]
  if (primary.cur !== 'USD') {
    const conv = all.find((a) => a.cur === 'USD')
    if (conv && conv.value / usd < 2 && usd / conv.value < 2) usd = conv.value
  }
  const before = text.slice(0, primary.index)
  const after = text.slice(primary.index + primary.raw.length)
  const plus = /^\s*(\+|이상)/.test(after)
  const approx = /약\s*$|~\s*$|≈\s*$|approx\.?\s*$|about\s*$/i.test(before) || /추정|estimate/i.test(text)
  const note = unwrap(
    after
      .replace(/^\s*(\+|이상)/, '')
      .replace(/^\s*누적/, '')
      .replace(/^[\s.,·:;-]+/, ''),
  )
  return { usd, primary, approx, plus, note: note || null, text }
}

/** "(a, b). c" → "a, b. c": drop the parentheses that open the note, keep what follows. */
function unwrap(note) {
  const t = note.trim()
  if (!t.startsWith('(')) return t
  let depth = 0
  for (let i = 0; i < t.length; i++) {
    if (t[i] === '(') depth++
    else if (t[i] === ')' && --depth === 0) {
      const rest = t.slice(i + 1).replace(/^[\s.,]+/, '')
      if (!rest) return t.slice(1, i)
      return /^[+/·&]/.test(rest) ? `${t.slice(1, i)} ${rest}` : `${t.slice(1, i)}. ${rest}`
    }
  }
  return t.slice(1)
}

const fmtNum = (n) => (n >= 100 ? Math.round(n) : n >= 10 ? Math.round(n * 10) / 10 : Math.round(n * 100) / 100).toLocaleString('en-US')

/** Compact USD: $83.8M, $1.2B, $650K. */
export function formatUSD(n) {
  if (n == null || !Number.isFinite(n)) return null
  if (n >= 1e9) return `$${fmtNum(n / 1e9)}B`
  if (n >= 1e6) return `$${fmtNum(n / 1e6)}M`
  if (n >= 1e3) return `$${Math.round(n / 1e3)}K`
  return `$${Math.round(n)}`
}

/** KRW in 억 원 / 조 원, the way Korean readers expect it. */
function formatKRW(v) {
  if (v >= 1e12) return `${fmtNum(v / 1e12)}조 원`
  if (v >= 1e8) return `${fmtNum(v / 1e8)}억 원`
  return `${Math.round(v / 1e4).toLocaleString('en-US')}만 원`
}

/**
 * Short label for lists and tables: KRW stays in 억 원, everything else becomes USD
 * so one column never mixes 엔 / ₹ / €. The original wording stays on the detail page.
 */
export function shortAmount(text, { krw = true } = {}) {
  const a = parseAmount(text)
  if (!a) return null
  const label = krw && a.primary.cur === 'KRW' ? formatKRW(a.primary.value) : formatUSD(a.usd)
  return `${label}${a.plus ? '+' : ''}`
}

/**
 * Detail view: the amount as written (without the trailing commentary) and the
 * commentary on its own line. "약 131억 엔(보조금·융자 포함, 약 $83.8M). 일문…"
 * → { main: "약 131억 엔", note: "보조금·융자 포함, 약 $83.8M). 일문…" }
 */
export function splitAmount(text) {
  if (!text || typeof text !== 'string') return { main: text || null, note: null }
  const a = parseAmount(text)
  if (!a) {
    // "비공개 (보도 간 불일치 …)" — keep the first word, the rest is the note
    const m = text.match(/^\s*([^(.,]+?)\s*[(.,]\s*(.+)$/s)
    return m ? { main: m[1], note: m[2].replace(/\)\s*$/, '') } : { main: text, note: null }
  }
  const start = a.primary.index
  const lead = text.slice(0, start).match(/(약|~|≈|approx\.?|about)\s*$/i)?.[0] || ''
  const main = `${lead}${a.primary.raw}${a.plus ? '+' : ''}`.trim()
  return { main, note: a.note }
}

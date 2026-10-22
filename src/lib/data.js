import raw from '../data/startups.json'
import corrections from '../data/corrections.json'

// KRW/EUR → USD rough rates, only used for ordering and summary stats.
const FX = { USD: 1, KRW: 1 / 1400, EUR: 1.08 }

/**
 * Parse loose funding strings ("$330M+", "약 1,000억 원+", "€825M+", "₩70B+")
 * into an approximate USD number. Returns null when unparseable.
 */
export function parseAmountUSD(text) {
  if (!text || typeof text !== 'string') return null
  const t = text.replace(/,/g, '')

  const eok = t.match(/([\d.]+)\s*(?:~\s*[\d.]+\s*)?억/)
  if (eok) {
    const jo = t.match(/([\d.]+)\s*조/)
    const krw = (jo ? parseFloat(jo[1]) * 1e12 : 0) + parseFloat(eok[1]) * 1e8
    return krw * FX.KRW
  }
  const joOnly = t.match(/([\d.]+)\s*조/)
  if (joOnly) return parseFloat(joOnly[1]) * 1e12 * FX.KRW

  const m = t.match(/([$€₩])\s*([\d.]+)\s*([KMBT])?/i)
  if (!m) return null
  const cur = m[1] === '€' ? 'EUR' : m[1] === '₩' ? 'KRW' : 'USD'
  const mult = { K: 1e3, M: 1e6, B: 1e9, T: 1e12 }[m[3]?.toUpperCase()] || 1
  return parseFloat(m[2]) * mult * FX[cur]
}

/** Some generated records lost their digits ("M+"); treat those as unknown. */
export function cleanAmount(text) {
  return typeof text === 'string' && /\d/.test(text) ? text : null
}

export function formatUSD(n) {
  if (n == null) return '—'
  if (n >= 1e9) return `$${(n / 1e9).toFixed(n >= 1e10 ? 0 : 1)}B`
  if (n >= 1e6) return `$${Math.round(n / 1e6)}M`
  return `$${Math.round(n / 1e3)}K`
}

export function getDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

/** Short stage label: "Public (NASDAQ: RXRX)" → "상장사", "Series B" → "Series B". */
export function stageLabel(stage = '') {
  // pre-IPO / late stage must win over the generic "ipo" match below
  if (/pre-ipo|late stage|growth/i.test(stage)) return 'Growth'
  if (/인수|acquired/i.test(stage)) return 'M&A'
  if (/public|ipo|상장/i.test(stage)) return '상장사'
  const series = stage.match(/series\s*([a-z])/i)
  if (series) return `Series ${series[1].toUpperCase()}`
  if (/seed/i.test(stage)) return 'Seed'
  return stage || '단계 미공개'
}

/* Categories are free-form Korean text from the generator (180+ variants).
   Map them onto a small, stable sector list for filters; order matters —
   "AI 신약개발" should land in 헬스·바이오 before the generic AI bucket. */
export const SECTORS = [
  { key: 'health', label: '헬스·바이오', re: /헬스|의료|바이오|신약|치료|DTx|뇌과학|장수|청각|슬립|세포|합성생물|약 배송|진단/i },
  { key: 'robotics', label: '로보틱스·제조', re: /로봇|로보|자율|물류 자동화|라스트마일|산업|스마트팩토리|예지|IoT|피지컬/i },
  { key: 'mobility', label: '모빌리티·우주', re: /모빌리티|eVTOL|항공|우주|발사체|스페이스|위성|디펜스|국방/i },
  { key: 'climate', label: '기후·에너지', re: /기후|클린|에너지|탄소|카본|공기 포집|배터리|EV 인프라|그리드|수처리|워터|지속가능|농|애그|단백질|푸드|바이오소재|화학/i },
  { key: 'fintech', label: '핀테크', re: /핀테크|FinTech|금융|뱅킹|결제|보험|인슈어|머니|Web3|크립토|블록체인|오라클/i },
  { key: 'infra', label: 'AI 인프라·반도체', re: /반도체|NPU|GPU|데이터센터|추론|클라우드|서버리스|MLOps|ML 인프라|인프라|양자|하드웨어|엣지|온디바이스|경량화|아키텍처/i },
  { key: 'devtools', label: '개발자 도구', re: /데브|개발자|코딩|DevOps|옵저버빌리티|스펙 기반/i },
  { key: 'enterprise', label: '엔터프라이즈', re: /SaaS|엔터프라이즈|HR|성과|지식|문서|검색|보안|인증|컴플라이언스|규제|리갈|프로젝트|공급망|물류 플랫폼|데이터 플랫폼|고객지원|프롭|부동산|건설|외식|빌딩|B2B/i },
  { key: 'consumer', label: '컨슈머·교육', re: /에듀|EdTech|학습|교육|튜터|게이밍|크리에이|퍼블리싱|VR|XR|공간 컴퓨팅|컨슈머|모바일 앱|실시간 3D/i },
  { key: 'ai', label: 'AI 모델·에이전트', re: /AI|LLM|파운데이션|에이전트|모델|음성|진화 알고리즘|비전/i },
]
const OTHER_SECTOR = { key: 'other', label: '기타' }

export function sectorOf(categories = []) {
  for (const c of categories) {
    const hit = SECTORS.find((s) => s.re.test(c))
    if (hit) return hit
  }
  return OTHER_SECTOR
}

export const STAGE_GROUPS = [
  { key: 'early', label: '초기 (Seed·A)' },
  { key: 'b', label: 'Series B' },
  { key: 'c', label: 'Series C' },
  { key: 'late', label: 'Series D 이상' },
  { key: 'exit', label: '상장·M&A·종료' },
]

const CORRECTION_KIND = (status = '') =>
  /중단|파산|폐업/.test(status) ? 'shutdown' : /인수/.test(status) ? 'acquired' : 'note'

function stageGroupOf(stage, correction) {
  if (correction && correction.kind !== 'note') return 'exit'
  if (stage === 'Seed' || stage === 'Series A') return 'early'
  if (stage === 'Series B') return 'b'
  if (stage === 'Series C') return 'c'
  if (stage === '상장사' || stage === 'M&A') return 'exit'
  return 'late'
}

export const REGIONS = [
  { key: 'kr', label: '한국' },
  { key: 'us', label: '미국' },
  { key: 'eu', label: '유럽' },
  { key: 'asia', label: '아시아·중동' },
  { key: 'etc', label: '기타' },
]

function regionOf(countryKo = '') {
  const c = countryKo.split('/')[0].trim()
  if (c.includes('한국')) return 'kr'
  if (c.includes('미국')) return 'us'
  if (/독일|영국|핀란드|포르투갈|스위스|크로아티아|프랑스|스웨덴|네덜란드|스페인|이탈리아|덴마크|노르웨이|에스토니아|폴란드|아일랜드|벨기에|오스트리아/.test(c)) return 'eu'
  if (/일본|중국|홍콩|싱가포르|이스라엘|인도|대만|베트남|인도네시아|아랍|사우디/.test(c)) return 'asia'
  return 'etc'
}

export const isKorean = (s) => (s.headquarters?.country_ko || '').includes('한국')

const norm = (t) => (t || '').normalize('NFC').toLowerCase().replace(/\s+/g, '')

const startups = raw
  .map((s) => {
    const category = Array.isArray(s.category) ? s.category : []
    const founders = Array.isArray(s.founders) ? s.founders : []
    const correction = corrections[s.id] ? { ...corrections[s.id], kind: CORRECTION_KIND(corrections[s.id].status) } : null
    const stage = stageLabel(s.company_stage)
    return {
      ...s,
      category,
      founders,
      _raised: cleanAmount(s.funding?.total_raised),
      _raisedUSD: parseAmountUSD(cleanAmount(s.funding?.total_raised)),
      _domain: getDomain(s.website),
      _sector: sectorOf(category),
      _stage: stage,
      _stageGroup: stageGroupOf(stage, correction),
      _region: regionOf(s.headquarters?.country_ko),
      _correction: correction,
      _search: {
        name: norm(`${s.name_ko} ${s.name_en}`),
        body: norm(`${s.tagline} ${category.join(' ')}`),
        founders: founders.map((f) => ({ label: f.name_ko || f.name_en, key: norm(`${f.name_ko} ${f.name_en}`) })),
        competitors: (s.competitive_landscape?.direct_competitors || []).map((c) => ({ label: c.name, key: norm(c.name) })),
      },
    }
  })
  .sort((a, b) => b.date.localeCompare(a.date))

/** Issue dates, newest first. */
export const dates = [...new Set(startups.map((s) => s.date))]

const issueCache = new Map(dates.map((d) => [d, startups.filter((s) => s.date === d)]))

export function byDate(date) {
  return issueCache.get(date) || []
}

export function byId(id) {
  return startups.find((s) => s.id === id)
}

/** Oldest issue is 제1호. */
export function issueNo(date) {
  const i = dates.indexOf(date)
  return i < 0 ? null : dates.length - i
}

export function sectorMix(list) {
  const counts = new Map()
  for (const s of list) counts.set(s._sector.label, (counts.get(s._sector.label) || 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1])
}

/**
 * Search across name, tagline, categories, founders and competitors.
 * Returns [{ startup, reason }] where reason explains non-obvious matches.
 */
export function search(query, list = startups) {
  const q = norm(query)
  if (!q) return list.map((startup) => ({ startup, reason: null }))
  const out = []
  for (const s of list) {
    if (s._search.name.includes(q) || s._search.body.includes(q)) {
      out.push({ startup: s, reason: null })
      continue
    }
    const f = s._search.founders.find((x) => x.key.includes(q))
    if (f) {
      out.push({ startup: s, reason: `창업자: ${f.label}` })
      continue
    }
    const c = s._search.competitors.find((x) => x.key.includes(q))
    if (c) out.push({ startup: s, reason: `경쟁사로 언급: ${c.label}` })
  }
  return out
}

export const correctionList = startups
  .filter((s) => s._correction)
  .sort((a, b) => b._correction.checked.localeCompare(a._correction.checked))

export const stats = {
  issues: dates.length,
  companies: startups.length,
  first: dates[dates.length - 1],
  last: dates[0],
}

export default startups

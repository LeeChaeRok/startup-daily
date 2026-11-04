/**
 * Y Combinator as a second lead source: one or two companies a day from the newest batches,
 * next to the model's own web discovery. Data comes from yc-oss (https://github.com/yc-oss/api),
 * an unofficial daily mirror of ycombinator.com/companies — when it is down the run just goes
 * on without YC leads.
 *
 * Kept small on purpose: YC alone would tilt the pool towards US B2B AI. Only tiny, active,
 * non-"top" companies from the two newest full batches, so they are early and not famous.
 * The pick is seeded by the issue date: a rerun of the same day asks for the same companies.
 */
const API = 'https://yc-oss.github.io/api'
const TIMEOUT_MS = 15000
const MIN_BATCH = 30 // batches still being admitted list only a handful of companies
const MAX_TEAM = 15

const COUNTRY_KO = {
  USA: '미국', Canada: '캐나다', 'United Kingdom': '영국', Germany: '독일', France: '프랑스', India: '인도',
  Switzerland: '스위스', Netherlands: '네덜란드', Sweden: '스웨덴', Spain: '스페인', Italy: '이탈리아',
  Mexico: '멕시코', Brazil: '브라질', Chile: '칠레', Colombia: '콜롬비아', Argentina: '아르헨티나',
  Nigeria: '나이지리아', Kenya: '케냐', Egypt: '이집트', 'South Africa': '남아프리카공화국', Turkey: '튀르키예',
  Israel: '이스라엘', Singapore: '싱가포르', Japan: '일본', 'South Korea': '한국', Indonesia: '인도네시아',
  Vietnam: '베트남', Philippines: '필리핀', Australia: '호주', Czechia: '체코', Poland: '폴란드', Estonia: '에스토니아',
}

/** A YC company → one of the nine pool keys (src/lib/sectors.js), from its industry and tags. */
export function ycSector(co) {
  const sub = `${co.subindustry || ''}`
  const tags = new Set(co.tags || [])
  const has = (...t) => t.some((x) => tags.has(x))
  switch (co.industry) {
    case 'Healthcare':
      return 'health'
    case 'Fintech':
      return 'fintech'
    case 'Consumer':
    case 'Education':
      return 'consumer'
    case 'Industrials':
      if (/Energy|Agriculture|Climate/.test(sub) || has('Climate', 'Energy', 'Solar Power', 'Carbon Capture')) return 'climate'
      if (/Aviation|Space|Defense|Drones|Automotive|Transportation/.test(sub)) return 'mobility'
      return 'robotics'
    case 'B2B':
      if (/Infrastructure|Engineering, Product and Design/.test(sub) || has('Developer Tools', 'Infrastructure', 'Semiconductors', 'Cloud Computing'))
        return 'infra'
      if (sub === 'B2B' && has('Generative AI', 'AI Assistant', 'Voice AI', 'Deep Learning')) return 'ai'
      return 'enterprise'
    default:
      return 'enterprise'
  }
}

/** "San Francisco, CA, USA; Remote" → { city, country (English), country_ko } */
export function ycPlace(locations = '') {
  const first = String(locations).split(';')[0].trim()
  const parts = first.split(',').map((s) => s.trim()).filter(Boolean)
  const country = parts.at(-1) || ''
  return { city: parts[0] || '', country, country_ko: COUNTRY_KO[country] || country }
}

// small deterministic PRNG (mulberry32) seeded from the date string
function seeded(seedText) {
  let a = [...seedText].reduce((h, ch) => (Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0), 2166136261)
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '')

/**
 * Pick `want` YC companies for `date`, each from a different sector in `sectors`, skipping
 * names already published. Returns discovery-shaped leads ({ name_en, website, …, _sector }).
 */
export function pickYc(companies, { date, want = 2, sectors, existingNames = [] }) {
  const seen = new Set(existingNames.map(norm))
  const eligible = companies.filter(
    (co) =>
      co.status === 'Active' && !co.top_company && !co.nonprofit && co.website && co.name &&
      (co.team_size ?? 0) <= MAX_TEAM && !seen.has(norm(co.name)) && sectors.includes(ycSector(co)),
  )
  const rand = seeded(`yc:${date}`)
  // Fisher–Yates over a copy sorted by id, so the API's order does not change the pick
  const pool = [...eligible].sort((a, b) => a.id - b.id)
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  const used = new Set()
  const out = []
  for (const co of pool) {
    if (out.length >= want) break
    const sector = ycSector(co)
    if (used.has(sector)) continue
    used.add(sector)
    const place = ycPlace(co.all_locations)
    out.push({
      name_en: co.name.trim(),
      name_ko: '',
      website: co.website,
      country_ko: place.country_ko,
      company_stage: 'Seed',
      status: 'active',
      why_now: `Y Combinator ${co.batch} batch company: ${String(co.one_liner || '').trim()} Find its most recent news (demo day, round, launch, customers).`,
      evidence_url: co.url || '',
      attention: 2,
      _sector: sector,
      _source: 'yc',
    })
  }
  return out
}

async function getJson(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) })
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`)
  return res.json()
}

const SEASONS = ['winter', 'spring', 'summer', 'fall']
/** "Fall 2026" → 2026.75, for sorting batches; unknown names sort last. */
export function batchOrder(name = '') {
  const m = /^(\w+)\s+(\d{4})$/.exec(String(name).trim())
  const s = m ? SEASONS.indexOf(m[1].toLowerCase()) : -1
  return s < 0 ? 0 : Number(m[2]) + s / 4
}

/** The companies of the two newest batches that are past admissions. */
export async function fetchYcCompanies({ log = () => {} } = {}) {
  const meta = await getJson(`${API}/meta.json`)
  const batches = Object.values(meta.batches || {})
    .filter((b) => b.count >= MIN_BATCH)
    .sort((a, b) => batchOrder(b.name) - batchOrder(a.name))
    .slice(0, 2)
  if (!batches.length) throw new Error('no YC batch with enough companies')
  const lists = await Promise.all(batches.map((b) => getJson(b.api)))
  log(`YC: ${batches.map((b) => `${b.name} (${b.count})`).join(', ')}`)
  return lists.flat()
}

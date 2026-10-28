// Guard tests for the daily pipeline: duplicate detection, amount normalization, logo checks.
// No network, no LLM. Run: npm run test:pipeline
import { companyKey, dropDuplicates, fixAmount, merge, normalize, registrableDomain, selectCandidates } from './lib/pipeline.mjs'
import { checkImage, iconLinks, imageSize, sniffType } from './lib/logos.mjs'

let fails = 0
const eq = (name, a, b) => { const ok = JSON.stringify(a) === JSON.stringify(b); if (!ok) fails++; console.log(ok ? 'ok  ' : 'FAIL', name, ok ? '' : `got ${JSON.stringify(a)} want ${JSON.stringify(b)}`) }

/* ---------- registrable domain ---------- */
eq('www dropped', registrableDomain('https://www.k-oqt.com'), 'k-oqt.com')
eq('subdomain + path', registrableDomain('https://global.helicalfusion.com/en/'), 'helicalfusion.com')
eq('no scheme', registrableDomain('k-oqt.com/en'), 'k-oqt.com')
eq('co.kr', registrableDomain('https://shop.mybenefit.co.kr/'), 'mybenefit.co.kr')
eq('co.jp', registrableDomain('https://www.example.co.jp'), 'example.co.jp')
eq('com.br', registrableDomain('https://app.matria.com.br'), 'matria.com.br')
eq('plain ccTLD', registrableDomain('https://reuse.cl'), 'reuse.cl')
eq('shared host keeps subdomain', registrableDomain('https://acme.notion.site/about'), 'acme.notion.site')
eq('bad url', registrableDomain('not a url'), null)
eq('empty', registrableDomain(''), null)

/* ---------- company names ---------- */
eq('주식회사 prefix', companyKey('주식회사 오큐티'), '오큐티')
eq('(주) prefix', companyKey('(주)오큐티'), '오큐티')
eq('㈜ suffix', companyKey('오큐티㈜'), '오큐티')
eq('Co., Ltd.', companyKey('Helical Fusion Co., Ltd.'), 'helicalfusion')
eq('Inc.', companyKey('Celaid Therapeutics, Inc.'), 'celaidtherapeutics')
eq('Corp + case + spaces', companyKey('ACME  corp'), companyKey('Acme'))
eq('株式会社', companyKey('株式会社Kinish'), 'kinish')
eq('name containing Co stays', companyKey('Cohere Health'), 'coherehealth')

/* ---------- duplicates against published data ---------- */
const published = [
  { id: 'oqt-2026', date: '2026-10-27', name_en: 'OQT', name_ko: '오큐티', website: 'https://www.k-oqt.com' },
  { id: 'helical-fusion-co-ltd-2026', date: '2026-10-26', name_en: 'Helical Fusion Co., Ltd.', name_ko: '헬리컬 퓨전', website: 'https://global.helicalfusion.com' },
]
const fresh = (o) => ({ company_stage: 'Seed', status: 'active', headquarters: { country_ko: '일본' }, ...o })
const pick = (cands, want = 5) => selectCandidates(cands, published, want, { maxPerCountry: 9 })

// the real incident: 10/28 "Occu-T (OQT)" repeated 10/27 "OQT" under another id
const occu = fresh({ name_en: 'Occu-T (OQT)', name_ko: '주식회사 오큐티', website: 'https://www.k-oqt.com' })
eq('incident: same site, other name', pick([occu]).accepted.length, 0)
eq('incident: reason names the domain', pick([occu]).rejected[0].reason.startsWith('duplicate (domain k-oqt.com'), true)
eq('same domain, different subdomain', pick([fresh({ name_en: 'Totally New', website: 'https://app.k-oqt.com/x' })]).accepted.length, 0)
eq('same Korean name with 주식회사', pick([fresh({ name_en: 'Something Else', name_ko: '주식회사 오큐티', website: 'https://other.io' })]).accepted.length, 0)
eq('same English name without legal suffix', pick([fresh({ name_en: 'Helical Fusion', website: 'https://helical.jp' })]).accepted.length, 0)
eq('alias in parentheses', pick([fresh({ name_en: 'Occu-T (OQT)', website: 'https://occu-t.kr' })]).accepted.length, 0)
eq('new company passes', pick([fresh({ name_en: 'Brand New', name_ko: '브랜드뉴', website: 'https://brandnew.co.kr' })]).accepted.length, 1)
eq('within one run: second copy rejected', pick([
  fresh({ name_en: 'Twin Labs', website: 'https://twinlabs.ai' }),
  fresh({ name_en: 'Twin Labs Inc.', website: 'https://www.twinlabs.ai/en' }),
]).accepted.length, 1)
eq('within one run: same domain, other name', pick([
  fresh({ name_en: 'Alpha', website: 'https://alpha.co.jp' }),
  fresh({ name_en: 'Beta', website: 'https://www.alpha.co.jp' }),
]).accepted.map((c) => c.name_en), ['Alpha'])

/* ---------- duplicates at merge ---------- */
const rec = (o) => ({ date: '2026-10-28', ...o })
const merged = merge(published, [
  rec({ id: 'occu-t-oqt-2026', name_en: 'Occu-T (OQT)', website: 'https://www.k-oqt.com' }),
  rec({ id: 'brand-new-2026', name_en: 'Brand New', website: 'https://brandnew.io' }),
  rec({ id: 'brand-new-inc-2026', name_en: 'Brand New Inc.', website: 'https://brandnew.io/en' }),
], 30)
eq('merge drops repeat of published company', merged.some((s) => s.id === 'occu-t-oqt-2026'), false)
eq('merge drops repeat within fresh', merged.filter((s) => s.name_en.startsWith('Brand New')).length, 1)
eq('merge keeps the rest', merged.length, 3)
const rerun = merge([...published, rec({ id: 'brand-new-2026', name_en: 'Brand New', website: 'https://brandnew.io' })],
  [rec({ id: 'brand-new-2026', name_en: 'Brand New', website: 'https://brandnew.io', tagline: 'v2' })], 30)
eq('re-run of the same issue replaces, not drops', rerun.find((s) => s.id === 'brand-new-2026')?.tagline, 'v2')
eq('dropDuplicates reports what it dropped', dropDuplicates([rec({ id: 'x', name_en: 'OQT', website: 'https://k-oqt.com' })], published).dropped[0].by, 'domain')

/* ---------- amounts ---------- */
const fa = (t, o) => fixAmount(t, o)
eq('plain USD', fa('$12.6M'), { amount: '$12.6M', note: null, usd: 12600000 })
eq('KRW with 약', fa('약 173억원'), { amount: '약 173억원', note: null, usd: 12357143 })
eq('explanation split off', fa('약 131억 엔(보조금·융자 포함, 약 $83.8M). 일문 발표는 130.5억 엔'),
  { amount: '약 131억 엔', note: '보조금·융자 포함, 약 $83.8M. 일문 발표는 130.5억 엔', usd: 83800000 })
eq('wrong conversion: original currency wins', fa('3.23억 엔 (약 $20.6M)', { usd: 20600000 }),
  { amount: '3.23억 엔', note: '약 $20.6M', usd: 2153333 })
eq('model USD within 2x kept', fa('$12M', { usd: 13000000 }).usd, 13000000)
eq('model USD off by 2x replaced', fa('$12M', { usd: 1200000 }).usd, 12000000)
eq('model note and split note joined', fa('$5M (Seed)', { note: '회사 발표' }).note, '회사 발표 / Seed')
eq('undisclosed keeps its note', fa('비공개 (보도 간 불일치)'), { amount: '비공개', note: '보도 간 불일치', usd: null })
eq('digit-less junk', fa('M+'), { amount: '비공개', note: null, usd: null })
eq('missing', fa(undefined), { amount: '비공개', note: null, usd: null })
eq('unknown kanji unit not cut', fa('¥2億 (¥200M)').amount, '¥2億 (¥200M)')
eq('이상 becomes +', fa('335억원 이상 (출처별 환산 차이)').amount, '335억원+')

const p = normalize({
  name_en: 'Test Co', headquarters: { country_ko: '일본' },
  funding: {
    total_raised: '3.23억 엔 (약 $20.6M). 다른 매체는 $24.8M', total_raised_usd: 20600000,
    latest_round: { stage: 'Series A', amount: '₩140억 (≈$10M, 추정)', date: '2026-10' },
    funding_history: [{ stage: 'Seed', amount: '$2M', note: '회사 발표' }, { stage: 'Pre-seed', amount: 'M+' }],
  },
}, { date: '2026-10-28', model: 'test', generatedAt: 'now' })
eq('normalize: total amount only', p.funding.total_raised, '3.23억 엔')
eq('normalize: total note', p.funding.total_raised_note, '약 $20.6M. 다른 매체는 $24.8M')
eq('normalize: total usd from yen', p.funding.total_raised_usd, 2153333)
eq('normalize: round split', [p.funding.latest_round.amount, p.funding.latest_round.note], ['₩140억', '≈$10M, 추정'])
eq('normalize: round usd', p.funding.latest_round.amount_usd, 10000000)
eq('normalize: history note kept', p.funding.funding_history[0], { stage: 'Seed', amount: '$2M', note: '회사 발표', amount_usd: 2000000, date: '', lead_investor: '' })
eq('normalize: junk round amount', p.funding.funding_history[1].amount, '비공개')
eq('normalize: logo empty until fetched', p.logo_url, '')

/* ---------- logo bytes ---------- */
const png = (w, h) => {
  const b = Buffer.alloc(33)
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(b, 0)
  b.writeUInt32BE(13, 8); b.write('IHDR', 12, 'latin1'); b.writeUInt32BE(w, 16); b.writeUInt32BE(h, 20)
  return b
}
const jpg = (w, h) => Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x04, 0x00, 0x00, // SOI + APP0 (len 4)
  0xff, 0xc0, 0x00, 0x11, 0x08, h >> 8, h & 255, w >> 8, w & 255, 0x03, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
])
const webpX = (w, h) => {
  const b = Buffer.alloc(30)
  b.write('RIFF', 0, 'latin1'); b.write('WEBP', 8, 'latin1'); b.write('VP8X', 12, 'latin1')
  b.writeUIntLE(w - 1, 24, 3); b.writeUIntLE(h - 1, 27, 3)
  return b
}
const webpL = (w, h) => {
  const b = Buffer.alloc(30)
  b.write('RIFF', 0, 'latin1'); b.write('WEBP', 8, 'latin1'); b.write('VP8L', 12, 'latin1')
  b[20] = 0x2f; b.writeUInt32LE(((w - 1) & 0x3fff) | (((h - 1) & 0x3fff) << 14), 21)
  return b
}
eq('png size', imageSize(png(180, 180)), { width: 180, height: 180 })
eq('jpeg size', imageSize(jpg(256, 128)), { height: 128, width: 256 })
eq('webp VP8X size', imageSize(webpX(512, 300)), { width: 512, height: 300 })
eq('webp VP8L size', imageSize(webpL(96, 64)), { width: 96, height: 64 })
eq('png accepted', checkImage(png(128, 128)).ok, true)
eq('png too small', checkImage(png(32, 32)).ok, false)
eq('one side too small', checkImage(png(200, 48)).ok, false)
eq('svg refused', sniffType(Buffer.from('<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg"></svg>')), null)
eq('ico refused', sniffType(Buffer.from([0, 0, 1, 0, 1, 0, 64, 64, 0, 0, 1, 0, 32, 0])), null)
eq('html refused', checkImage(Buffer.from('<!doctype html><html></html>')).ok, false)
const big = Buffer.concat([png(512, 512), Buffer.alloc(210 * 1024)])
eq('over 200 KB refused', checkImage(big).ok, false)

eq('icon links: touch first, then largest icon', iconLinks(`
  <link rel="icon" href="/favicon-16.png" sizes="16x16">
  <link rel="shortcut icon" href="/favicon.ico">
  <link rel="icon" type="image/png" sizes="192x192" href='/icon-192.png'>
  <link href="https://cdn.x.com/touch.png" rel="apple-touch-icon">
  <link rel="stylesheet" href="/a.css">`, 'https://x.com/en/'), [
  'https://cdn.x.com/touch.png', 'https://x.com/icon-192.png', 'https://x.com/favicon-16.png', 'https://x.com/favicon.ico',
])

console.log(fails ? `\n${fails} failed` : '\nall passed')
process.exit(fails ? 1 : 0)

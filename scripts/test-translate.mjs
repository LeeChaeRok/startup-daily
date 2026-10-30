// Guard tests for the English edition. Mock LLM: no network.
// Run: npm run test:translate
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  buildOverlay, checkValue, englishAmounts, extractStrings, koreanAmounts, plainNumbers,
  translateMap, translateRecord, translateRecords, translateUpdates, vetTranslation,
} from './lib/translate.mjs'
import { englishRecord } from '../src/lib/merge-en.js'

let fails = 0
const eq = (name, a, b) => { const ok = JSON.stringify(a) === JSON.stringify(b); if (!ok) fails++; console.log(ok ? 'ok  ' : 'FAIL', name, ok ? '' : `got ${JSON.stringify(a)} want ${JSON.stringify(b)}`) }

const record = {
  id: 'acme-2026',
  date: '2026-10-30',
  name_en: 'Acme',
  name_ko: '애크미',
  tagline: '공장용 AI 비전',
  category: ['AI', '제조'],
  founded_year: 2021,
  headquarters: { city: 'Seoul', country: 'South Korea', country_ko: '한국' },
  company_stage: 'Series A',
  website: 'https://acme.ai',
  logo_url: '/logos/acme.png',
  logo_svg_description: '파란 원',
  model: 'deepseek/x',
  generated_at: '2026-10-30T00:00:00Z',
  website_check: { verified: true, http_status: 200, checked_at: '2026-10-30' },
  founders: [{ name_en: 'Minsu Kim', name_ko: '김민수', role: '대표', background: '삼성전자 출신', linkedin: 'https://linkedin.com/in/x', email: 'a@b.c' }],
  product: { summary: '불량 검출 정확도 99.5%', key_features: ['English feature', '실시간 분석'], demo_or_screenshot_url: 'https://acme.ai/demo' },
  funding: {
    total_raised: '약 131억 엔',
    total_raised_usd: 87000000,
    latest_round: { stage: 'Series A', amount: '$12M', note: '2026년 10월 마감' },
  },
  related_links: [{ title: '공식 사이트', url: 'https://acme.ai', verified: true }, { title: 'TechCrunch', url: 'https://tc.com/a' }],
  trending_reason: { media_mentions: [{ source: '더벨', title: '애크미, 시리즈 A 유치', url: 'https://thebell.kr/1', date: '2026-10-01' }] },
  weird_link: 'http://한국.kr/페이지',
}

/* ---------- extraction ---------- */
const req = extractStrings(record)
eq('extracted paths', Object.keys(req), [
  'tagline', 'category.1', 'headquarters.country_ko', 'founders.0.role', 'founders.0.background',
  'product.summary', 'product.key_features.1', 'funding.total_raised', 'funding.latest_round.note',
  'related_links.0.title', 'trending_reason.media_mentions.0.source', 'trending_reason.media_mentions.0.title',
])
const skipped = ['id', 'date', 'website', 'logo_url', 'model', 'generated_at', 'name_en', 'name_ko', 'founders.0.name_ko', 'founders.0.linkedin', 'founders.0.email', 'logo_svg_description', 'weird_link', 'product.demo_or_screenshot_url']
eq('excluded fields not extracted', skipped.filter((k) => k in req), [])
eq('English-only strings not extracted', ['category.0', 'product.key_features.0', 'related_links.1.title'].filter((k) => k in req), [])

/* ---------- overlay ---------- */
const en = {
  tagline: 'AI vision for factories',
  'category.1': 'Manufacturing',
  'headquarters.country_ko': 'South Korea',
  'founders.0.role': 'CEO',
  'founders.0.background': 'Formerly at Samsung Electronics',
  'product.summary': 'Defect detection accuracy of 99.5%',
  'product.key_features.1': 'Real-time analysis',
  'funding.total_raised': 'approx. ¥13.1B',
  'funding.latest_round.note': 'Closed October 2026',
  'related_links.0.title': 'Official site',
  'trending_reason.media_mentions.0.source': 'The Bell',
  'trending_reason.media_mentions.0.title': 'Acme raises Series A',
}
const ov = buildOverlay(record, en)
eq('overlay keeps the shape, strings only', ov, {
  tagline: 'AI vision for factories',
  category: [null, 'Manufacturing'],
  headquarters: { country_ko: 'South Korea' },
  founders: [{ role: 'CEO', background: 'Formerly at Samsung Electronics' }],
  product: { summary: 'Defect detection accuracy of 99.5%', key_features: [null, 'Real-time analysis'] },
  funding: { total_raised: 'approx. ¥13.1B', latest_round: { note: 'Closed October 2026' } },
  related_links: [{ title: 'Official site' }],
  trending_reason: { media_mentions: [{ source: 'The Bell', title: 'Acme raises Series A' }] },
})
eq('overlay has no holes after JSON round trip', JSON.parse(JSON.stringify(ov)).category, [null, 'Manufacturing'])

/* ---------- with merge-en.js ---------- */
const merged = englishRecord(record, JSON.parse(JSON.stringify(ov)))
eq('merged: translated strings', [merged.tagline, merged.category, merged.founders[0].role, merged.product.key_features], ['AI vision for factories', ['AI', 'Manufacturing'], 'CEO', ['English feature', 'Real-time analysis']])
eq('merged: untouched fields kept', [merged.id, merged.website, merged.founders[0].linkedin, merged.related_links[0].url, merged.related_links[1].title, merged.funding.total_raised_usd], ['acme-2026', 'https://acme.ai', 'https://linkedin.com/in/x', 'https://acme.ai', 'TechCrunch', 87000000])
eq('merged: English name shown, Korean values under _ko', [merged.name_ko, merged._ko.name_ko, merged._ko.total_raised, merged._ko.category], ['Acme', '애크미', '약 131억 엔', ['AI', '제조']])
eq('merged: no Korean left in translated fields', Object.keys(extractStrings({ ...merged, _ko: undefined, logo_svg_description: '' })), [])
eq('no translation → untranslated flag', englishRecord(record, undefined)._untranslated, true)

/* ---------- number and amount checks ---------- */
eq('Korean amounts', koreanAmounts('약 131억 엔, 1조 2,000억원, 5천만 원, 4,000만 달러'), [13100000000, 1200000000000, 50000000, 40000000])
eq('English amounts', englishAmounts('approx. ¥13.1B, KRW 1.2 trillion, $40M, 2026, 1,400,000'), [13100000000, 1200000000000, 40000000, 1400000])
eq('plain numbers skip units, months, single digits', plainNumbers('2026년 10월 163억원 유치, 정확도 99.5%, 3인, 1,400원/$'), ['2026', '99.5', '1400'])
eq('good value passes', checkValue('약 131억 엔(보조금 포함)', 'approx. ¥13.1B (incl. grants)'), [])
eq('wrong unit conversion caught', checkValue('163억원', 'KRW 163B').map((p) => p.reason), ['amount 16300000000 not kept'])
eq('lost number caught', checkValue('2025년 매출 148% 증가', 'Revenue up sharply in 2025').map((p) => p.reason), ['number 148 lost'])
eq('Korean left is hard', checkValue('삼성전자 출신', '삼성전자 출신 engineer').map((p) => p.hard), [true])
eq('a few Korean characters allowed', checkValue('더벨 기사', 'Article in The Bell (더벨)'), [])
const vt = vetTranslation({ a: '하나', b: '둘' }, { a: 'One', c: 'Extra' })
eq('vet: good, missing, unexpected keys', [vt.good, Object.keys(vt.bad), vt.extra], [{ a: 'One' }, ['b'], ['c']])

/* ---------- mock LLM ---------- */
function mockLlm(replies, models = ['primary', 'fallback']) {
  const calls = []
  return {
    calls,
    models,
    async chat(opts) {
      calls.push(opts)
      const r = replies[calls.length - 1]
      if (r instanceof Error) throw r
      const reqKeys = JSON.parse(opts.user.slice(opts.user.indexOf('{')))
      return { text: typeof r === 'function' ? r(reqKeys) : r, model: opts.useModels?.[0] || models[0], citations: [] }
    },
  }
}
const asJson = (o) => JSON.stringify(o)
const quiet = () => {}

// all good in one call
const llm1 = mockLlm([asJson(en)])
const r1 = await translateRecord(llm1, record, { log: quiet })
eq('one call, json mode, no web', [llm1.calls.length, llm1.calls[0].json, !!llm1.calls[0].web], [1, true, false])
eq('record ok → overlay', [r1.ok, r1.overlay.tagline, r1.models], [true, 'AI vision for factories', ['primary']])
eq('prompt carries the name glossary', /김민수 = Minsu Kim/.test(llm1.calls[0].user), true)

// cut off on the first model → whole request again on the fallback
const llm2 = mockLlm([new Error('OpenRouter length: response hit max_tokens'), asJson(en)])
const r2 = await translateRecord(llm2, record, { log: quiet })
eq('cut off → retried on llm.models.slice(1)', [r2.ok, llm2.calls[1].useModels, Object.keys(JSON.parse(llm2.calls[1].user.slice(llm2.calls[1].user.indexOf('{')))).length], [true, ['fallback'], Object.keys(en).length])

// unparsable answer → retry
const llm3 = mockLlm(['not json at all', asJson(en)])
eq('parse failure → retry', (await translateRecord(llm3, record, { log: quiet })).ok, true)

// some keys bad → only those retried
const partial = { ...en, tagline: '공장용 AI 비전', 'founders.0.role': undefined, bogus: 'x' }
const llm4 = mockLlm([asJson(partial), asJson({ tagline: 'AI vision for factories', 'founders.0.role': 'CEO' })])
const r4 = await translateRecord(llm4, record, { log: quiet })
eq('only failed keys retried', Object.keys(JSON.parse(llm4.calls[1].user.slice(llm4.calls[1].user.indexOf('{')))).sort(), ['founders.0.role', 'tagline'])
eq('retry fills them, unexpected key ignored', [r4.ok, r4.overlay.tagline, r4.overlay.founders[0].role, 'bogus' in r4.overlay], [true, 'AI vision for factories', 'CEO', false])

// still Korean after the retry → record fails, nothing stored
const llm5 = mockLlm([asJson({ ...en, tagline: '공장용 AI 비전' }), asJson({ tagline: '공장용 비전' })])
const r5 = await translateRecord(llm5, record, { log: quiet })
eq('hard failure after retry → not ok, no overlay', [r5.ok, r5.overlay, Object.keys(r5.failed)], [false, null, ['tagline']])

// number lost twice → the retry's text kept with a warning (soft)
const llm6 = mockLlm([asJson({ ...en, 'product.summary': 'Very accurate defect detection' }), asJson({ 'product.summary': 'Highly accurate defect detection' })])
const r6 = await translateRecord(llm6, record, { log: quiet })
eq('soft failure after retry → kept, warned', [r6.ok, r6.overlay.product.summary, Object.keys(r6.warnings)], [true, 'Highly accurate defect detection', ['product.summary']])

// single-model list: no retry round
const llm7 = mockLlm([asJson({ a: '하나' })], ['only'])
eq('no fallback model → one call', [(await translateMap(llm7, { a: '하나' }, { prompt: (q) => JSON.stringify(q) })).ok, llm7.calls.length], [false, 1])

/* ---------- store: saved per company, resumable ---------- */
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sd-tr-'))
const file = path.join(dir, 'startups.en.json')
const recB = { id: 'beta-2026', name_en: 'Beta', tagline: '베타 서비스' }
const recC = { id: 'gamma-2026', name_en: 'Gamma', tagline: '감마 서비스' }
const llm8 = mockLlm([
  (q) => asJson(Object.fromEntries(Object.keys(q).map((k) => [k, `EN ${k}`]))),
  (q) => asJson(Object.fromEntries(Object.keys(q).map((k) => [k, '여전히 한국어']))),
  (q) => asJson(Object.fromEntries(Object.keys(q).map((k) => [k, '여전히 한국어']))),
])
const res8 = await translateRecords(llm8, [recB, recC], { file, order: ['gamma-2026', 'beta-2026'], concurrency: 1, fs, log: quiet })
const saved = JSON.parse(fs.readFileSync(file, 'utf-8'))
eq('done / failed', [res8.done, res8.failed.map((f) => f.id)], [['beta-2026'], ['gamma-2026']])
eq('only the good company saved', saved, { 'beta-2026': { tagline: 'EN tagline' } })
fs.writeFileSync(file, JSON.stringify({ 'gamma-2026': { tagline: 'Gamma service' }, ...saved }))
const llm9 = mockLlm([(q) => asJson(Object.fromEntries(Object.keys(q).map((k) => [k, `Beta ${k}`])))])
await translateRecords(llm9, [recB], { file, order: ['gamma-2026', 'beta-2026'], fs, log: quiet })
eq('existing entries kept, startups.json order', Object.keys(JSON.parse(fs.readFileSync(file, 'utf-8'))), ['gamma-2026', 'beta-2026'])
fs.rmSync(dir, { recursive: true, force: true })

/* ---------- follow-up events ---------- */
const store = {
  updates: {
    'x-2026': [
      { date: '2026-06-01', kind: 'funding', title_ko: '시리즈 B 4,000만 달러 유치', detail_ko: '리드는 X다.' },
      { date: '2026-05-01', kind: 'product', title_ko: '앱 출시', title_en: 'App launch', detail_ko: '앱을 냈다.', detail_en: 'Launched an app.' },
    ],
  },
  checked: { 'x-2026': '2026-10-01' },
}
const llm10 = mockLlm([(q) => asJson({ 'x-2026.0.title_en': 'Raised $40M Series B', 'x-2026.0.detail_en': 'Led by X.', other: q.other })])
const tu = await translateUpdates(llm10, store, { log: quiet })
eq('updates: only missing fields requested', Object.keys(JSON.parse(llm10.calls[0].user.slice(llm10.calls[0].user.indexOf('{')))), ['x-2026.0.title_en', 'x-2026.0.detail_en'])
eq('updates: English written next to Korean', [tu.count, store.updates['x-2026'][0].title_en, store.updates['x-2026'][0].detail_en, store.updates['x-2026'][1].title_en], [2, 'Raised $40M Series B', 'Led by X.', 'App launch'])
const llm11 = mockLlm([])
eq('updates: nothing missing → no call', [(await translateUpdates(llm11, store)).count, llm11.calls.length], [0, 0])

console.log(fails ? `${fails} FAILED` : 'ALL PASS')
process.exit(fails ? 1 : 0)

// Guard tests for "그때 그 회사" follow-ups. Mock LLM and mock fetch: no network.
// Run: npm run test:followups
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { applyResult, dateAfter, emptyStore, researchFollowup, runFollowups, selectTargets, vetEvents } from './lib/followups.mjs'
import { merge } from './lib/pipeline.mjs'

let fails = 0
const eq = (name, a, b) => { const ok = JSON.stringify(a) === JSON.stringify(b); if (!ok) fails++; console.log(ok ? 'ok  ' : 'FAIL', name, ok ? '' : `got ${JSON.stringify(a)} want ${JSON.stringify(b)}`) }

const TODAY = '2026-10-28'

// Mock fetch: /ok pages answer 200, /wall pages 403 (bot wall), everything else 404.
let fetched = []
const fetchImpl = async (url) => {
  fetched.push(url)
  const status = /\/ok/.test(url) ? 200 : /\/wall/.test(url) ? 403 : 404
  return { status, body: { cancel: async () => {} } }
}

/* ---------- retention ---------- */
const issues = ['2026-04-15', '2026-04-16', '2026-10-27'].map((d, i) => ({ id: `c${i}`, date: d, name_en: `Company ${i}`, website: `https://c${i}.io` }))
eq('merge keeps every issue by default', merge(issues, [], undefined).length, 3)
eq('merge keeps every issue with 0', merge(issues, [], 0).length, 3)
eq('merge keeps N newest with N > 0', merge(issues, [], 2).map((s) => s.date), ['2026-10-27', '2026-04-16'])

/* ---------- dates ---------- */
eq('day after intro passes', dateAfter('2026-04-16', '2026-04-15', TODAY), true)
eq('same day as intro fails', dateAfter('2026-04-15', '2026-04-15', TODAY), false)
eq('before intro fails', dateAfter('2026-03-01', '2026-04-15', TODAY), false)
eq('future fails', dateAfter('2026-11-30', '2026-04-15', TODAY), false)
eq('month-only, same month fails', dateAfter('2026-04', '2026-04-15', TODAY), false)
eq('month-only, later month passes', dateAfter('2026-05', '2026-04-15', TODAY), true)
eq('junk fails', dateAfter('last spring', '2026-04-15', TODAY), false)

/* ---------- target selection ---------- */
const recs = [
  { id: 'old-a', date: '2026-04-15', name_en: 'Old A' },
  { id: 'old-b', date: '2026-04-16', name_en: 'Old B' },
  { id: 'old-c', date: '2026-04-17', name_en: 'Old C' },
  { id: 'acquired', date: '2026-04-14', name_en: 'Bought' }, // corrections: 인수 완료
  { id: 'closed', date: '2026-04-14', name_en: 'Gone' }, // corrections: 운영 중단
  { id: 'restructured', date: '2026-04-18', name_en: 'Still Going' }, // corrections: 구조조정 (not terminal)
  { id: 'listed-by-followup', date: '2026-04-14', name_en: 'Listed' }, // an earlier follow-up found an IPO
  { id: 'recent-check', date: '2026-04-10', name_en: 'Checked Lately' },
  { id: 'new', date: '2026-10-20', name_en: 'Too New' },
  { id: 'edge-89', date: '2026-07-31', name_en: '89 days' },
  { id: 'edge-90', date: '2026-07-30', name_en: '90 days' },
]
const corrections = {
  acquired: { status: '인수 완료' },
  closed: { status: '운영 중단' },
  restructured: { status: '구조조정' },
}
const store0 = {
  updates: { 'listed-by-followup': [{ date: '2026-06-01', kind: 'ipo', title_ko: '코스닥 상장', source_url: 'https://x.com/ok/1' }] },
  checked: { 'recent-check': '2026-09-01', 'old-c': '2026-07-01' },
}
const sel = selectTargets(recs, { store: store0, corrections, today: TODAY })
eq('due excludes terminal, recent check, too new', sel.due.map((r) => r.id).sort(), ['edge-90', 'old-a', 'old-b', 'old-c', 'restructured'].sort())
eq('two a day, oldest first', sel.targets.map((r) => r.id), ['old-a', 'old-b'])
eq('older last check goes first', selectTargets(recs, { store: { updates: store0.updates, checked: { ...store0.checked, 'old-a': '2026-07-20', 'old-b': '2026-07-20' } }, corrections, today: TODAY }).targets.map((r) => r.id), ['restructured', 'old-c'])
eq('limit respected', selectTargets(recs, { store: store0, corrections, today: TODAY, limit: 3 }).targets.length, 3)

/* ---------- vetting ---------- */
const subject = { id: 'old-a', date: '2026-04-15', name_en: 'Old A' }
const ev = (o) => ({ date: '2026-06-10', kind: 'funding', title_ko: '시리즈 B 4,000만 달러 유치', detail_ko: '리드 투자사는 X다.', source_url: 'https://news.example/ok/1', source_name: 'News', ...o })
fetched = []
const vet = await vetEvents([
  ev({}),
  ev({ source_url: 'https://news.example/dead/2', date: '2026-07-01', title_ko: '신제품 출시' }), // 404
  ev({ source_url: 'https://news.example/wall/3', date: '2026-07-02', kind: 'product', title_ko: '새 플랫폼 출시' }), // 403, not searched
  ev({ source_url: 'https://news.example/wall/4', date: '2026-07-03', kind: 'product', title_ko: '모바일 앱 출시' }), // 403, searched
  ev({ date: '2026-03-01', source_url: 'https://news.example/ok/5' }), // before intro
  ev({ date: '2026-04-15', source_url: 'https://news.example/ok/6' }), // same day as intro
  ev({ source_url: 'https://news.example/ok/1/', title_ko: '같은 기사 다른 제목' }), // duplicate url
  ev({ source_url: 'https://other.example/ok/7', title_ko: '같은 라운드 다른 기사' }), // duplicate (kind, date)
  ev({ kind: 'rumor', source_url: 'https://news.example/ok/8' }),
  ev({ title_ko: '시리즈 C 투자 유치 예정', date: '2026-08-01', source_url: 'https://news.example/ok/9' }), // speculative
  ev({ title_ko: 'Raised a large Series B round from investors', date: '2026-08-02', source_url: 'https://news.example/ok/10' }), // not Korean
  ev({ title_ko: '가'.repeat(41), date: '2026-08-03', source_url: 'https://news.example/ok/11' }), // too long
  ev({ source_url: 'https://news.example/', date: '2026-08-04', kind: 'ipo', title_ko: '나스닥 상장' }), // homepage
], subject, { searched: new Set(['news.example/wall/4']), today: TODAY, fetchImpl })
eq('kept: opened, searched bot wall', vet.events.map((e) => e.source_url), ['https://news.example/ok/1', 'https://news.example/wall/4'])
eq('dead link dropped', vet.dropped.some((d) => d.title === '신제품 출시' && /did not open \(404\)/.test(d.reason)), true)
eq('unsearched bot wall dropped', vet.dropped.some((d) => d.title === '새 플랫폼 출시'), true)
eq('pre-intro events dropped', vet.dropped.filter((d) => /not after/.test(d.reason)).length, 2)
eq('duplicates dropped', vet.dropped.filter((d) => d.reason === 'duplicate').length, 2)
eq('bad kind / speculative / English / long / homepage dropped', ['kind rumor', 'speculative wording', 'title missing, too long or not Korean', 'title missing, too long or not Korean', 'is not an article URL'].every((r) => vet.dropped.some((d) => d.reason.includes(r))), true)
eq('found stamped', vet.events[0].found, TODAY)
eq('event shape', Object.keys(vet.events[0]), ['date', 'kind', 'title_ko', 'detail_ko', 'source_url', 'source_name', 'found'])
eq('no link check for rule failures', fetched.length, 6)

const vet2 = await vetEvents([ev({}), ev({ source_url: 'https://news.example/ok/new', date: '2026-09-09', kind: 'product', title_ko: '신규 API 출시' })], subject, {
  today: TODAY, fetchImpl, existing: [{ ...ev({}), found: '2026-07-01' }],
})
eq('duplicate of a stored event dropped', vet2.events.map((e) => e.title_ko), ['신규 API 출시'])

/* ---------- research call + store ---------- */
const mockLlm = (reply, citations = []) => {
  const calls = []
  return {
    calls,
    models: ['m1', 'm2'],
    chat: async (opts) => {
      calls.push(opts)
      if (reply instanceof Error) throw reply
      return { text: reply, citations: citations.map((url) => ({ url })), model: 'deepseek/deepseek-v4-flash' }
    },
  }
}
const llmA = mockLlm('Here you go:\n```json\n' + JSON.stringify({ events: [ev({}), ev({ source_url: 'https://news.example/wall/x', date: '2026-07-07', kind: 'shutdown', title_ko: '서비스 종료' })] }) + '\n```', ['https://news.example/wall/x'])
const resA = await researchFollowup(llmA, subject, { today: TODAY, fetchImpl, deadline: Date.now() + 240_000 })
eq('one web call with the token cap', llmA.calls.map((c) => [c.web, c.maxTokens]), [[true, 16000]])
eq('citations make a bot-walled source count', resA.events.map((e) => e.kind), ['funding', 'shutdown'])
eq('prompt pins the intro date', llmA.calls[0].user.includes('AFTER 2026-04-15'), true)

const resEmpty = await researchFollowup(mockLlm('{"events": []}'), subject, { today: TODAY, fetchImpl })
eq('no events is ok', [resEmpty.ok, resEmpty.events.length], [true, 0])
const resFail = await researchFollowup(mockLlm(new Error('OpenRouter 500')), subject, { today: TODAY, fetchImpl })
eq('LLM failure is not ok', resFail.ok, false)
const resBroken = await researchFollowup(mockLlm('sorry, no json'), subject, { today: TODAY, fetchImpl })
eq('unparseable answer is not ok', resBroken.ok, false)
const resLate = await researchFollowup(mockLlm('{"events": []}'), subject, { today: TODAY, fetchImpl, deadline: Date.now() + 10_000 })
eq('no call when the budget is spent', [resLate.ok, resLate.error], [false, 'no time left'])

let st = applyResult(emptyStore(), 'old-a', resA, TODAY)
eq('checked updated with events', st.checked['old-a'], TODAY)
eq('events newest first', st.updates['old-a'].map((e) => e.date), ['2026-07-07', '2026-06-10'])
st = applyResult(st, 'old-b', resEmpty, TODAY)
eq('checked updated without events', [st.checked['old-b'], 'old-b' in st.updates], [TODAY, false])
st = applyResult(st, 'old-c', resFail, TODAY)
eq('failure leaves checked alone', 'old-c' in st.checked, false)
eq('shutdown found makes the company finished', selectTargets([{ id: 'old-a', date: '2026-01-01' }], { store: { ...st, checked: {} }, today: TODAY }).due.length, 0)

/* ---------- full run on temp files ---------- */
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'followups-'))
const updatesPath = path.join(dir, 'updates.json')
const correctionsPath = path.join(dir, 'corrections.json')
fs.writeFileSync(updatesPath, JSON.stringify(store0))
fs.writeFileSync(correctionsPath, JSON.stringify(corrections))
const quiet = () => {}

const dry = await runFollowups(null, recs, { updatesPath, correctionsPath, today: TODAY, dryRun: true, log: quiet })
eq('dry run lists targets without writing', [dry.targets.length, fs.readFileSync(updatesPath, 'utf-8')], [2, JSON.stringify(store0)])

const llmRun = mockLlm(JSON.stringify({ events: [ev({})] }))
const run1 = await runFollowups(llmRun, recs, { updatesPath, correctionsPath, today: TODAY, fetchImpl, log: quiet })
const saved = JSON.parse(fs.readFileSync(updatesPath, 'utf-8'))
eq('run researched two companies', llmRun.calls.length, 2)
eq('run saved checked for both', [saved.checked['old-a'], saved.checked['old-b']], [TODAY, TODAY])
eq('run saved events for both, kept the old ones', Object.keys(saved.updates).sort(), ['listed-by-followup', 'old-a', 'old-b'])
eq('next run moves on to the next companies', run1.due.length - 2, selectTargets(recs, { store: saved, corrections, today: TODAY }).due.length)

const llmIds = mockLlm(JSON.stringify({ events: [ev({})] }))
await runFollowups(llmIds, recs, { updatesPath, correctionsPath, today: TODAY, ids: ['old-a', 'missing'], fetchImpl, log: quiet })
const saved2 = JSON.parse(fs.readFileSync(updatesPath, 'utf-8'))
eq('--ids forces a recheck, duplicate event not stored twice', [llmIds.calls.length, saved2.updates['old-a'].length], [1, 1])
fs.rmSync(dir, { recursive: true, force: true })

console.log(fails ? `${fails} FAILED` : 'ALL PASS')
process.exit(fails ? 1 : 0)

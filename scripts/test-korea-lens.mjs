// Guard tests for the "한국에서는" pipeline. Mock LLM; link checks hit example.com / an invalid host.
// Run: node scripts/test-korea-lens.mjs
import { absoluteClaims, boundVerdict, buildKoreaLens, validate, buildIndex, unverifiedMentions } from './lib/korea-lens.mjs'
let fails = 0
const eq = (name, a, b) => { const ok = JSON.stringify(a) === JSON.stringify(b); if (!ok) fails++; console.log(ok ? 'ok  ' : 'FAIL', name, ok ? '' : `got ${JSON.stringify(a)} want ${JSON.stringify(b)}`) }

// verdict bounds
eq('3 players force crowded', boundVerdict('open', { players: 3, queries: 3, gaps: 'x' }), 'crowded')
eq('1 player forces emerging', boundVerdict('open', { players: 1, queries: 3, gaps: 'x' }), 'emerging')
eq('constrained survives players', boundVerdict('constrained', { players: 2, queries: 3, gaps: 'x' }), 'constrained')
eq('open needs 2 queries', boundVerdict('open', { players: 0, queries: 1, gaps: 'x' }), 'unclear')
eq('open needs gaps', boundVerdict('open', { players: 0, queries: 3, gaps: '' }), 'unclear')
eq('open ok with evidence', boundVerdict('open', { players: 0, queries: 3, gaps: 'x' }), 'open')
eq('crowded without players -> unclear', boundVerdict('crowded', { players: 0, queries: 3, gaps: 'x' }), 'unclear')
eq('junk verdict', boundVerdict('wow', { players: 0, queries: 3, gaps: 'x' }), 'unclear')

// absolute claims
const abs = (t) => absoluteClaims({ headline: t }).length > 0
eq('blocks 국내에는 없다', abs('국내에는 아직 같은 서비스가 없다'), true)
eq('blocks 전무', abs('국내 경쟁사는 전무하다'), true)
eq('blocks 유일한', abs('한국에서 유일한 플레이어'), true)
eq('allows hedged', abs('이번 조사에서는 한국 사업자가 확인되지 않았다'), false)
eq('allows 없이 (without)', abs('설치 없이 바로 쓸 수 있어 국내 도입이 쉽다'), false)
eq('ghost name caught', unverifiedMentions({ headline: '국내 MGA 인프라 스타트업, 디비아이엔씨 예스슈어 확인' }, ['DB Inc. (디비아이엔씨) — 예스슈어(Yes, Sure)', '디비아이엔씨 예스슈어']).length > 0, true)
eq('ghost name ignored when absent', unverifiedMentions({ headline: '국내 직접 후보 2곳' }, ['AIMS (에임스)']).length, 0)
eq('blocks 미개척', abs('AI 임베디드 보험 인프라, 한국 시장 미개척'), true)
eq('blocks 블루오션', abs('국내는 블루오션이다'), true)
eq('allows 공백 elsewhere', abs('개발 공백 기간을 줄인다'), false)

// full flow with mocked LLM + real link check (example.com is reachable, nope.invalid is not)
const good = 'https://example.com/'
const bad = 'https://nope.invalid/x'
let calls = 0
const llm = { chat: async ({ web, user }) => {
  calls++
  if (web) return { text: JSON.stringify({ queries_run: ['q1', 'q2'], similar: [
      { name: 'Alpha', country_ko: '미국', kind: 'company', relation: 'direct', fact: 'f', url: good },
      { name: 'Beta', country_ko: '일본', kind: 'product', relation: 'adjacent', fact: 'f', url: good },
      { name: 'Ghost', country_ko: '독일', kind: 'company', relation: 'direct', fact: 'f', url: bad } ],
    korean_players: [{ name: '가나다', relation: 'direct', what: 'w', url: good }, { name: '유령', what: 'w', url: bad }],
    regulation: { note: 'n', source_url: bad }, gaps: '대형 병원 시스템은 확인 못함' }), citations: [], model: 'm' }
  const bad1 = user.includes('rejected')
  return { model: 'anthropic/claude-haiku-5.5', citations: [], text: JSON.stringify({
    verdict: 'open', headline: bad1 ? '이번 조사에서는 확인된 곳이 적다' : '국내에는 경쟁사가 없다',
    similar: [{ name: 'Alpha', summary: '같은 점과 다른 점입니다.' }, { name: 'Beta', summary: '또 다른 요약입니다.' }, { name: 'Invented', summary: '지어낸 곳' }],
    market_note: '한국 시장은 병원 구매 구조가 다르다.', regulation_note: '의료기기 허가가 필요하다.',
    thesis: '한국에서는 병원 네트워크를 가진 팀이 유리하다. 허가 일정이 관건이다. 먼저 한 분야로 좁혀야 한다.',
    who: '병원 SI 업체', wedge: '건강검진센터', barriers: ['허가', '영업'], checks: ['a', 'b', 'c'] }) }
} }
const entry = await buildKoreaLens(llm, { name_en: 'Subject', tagline: 't', product: {}, category: [] }, { checkedAt: 'now', log: console.log })
eq('retry happened (2 writes + 1 research)', calls, 3)
eq('only verified/known similar kept', entry.similar.map((s) => s.name), ['Alpha', 'Beta'])
eq('unverifiable player dropped', entry.korea.players.map((p) => p.name), ['가나다'])
eq('1 direct player => emerging despite model open', entry.verdict, 'emerging')
eq('regulation kept as estimate when source dead', entry.korea.regulation, { note: '의료기기 허가가 필요하다.', source_url: null, estimate: true })
eq('index', buildIndex({ x: entry }).x, { v: 'emerging', n: ['Alpha', 'Beta', '가나다'] })
console.log(fails ? `${fails} FAILED` : 'ALL PASS')
process.exit(fails ? 1 : 0)

// Y Combinator lead source (scripts/lib/yc.mjs). No network. Run: npm run test:yc
import { batchOrder, pickYc, ycPlace, ycSector } from './lib/yc.mjs'

let fails = 0
const eq = (name, a, b) => { const ok = JSON.stringify(a) === JSON.stringify(b); if (!ok) fails++; console.log(ok ? 'ok  ' : 'FAIL', name, ok ? '' : `got ${JSON.stringify(a)} want ${JSON.stringify(b)}`) }

const C = (id, name, industry, subindustry, tags = [], extra = {}) => ({
  id, name, industry, subindustry, tags, status: 'Active', top_company: false, nonprofit: false,
  website: `https://${name.toLowerCase()}.com`, team_size: 3, batch: 'Fall 2026', one_liner: 'Does a thing.',
  all_locations: 'San Francisco, CA, USA', url: `https://www.ycombinator.com/companies/${name.toLowerCase()}`, ...extra,
})

eq('sectors from industry and tags', [
  C(1, 'A', 'Healthcare', 'Healthcare -> Therapeutics'),
  C(2, 'B', 'Industrials', 'Industrials -> Energy'),
  C(3, 'C', 'Industrials', 'Industrials -> Defense'),
  C(4, 'D', 'Industrials', 'Industrials -> Manufacturing and Robotics'),
  C(5, 'E', 'B2B', 'B2B -> Infrastructure'),
  C(6, 'F', 'B2B', 'B2B -> Legal', ['AI']),
  C(7, 'G', 'B2B', 'B2B', ['Generative AI']),
  C(8, 'H', 'Education', 'Education'),
  C(9, 'I', 'Fintech', 'Fintech -> Insurance'),
].map(ycSector), ['health', 'climate', 'mobility', 'robotics', 'infra', 'enterprise', 'ai', 'consumer', 'fintech'])

eq('place', ycPlace('Berlin, Germany; Remote'), { city: 'Berlin', country: 'Germany', country_ko: '독일' })
eq('batches sort newest first', ['Summer 2026', 'Fall 2026', 'Winter 2027', 'odd'].sort((a, b) => batchOrder(b) - batchOrder(a)), ['Winter 2027', 'Fall 2026', 'Summer 2026', 'odd'])

const all = [
  C(1, 'Alpha', 'Healthcare', 'Healthcare'), C(2, 'Beta', 'Healthcare', 'Healthcare'),
  C(3, 'Gamma', 'Fintech', 'Fintech'), C(4, 'Delta', 'B2B', 'B2B -> Legal'),
  C(5, 'Big', 'Fintech', 'Fintech', [], { top_company: true }),
  C(6, 'Gone', 'Fintech', 'Fintech', [], { status: 'Acquired' }),
  C(7, 'Large', 'Fintech', 'Fintech', [], { team_size: 80 }),
]
const sectors = ['health', 'fintech', 'enterprise']
const pick = (o) => pickYc(all, { date: '2026-11-06', sectors, ...o }).map((l) => l.name_en)

const two = pick({})
eq('two leads, different sectors', [two.length, new Set(two.map((n) => ycSector(all.find((c) => c.name === n)))).size], [2, 2])
eq('top, acquired, large teams never picked', [...Array(30)].flatMap((_, i) => pickYc(all, { date: `2026-12-${String(i + 1).padStart(2, '0')}`, sectors })).some((l) => ['Big', 'Gone', 'Large'].includes(l.name_en)), false)
eq('same date, same pick (input order does not matter)', pickYc([...all].reverse(), { date: '2026-11-06', sectors }).map((l) => l.name_en), two)
eq('published names skipped', pick({ existingNames: ['ALPHA', 'beta', 'Gamma', 'Delta'] }), [])
eq('only the generated sectors', pick({ sectors: ['enterprise'] }), ['Delta'])
const lead = pickYc(all, { date: '2026-11-06', sectors: ['fintech'] })[0]
eq('lead shape', [lead.country_ko, lead.company_stage, lead._sector, lead.why_now.startsWith('Y Combinator Fall 2026')], ['미국', 'Seed', 'fintech', true])

console.log(fails ? `\n${fails} failed` : '\nall passed')
process.exit(fails ? 1 : 0)

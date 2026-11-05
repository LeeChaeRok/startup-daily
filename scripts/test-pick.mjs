// "내 5곳" selection rule (src/lib/pick.js). No network. Run: npm run test:pick
import { followedPools, moreInMySectors, myKey, pickMine } from '../src/lib/pick.js'

let fails = 0
const eq = (name, a, b) => { const ok = JSON.stringify(a) === JSON.stringify(b); if (!ok) fails++; console.log(ok ? 'ok  ' : 'FAIL', name, ok ? '' : `got ${JSON.stringify(a)} want ${JSON.stringify(b)}`) }

const R = (id, sector, featured = false, attention = 3) => ({ id, sector, featured, attention })
const today = [
  R('f-ai', 'ai', true, 4), R('f-health', 'health', true, 5), R('f-fin', 'fintech', true, 3), R('f-cli', 'climate', true, 4), R('f-rob', 'robotics', true, 2),
  R('ai2', 'ai', false, 5), R('ai3', 'ai', false, 2), R('h2', 'health', false, 3), R('h3', 'health', false, 4), R('m1', 'mobility', false, 5),
]
const ids = (r) => r && { interest: r.interest.map((s) => s.id), discovery: r.discovery?.id ?? null }

eq('no interests → shared five', pickMine({ days: [today], interests: [] }), null)
eq('devtools maps to infra, order fixed', followedPools(['devtools', 'ai', 'zzz']), ['infra', 'ai'])

eq('two sectors take turns, featured first; discovery from the shared five', ids(pickMine({ days: [today], interests: ['health', 'ai'] })), {
  interest: ['f-health', 'f-ai', 'h3', 'ai2'],
  discovery: 'f-cli',
})
eq('deterministic', ids(pickMine({ days: [today], interests: ['ai', 'health'] })), ids(pickMine({ days: [[...today]], interests: ['health', 'ai'] })))

const read = new Set(['f-health', 'h3'])
eq('read ones skipped', ids(pickMine({ days: [today], interests: ['health'], isRead: (id) => read.has(id) })), {
  interest: ['h2', 'f-fin', 'f-cli', 'f-rob'],
  discovery: 'f-ai', // f-ai and f-cli tie on attention: the day file's order decides
})

const yesterday = [R('y-h', 'health', true, 3), R('y-h2', 'health', false, 1)]
eq('short today → yesterday, then the shared five', ids(pickMine({ days: [today, yesterday], interests: ['health'] })), {
  interest: ['f-health', 'h3', 'h2', 'y-h'],
  discovery: 'f-ai',
})

eq('mobility (not in the five) still gets its pool company', ids(pickMine({ days: [today], interests: ['mobility'] })).interest[0], 'm1')

const all = ['ai', 'health', 'fintech', 'climate', 'robotics', 'mobility', 'infra', 'enterprise', 'consumer']
const every = pickMine({ days: [today], interests: all })
eq('every sector followed → five interest picks, no discovery', [every.interest.length, every.discovery], [5, null])

eq('always five', pickMine({ days: [today], interests: ['consumer'] }).interest.length + 1, 5)
eq('more in my sectors', moreInMySectors({ today, interests: ['health'], shown: ['f-health', 'h3'] }), 1)

/* ---------- hidden sectors (_workspace/15) ---------- */
const sectorOf = new Map([...today, ...yesterday].map((s) => [s.id, s.sector]))
const sectorsIn = (r) => [...r.interest, r.discovery].filter(Boolean).map((s) => sectorOf.get(s.id))

const noAi = pickMine({ days: [today], interests: ['health'], muted: ['ai'] })
eq('hidden sector never in the share or as filler', sectorsIn(noAi).includes('ai'), false)
// f-ai and f-cli tie, f-ai comes first in the file; with ai hidden the find moves on
eq('find skips a hidden sector', ids(pickMine({ days: [today], interests: ['health', 'fintech'], muted: ['ai'] })).discovery, 'f-cli')

const narrowed = ['ai', 'infra', 'health', 'robotics', 'mobility', 'enterprise', 'consumer'] // fintech followed, climate left open
eq('narrowed: the find comes from the one open sector', ids(pickMine({ days: [today], interests: ['fintech'], muted: narrowed })).discovery, 'f-cli')
const climateYesterday = [R('y-c', 'climate', false, 2)]
eq('narrowed, open sector empty today → yesterday', ids(pickMine({ days: [today.filter((s) => s.sector !== 'climate'), climateYesterday], interests: ['fintech'], muted: narrowed })).discovery, 'y-c')

const allButHealth = ['ai', 'infra', 'climate', 'robotics', 'mobility', 'fintech', 'enterprise', 'consumer']
const onlyHealth = pickMine({ days: [today], interests: [], muted: allButHealth })
eq('only hidden, no interests: no find, all from the rest', [onlyHealth.discovery, [...new Set(sectorsIn(onlyHealth))]], [null, ['health']])
eq('fewer than five rather than a hidden one', onlyHealth.interest.length, 3)

eq('following wins over hiding', ids(pickMine({ days: [today], interests: ['health'], muted: ['health'] })).interest[0], 'f-health')
eq('deterministic in hidden order', ids(pickMine({ days: [today], interests: ['health'], muted: ['ai', 'climate'] })), ids(pickMine({ days: [today], interests: ['health'], muted: ['climate', 'ai'] })))
eq('key unchanged without hidden sectors', [myKey(['ai', 'health'], []), myKey(['health'], ['ai'])], [followedPools(['ai', 'health']).join(','), 'health|-ai'])
eq('hidden + read', ids(pickMine({ days: [today], interests: ['health'], muted: ['ai'], isRead: (id) => id === 'f-health' })).interest[0], 'h3')
eq('more in my sectors leaves hidden out', moreInMySectors({ today, interests: [], muted: allButHealth, shown: ['f-health'] }), 2)

console.log(fails ? `\n${fails} failed` : '\nall passed')
process.exit(fails ? 1 : 0)

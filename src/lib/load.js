import { initData, setDataFailed } from './data.js'
import { setLoadedMeta } from './update.js'

/* The issue data is fetched, not bundled (see vite.config.js). The first paint needs only
   the list fields (index.json, ~35 KB gzip; index.html preloads it); the full records
   (startups.json) follow in the background. A cold start straight into a company page
   (a shared link) waits for the full records instead. */
const getJSON = async (name) => {
  const res = await fetch(`/data/${name}`)
  if (!res.ok) throw new Error(`${name}: ${res.status}`)
  return res.json()
}

export async function loadData() {
  const full = window.location.hash.startsWith('#/s/')
  const [startups, corrections, lensIndex, meta, updates] = await Promise.all([
    getJSON(full ? 'startups.json' : 'index.json'),
    getJSON('corrections.json').catch(() => ({})),
    getJSON('korea-lens-index.json').catch(() => ({})),
    getJSON('meta.json').catch(() => null),
    getJSON('updates.json').catch(() => ({})),
  ])
  initData({ startups, corrections, lensIndex, updates: updates.updates, full })
  setLoadedMeta(meta)
  if (!full) {
    getJSON('startups.json').then(
      (all) => initData({ startups: all, corrections, lensIndex, updates: updates.updates, full: true }),
      setDataFailed,
    )
  }
}

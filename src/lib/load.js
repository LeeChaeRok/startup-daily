import { initData } from './data.js'
import { setLoadedMeta } from './update.js'

/* The issue data is fetched, not bundled (see vite.config.js). index.html preloads
   startups.json so the request starts before this module runs. */
const getJSON = async (name) => {
  const res = await fetch(`/data/${name}`)
  if (!res.ok) throw new Error(`${name}: ${res.status}`)
  return res.json()
}

export async function loadData() {
  const [startups, corrections, lensIndex, meta] = await Promise.all([
    getJSON('startups.json'),
    getJSON('corrections.json').catch(() => ({})),
    getJSON('korea-lens-index.json').catch(() => ({})),
    getJSON('meta.json').catch(() => null),
  ])
  initData({ startups, corrections, lensIndex })
  setLoadedMeta(meta)
}

import { initData, setDayLoader } from './data.js'
import { setLoadedMeta } from './update.js'
import { isEn } from './i18n.js'

/* The issue data is fetched, not bundled (see vite.config.js). The first paint needs only
   the list fields (index.json; index.html preloads it); a day's full records
   (days/<date>.json) are fetched when a company of that day is opened. */

/** ?preview=pool — the whole sector pool, before it is public (_workspace/14 §1-5). */
export const poolPreview = new URLSearchParams(window.location.search).get('preview') === 'pool'

// the English edition has its own copies of the company files (data/en/…), the preview its own (…/pool/…)
const companyBase = `${isEn ? 'en/' : ''}${poolPreview ? 'pool/' : ''}`
const getJSON = async (name) => {
  const res = await fetch(`/data/${name}`)
  if (!res.ok) throw new Error(`${name}: ${res.status}`)
  return res.json()
}

export async function loadData() {
  setDayLoader((date) => getJSON(`${companyBase}days/${date}.json`))
  const [startups, corrections, lensIndex, meta, updates] = await Promise.all([
    getJSON(`${companyBase}index.json`),
    getJSON('corrections.json').catch(() => ({})),
    getJSON('korea-lens-index.json').catch(() => ({})),
    getJSON('meta.json').catch(() => null),
    getJSON('updates.json').catch(() => ({})),
  ])
  initData({ startups, corrections, lensIndex, updates: updates.updates })
  setLoadedMeta(meta)
}

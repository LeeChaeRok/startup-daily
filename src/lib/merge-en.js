/**
 * English edition of a company record: the Korean record with the translated text from
 * startups.en.json laid over it (same shape, strings only). The Korean values the app
 * derives things from (sector, region, amounts) are kept under `_ko`, and name_ko
 * carries the English name so every "display name" spot shows English without a
 * second code path. Used at build time (vite.config.js).
 */
function overlay(base, tr) {
  if (tr == null) return base
  if (typeof tr === 'string') return typeof base === 'string' || base == null ? tr : base
  if (Array.isArray(base) && Array.isArray(tr)) return base.map((b, i) => overlay(b, tr[i]))
  if (base && typeof base === 'object' && typeof tr === 'object' && !Array.isArray(tr)) {
    const out = { ...base }
    for (const [k, v] of Object.entries(tr)) out[k] = k in base ? overlay(base[k], v) : v
    return out
  }
  return base
}

export function englishRecord(s, tr) {
  const _ko = {
    name_ko: s.name_ko,
    category: s.category,
    stage: s.company_stage,
    country_ko: s.headquarters?.country_ko,
    total_raised: s.funding?.total_raised,
  }
  // not translated yet: Korean text, but at least the English name
  if (!tr) return { ...s, name_ko: s.name_en || s.name_ko, _ko, _untranslated: true }
  const merged = overlay(s, tr)
  return { ...merged, name_ko: s.name_en || s.name_ko, _ko }
}

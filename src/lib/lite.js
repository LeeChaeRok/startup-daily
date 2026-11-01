/**
 * The list view of a company: what the issue list, explore, saved and search need.
 * Shipped as /data/index.json (about a tenth of the full records) so the first screen
 * can paint before a day's full records (/data/days/<date>.json) arrive. Used by vite.config.js at build time.
 */
export function liteRecord(s) {
  return {
    id: s.id,
    date: s.date,
    // false: a sector-pool company that is not in the day's shared five (_workspace/14)
    featured: s.featured !== false,
    sector: s.sector,
    name_ko: s.name_ko,
    name_en: s.name_en,
    tagline: s.tagline,
    category: s.category,
    headquarters: { country_ko: s.headquarters?.country_ko, city: s.headquarters?.city },
    company_stage: s.company_stage,
    website: s.website,
    logo_url: s.logo_url,
    founded_year: s.founded_year,
    employee_count: s.employee_count,
    funding: {
      total_raised: s.funding?.total_raised,
      total_raised_usd: s.funding?.total_raised_usd,
      // the "투자자라면 / 커리어로 보면" line (personal.js forRole)
      latest_round: s.funding?.latest_round && {
        stage: s.funding.latest_round.stage,
        amount: s.funding.latest_round.amount,
        date: s.funding.latest_round.date,
        lead_investor: s.funding.latest_round.lead_investor,
      },
    },
    founders: (s.founders || []).map((f) => ({ name_ko: f.name_ko, name_en: f.name_en })),
    competitive_landscape: {
      direct_competitors: (s.competitive_landscape?.direct_competitors || []).map((c) => ({ name: c.name })),
      key_differentiator: s.competitive_landscape?.key_differentiator,
    },
    // first key feature only: the "PM이라면" line
    product: s.product?.key_features?.length ? { key_features: s.product.key_features.slice(0, 1) } : undefined,
    trending_reason: { summary: s.trending_reason?.summary },
    editor_pick_comment: s.editor_pick_comment,
  }
}

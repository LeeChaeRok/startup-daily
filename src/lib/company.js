/* Small helpers shared by the company card, row and page. */

export const companyHref = (s, from) => `#/s/${s.id}${from ? `?from=${from}` : ''}`

/** The first sentence of "왜 지금" (a period that ends a sentence, not "$1.5M"). */
export function firstSentence(text = '') {
  const m = text.match(/^(.+?[.!?])(?=\s|$)/)
  return (m ? m[1] : text).trim()
}

/** "Summer 2026 · Fall 2026": the YC batches in a list. */
export const batchLine = (list) => [...new Set(list.map((s) => s.yc?.batch).filter(Boolean))].join(' · ')

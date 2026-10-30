/* Two languages, Korean (original) and English. The language is chosen once per page
   load: switching stores the choice and reloads, so every module (data, formatting,
   copy) reads one fixed value and nothing has to re-render on its own.

   Copy lives next to where it is used: L('저장', 'Save'). */
import { load, save } from './storage.js'

const KEY = 'sd_lang'
const fromUrl = () => new URLSearchParams(window.location.search).get('lang')
const guess = () => (/^ko\b/i.test(navigator.language || '') ? 'ko' : 'en')

function initial() {
  const url = fromUrl()
  if (url === 'ko' || url === 'en') {
    save(KEY, url)
    return url
  }
  const stored = load(KEY, null)
  return stored === 'ko' || stored === 'en' ? stored : guess()
}

/** 'ko' | 'en' for this page load. */
export const lang = initial()
export const isEn = lang === 'en'
document.documentElement.lang = lang

/** Pick the copy for the current language. */
export const L = (ko, en) => (isEn ? en : ko)

export function setLang(next) {
  if (next === lang) return
  save(KEY, next)
  // drop ?lang= so the stored choice wins from now on
  const url = new URL(window.location.href)
  url.searchParams.delete('lang')
  window.location.replace(url.href)
}

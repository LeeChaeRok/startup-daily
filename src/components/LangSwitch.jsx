import { L, lang, setLang } from '../lib/i18n.js'

const OPTIONS = [
  { key: 'ko', label: '한국어', htmlLang: 'ko' },
  { key: 'en', label: 'English', htmlLang: 'en' },
]

/** 한국어 | English segmented control (settings). Switching reloads the page. */
export default function LangSwitch({ labelledBy }) {
  return (
    <div
      className="segmented segmented--inline"
      role="group"
      aria-labelledby={labelledBy}
      aria-label={labelledBy ? undefined : L('언어', 'Language')}
    >
      {OPTIONS.map((o) => (
        <button
          key={o.key}
          type="button"
          lang={o.htmlLang}
          className="segmented__tab"
          aria-pressed={lang === o.key}
          onClick={() => setLang(o.key)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** Compact header toggle: shows the language you would switch to. */
export function LangToggle() {
  const next = lang === 'en' ? 'ko' : 'en'
  return (
    <button
      type="button"
      className="icon-btn lang-toggle"
      lang={next}
      aria-label={next === 'en' ? 'Read in English' : '한국어로 보기'}
      title={next === 'en' ? 'Read in English' : '한국어로 보기'}
      onClick={() => setLang(next)}
    >
      <span aria-hidden="true">{next === 'en' ? 'EN' : '한'}</span>
    </button>
  )
}

/** Inline text link for first-run screens: "Read in 한국어 / English". */
export function LangLink({ className = '' }) {
  return (
    <p className={`lang-link ${className}`}>
      <span aria-hidden="true">Read in </span>
      {OPTIONS.map((o, i) => (
        <span key={o.key}>
          {i > 0 && <span aria-hidden="true"> / </span>}
          {lang === o.key ? (
            <strong lang={o.htmlLang} aria-hidden="true">
              {o.label}
            </strong>
          ) : (
            <button
              type="button"
              className="text-btn"
              lang={o.htmlLang}
              aria-label={o.key === 'en' ? 'Read in English' : '한국어로 보기'}
              onClick={() => setLang(o.key)}
            >
              {o.label}
            </button>
          )}
        </span>
      ))}
    </p>
  )
}

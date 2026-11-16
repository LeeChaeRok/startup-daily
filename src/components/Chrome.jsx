/* App chrome (spec v2 §2-5, §3.1–3.2): the phone top bar, the bottom tabs, the desktop
   top navigation and the one-line footer. */
import { useEffect, useState } from 'react'
import Icon from './Icon.jsx'
import { byId } from '../lib/data.js'
import { navigate, useSaved } from '../lib/hooks.js'
import { isEn, L, setLang } from '../lib/i18n.js'

/** Bottom tabs = desktop nav, same order and names. Contests are Korean-only (hidden in English). */
export const TABS = [
  { key: 'today', href: '#/', label: L('오늘', 'Today'), icon: 'today' },
  { key: 'explore', href: '#/explore', label: L('탐색', 'Explore'), icon: 'explore' },
  !isEn && { key: 'contests', href: '#/contests', label: L('공모전', 'Contests'), icon: 'trophy' },
  { key: 'saved', href: '#/saved', label: L('저장', 'Saved'), icon: 'bookmark' },
].filter(Boolean)

function useScrolled(past = 8) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > past)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [past])
  return scrolled
}

/** Saved companies with news since we covered them: a dot on the 저장 tab. */
function useSavedNews() {
  const { saved } = useSaved()
  return saved.some((id) => byId(id)?._hasNews)
}

/** Tapping the tab you are on scrolls to the top; at the top it returns to the tab's first page (§8-3). */
function onTabClick(e, tab, active, atRoot) {
  if (!active) return
  e.preventDefault()
  if (window.scrollY > 4) window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  else if (!atRoot) navigate(tab.href)
}

export function Wordmark() {
  return (
    <a href="#/" className="wordmark" aria-label={L('Startup Daily, 오늘', 'Startup Daily, today')}>
      Startup Daily<span className="wordmark__dot" aria-hidden="true" />
    </a>
  )
}

/**
 * Phone top bar. Tab roots: wordmark + settings. Other screens: back, a title (optionally only
 * once the page heading has scrolled away) and the screen's own actions.
 */
export function TopBar({ back, title, titleVisible, actions, progress }) {
  const scrolled = useScrolled()
  // a page with its own heading: the bar's title shows once that heading has scrolled away
  const pastHeading = useScrolled(64)
  const showTitle = titleVisible ?? pastHeading
  return (
    <header className={`topbar ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="topbar__inner">
        {back ? (
          <button type="button" className="btn-icon topbar__back" onClick={back.onClick} aria-label={back.label}>
            <Icon name="back" size={24} />
          </button>
        ) : (
          <Wordmark />
        )}
        {back && (
          <span className={`topbar__title ${showTitle ? 'is-visible' : ''}`} aria-hidden={!showTitle}>
            {title}
          </span>
        )}
        <span className="topbar__spacer" />
        {actions ??
          (!back && (
            <a href="#/settings" className="btn-icon" aria-label={L('설정', 'Settings')}>
              <Icon name="settings" size={22} />
            </a>
          ))}
      </div>
      {progress}
    </header>
  )
}

export function TabBar({ section, atRoot }) {
  const news = useSavedNews()
  return (
    <nav className="tabbar" aria-label={L('주 메뉴', 'Main')}>
      {TABS.map((t) => {
        const active = section === t.key
        return (
          <a key={t.key} href={t.href} className="tabbar__tab" aria-current={active ? 'page' : undefined} onClick={(e) => onTabClick(e, t, active, atRoot)}>
            <span className="tabbar__icon">
              <Icon name={t.key === 'saved' && active ? 'bookmarkFill' : t.icon} size={24} strokeWidth={active ? 2.1 : 1.75} />
              {t.key === 'saved' && news && <span className="tabbar__dot" role="img" aria-label={L('새 소식', 'News')} />}
            </span>
            <span className="tabbar__label">{t.label}</span>
          </a>
        )
      })}
    </nav>
  )
}

export function DesktopNav({ section, atRoot, query = '' }) {
  const scrolled = useScrolled()
  const news = useSavedNews()
  return (
    <header className={`dnav ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="dnav__inner">
        <Wordmark />
        <nav className="dnav__tabs" aria-label={L('주 메뉴', 'Main')}>
          {TABS.map((t) => {
            const active = section === t.key
            return (
              <a key={t.key} href={t.href} className="dnav__tab" aria-current={active ? 'page' : undefined} onClick={(e) => onTabClick(e, t, active, atRoot)}>
                {t.label}
                {t.key === 'saved' && news && <span className="tabbar__dot tabbar__dot--inline" role="img" aria-label={L('새 소식', 'News')} />}
              </a>
            )
          })}
        </nav>
        <form
          key={query}
          className="dnav__search"
          role="search"
          onSubmit={(e) => {
            e.preventDefault()
            const q = new FormData(e.currentTarget).get('q')?.toString().trim()
            navigate(`/explore${q ? `?q=${encodeURIComponent(q)}` : ''}`)
          }}
        >
          <Icon name="explore" size={18} />
          <label className="sr-only" htmlFor="global-search">
            {L('회사·분야·투자사 검색', 'Search companies, sectors, investors')}
          </label>
          <input id="global-search" name="q" type="search" defaultValue={query} placeholder={L('회사·분야·투자사 검색', 'Search companies, sectors, investors')} autoComplete="off" />
        </form>
        <button type="button" className="dnav__lang" lang={isEn ? 'ko' : 'en'} onClick={() => setLang(isEn ? 'ko' : 'en')} aria-label={isEn ? '한국어로 보기' : 'Read in English'}>
          {isEn ? '한국어' : 'EN'}
        </button>
        <a href="#/settings" className="btn-icon" aria-label={L('설정', 'Settings')} aria-current={section === 'settings' ? 'page' : undefined}>
          <Icon name="settings" size={22} />
        </a>
      </div>
    </header>
  )
}

/** One quiet line: what this is, how long it has run, where to read more (spec v2 §5-12). */
export function FooterLine({ days }) {
  return (
    <footer className="footline">
      <p>
        {L('매일 아침 발행', 'Every morning')}
        {days ? (
          <>
            {' · '}
            <span className="num">{L(`${days}일째`, `day ${days}`)}</span>
          </>
        ) : null}
        {' · '}
        {L('AI가 공개 자료로 정리 · 투자 조언 아님', 'Written by AI from public sources · Not investment advice')}
      </p>
      <p className="footline__links">
        <a href="#/about">{L('소개·선정 기준', 'About')}</a>
        <a href="#/about?sec=corrections">{L('정정 기록', 'Corrections')}</a>
        <button type="button" className="linkbtn" lang={isEn ? 'ko' : 'en'} onClick={() => setLang(isEn ? 'ko' : 'en')}>
          {isEn ? '한국어' : 'English'}
        </button>
      </p>
    </footer>
  )
}

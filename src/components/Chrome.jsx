import { useEffect, useState } from 'react'
import Icon from './Icon.jsx'
import { LangToggle } from './LangSwitch.jsx'
import { navigate, useSaved, useTheme } from '../lib/hooks.js'
import { L } from '../lib/i18n.js'

const THEME_NEXT = { system: 'light', light: 'dark', dark: 'system' }
const THEME_LABEL = {
  system: L('시스템 테마', 'System theme'),
  light: L('라이트 테마', 'Light theme'),
  dark: L('다크 테마', 'Dark theme'),
}

export function ThemeButton() {
  const [theme, setTheme] = useTheme()
  const icon = theme === 'dark' ? 'moon' : theme === 'light' ? 'sun' : 'monitor'
  return (
    <button
      type="button"
      className="icon-btn"
      onClick={() => setTheme(THEME_NEXT[theme])}
      aria-label={L(`테마: ${THEME_LABEL[theme]} (눌러서 변경)`, `Theme: ${THEME_LABEL[theme]} (tap to change)`)}
      title={THEME_LABEL[theme]}
    >
      <Icon name={icon} />
    </button>
  )
}

function Wordmark() {
  return (
    <a href="#/" className="wordmark" aria-label={L('Startup Daily 최신 호', 'Startup Daily, latest issue')}>
      Startup Daily<span className="wordmark__dot" aria-hidden="true" />
    </a>
  )
}

const NAV = [
  { key: 'issue', href: '#/', label: L('최신 호', 'Latest'), icon: 'today' },
  { key: 'explore', href: '#/explore', label: L('탐색', 'Explore'), icon: 'explore' },
  { key: 'saved', href: '#/saved', label: L('저장', 'Saved'), icon: 'bookmark' },
]

/**
 * Sticky top bar. On mobile detail pages it becomes a back bar whose title
 * fades in once the hero has scrolled away.
 */
export function AppHeader({ section, back, title, desktop }) {
  const [scrolled, setScrolled] = useState(false)
  const { saved } = useSaved()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (desktop) {
    return (
      <header className={`appbar appbar--desktop ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="appbar__inner">
          <Wordmark />
          <nav className="topnav" aria-label={L('주 메뉴', 'Main')}>
            {[...NAV, { key: 'about', href: '#/about', label: L('소개', 'About') }].map((n) => (
              <a key={n.key} href={n.href} className="topnav__link" aria-current={section === n.key ? 'page' : undefined}>
                {n.label}
                {n.key === 'saved' && saved.length > 0 && <span className="topnav__count mono">{saved.length}</span>}
              </a>
            ))}
          </nav>
          <form
            className="appbar__search"
            role="search"
            onSubmit={(e) => {
              e.preventDefault()
              const q = new FormData(e.currentTarget).get('q')?.toString().trim()
              navigate(`/explore${q ? `?q=${encodeURIComponent(q)}` : ''}`)
            }}
          >
            <Icon name="explore" size={18} />
            <label className="sr-only" htmlFor="global-search">
              {L('회사, 분야, 창업자 검색', 'Search companies, sectors, founders')}
            </label>
            <input id="global-search" name="q" type="search" placeholder={L('회사·분야·창업자 검색', 'Search companies, sectors, founders')} autoComplete="off" />
          </form>
          <LangToggle />
          <ThemeButton />
        </div>
      </header>
    )
  }

  return (
    <header className={`appbar ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="appbar__inner">
        {back ? (
          <>
            <button type="button" className="icon-btn" onClick={back.onClick} aria-label={back.label}>
              <Icon name="back" />
            </button>
            <span className={`appbar__title ${title?.visible ? 'is-visible' : ''}`} aria-hidden={!title?.visible}>
              {title?.text}
            </span>
          </>
        ) : (
          <Wordmark />
        )}
        <span className="appbar__spacer" />
        {!back && (
          <a href="#/explore?focus=1" className="icon-btn" aria-label={L('검색', 'Search')}>
            <Icon name="explore" />
          </a>
        )}
        <LangToggle />
        <ThemeButton />
      </div>
    </header>
  )
}

export function TabBar({ section }) {
  const { saved } = useSaved()
  return (
    <nav className="tabbar" aria-label={L('주 메뉴', 'Main')}>
      {NAV.map((n) => (
        <a key={n.key} href={n.href} className="tabbar__tab" aria-current={section === n.key ? 'page' : undefined}>
          <span className="tabbar__icon">
            <Icon name={n.icon} size={24} />
            {n.key === 'saved' && saved.length > 0 && <span className="tabbar__dot" aria-hidden="true" />}
          </span>
          <span className="tabbar__label">
            {n.label}
            {n.key === 'saved' && saved.length > 0 && <span className="sr-only">{L(`, ${saved.length}개`, `, ${saved.length}`)}</span>}
          </span>
        </a>
      ))}
    </nav>
  )
}

export function Footer() {
  return (
    <footer className="footer">
      <nav className="footer__links" aria-label={L('사이트 정보', 'Site info')}>
        <a href="#/about">{L('소개·선정 기준', 'About and how we pick')}</a>
        <a href="#/settings">{L('설정', 'Settings')}</a>
        <a href="#/about?sec=corrections">{L('정정 기록', 'Corrections log')}</a>
        <a href="#/about?sec=how">{L('투자 조언 아님', 'Not investment advice')}</a>
      </nav>
    </footer>
  )
}

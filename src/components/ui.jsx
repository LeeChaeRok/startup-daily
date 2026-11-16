/* Shared parts of the v2 system (spec _workspace/v2/02_visual-designer_system.md §3):
   section header, chips, segmented control, badges, empty state, skeleton, save button. */
import Icon from './Icon.jsx'
import { useToast } from './toast-context.js'
import { useSaved } from '../lib/hooks.js'
import { L } from '../lib/i18n.js'

/** The one section header: title, optional note, optional link on the right. */
export function SectionHeader({ id, title, note, more, moreHref, onMore, level = 2 }) {
  const H = `h${level}`
  return (
    <div className="shead">
      <div className="shead__text">
        <H id={id} className="shead__title">
          {title}
        </H>
        {note && <p className="shead__note">{note}</p>}
      </div>
      {more &&
        (moreHref ? (
          <a className="shead__more" href={moreHref}>
            {more} <Icon name="chevronRight" size={16} />
          </a>
        ) : (
          <button type="button" className="shead__more" onClick={onMore}>
            {more} <Icon name="chevronRight" size={16} />
          </button>
        ))}
    </div>
  )
}

/** Page title block: eyebrow (optional, may be a button), title, one-line sub. */
export function PageTitle({ eyebrow, title, sub, children }) {
  return (
    <header className="ptitle">
      {eyebrow && <div className="ptitle__eyebrow">{eyebrow}</div>}
      <h1 className="ptitle__h" tabIndex={-1}>
        {title}
      </h1>
      {sub && <p className="ptitle__sub">{sub}</p>}
      {children}
    </header>
  )
}

export function Chip({ on = false, onClick, children, dot, count, icon, label, disabled }) {
  return (
    <button type="button" className={`chip ${on ? 'is-on' : ''}`} aria-pressed={on} onClick={onClick} aria-label={label} disabled={disabled}>
      {icon && <Icon name={icon} size={16} />}
      {dot && <span className="dot" style={{ '--dot': dot }} aria-hidden="true" />}
      {children}
      {count != null && <span className="chip__n num">{count}</span>}
    </button>
  )
}

/** One row of chips that scrolls sideways; never wraps to a second line. */
export function ChipRow({ children, label }) {
  return (
    <div className="chiprow" role="group" aria-label={label}>
      <div className="chiprow__track">{children}</div>
    </div>
  )
}

/** Wrapping chips inside a sheet (filter options). */
export function ChipWrap({ children, label }) {
  return (
    <div className="chipwrap" role="group" aria-label={label}>
      {children}
    </div>
  )
}

export function Segmented({ options, value, onChange, label }) {
  const i = Math.max(0, options.findIndex((o) => o.key === value))
  return (
    <div className="seg" role="group" aria-label={label} style={{ '--n': options.length, '--i': i }}>
      <span className="seg__pill" aria-hidden="true" />
      {options.map((o) => (
        <button key={o.key} type="button" aria-pressed={o.key === value} className="seg__tab" onClick={() => onChange(o.key)}>
          {o.label}
          {o.count != null && <span className="seg__n num">{o.count}</span>}
        </button>
      ))}
    </div>
  )
}

/** Sector dot + label (lists show the label in ink-2; the colour sits in the dot only). */
export function SectorLabel({ sector }) {
  return (
    <span className="sector">
      <span className="dot" style={{ '--dot': `var(--sd-sector-${sector.key})` }} aria-hidden="true" />
      {sector.label}
    </span>
  )
}

export function Badge({ children, tone = 'plain', title }) {
  return (
    <span className={`badge badge--${tone}`} title={title}>
      {children}
    </span>
  )
}

/** D-day badge for contests: 오늘 (filled), D-1~3 (soft warning), D-4+ (neutral), 마감. */
export function Dday({ n, closed = false }) {
  if (closed || n < 0) return <span className="dday dday--closed">{L('마감', 'Closed')}</span>
  const tone = n === 0 ? 'today' : n <= 3 ? 'soon' : 'plain'
  return <span className={`dday dday--${tone} num`}>{n === 0 ? L('오늘', 'Today') : `D-${n}`}</span>
}

export function EmptyState({ icon = 'info', title, children, action, level = 2, tone }) {
  const H = `h${level}`
  return (
    <div className={`empty ${tone === 'positive' ? 'empty--positive' : ''}`}>
      <span className="empty__icon" aria-hidden="true">
        <Icon name={icon} size={30} strokeWidth={1.75} />
      </span>
      <H className="empty__title" tabIndex={level === 1 ? -1 : undefined}>
        {title}
      </H>
      {children && <p className="empty__text">{children}</p>}
      {action && <div className="empty__action">{action}</div>}
    </div>
  )
}

/** Skeleton blocks shaped like the real layout. */
export function SkeletonCards({ n = 3 }) {
  return (
    <div className="skel" aria-busy="true" aria-label={L('불러오는 중', 'Loading')}>
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="skel__card">
          <span className="skel__logo" />
          <span className="skel__line" style={{ width: '58%' }} />
          <span className="skel__line" style={{ width: '92%' }} />
          <span className="skel__line" style={{ width: '74%' }} />
        </div>
      ))}
    </div>
  )
}

export function SkeletonRows({ n = 6 }) {
  return (
    <div className="group skel" aria-busy="true" aria-label={L('불러오는 중', 'Loading')}>
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="skel__row">
          <span className="skel__logo skel__logo--sm" />
          <span className="skel__lines">
            <span className="skel__line" style={{ width: '46%' }} />
            <span className="skel__line" style={{ width: '82%' }} />
          </span>
        </div>
      ))}
    </div>
  )
}

/** Bookmark for a company: fills on save, toast with undo. */
export function SaveButton({ startup, large = false }) {
  const { isSaved, toggle, saved, restore } = useSaved()
  const toast = useToast()
  const on = isSaved(startup.id)
  const name = startup.name_ko || startup.name_en
  const onClick = () => {
    const before = saved
    toggle(startup.id)
    toast(on ? L('저장을 취소했어요', 'Removed from saved') : L('저장했어요', 'Saved'), { label: L('되돌리기', 'Undo'), onClick: () => restore(before) })
  }
  return (
    <button
      type="button"
      className={`btn-icon save ${on ? 'is-on' : ''} ${large ? 'btn-icon--lg' : ''}`}
      aria-pressed={on}
      aria-label={on ? L(`${name} 저장 취소`, `Unsave ${name}`) : L(`${name} 저장`, `Save ${name}`)}
      onClick={onClick}
    >
      <Icon name={on ? 'bookmarkFill' : 'bookmark'} size={22} />
    </button>
  )
}

/** Overlapping logos (a day's companies in one line). */
export function LogoStack({ children }) {
  return (
    <span className="stack" aria-hidden="true">
      {children}
    </span>
  )
}

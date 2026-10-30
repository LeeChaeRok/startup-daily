import Icon from './Icon.jsx'
import { useReadLog, useSaved } from '../lib/hooks.js'
import { useToast } from './toast-context.js'
import { navigate } from '../lib/hooks.js'
import { L } from '../lib/i18n.js'

export function SectorLabel({ sector }) {
  return <span className="sector">{sector.label}</span>
}

export function StageBadge({ startup }) {
  return <span className="badge">{startup._stage}</span>
}

export function CorrectionBadge({ correction }) {
  if (!correction) return null
  return (
    <span className={`badge badge--warn ${correction.kind === 'note' ? 'badge--note' : ''}`}>
      {L('정정', 'Correction')} · {correction.status}
    </span>
  )
}

export function Tag({ children, tone = 'muted' }) {
  return <span className={`tag tag--${tone}`}>{children}</span>
}

/** Bullet-separated meta row; falsy items are skipped. */
export function Meta({ items, className = '' }) {
  const list = items.filter(Boolean)
  return (
    <span className={`meta ${className}`}>
      {list.map((item, i) => (
        <span key={i} className="meta__item">
          {item}
        </span>
      ))}
    </span>
  )
}

export function ProgressRing({ done, total, size = 22 }) {
  const r = (size - 4) / 2
  const c = 2 * Math.PI * r
  const pct = total ? done / total : 0
  return (
    <span className="progress">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} className="progress__track" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className={`progress__bar ${pct >= 1 ? 'is-done' : ''}`}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="progress__text">
        <span className="mono">{done}</span>/<span className="mono">{total}</span>
        <span className="sr-only">{L(' 읽음', ' read')}</span>
      </span>
    </span>
  )
}

export function SaveButton({ startup, variant = 'icon' }) {
  const { isSaved, toggle, saved, restore } = useSaved()
  const toast = useToast()
  const on = isSaved(startup.id)

  const onClick = () => {
    const before = saved
    toggle(startup.id)
    if (on) {
      toast(L('저장을 취소했어요', 'Removed from saved'), { label: L('되돌리기', 'Undo'), onClick: () => restore(before) })
    } else {
      toast(L('저장함에 담았어요', 'Saved'), { label: L('보기', 'View'), onClick: () => navigate('/saved') })
    }
  }

  const label = L(`${startup.name_ko || startup.name_en} 저장`, `Save ${startup.name_ko || startup.name_en}`)
  if (variant === 'label') {
    return (
      <button type="button" className={`btn btn--secondary save ${on ? 'is-on' : ''}`} aria-pressed={on} onClick={onClick}>
        <Icon name={on ? 'bookmarkFill' : 'bookmark'} className="save__icon" />
        {on ? L('저장됨', 'Saved') : L('저장', 'Save')}
      </button>
    )
  }
  return (
    <button
      type="button"
      className={`icon-btn save ${on ? 'is-on' : ''}`}
      aria-pressed={on}
      aria-label={label}
      onClick={onClick}
    >
      <Icon name={on ? 'bookmarkFill' : 'bookmark'} className="save__icon" />
    </button>
  )
}

/** "읽음" toggle — auto-tracking marks it, this lets the reader set it either way. */
export function ReadButton({ startup, variant = 'icon' }) {
  const { isRead, setRead } = useReadLog()
  const on = isRead(startup.id)
  const onClick = () => setRead([startup.id], !on)
  if (variant === 'label') {
    return (
      <button type="button" className={`btn btn--secondary readbtn ${on ? 'is-on' : ''}`} aria-pressed={on} onClick={onClick}>
        <Icon name="check" size={18} />
        {on ? L('읽음', 'Read') : L('읽음 표시', 'Mark as read')}
      </button>
    )
  }
  return (
    <button
      type="button"
      className={`icon-btn readbtn ${on ? 'is-on' : ''}`}
      aria-pressed={on}
      aria-label={L(`${startup.name_ko || startup.name_en} 읽음 표시`, `Mark ${startup.name_ko || startup.name_en} as read`)}
      onClick={onClick}
    >
      <Icon name="check" />
    </button>
  )
}

/** Mark a whole list read (or unread again), with undo. */
export function MarkAllRead({ list, label = L('이 호', 'this issue') }) {
  const { isRead, setRead, readLog, restoreRead } = useReadLog()
  const toast = useToast()
  if (!list.length) return null
  const allRead = list.every((s) => isRead(s.id))
  const onClick = () => {
    const before = readLog
    setRead(list.map((s) => s.id), !allRead)
    toast(
      allRead
        ? L(`${label}를 안 읽음으로 돌렸어요`, `Marked ${label} as unread`)
        : L(`${label}를 모두 읽음으로 표시했어요`, `Marked ${label} as read`),
      {
      label: L('되돌리기', 'Undo'),
      onClick: () => restoreRead(before),
      },
    )
  }
  return (
    <button type="button" className="text-btn mark-all" onClick={onClick}>
      <Icon name="check" size={16} /> {allRead ? L('모두 안 읽음으로', 'Mark all unread') : L('모두 읽음으로 표시', 'Mark all read')}
    </button>
  )
}

export function EmptyState({ icon, title, children, actions, level = 2 }) {
  const H = level === 1 ? 'h1' : 'h2'
  return (
    <div className="empty">
      <Icon name={icon} size={40} strokeWidth={1.5} className="empty__icon" />
      <H className="empty__title" tabIndex={level === 1 ? -1 : undefined}>
        {title}
      </H>
      {children && <p className="empty__text">{children}</p>}
      {actions && <div className="empty__actions">{actions}</div>}
    </div>
  )
}

export function AiNote({ compact = false }) {
  return (
    <p className={`ai-note ${compact ? 'ai-note--compact' : ''}`}>
      <Icon name="info" size={16} />
      <span>
        {L('AI가 공개 자료로 작성 · 발행일 기준 정보 · 투자 조언 아님 ·', 'Written by AI from public sources · Accurate as of publication · Not investment advice ·')}{' '}
        <a href="#/about?sec=how">{L('작성 방식과 선정 기준', 'How we write and pick')}</a>
      </span>
    </p>
  )
}

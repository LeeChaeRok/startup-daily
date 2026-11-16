/* The two shapes a company takes in a list (spec v2 §3.5, §3.6):
   CompanyCard — the day's five and the YC list, all the same format; a read card folds to one line.
   CompanyRow  — two lines everywhere else (explore, saved, blocks, the desktop context list). */
import Logo from './Logo.jsx'
import Icon from './Icon.jsx'
import { Badge } from './ui.jsx'
import { useReadLog } from '../lib/hooks.js'
import { pad2 } from '../lib/format.js'
import { companyHref, firstSentence } from '../lib/company.js'
import { L } from '../lib/i18n.js'


/** "$120M · Series B": the card's money line, or the correction when there is one. */
function MoneyLine({ startup: s }) {
  if (s._correction && s._correction.kind !== 'note') return <Badge tone="warning">{s._correction.status}</Badge>
  const parts = [s._raisedShort && { v: s._raisedShort, k: L('누적', 'raised') }, s._stage && s._stage !== '단계 미공개' && s._stage !== 'Stage undisclosed' && { v: s._stage }].filter(Boolean)
  if (!parts.length) return null
  return (
    <span className="card__money">
      {parts.map((p, i) => (
        <span key={i} className="card__fact">
          <span className="num">{p.v}</span>
          {p.k && <span className="card__factk">{p.k}</span>}
        </span>
      ))}
    </span>
  )
}

export function CompanyCard({ startup: s, rank, from, badge }) {
  const { isRead } = useReadLog()
  const read = isRead(s.id)
  const href = companyHref(s, from)
  if (read) {
    return (
      <li className="card card--folded">
        <a className="card__link" href={href}>
          {rank != null && <span className="card__rank num">{pad2(rank)}</span>}
          <Icon name="check" size={16} className="card__check" />
          <Logo startup={s} size={32} />
          <span className="card__foldtext">
            <span className="card__foldname">{s.name_ko || s.name_en}</span>
            <span className="card__foldtag">{s.tagline}</span>
          </span>
          <span className="sr-only">{L(', 읽음', ', read')}</span>
        </a>
      </li>
    )
  }
  const why = firstSentence(s.trending_reason?.summary)
  return (
    <li className="card">
      <a className="card__link" href={href}>
        <span className="card__head">
          <Logo startup={s} size={44} />
          <span className="card__id">
            <span className="card__name">
              {s.name_ko || s.name_en}
              {badge && <Badge>{badge}</Badge>}
            </span>
            <span className="card__meta">
              <span className="dot" style={{ '--dot': `var(--sd-sector-${s._sector.key})` }} aria-hidden="true" />
              {[s._sector.label, s.headquarters?.country_ko].filter(Boolean).join(' · ')}
            </span>
          </span>
          {rank != null && (
            <span className="card__rank num" aria-label={L(`${rank}번째`, `No. ${rank}`)}>
              {pad2(rank)}
            </span>
          )}
        </span>
        <span className="card__tagline">{s.tagline}</span>
        {why && (
          <span className="card__why">
            <span className="card__whyk">{L('왜 지금', 'Why now')}</span>
            <span className="card__whyv">{why}</span>
          </span>
        )}
        <MoneyLine startup={s} />
      </a>
    </li>
  )
}

/** Right-hand figure of a row: total raised, else the stage. */
function rowValue(s) {
  if (s._correction && s._correction.kind !== 'note') return null
  return s._raisedShort || (s._stage && !/미공개|undisclosed/i.test(s._stage) ? s._stage : null)
}

export function CompanyRow({ startup: s, from, selected = false, badge, sub, dot = false, value, onClick }) {
  const { isRead } = useReadLog()
  const read = isRead(s.id)
  const v = value === undefined ? rowValue(s) : value
  return (
    <li className={`row ${read ? 'is-read' : ''} ${selected ? 'is-selected' : ''}`}>
      <a className="row__link" href={companyHref(s, from)} aria-current={selected ? 'page' : undefined} onClick={onClick}>
        <Logo startup={s} size={44} />
        <span className="row__body">
          <span className="row__name">
            {s._hasNews && <span className="row__news" role="img" aria-label={L('새 소식', 'News')} />}
            <span className="row__nametext">{s.name_ko || s.name_en}</span>
            {badge && <Badge>{badge}</Badge>}
            {s._correction && s._correction.kind !== 'note' && <Badge tone="warning">{s._correction.status}</Badge>}
            {read && <Icon name="check" size={14} className="row__check" label={L('읽음', 'Read')} />}
          </span>
          <span className="row__sub">
            {dot && <span className="dot" style={{ '--dot': `var(--sd-sector-${s._sector.key})` }} aria-hidden="true" />}
            {sub ?? s.tagline}
          </span>
        </span>
        {v && <span className="row__value num">{v}</span>}
      </a>
    </li>
  )
}

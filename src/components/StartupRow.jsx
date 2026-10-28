import Logo from './Logo.jsx'
import Icon from './Icon.jsx'
import { CorrectionBadge, Meta, SaveButton } from './bits.jsx'
import { LENS_VERDICTS } from '../lib/data.js'
import { useReadLog } from '../lib/hooks.js'
import { monthDay, numClass, pad2 } from '../lib/format.js'

/**
 * One startup in a list. The whole row is a single link; the optional save
 * button sits beside it (never nested inside the link).
 *
 * rank     — show "01" in the leading column (issue lists)
 * showDate — show the issue date in the meta line (search, saved)
 * compact  — one-line tagline, smaller logo (desktop side list)
 */
export default function StartupRow({ startup: s, rank, showDate, compact, selected, reason, showSave, from }) {
  const { isRead } = useReadLog()
  const read = isRead(s.id)
  const href = `#/s/${s.id}${from ? `?from=${from}` : ''}`
  // The amount column is narrow: one currency per column ($, or 억 원 for Korean amounts).
  // The amount as written, with its notes, is on the detail page.
  const raised = s._raisedShort

  return (
    <li className={`row ${compact ? 'row--compact' : ''} ${read ? 'is-read' : ''} ${selected ? 'is-selected' : ''}`}>
      <a className="row__link" href={href} aria-current={selected ? 'page' : undefined}>
        {rank != null && (
          <span className="row__rank mono" aria-hidden={read ? 'true' : undefined}>
            {read ? <Icon name="check" size={16} /> : pad2(rank)}
          </span>
        )}
        <Logo startup={s} size={compact ? 32 : 40} />
        <span className="row__body">
          <span className="row__title">
            <span className="row__name">{s.name_ko || s.name_en}</span>
            {s.name_en && s.name_en !== s.name_ko && (
              <span className="row__en" lang="en">
                {s.name_en}
              </span>
            )}
          </span>
          <span className="row__tagline">{s.tagline}</span>
          {!compact && (
            <span className="row__meta">
              <Meta
                items={[
                  <span className="sector" key="s">{s._sector.label}</span>,
                  s._correction ? null : s._stage,
                  s.headquarters?.country_ko,
                  showDate ? `${monthDay(s.date)} 호` : null,
                ]}
              />
              <CorrectionBadge correction={s._correction} />
              {read && <span className="read-tag">읽음</span>}
              {LENS_VERDICTS[s._lens?.v]?.badge && <span className="badge badge--accent badge--flat">{LENS_VERDICTS[s._lens.v].badge}</span>}
            </span>
          )}
          {compact && s._correction && (
            <span className="row__meta">
              <CorrectionBadge correction={s._correction} />
            </span>
          )}
          {reason && <span className="row__reason">{reason}</span>}
          {read && compact && <span className="sr-only">, 읽음</span>}

        </span>
        <span className="row__num">
          {raised ? <span className={numClass(raised)}>{raised}</span> : <span className="row__na">미공개</span>}
          {!compact && <span className="row__numlabel">누적 투자</span>}
        </span>
      </a>
      {showSave && <SaveButton startup={s} />}
    </li>
  )
}

import Logo from './Logo.jsx'
import Icon from './Icon.jsx'
import { CorrectionBadge, Meta, SaveButton } from './bits.jsx'
import { LENS_VERDICTS } from '../lib/data.js'
import { useInterests, useReadLog } from '../lib/hooks.js'
import { monthDay, numClass, pad2 } from '../lib/format.js'
import { L } from '../lib/i18n.js'

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
  const { isInterest } = useInterests()
  const read = isRead(s.id)
  const hasNews = s._hasNews
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
            <span className="row__name">
              {s.name_ko || s.name_en}
              {hasNews && <span className="row__news" title={L('소개 이후 새 소식', 'News since we covered it')} />}
              {hasNews && <span className="sr-only">{L(' (새 소식)', ' (news)')}</span>}
            </span>
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
                  <span className={`sector ${isInterest(s._sector.key) ? 'is-interest' : ''}`} key="s">
                    {s._sector.label}
                    {isInterest(s._sector.key) && <span className="sr-only">{L(' (관심 분야)', ' (a sector you follow)')}</span>}
                  </span>,
                  s._correction ? null : s._stage,
                  s.headquarters?.country_ko,
                  showDate ? L(`${monthDay(s.date)} 호`, `${monthDay(s.date)} issue`) : null,
                ]}
              />
              <CorrectionBadge correction={s._correction} />
              {read && <span className="read-tag">{L('읽음', 'Read')}</span>}
              {LENS_VERDICTS[s._lens?.v]?.badge && <span className="badge badge--accent badge--flat">{LENS_VERDICTS[s._lens.v].badge}</span>}
            </span>
          )}
          {compact && s._correction && (
            <span className="row__meta">
              <CorrectionBadge correction={s._correction} />
            </span>
          )}
          {reason && <span className="row__reason">{reason}</span>}
          {read && compact && <span className="sr-only">{L(', 읽음', ', read')}</span>}

        </span>
        <span className="row__num">
          {raised ? <span className={numClass(raised)}>{raised}</span> : <span className="row__na">{L('미공개', 'Undisclosed')}</span>}
          {!compact && <span className="row__numlabel">{L('누적 투자', 'Total raised')}</span>}
        </span>
      </a>
      {showSave && <SaveButton startup={s} />}
    </li>
  )
}

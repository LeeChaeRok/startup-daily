import Logo from './Logo.jsx'
import Icon from './Icon.jsx'
import { UPDATE_KINDS, followUps } from '../lib/data.js'
import { dotDate, monthDay } from '../lib/format.js'

/** Detail page strip: what happened after we introduced the company (verified sources only). */
export function UpdateBanner({ startup: s }) {
  if (!s._updates?.length) return null
  return (
    <aside className="update-banner" aria-label="소개 이후 소식">
      <p className="update-banner__label">소개 이후 소식</p>
      <ul>
        {s._updates.slice(0, 3).map((u, i) => (
          <li key={i}>
            <span className="badge badge--accent badge--flat">{UPDATE_KINDS[u.kind] || '소식'}</span>{' '}
            <span className="mono">{dotDate(u.date)}</span> · {u.title_ko}{' '}
            {u.source_url && (
              <a href={u.source_url} target="_blank" rel="noopener noreferrer">
                {u.source_name || '출처'} <Icon name="external" size={12} />
              </a>
            )}
          </li>
        ))}
      </ul>
    </aside>
  )
}

/** Home section "그때 그 회사": companies we introduced earlier that have news since. */
export function FollowUpSection() {
  const list = followUps(2)
  if (!list.length) return null
  return (
    <section className="followups" aria-labelledby="followups-title">
      <div className="section-head section-head--plain">
        <h2 id="followups-title" className="section-head__title">
          그때 그 회사
        </h2>
      </div>
      {list.map((s) => {
        const u = s._updates[0]
        return (
          <a key={s.id} className="followup" href={`#/s/${s.id}`}>
            <Logo startup={s} size={36} />
            <span className="followup__body">
              <span className="followup__lead">
                {monthDay(s.date)}에 소개한 <strong>{s.name_ko}</strong>, 그 후
              </span>
              <span className="followup__news">
                <span className="badge badge--accent badge--flat">{UPDATE_KINDS[u.kind] || '소식'}</span> {u.title_ko}
              </span>
            </span>
            <Icon name="chevronRight" size={18} />
          </a>
        )
      })}
    </section>
  )
}

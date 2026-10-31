import { forRole, useRole } from '../lib/personal.js'
import { L } from '../lib/i18n.js'

/**
 * "투자자라면 · Series C 163억원 · 리드 …" — one existing fact picked for the reader's
 * role (personal.js forRole). Nothing at all when there is no role or no such fact.
 * variant: 'hero' (S1 hero, two lines at most) | 'detail' (under the summary, in full)
 */
export default function ForRoleLine({ startup, variant = 'hero' }) {
  const [role] = useRole()
  const line = forRole(startup, role)
  if (!line) return null
  return (
    <p className={`forrole forrole--${variant}`}>
      <span className="forrole__label">{line.label}</span>
      <span className="sr-only">{L(' 관점: ', ' perspective: ')}</span> <span className="forrole__text num">{line.text}</span>
    </p>
  )
}

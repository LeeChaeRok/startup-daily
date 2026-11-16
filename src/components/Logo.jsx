import { useState } from 'react'

/** First Latin letter of the English name, else the first syllable of the Korean name. */
function initial(s, name) {
  const en = (name || s?.name_en || '').match(/[A-Za-z0-9]/)
  if (en) return en[0].toUpperCase()
  const ko = (s?.name_ko || name || '').trim()
  return ko ? [...ko][0] : '?'
}

/**
 * Company mark (spec v2 §3.21). The monogram — the sector's soft tile with its letter — is
 * painted first; the saved logo (logo_url) covers it once it has loaded, and a failed image
 * simply leaves the monogram. Colour comes from the sector only, never from a hash.
 * person: a founder's initial on a neutral tile.
 */
export default function Logo({ startup, size = 44, person = false, name }) {
  const src = person ? null : startup?.logo_url || null
  const [state, setState] = useState('') // '' | 'full' | 'small' | 'failed'
  const sector = person ? 'other' : startup?._sector?.key || 'other'
  return (
    <span
      className={`logo ${person ? 'logo--person' : ''}`}
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.26),
        fontSize: Math.round(size * 0.42),
        '--mono-bg': `var(--sd-sector-${sector}-soft)`,
        '--mono-fg': `var(--sd-sector-${sector})`,
      }}
      aria-hidden="true"
    >
      <span className="logo__mono">{initial(startup, name)}</span>
      {src && state !== 'failed' && (
        <img
          className={`logo__img ${state === 'full' || state === 'small' ? 'is-loaded' : ''} ${state === 'small' ? 'is-small' : ''}`}
          src={src}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          onLoad={(e) => {
            const w = e.currentTarget.naturalWidth
            setState(src.endsWith('.svg') || w >= 64 ? 'full' : w >= 24 ? 'small' : 'failed')
          }}
          onError={() => setState('failed')}
        />
      )}
    </span>
  )
}

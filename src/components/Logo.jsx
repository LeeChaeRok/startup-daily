import { useState } from 'react'

// djb2 over the lowercased name → one of 7 muted paper tones (8th is reserved for people).
function monoIndex(text = '') {
  let h = 5381
  for (const c of text.toLowerCase().replace(/\s+/g, '')) h = ((h << 5) + h + c.charCodeAt(0)) >>> 0
  return h % 7
}

function initials(name = '') {
  const words = name.replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0][0].toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

/**
 * Company mark. The monogram is always painted first; a logo image (explicit
 * logo_url, else the site's favicon via Google s2) covers it only once it has
 * loaded at a usable size, so a blank tile never shows.
 */
export default function Logo({ startup, size = 40, person = false, name }) {
  const label = name || startup?.name_en || startup?.name_ko || ''
  const src = person
    ? null
    : startup?.logo_url ||
      (startup?._domain ? `https://www.google.com/s2/favicons?domain=${startup._domain}&sz=128` : null)
  const [loaded, setLoaded] = useState(false)
  const idx = person ? 7 : monoIndex(label)
  const text = initials(label)

  return (
    <span
      className={`logo ${size >= 56 ? 'logo--lg' : ''}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * (text.length > 1 ? 0.36 : 0.44)),
        '--mono-bg': `var(--sd-mono-${idx}-bg)`,
        '--mono-fg': `var(--sd-mono-${idx}-fg)`,
      }}
      aria-hidden="true"
    >
      <span className="logo__mono">{text}</span>
      {src && (
        <img
          className={`logo__img ${loaded ? 'is-loaded' : ''}`}
          src={src}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={(e) => setLoaded(e.currentTarget.naturalWidth >= 48)}
        />
      )}
    </span>
  )
}

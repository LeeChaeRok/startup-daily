const catColors = {
  'AI': '#7c3aed', 'FinTech': '#059669', 'HealthTech': '#e11d48',
  'CleanTech': '#65a30d', 'SaaS': '#0284c7', 'Web3': '#ea580c',
  'RegTech': '#7c3aed', 'AI Infrastructure': '#6366f1',
  'DevTools': '#0891b2', 'MarketTech': '#d946ef',
  'BioTech': '#059669', 'Industrial Tech': '#475569',
  'Identity': '#8b5cf6', 'Sustainability': '#16a34a',
  'FoodTech': '#ea580c', 'Neurotech': '#e11d48',
  'Wearable': '#f59e0b', 'Robotics': '#64748b',
  'AgTech': '#65a30d', 'HardTech': '#475569',
  'Hospitality Tech': '#d946ef', 'EdTech': '#0284c7',
  'SpaceTech': '#1e40af',
}

function getLogoUrl(startup) {
  if (startup.logo_url) return startup.logo_url
  if (startup.website) {
    try {
      const domain = new URL(startup.website).hostname.replace('www.', '')
      return `https://logo.clearbit.com/${domain}?size=200`
    } catch { /* */ }
  }
  return null
}

export default function CoverSlide({ startup, accent }) {
  const logoUrl = getLogoUrl(startup)

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', justifyContent: 'center',
      alignItems: 'center', textAlign: 'center', padding: '32px 24px',
      minHeight: '100%', gap: 16,
      background: `linear-gradient(160deg, ${accent}12, ${accent}06, #fff)`,
    }}>
      {/* Logo */}
      {logoUrl ? (
        <div style={{
          width: 72, height: 72, borderRadius: 18,
          background: '#fff', border: '1px solid rgba(0,0,0,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', padding: 8,
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        }}>
          <img src={logoUrl} alt={startup.name_en}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            onError={(e) => { e.target.style.display = 'none' }}
          />
        </div>
      ) : (
        <div style={{
          width: 72, height: 72, borderRadius: 18,
          background: `linear-gradient(135deg, ${accent}, ${accent}bb)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, fontWeight: 800, color: '#fff',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
        }}>
          {startup.name_en.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase()}
        </div>
      )}

      {/* Name */}
      <div>
        <h2 style={{
          fontSize: 24, fontWeight: 800, color: '#1a1a2e',
          fontFamily: "'Playfair Display', serif", lineHeight: 1.2,
          letterSpacing: -0.5,
        }}>
          {startup.name_en}
        </h2>
        {startup.name_ko && (
          <div style={{ fontSize: 14, color: '#888', marginTop: 2 }}>{startup.name_ko}</div>
        )}
      </div>

      {/* Tagline */}
      <p style={{ fontSize: 14, color: '#555', lineHeight: 1.5, maxWidth: 300 }}>
        {startup.tagline}
      </p>

      {/* Badges */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, justifyContent: 'center' }}>
        {startup.category.map((c) => (
          <span key={c} style={{
            fontSize: 11, fontWeight: 700, color: '#fff',
            background: catColors[c] || accent,
            padding: '3px 10px', borderRadius: 99,
          }}>{c}</span>
        ))}
        <span style={{
          fontSize: 11, fontWeight: 600, color: '#2563eb',
          background: '#eff6ff', padding: '3px 10px', borderRadius: 99,
        }}>{startup.company_stage}</span>
      </div>

      {/* Meta */}
      <div style={{
        display: 'flex', gap: 16, fontSize: 12, color: '#888',
        flexWrap: 'wrap', justifyContent: 'center',
      }}>
        <span>📍 {startup.headquarters?.city}</span>
        <span>🗓 {startup.founded_year}</span>
        <span>👥 {startup.employee_count}</span>
      </div>

      {/* Funding highlight */}
      {startup.funding?.total_raised && (
        <div style={{
          marginTop: 4, padding: '10px 20px', borderRadius: 14,
          background: '#fff', border: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}>
          <div style={{ fontSize: 11, color: '#888', fontWeight: 600 }}>Total Raised</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: accent }}>{startup.funding.total_raised}</div>
        </div>
      )}

      {/* Swipe hint */}
      <div style={{ fontSize: 11, color: '#bbb', marginTop: 8, letterSpacing: 0.5 }}>
        swipe to explore →
      </div>
    </div>
  )
}

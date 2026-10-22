export default function MarketSlide({ startup, accent }) {
  const mo = startup.market_outlook
  if (!mo) return null

  return (
    <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 14, minHeight: '100%' }}>
      <div style={{
        fontSize: 11, fontWeight: 700, color: accent,
        textTransform: 'uppercase', letterSpacing: 1.5,
      }}>Market</div>

      {/* TAM */}
      {mo.tam_sam_som && (
        <div style={{
          padding: '12px 14px', borderRadius: 12,
          background: '#f8f8fa', border: '1px solid rgba(0,0,0,0.04)',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#555', marginBottom: 4 }}>Market Size</div>
          <p style={{ fontSize: 13, color: '#333', lineHeight: 1.5, margin: 0 }}>{mo.tam_sam_som}</p>
        </div>
      )}

      {mo.market_trend && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 4 }}>Trends</div>
          <p style={{ fontSize: 13, color: '#444', lineHeight: 1.6, margin: 0 }}>{mo.market_trend}</p>
        </div>
      )}

      {mo.growth_potential && (
        <div style={{
          padding: '12px 14px', borderRadius: 12,
          background: '#f0fdf4', border: '1px solid #bbf7d0',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#059669', marginBottom: 4 }}>Growth Potential</div>
          <p style={{ fontSize: 13, color: '#333', lineHeight: 1.5, margin: 0 }}>{mo.growth_potential}</p>
        </div>
      )}

      {/* Risks */}
      {mo.risks?.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#dc2626' }}>Risks</div>
          {mo.risks.map((r, i) => (
            <div key={i} style={{
              fontSize: 12, color: '#555', lineHeight: 1.4,
              padding: '8px 12px', borderRadius: 8,
              background: '#fef2f2', border: '1px solid #fecaca',
              display: 'flex', gap: 8, alignItems: 'flex-start',
            }}>
              <span style={{ color: '#ef4444', flexShrink: 0, fontSize: 11 }}>⚠</span>
              {r}
            </div>
          ))}
        </div>
      )}

      {mo.risk_mitigation && (
        <div style={{
          padding: '10px 14px', borderRadius: 10,
          background: '#f0fdf4', border: '1px solid #bbf7d0',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#059669', marginBottom: 4 }}>Mitigation</div>
          <p style={{ fontSize: 12, color: '#555', lineHeight: 1.5, margin: 0 }}>{mo.risk_mitigation}</p>
        </div>
      )}

      {/* Editor pick */}
      {startup.editor_pick_comment && (
        <div style={{
          padding: '12px 14px', borderRadius: 12, marginTop: 4,
          background: `${accent}06`, borderLeft: `3px solid ${accent}`,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: accent, marginBottom: 3, letterSpacing: 1 }}>
            EDITOR'S PICK
          </div>
          <p style={{ fontSize: 12, color: '#555', fontStyle: 'italic', lineHeight: 1.5, margin: 0 }}>
            "{startup.editor_pick_comment}"
          </p>
        </div>
      )}

      {/* Links */}
      {startup.related_links?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
          {startup.related_links.map((link, i) => (
            <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
              style={{
                fontSize: 11, fontWeight: 600, color: accent,
                background: `${accent}10`, border: `1px solid ${accent}20`,
                padding: '4px 12px', borderRadius: 99, textDecoration: 'none',
              }}>
              {link.label} ↗
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

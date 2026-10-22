export default function CompetitionSlide({ startup, accent }) {
  const cl = startup.competitive_landscape
  if (!cl) return null

  return (
    <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 14, minHeight: '100%' }}>
      <div style={{
        fontSize: 11, fontWeight: 700, color: accent,
        textTransform: 'uppercase', letterSpacing: 1.5,
      }}>Competition</div>

      {/* Competitors */}
      {cl.direct_competitors?.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {cl.direct_competitors.map((c, i) => (
            <div key={i} style={{
              padding: '12px 14px', borderRadius: 12,
              background: '#f8f8fa', border: '1px solid rgba(0,0,0,0.04)',
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#333', marginBottom: 4 }}>
                vs. {c.name}
              </div>
              <div style={{ fontSize: 12, color: '#666', lineHeight: 1.5 }}>{c.comparison}</div>
            </div>
          ))}
        </div>
      )}

      {/* Differentiator */}
      {cl.key_differentiator && (
        <div style={{
          padding: '12px 14px', borderRadius: 12,
          background: `${accent}08`, borderLeft: `3px solid ${accent}`,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: accent, marginBottom: 4 }}>Key Differentiator</div>
          <p style={{ fontSize: 13, color: '#333', lineHeight: 1.5, margin: 0 }}>{cl.key_differentiator}</p>
        </div>
      )}

      {/* Moat */}
      {cl.moat && (
        <div style={{
          padding: '12px 14px', borderRadius: 12,
          background: '#fffbeb', border: '1px solid #fde68a',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#d97706', marginBottom: 4 }}>Moat</div>
          <p style={{ fontSize: 13, color: '#555', lineHeight: 1.5, margin: 0 }}>{cl.moat}</p>
        </div>
      )}

      {/* Position */}
      {cl.competitive_position_summary && (
        <p style={{
          fontSize: 13, color: '#666', fontStyle: 'italic', lineHeight: 1.5,
          padding: '8px 0', borderTop: '1px solid rgba(0,0,0,0.04)', margin: 0,
        }}>
          {cl.competitive_position_summary}
        </p>
      )}
    </div>
  )
}

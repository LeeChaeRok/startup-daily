export default function TeamSlide({ startup, accent }) {
  const founders = startup.founders
  if (!founders?.length) return null

  return (
    <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 14, minHeight: '100%' }}>
      <div style={{
        fontSize: 11, fontWeight: 700, color: accent,
        textTransform: 'uppercase', letterSpacing: 1.5,
      }}>Team</div>

      {founders.map((f, i) => (
        <div key={i} style={{
          display: 'flex', gap: 12, alignItems: 'flex-start',
          padding: '14px', borderRadius: 14,
          background: '#f8f8fa', border: '1px solid rgba(0,0,0,0.04)',
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: `linear-gradient(135deg, ${accent}30, ${accent}60)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15, fontWeight: 700, color: accent, flexShrink: 0,
          }}>
            {f.name_en ? f.name_en[0].toUpperCase() : '?'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#333' }}>
              {f.name_ko || f.name_en}
              {f.name_ko && f.name_en && (
                <span style={{ fontSize: 11, color: '#999', marginLeft: 5 }}>({f.name_en})</span>
              )}
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: accent, marginTop: 1 }}>{f.role}</div>
            {f.background && (
              <div style={{ fontSize: 12, color: '#666', marginTop: 4, lineHeight: 1.4 }}>{f.background}</div>
            )}
            {f.notable_achievement && (
              <div style={{
                fontSize: 11, color: '#d97706', background: '#fffbeb',
                padding: '3px 8px', borderRadius: 6, marginTop: 6, display: 'inline-block',
              }}>
                ⭐ {f.notable_achievement}
              </div>
            )}
          </div>
        </div>
      ))}

      {startup.team_highlights && (
        <div style={{
          padding: '10px 14px', borderRadius: 10,
          background: '#f0f0ff', border: '1px solid #e0e0ff',
          fontSize: 12, color: '#555', lineHeight: 1.5,
        }}>
          <span style={{ fontWeight: 700 }}>Team:</span> {startup.team_highlights}
        </div>
      )}
    </div>
  )
}

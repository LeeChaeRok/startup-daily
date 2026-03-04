export default function CompetitiveLandscape({ competitive_landscape }) {
  if (!competitive_landscape) return null
  const cl = competitive_landscape

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {cl.direct_competitors?.length > 0 && (
        <div>
          <h4 style={{ fontSize: 13, fontWeight: 700, color: '#333', marginBottom: 10 }}>경쟁사 비교</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {cl.direct_competitors.map((comp, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                background: '#fafafa', borderRadius: 8, padding: 12, border: '1px solid #eee',
              }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, color: '#e11d48',
                  background: '#fef2f2', padding: '2px 8px', borderRadius: 4, flexShrink: 0,
                }}>VS</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>{comp.name}</div>
                  <div style={{ fontSize: 13, color: '#666', marginTop: 2, lineHeight: 1.5 }}>{comp.comparison}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {cl.key_differentiator && (
        <div style={{ background: '#f0f0ff', borderRadius: 8, padding: 14, border: '1px solid #e0e0f0' }}>
          <h4 style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', marginBottom: 4 }}>⭐ 핵심 차별점</h4>
          <p style={{ fontSize: 14, color: '#444', lineHeight: 1.5 }}>{cl.key_differentiator}</p>
        </div>
      )}

      {cl.moat && (
        <div>
          <h4 style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 4 }}>🛡️ 경쟁 우위 (Moat)</h4>
          <p style={{ fontSize: 13, color: '#555', lineHeight: 1.5 }}>{cl.moat}</p>
        </div>
      )}

      {cl.competitive_position_summary && (
        <p style={{ fontSize: 13, color: '#888', fontStyle: 'italic', borderTop: '1px solid #eee', paddingTop: 10 }}>
          {cl.competitive_position_summary}
        </p>
      )}
    </div>
  )
}

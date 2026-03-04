export default function FounderInfo({ founders, team_highlights }) {
  if (!founders?.length) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: founders.length > 1 ? 'repeat(auto-fit, minmax(250px, 1fr))' : '1fr', gap: 12 }}>
        {founders.map((f, i) => (
          <div key={i} style={{
            background: '#fafafa', borderRadius: 10, padding: 14, border: '1px solid #eee',
            display: 'flex', gap: 12, alignItems: 'flex-start',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'linear-gradient(135deg, #7c3aed22, #7c3aed44)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 700, color: '#7c3aed', flexShrink: 0,
            }}>
              {f.name_en ? f.name_en[0].toUpperCase() : '?'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>
                {f.name_ko || f.name_en}
                {f.name_ko && f.name_en && <span style={{ fontSize: 12, color: '#888', marginLeft: 6 }}>({f.name_en})</span>}
              </div>
              <div style={{ fontSize: 12, color: '#7c3aed', fontWeight: 500, marginTop: 2 }}>{f.role}</div>
              {f.background && <div style={{ fontSize: 12, color: '#666', marginTop: 4, lineHeight: 1.4 }}>{f.background}</div>}
              {f.notable_achievement && (
                <div style={{ fontSize: 11, color: '#d97706', background: '#fffbeb', padding: '2px 8px', borderRadius: 4, marginTop: 4, display: 'inline-block' }}>
                  ⭐ {f.notable_achievement}
                </div>
              )}
              {f.linkedin && (
                <a href={f.linkedin} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 11, color: '#0077b5', textDecoration: 'none', marginTop: 4, display: 'block' }}>
                  LinkedIn →
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {team_highlights && (
        <div style={{ fontSize: 13, color: '#555', background: '#f8f8fc', padding: 12, borderRadius: 8, border: '1px solid #eee' }}>
          👥 <strong>팀 하이라이트:</strong> {team_highlights}
        </div>
      )}
    </div>
  )
}

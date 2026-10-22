export default function TrendingSlide({ startup, accent }) {
  const tr = startup.trending_reason
  if (!tr) return null

  return (
    <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16, minHeight: '100%' }}>
      <div style={{
        fontSize: 11, fontWeight: 700, color: accent,
        textTransform: 'uppercase', letterSpacing: 1.5,
      }}>Why Trending</div>

      <p style={{ fontSize: 15, fontWeight: 600, color: '#1a1a2e', lineHeight: 1.5 }}>
        {tr.summary}
      </p>

      {/* Catalysts */}
      {tr.catalysts?.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#555' }}>Catalysts</div>
          {tr.catalysts.map((c, i) => (
            <div key={i} style={{
              display: 'flex', gap: 10, alignItems: 'flex-start',
              padding: '10px 14px', borderRadius: 12,
              background: `${accent}08`, border: `1px solid ${accent}15`,
            }}>
              <span style={{
                width: 22, height: 22, borderRadius: 7,
                background: accent, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, flexShrink: 0,
              }}>{i + 1}</span>
              <span style={{ fontSize: 13, color: '#444', lineHeight: 1.4 }}>{c}</span>
            </div>
          ))}
        </div>
      )}

      {/* Growth metrics */}
      {tr.growth_metrics && (
        <div style={{
          padding: '12px 16px', borderRadius: 12,
          background: '#f0fdf4', border: '1px solid #bbf7d0',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#059669', marginBottom: 4 }}>Growth</div>
          <div style={{ fontSize: 13, color: '#333', lineHeight: 1.5 }}>{tr.growth_metrics}</div>
        </div>
      )}

      {/* Media */}
      {tr.media_mentions?.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#555' }}>In the News</div>
          {tr.media_mentions.map((m, i) => (
            <div key={i} style={{
              padding: '8px 12px', borderRadius: 10,
              background: '#f8f8fa', border: '1px solid rgba(0,0,0,0.04)',
              fontSize: 12, color: '#555',
            }}>
              <span style={{ fontWeight: 700, color: '#333' }}>{m.source}</span>
              <span style={{ margin: '0 6px', color: '#ccc' }}>·</span>
              {m.title}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

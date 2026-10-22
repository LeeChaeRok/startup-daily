export default function TrendingHighlight({ trending_reason, funding }) {
  if (!trending_reason) return null

  return (
    <div style={{
      background: 'linear-gradient(135deg, #f0f0ff, #e8f4f8)',
      border: '1px solid #ddd',
      borderRadius: 12, padding: 20,
    }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#7c3aed', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
        🔥 왜 지금 뜨고 있나
      </h3>

      {trending_reason.summary && (
        <p style={{ fontSize: 15, color: '#333', lineHeight: 1.6, marginBottom: 14 }}>
          {trending_reason.summary}
        </p>
      )}

      {trending_reason.catalysts?.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          {trending_reason.catalysts.map((c, i) => (
            <li key={i} style={{ fontSize: 13, color: '#444', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ flexShrink: 0 }}>🚀</span>
              {c}
            </li>
          ))}
        </ul>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {trending_reason.growth_metrics && (
          <span style={{ fontSize: 12, fontWeight: 600, color: '#059669', background: '#ecfdf5', padding: '4px 10px', borderRadius: 99 }}>
            📈 {trending_reason.growth_metrics}
          </span>
        )}
        {funding?.latest_round?.amount && (
          <span style={{ fontSize: 12, fontWeight: 600, color: '#2563eb', background: '#eff6ff', padding: '4px 10px', borderRadius: 99 }}>
            💰 최근 라운드: {funding.latest_round.amount}
          </span>
        )}
      </div>
    </div>
  )
}

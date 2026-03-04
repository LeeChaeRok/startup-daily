export default function MarketOutlook({ market_outlook }) {
  if (!market_outlook) return null
  const mo = market_outlook

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* TAM/SAM/SOM */}
      {mo.tam_sam_som && (
        <div>
          <h4 style={{ fontSize: 12, fontWeight: 700, color: '#333', marginBottom: 10 }}>시장 규모</h4>
          <div style={{ background: '#fafafa', borderRadius: 8, padding: 14, border: '1px solid #eee' }}>
            <p style={{ fontSize: 13, color: '#555', lineHeight: 1.6 }}>{mo.tam_sam_som}</p>
          </div>
        </div>
      )}

      {mo.market_trend && (
        <div>
          <h4 style={{ fontSize: 12, fontWeight: 700, color: '#333', marginBottom: 6 }}>📈 시장 트렌드</h4>
          <p style={{ fontSize: 14, color: '#444', lineHeight: 1.6 }}>{mo.market_trend}</p>
        </div>
      )}

      {mo.growth_potential && (
        <div>
          <h4 style={{ fontSize: 12, fontWeight: 700, color: '#059669', marginBottom: 6 }}>🌱 성장 잠재력</h4>
          <p style={{ fontSize: 14, color: '#444', lineHeight: 1.6 }}>{mo.growth_potential}</p>
        </div>
      )}

      {mo.risks?.length > 0 && (
        <div>
          <h4 style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', marginBottom: 8 }}>⚠️ 리스크</h4>
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {mo.risks.map((risk, i) => (
              <li key={i} style={{
                fontSize: 13, color: '#555', background: '#fef2f2',
                padding: '8px 12px', borderRadius: 6, border: '1px solid #fecaca',
                display: 'flex', alignItems: 'flex-start', gap: 8,
              }}>
                <span style={{ color: '#ef4444', flexShrink: 0 }}>⚠</span>
                {risk}
              </li>
            ))}
          </ul>
        </div>
      )}

      {mo.risk_mitigation && (
        <div style={{ background: '#f0fdf4', borderRadius: 8, padding: 12, border: '1px solid #bbf7d0' }}>
          <h4 style={{ fontSize: 12, fontWeight: 700, color: '#059669', marginBottom: 4 }}>🛡️ 리스크 대응</h4>
          <p style={{ fontSize: 13, color: '#555', lineHeight: 1.5 }}>{mo.risk_mitigation}</p>
        </div>
      )}
    </div>
  )
}

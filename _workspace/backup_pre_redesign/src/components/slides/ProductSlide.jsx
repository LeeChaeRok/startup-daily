export default function ProductSlide({ startup, accent }) {
  const p = startup.product
  if (!p) return null

  return (
    <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 14, minHeight: '100%' }}>
      <div style={{
        fontSize: 11, fontWeight: 700, color: accent,
        textTransform: 'uppercase', letterSpacing: 1.5,
      }}>Product</div>

      {/* Problem */}
      {p.problem_statement && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#e11d48', marginBottom: 6 }}>Problem</div>
          <p style={{ fontSize: 13, color: '#444', lineHeight: 1.6, margin: 0 }}>{p.problem_statement}</p>
        </div>
      )}

      {/* Solution */}
      {p.solution && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#059669', marginBottom: 6 }}>Solution</div>
          <p style={{ fontSize: 13, color: '#444', lineHeight: 1.6, margin: 0 }}>{p.solution}</p>
        </div>
      )}

      {/* Key Features */}
      {p.key_features?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {p.key_features.map((f, i) => (
            <span key={i} style={{
              fontSize: 11, fontWeight: 600, color: accent,
              background: `${accent}10`, border: `1px solid ${accent}20`,
              padding: '4px 10px', borderRadius: 99,
            }}>{f}</span>
          ))}
        </div>
      )}

      {/* Tech */}
      {p.tech_stack_or_innovation && (
        <div style={{
          padding: '10px 14px', borderRadius: 10,
          background: '#f8f8fc', border: `1px solid ${accent}15`,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: accent, marginBottom: 4 }}>Tech</div>
          <p style={{ fontSize: 12, color: '#555', lineHeight: 1.5, margin: 0 }}>{p.tech_stack_or_innovation}</p>
        </div>
      )}

      {/* Target & BM */}
      <div style={{ display: 'flex', gap: 8 }}>
        {p.target_customer && (
          <div style={{ flex: 1, padding: '10px 12px', borderRadius: 10, background: '#f5f5f7' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#888', marginBottom: 3 }}>Target</div>
            <div style={{ fontSize: 12, color: '#333', lineHeight: 1.4 }}>{p.target_customer}</div>
          </div>
        )}
        {p.business_model && (
          <div style={{ flex: 1, padding: '10px 12px', borderRadius: 10, background: '#f5f5f7' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#888', marginBottom: 3 }}>Biz Model</div>
            <div style={{ fontSize: 12, color: '#333', lineHeight: 1.4 }}>{p.business_model}</div>
          </div>
        )}
      </div>
    </div>
  )
}

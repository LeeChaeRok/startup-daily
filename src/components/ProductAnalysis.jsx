export default function ProductAnalysis({ product }) {
  if (!product) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {product.problem_statement && (
        <div>
          <h4 style={{ fontSize: 13, fontWeight: 700, color: '#e11d48', marginBottom: 6 }}>🎯 해결하는 문제</h4>
          <p style={{ fontSize: 14, color: '#444', lineHeight: 1.6 }}>{product.problem_statement}</p>
        </div>
      )}

      {product.solution && (
        <div>
          <h4 style={{ fontSize: 13, fontWeight: 700, color: '#059669', marginBottom: 6 }}>💡 솔루션</h4>
          <p style={{ fontSize: 14, color: '#444', lineHeight: 1.6 }}>{product.solution}</p>
        </div>
      )}

      {product.key_features?.length > 0 && (
        <div>
          <h4 style={{ fontSize: 13, fontWeight: 700, color: '#333', marginBottom: 8 }}>핵심 기능</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {product.key_features.map((f, i) => (
              <span key={i} style={{
                fontSize: 12, color: '#555', background: '#f0f0f5',
                padding: '4px 10px', borderRadius: 99, border: '1px solid #e5e5ea',
              }}>{f}</span>
            ))}
          </div>
        </div>
      )}

      {product.tech_stack_or_innovation && (
        <div style={{ background: '#f8f8fc', borderRadius: 8, padding: 12, border: '1px solid #eee' }}>
          <h4 style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', marginBottom: 4 }}>⚡ 기술 혁신</h4>
          <p style={{ fontSize: 13, color: '#555', lineHeight: 1.5 }}>{product.tech_stack_or_innovation}</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {product.target_customer && (
          <div style={{ background: '#fafafa', borderRadius: 8, padding: 12, border: '1px solid #eee' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#888', marginBottom: 4 }}>타겟 고객</div>
            <div style={{ fontSize: 13, color: '#444' }}>{product.target_customer}</div>
          </div>
        )}
        {product.business_model && (
          <div style={{ background: '#fafafa', borderRadius: 8, padding: 12, border: '1px solid #eee' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#888', marginBottom: 4 }}>비즈니스 모델</div>
            <div style={{ fontSize: 13, color: '#444' }}>{product.business_model}</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function FundingTimeline({ funding }) {
  if (!funding) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Top stats */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {funding.total_raised && (
          <div style={{ background: '#f0f0ff', borderRadius: 10, padding: '12px 16px', flex: 1, minWidth: 140 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#888' }}>총 투자유치</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#7c3aed' }}>{funding.total_raised}</div>
          </div>
        )}
        {funding.valuation_estimate && (
          <div style={{ background: '#ecfdf5', borderRadius: 10, padding: '12px 16px', flex: 1, minWidth: 140 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#888' }}>기업가치</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#059669' }}>{funding.valuation_estimate}</div>
          </div>
        )}
      </div>

      {/* Latest round */}
      {funding.latest_round && (
        <div style={{ background: '#fafafa', borderRadius: 10, padding: 14, border: '1px solid #eee' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#333', marginBottom: 8 }}>최근 라운드</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 13, color: '#555' }}>
            <span style={{ background: '#e0e7ff', color: '#3730a3', padding: '2px 8px', borderRadius: 4, fontWeight: 600, fontSize: 12 }}>
              {funding.latest_round.stage}
            </span>
            <span><strong>{funding.latest_round.amount}</strong></span>
            <span>· {funding.latest_round.date}</span>
            {funding.latest_round.lead_investor && <span>· 리드: <strong>{funding.latest_round.lead_investor}</strong></span>}
          </div>
          {funding.latest_round.notable_investors?.length > 0 && (
            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {funding.latest_round.notable_investors.map((inv, i) => (
                <span key={i} style={{ fontSize: 11, color: '#666', background: '#f0f0f0', padding: '2px 8px', borderRadius: 4 }}>
                  {inv}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Timeline */}
      {funding.funding_history?.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#333', marginBottom: 12 }}>투자 히스토리</div>
          <div style={{ position: 'relative', paddingLeft: 24 }}>
            {/* Vertical line */}
            <div style={{
              position: 'absolute', left: 6, top: 4, bottom: 4, width: 2,
              background: 'linear-gradient(to bottom, #7c3aed, #ddd)',
            }} />

            {funding.funding_history.map((round, i) => (
              <div key={i} style={{ position: 'relative', paddingBottom: 16 }}>
                {/* Dot */}
                <div style={{
                  position: 'absolute', left: -20, top: 4,
                  width: 10, height: 10, borderRadius: '50%',
                  background: '#7c3aed', border: '2px solid #fff',
                  boxShadow: '0 0 0 2px #7c3aed44',
                }} />
                <div style={{ fontSize: 13, color: '#333' }}>
                  <span style={{
                    fontSize: 11, fontWeight: 600, color: '#fff', background: '#7c3aed',
                    padding: '1px 6px', borderRadius: 3, marginRight: 6,
                  }}>{round.stage}</span>
                  <strong>{round.amount}</strong>
                  <span style={{ color: '#888', marginLeft: 6 }}>({round.date})</span>
                </div>
                {round.investors?.length > 0 && (
                  <div style={{ fontSize: 12, color: '#777', marginTop: 2 }}>
                    {round.investors.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

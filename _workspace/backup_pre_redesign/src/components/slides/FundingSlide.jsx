export default function FundingSlide({ startup, accent }) {
  const f = startup.funding
  if (!f) return null

  return (
    <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 14, minHeight: '100%' }}>
      <div style={{
        fontSize: 11, fontWeight: 700, color: accent,
        textTransform: 'uppercase', letterSpacing: 1.5,
      }}>Funding</div>

      {/* Top stats */}
      <div style={{ display: 'flex', gap: 10 }}>
        {f.total_raised && (
          <div style={{
            flex: 1, padding: '14px', borderRadius: 14,
            background: `${accent}08`, textAlign: 'center',
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#888' }}>Total Raised</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: accent, marginTop: 2 }}>{f.total_raised}</div>
          </div>
        )}
        {f.valuation_estimate && (
          <div style={{
            flex: 1, padding: '14px', borderRadius: 14,
            background: '#f0fdf4', textAlign: 'center',
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#888' }}>Valuation</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#059669', marginTop: 2 }}>{f.valuation_estimate}</div>
          </div>
        )}
      </div>

      {/* Latest round */}
      {f.latest_round && (
        <div style={{
          padding: '14px', borderRadius: 14,
          background: '#f8f8fa', border: '1px solid rgba(0,0,0,0.04)',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#555', marginBottom: 8 }}>Latest Round</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginBottom: 8 }}>
            <span style={{
              fontSize: 11, fontWeight: 700, color: '#fff', background: accent,
              padding: '2px 8px', borderRadius: 6,
            }}>{f.latest_round.stage}</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#333' }}>{f.latest_round.amount}</span>
            <span style={{ fontSize: 12, color: '#888' }}>{f.latest_round.date}</span>
          </div>
          {f.latest_round.lead_investor && (
            <div style={{ fontSize: 12, color: '#555' }}>
              Lead: <strong>{f.latest_round.lead_investor}</strong>
            </div>
          )}
          {f.latest_round.notable_investors?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
              {f.latest_round.notable_investors.map((inv, i) => (
                <span key={i} style={{
                  fontSize: 10, color: '#666', background: '#eee',
                  padding: '2px 8px', borderRadius: 4,
                }}>{inv}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Timeline */}
      {f.funding_history?.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#555', marginBottom: 10 }}>History</div>
          <div style={{ position: 'relative', paddingLeft: 20 }}>
            <div style={{
              position: 'absolute', left: 5, top: 4, bottom: 4, width: 2,
              background: `linear-gradient(to bottom, ${accent}, #ddd)`,
            }} />
            {f.funding_history.map((r, i) => (
              <div key={i} style={{ position: 'relative', paddingBottom: 12 }}>
                <div style={{
                  position: 'absolute', left: -17, top: 4,
                  width: 8, height: 8, borderRadius: '50%',
                  background: accent, border: '2px solid #fff',
                  boxShadow: `0 0 0 2px ${accent}33`,
                }} />
                <div style={{ fontSize: 12, color: '#333' }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: '#fff', background: accent,
                    padding: '1px 5px', borderRadius: 3, marginRight: 6,
                  }}>{r.stage}</span>
                  <strong>{r.amount}</strong>
                  <span style={{ color: '#999', marginLeft: 6, fontSize: 11 }}>({r.date})</span>
                </div>
                {r.investors?.length > 0 && (
                  <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                    {r.investors.join(', ')}
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

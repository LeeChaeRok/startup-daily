import { useState, useMemo, useCallback, useEffect } from 'react'
import StartupCard from './components/StartupCard.jsx'
import startups from './data/startups.json'

const isKorean = (s) => s.headquarters?.country_ko === '한국'

function useSavedIds() {
  const [savedIds, setSavedIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('saved_startups') || '[]')
    } catch { return [] }
  })

  const toggle = useCallback((id) => {
    setSavedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      localStorage.setItem('saved_startups', JSON.stringify(next))
      return next
    })
  }, [])

  return { savedIds, toggle }
}

export default function App() {
  const [region, setRegion] = useState('all') // 'all' | 'korea'
  const [showSaved, setShowSaved] = useState(false)
  const { savedIds, toggle } = useSavedIds()

  const dates = useMemo(() => {
    const pool = region === 'korea' ? startups.filter(isKorean) : startups
    const unique = [...new Set(pool.map((s) => s.date))]
    unique.sort((a, b) => b.localeCompare(a))
    return unique
  }, [region])

  const [selectedDate, setSelectedDate] = useState(dates[0])

  useEffect(() => {
    if (!dates.includes(selectedDate)) {
      setSelectedDate(dates[0])
    }
  }, [dates, selectedDate])

  const todayStartups = useMemo(() => {
    let result = startups.filter((s) => s.date === selectedDate)
    if (region === 'korea') result = result.filter(isKorean)
    return result
  }, [selectedDate, region])

  const savedStartups = useMemo(() => {
    let result = startups.filter((s) => savedIds.includes(s.id))
    if (region === 'korea') result = result.filter(isKorean)
    return result
  }, [savedIds, region])

  const displayStartups = showSaved ? savedStartups : todayStartups

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00')
    const month = d.getMonth() + 1
    const day = d.getDate()
    const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()]
    return `${month}/${day} ${weekday}`
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f2f2f7',
    }}>
      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(242,242,247,0.9)', backdropFilter: 'blur(20px)',
        padding: '12px 16px 0',
      }}>
        <div style={{ maxWidth: 520, margin: '0 auto' }}>
          {/* Title row */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9,
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 15, color: '#fff', fontWeight: 800,
              }}>S</div>
              <span style={{ fontSize: 17, fontWeight: 800, color: '#1a1a2e', letterSpacing: -0.5 }}>
                Startup Daily
              </span>
            </div>

            {/* Saved button */}
            <button
              onClick={() => setShowSaved(!showSaved)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '6px 12px', borderRadius: 99, border: 'none',
                background: showSaved
                  ? 'linear-gradient(135deg, #667eea, #764ba2)'
                  : '#fff',
                color: showSaved ? '#fff' : '#555',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                boxShadow: showSaved
                  ? '0 2px 8px rgba(102,126,234,0.3)'
                  : '0 1px 3px rgba(0,0,0,0.06)',
                transition: 'all 0.2s',
              }}
            >
              <span style={{ fontSize: 14 }}>{showSaved ? '★' : '☆'}</span>
              Saved
              {savedIds.length > 0 && (
                <span style={{
                  background: showSaved ? 'rgba(255,255,255,0.3)' : '#667eea',
                  color: '#fff',
                  fontSize: 10, fontWeight: 700,
                  padding: '1px 6px', borderRadius: 99,
                  minWidth: 18, textAlign: 'center',
                }}>{savedIds.length}</span>
              )}
            </button>
          </div>

          {/* Region toggle */}
          {!showSaved && (
            <div style={{
              display: 'flex', gap: 6, marginBottom: 8,
            }}>
              {[
                { key: 'all', label: '🌐 전체' },
                { key: 'korea', label: '🇰🇷 한국' },
              ].map((opt) => {
                const active = region === opt.key
                return (
                  <button
                    key={opt.key}
                    onClick={() => setRegion(opt.key)}
                    style={{
                      padding: '6px 14px', borderRadius: 99, border: 'none',
                      background: active
                        ? 'linear-gradient(135deg, #667eea, #764ba2)'
                        : '#fff',
                      color: active ? '#fff' : '#555',
                      fontSize: 12, fontWeight: active ? 700 : 500,
                      cursor: 'pointer',
                      boxShadow: active
                        ? '0 2px 8px rgba(102,126,234,0.3)'
                        : '0 1px 3px rgba(0,0,0,0.06)',
                      transition: 'all 0.2s',
                    }}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          )}

          {/* Date tabs — hide when showing saved */}
          {!showSaved && (
            <div style={{
              display: 'flex', gap: 6,
              overflowX: 'auto', scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              paddingBottom: 12,
            }}>
              {dates.map((date) => {
                const active = date === selectedDate
                return (
                  <button key={date} onClick={() => setSelectedDate(date)} style={{
                    padding: '6px 14px', borderRadius: 99, border: 'none',
                    background: active
                      ? 'linear-gradient(135deg, #667eea, #764ba2)'
                      : '#fff',
                    color: active ? '#fff' : '#555',
                    fontSize: 12, fontWeight: active ? 700 : 500,
                    cursor: 'pointer', flexShrink: 0,
                    boxShadow: active ? '0 2px 8px rgba(102,126,234,0.3)' : '0 1px 3px rgba(0,0,0,0.06)',
                    transition: 'all 0.2s',
                  }}>
                    {formatDate(date)}
                  </button>
                )
              })}
            </div>
          )}

          {/* Saved header */}
          {showSaved && (
            <div style={{
              paddingBottom: 12, fontSize: 13, color: '#888',
            }}>
              {savedStartups.length > 0
                ? `${savedStartups.length}개 저장됨`
                : '저장된 스타트업이 없습니다'}
            </div>
          )}
        </div>
      </header>

      {/* Feed */}
      <main style={{ maxWidth: 520, margin: '0 auto', padding: '8px 12px 40px' }}>
        {displayStartups.length > 0 ? (
          displayStartups.map((startup) => (
            <StartupCard
              key={startup.id}
              startup={startup}
              isSaved={savedIds.includes(startup.id)}
              onToggleSave={() => toggle(startup.id)}
            />
          ))
        ) : showSaved ? (
          <div style={{
            textAlign: 'center', padding: '80px 20px',
            color: '#999', fontSize: 14,
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>☆</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>저장된 스타트업이 없습니다</div>
            <div style={{ fontSize: 12 }}>카드에서 ★ 버튼을 눌러 저장해보세요</div>
          </div>
        ) : null}
      </main>
    </div>
  )
}

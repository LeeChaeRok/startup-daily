import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import StartupCard from './components/StartupCard.jsx'
import startups from './data/startups.json'

export default function App() {
  // Get unique dates sorted descending (newest first)
  const dates = useMemo(() => {
    const unique = [...new Set(startups.map((s) => s.date))]
    unique.sort((a, b) => b.localeCompare(a))
    return unique
  }, [])

  const [dateIndex, setDateIndex] = useState(0)
  const currentDate = dates[dateIndex]
  const todayStartups = startups.filter((s) => s.date === currentDate)
  const [cardIndex, setCardIndex] = useState(0)
  const startup = todayStartups[cardIndex] || todayStartups[0]

  const changeDate = (newIdx) => {
    setDateIndex(newIdx)
    setCardIndex(0)
  }

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f7' }}>
      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #e5e5ea', padding: '16px 24px',
      }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: '#1a1a2e' }}>
              Startup Daily
            </div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
              매일 전 세계 떠오르는 스타트업을 깊이 있게
            </div>
          </div>
          <div style={{ fontSize: 13, color: '#666' }}>
            {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>

        {/* Date Navigation */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#fff', borderRadius: 12, padding: '10px 16px',
          marginBottom: 12, border: '1px solid #e5e5ea',
        }}>
          <button onClick={() => changeDate(Math.min(dateIndex + 1, dates.length - 1))}
            disabled={dateIndex === dates.length - 1}
            style={{
              padding: '6px 14px', borderRadius: 8, border: '1px solid #ddd',
              background: dateIndex === dates.length - 1 ? '#f5f5f5' : '#fff',
              color: dateIndex === dates.length - 1 ? '#ccc' : '#333',
              cursor: dateIndex === dates.length - 1 ? 'default' : 'pointer',
              fontSize: 13, fontWeight: 500,
            }}>
            ← 이전 날
          </button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e' }}>{formatDate(currentDate)}</div>
            <div style={{ fontSize: 11, color: '#999' }}>{todayStartups.length}개 스타트업</div>
          </div>
          <button onClick={() => changeDate(Math.max(dateIndex - 1, 0))}
            disabled={dateIndex === 0}
            style={{
              padding: '6px 14px', borderRadius: 8, border: '1px solid #ddd',
              background: dateIndex === 0 ? '#f5f5f5' : '#fff',
              color: dateIndex === 0 ? '#ccc' : '#333',
              cursor: dateIndex === 0 ? 'default' : 'pointer',
              fontSize: 13, fontWeight: 500,
            }}>
            다음 날 →
          </button>
        </div>

        {/* Card Navigation */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#fff', borderRadius: 12, padding: '10px 16px',
          marginBottom: 12, border: '1px solid #e5e5ea',
        }}>
          <button onClick={() => setCardIndex(Math.max(cardIndex - 1, 0))}
            disabled={cardIndex === 0}
            style={{
              padding: '6px 14px', borderRadius: 8, border: '1px solid #ddd',
              background: cardIndex === 0 ? '#f5f5f5' : '#fff',
              color: cardIndex === 0 ? '#ccc' : '#333',
              cursor: cardIndex === 0 ? 'default' : 'pointer',
              fontSize: 13, fontWeight: 500,
            }}>
            ← 이전
          </button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{cardIndex + 1} / {todayStartups.length}</div>
            <div style={{ fontSize: 12, color: '#888' }}>{startup?.name_en}</div>
          </div>
          <button onClick={() => setCardIndex(Math.min(cardIndex + 1, todayStartups.length - 1))}
            disabled={cardIndex === todayStartups.length - 1}
            style={{
              padding: '6px 14px', borderRadius: 8, border: '1px solid #ddd',
              background: cardIndex === todayStartups.length - 1 ? '#f5f5f5' : '#fff',
              color: cardIndex === todayStartups.length - 1 ? '#ccc' : '#333',
              cursor: cardIndex === todayStartups.length - 1 ? 'default' : 'pointer',
              fontSize: 13, fontWeight: 500,
            }}>
            다음 →
          </button>
        </div>

        {/* Dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
          {todayStartups.map((s, i) => (
            <button key={s.id} onClick={() => setCardIndex(i)}
              title={s.name_en}
              style={{
                width: i === cardIndex ? 28 : 8, height: 8,
                borderRadius: 99, border: 'none',
                background: i === cardIndex ? '#333' : '#ccc',
                cursor: 'pointer', transition: 'all 0.3s',
              }}
            />
          ))}
        </div>

        {/* Card */}
        {startup && (
          <AnimatePresence mode="wait">
            <motion.div key={startup.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25 }}
            >
              <StartupCard startup={startup} />
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      <footer style={{ textAlign: 'center', padding: '40px 16px', fontSize: 13, color: '#999', borderTop: '1px solid #e5e5ea', marginTop: 40 }}>
        © 2026 Startup Daily. 매일 아침, 스타트업 인텔리전스.
      </footer>
    </div>
  )
}

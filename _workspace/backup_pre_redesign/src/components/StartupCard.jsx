import { useRef, useState, useEffect, useCallback } from 'react'
import CoverSlide from './slides/CoverSlide.jsx'
import TrendingSlide from './slides/TrendingSlide.jsx'
import ProductSlide from './slides/ProductSlide.jsx'
import CompetitionSlide from './slides/CompetitionSlide.jsx'
import TeamSlide from './slides/TeamSlide.jsx'
import FundingSlide from './slides/FundingSlide.jsx'
import MarketSlide from './slides/MarketSlide.jsx'

const catColors = {
  'AI': '#7c3aed', 'FinTech': '#059669', 'HealthTech': '#e11d48',
  'CleanTech': '#65a30d', 'SaaS': '#0284c7', 'Web3': '#ea580c',
  'RegTech': '#7c3aed', 'AI Infrastructure': '#6366f1',
  'DevTools': '#0891b2', 'MarketTech': '#d946ef',
  'BioTech': '#059669', 'Industrial Tech': '#475569',
  'Identity': '#8b5cf6', 'Sustainability': '#16a34a',
  'FoodTech': '#ea580c', 'Neurotech': '#e11d48',
  'Wearable': '#f59e0b', 'Robotics': '#64748b',
  'AgTech': '#65a30d', 'HardTech': '#475569',
  'Hospitality Tech': '#d946ef', 'EdTech': '#0284c7',
  'SpaceTech': '#1e40af',
}

const slideLabels = ['Cover', 'Trending', 'Product', 'Competition', 'Team', 'Funding', 'Market']

export default function StartupCard({ startup, isSaved = false, onToggleSave }) {
  const accent = catColors[startup.category?.[0]] || '#7c3aed'
  const scrollRef = useRef(null)
  const [activeSlide, setActiveSlide] = useState(0)
  const slideCount = slideLabels.length

  // Observe which slide is visible
  useEffect(() => {
    const container = scrollRef.current
    if (!container) return

    const slides = container.children
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            const idx = Array.from(slides).indexOf(entry.target)
            if (idx >= 0) setActiveSlide(idx)
          }
        })
      },
      { root: container, threshold: 0.5 }
    )

    Array.from(slides).forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [startup.id])

  const scrollToSlide = useCallback((idx) => {
    const container = scrollRef.current
    if (!container || idx < 0 || idx >= slideCount) return
    const slide = container.children[idx]
    if (slide) slide.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' })
  }, [slideCount])

  return (
    <div style={{
      background: '#fff',
      borderRadius: 20,
      boxShadow: '0 2px 20px rgba(0,0,0,0.06)',
      overflow: 'hidden',
      marginBottom: 16,
    }}>
      {/* Progress dots */}
      <div style={{
        display: 'flex', gap: 4, padding: '12px 16px 0',
        alignItems: 'center',
      }}>
        {slideLabels.map((_, i) => (
          <button key={i} onClick={() => scrollToSlide(i)} style={{
            flex: 1, height: 3, borderRadius: 2, border: 'none', padding: 0,
            background: i === activeSlide
              ? accent
              : i < activeSlide ? '#bbb' : '#e5e5ea',
            cursor: 'pointer',
            transition: 'all 0.3s',
          }} />
        ))}
      </div>

      {/* Slide label + save button */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '6px 16px 0',
      }}>
        <span style={{
          fontSize: 10, fontWeight: 700, color: '#aaa',
          textTransform: 'uppercase', letterSpacing: 1,
        }}>
          {slideLabels[activeSlide]}
          <span style={{ marginLeft: 6, color: '#ccc', fontWeight: 500 }}>
            {activeSlide + 1}/{slideCount}
          </span>
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleSave?.() }}
          style={{
            display: 'flex', alignItems: 'center', gap: 3,
            padding: '4px 10px', borderRadius: 99, border: 'none',
            background: isSaved ? accent : '#f0f0f5',
            color: isSaved ? '#fff' : '#888',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <span style={{ fontSize: 13 }}>{isSaved ? '★' : '☆'}</span>
          {isSaved ? 'Saved' : 'Save'}
        </button>
      </div>

      {/* Horizontal scroll container */}
      <div
        ref={scrollRef}
        className="carousel-scroll"
        style={{
          display: 'flex',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {/* Slide 1: Cover */}
        <div className="carousel-scroll" style={{
          minWidth: '100%', maxWidth: '100%',
          scrollSnapAlign: 'start',
          minHeight: 420,
        }}>
          <CoverSlide startup={startup} accent={accent} />
        </div>

        {/* Slide 2: Trending */}
        <div style={{
          minWidth: '100%', maxWidth: '100%',
          scrollSnapAlign: 'start',
          minHeight: 420, overflowY: 'auto',
        }}>
          <TrendingSlide startup={startup} accent={accent} />
        </div>

        {/* Slide 3: Product */}
        <div style={{
          minWidth: '100%', maxWidth: '100%',
          scrollSnapAlign: 'start',
          minHeight: 420, overflowY: 'auto',
        }}>
          <ProductSlide startup={startup} accent={accent} />
        </div>

        {/* Slide 4: Competition */}
        <div style={{
          minWidth: '100%', maxWidth: '100%',
          scrollSnapAlign: 'start',
          minHeight: 420, overflowY: 'auto',
        }}>
          <CompetitionSlide startup={startup} accent={accent} />
        </div>

        {/* Slide 5: Team */}
        <div style={{
          minWidth: '100%', maxWidth: '100%',
          scrollSnapAlign: 'start',
          minHeight: 420, overflowY: 'auto',
        }}>
          <TeamSlide startup={startup} accent={accent} />
        </div>

        {/* Slide 6: Funding */}
        <div style={{
          minWidth: '100%', maxWidth: '100%',
          scrollSnapAlign: 'start',
          minHeight: 420, overflowY: 'auto',
        }}>
          <FundingSlide startup={startup} accent={accent} />
        </div>

        {/* Slide 7: Market */}
        <div style={{
          minWidth: '100%', maxWidth: '100%',
          scrollSnapAlign: 'start',
          minHeight: 420, overflowY: 'auto',
        }}>
          <MarketSlide startup={startup} accent={accent} />
        </div>
      </div>
    </div>
  )
}

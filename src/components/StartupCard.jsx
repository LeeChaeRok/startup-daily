import { useState } from 'react'
import AccordionSection from './AccordionSection.jsx'
import TrendingHighlight from './TrendingHighlight.jsx'
import ProductAnalysis from './ProductAnalysis.jsx'
import CompetitiveLandscape from './CompetitiveLandscape.jsx'
import FounderInfo from './FounderInfo.jsx'
import FundingTimeline from './FundingTimeline.jsx'
import MarketOutlook from './MarketOutlook.jsx'

const catColors = {
  'AI': '#7c3aed', 'FinTech': '#059669', 'HealthTech': '#e11d48',
  'CleanTech': '#65a30d', 'SaaS': '#0284c7', 'Web3': '#ea580c',
  'RegTech': '#7c3aed', 'AI Infrastructure': '#6366f1',
  'DevTools': '#0891b2', 'MarketTech': '#d946ef',
}

function getColor(cats) {
  if (!cats || !cats.length) return '#7c3aed'
  return catColors[cats[0]] || '#7c3aed'
}

function Badge({ label, color }) {
  return (
    <span style={{
      fontSize: 12, fontWeight: 600, color,
      background: color + '12', border: `1px solid ${color}33`,
      padding: '3px 10px', borderRadius: 99, display: 'inline-block',
    }}>
      {label}
    </span>
  )
}

/* ── Image Lightbox Modal ── */
function ImageModal({ src, alt, onClose }) {
  const [copied, setCopied] = useState(false)

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(src)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* fallback: select text */ }
  }

  const handleCopyImage = async () => {
    try {
      const res = await fetch(src)
      const blob = await res.blob()
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      handleCopyUrl()
    }
  }

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'zoom-out',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 16, padding: 24,
        maxWidth: '90vw', maxHeight: '90vh',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)', cursor: 'default',
      }}>
        <img src={src} alt={alt} style={{
          maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain',
          borderRadius: 8, background: '#f5f5f5', padding: 16,
        }} />

        <div style={{ fontSize: 16, fontWeight: 600, color: '#333' }}>{alt}</div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleCopyImage} style={{
            padding: '8px 16px', borderRadius: 8, border: '1px solid #ddd',
            background: copied ? '#059669' : '#f5f5f5',
            color: copied ? '#fff' : '#333',
            fontSize: 13, fontWeight: 500, cursor: 'pointer',
            transition: 'all 0.2s',
          }}>
            {copied ? '✓ 복사됨!' : '📋 이미지 복사'}
          </button>
          <button onClick={handleCopyUrl} style={{
            padding: '8px 16px', borderRadius: 8, border: '1px solid #ddd',
            background: '#f5f5f5', color: '#333',
            fontSize: 13, fontWeight: 500, cursor: 'pointer',
          }}>
            🔗 URL 복사
          </button>
          <a href={src} download target="_blank" rel="noopener noreferrer" style={{
            padding: '8px 16px', borderRadius: 8, border: '1px solid #ddd',
            background: '#f5f5f5', color: '#333', textDecoration: 'none',
            fontSize: 13, fontWeight: 500,
          }}>
            ⬇ 다운로드
          </a>
        </div>

        <button onClick={onClose} style={{
          position: 'absolute', top: 12, right: 12,
          width: 32, height: 32, borderRadius: '50%',
          border: 'none', background: 'rgba(0,0,0,0.1)',
          fontSize: 18, cursor: 'pointer', color: '#666',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          ✕
        </button>
      </div>
    </div>
  )
}

function getLogoUrl(startup) {
  // 1) 수동 지정된 logo_url 우선
  if (startup.logo_url) return startup.logo_url
  // 2) 도메인 기반 Clearbit Logo API (고화질 자동)
  if (startup.website) {
    try {
      const domain = new URL(startup.website).hostname.replace('www.', '')
      return `https://logo.clearbit.com/${domain}?size=200`
    } catch { /* invalid url */ }
  }
  return null
}

export default function StartupCard({ startup }) {
  const accent = getColor(startup.category)
  const [showModal, setShowModal] = useState(false)
  const logoUrl = getLogoUrl(startup)

  return (
    <article style={{
      background: '#fff', borderRadius: 16,
      border: '1px solid #e5e5ea', boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      overflow: 'hidden',
    }}>
      {/* Accent strip */}
      <div style={{ height: 4, background: accent }} />

      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
          {startup.category.map((c) => <Badge key={c} label={c} color={catColors[c] || accent} />)}
          <Badge label={startup.company_stage} color="#2563eb" />
          <span style={{ fontSize: 12, color: '#999', marginLeft: 'auto' }}>{startup.date}</span>
        </div>

        {/* Logo + Name */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          {logoUrl ? (
            <div
              onClick={() => setShowModal(true)}
              title="클릭하여 확대"
              style={{
                width: 56, height: 56, borderRadius: 14,
                background: '#fff', border: '1px solid #e5e5ea',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, overflow: 'hidden', padding: 6,
                cursor: 'zoom-in', transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <img src={logoUrl} alt={`${startup.name_en} logo`}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                onError={(e) => { e.target.style.display = 'none' }}
              />
            </div>
          ) : (
            <div style={{
              width: 56, height: 56, borderRadius: 14,
              background: `linear-gradient(135deg, ${accent}15, ${accent}30)`,
              border: `1px solid ${accent}33`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 700, color: accent,
              fontFamily: "'Playfair Display', serif", flexShrink: 0,
            }}>
              {startup.name_en.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase()}
            </div>
          )}
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Playfair Display', serif", color: '#1a1a2e', lineHeight: 1.2 }}>
              {startup.name_en}
              {startup.name_ko && <span style={{ fontSize: 14, fontWeight: 400, color: '#888', marginLeft: 8 }}>{startup.name_ko}</span>}
            </h2>
            <p style={{ fontSize: 15, color: '#555', marginTop: 4, lineHeight: 1.4 }}>{startup.tagline}</p>
            <div style={{ marginTop: 6, fontSize: 12, color: '#999', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <span>📍 {startup.headquarters?.city}, {startup.headquarters?.country_ko}</span>
              <span>🗓 설립 {startup.founded_year}년</span>
              <span>👥 {startup.employee_count}명</span>
            </div>
          </div>
        </div>

        {/* Trending */}
        <TrendingHighlight trending_reason={startup.trending_reason} funding={startup.funding} />

        {/* Accordions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <AccordionSection title="문제 & 솔루션" icon="💡" defaultOpen={true}>
            <ProductAnalysis product={startup.product} />
          </AccordionSection>
          <AccordionSection title="경쟁 구도 & 차별점" icon="⚔️" defaultOpen={true}>
            <CompetitiveLandscape competitive_landscape={startup.competitive_landscape} />
          </AccordionSection>
          <AccordionSection title="창업자 & 팀" icon="👥" defaultOpen={true}>
            <FounderInfo founders={startup.founders} team_highlights={startup.team_highlights} />
          </AccordionSection>
          <AccordionSection title="투자 & 재무" icon="💰" defaultOpen={true}>
            <FundingTimeline funding={startup.funding} />
          </AccordionSection>
          <AccordionSection title="시장 전망 & 리스크" icon="📊" defaultOpen={true}>
            <MarketOutlook market_outlook={startup.market_outlook} />
          </AccordionSection>
        </div>

        {/* Links */}
        {startup.related_links?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {startup.related_links.map((link, i) => (
              <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                style={{
                  fontSize: 12, fontWeight: 500, color: accent,
                  background: accent + '10', border: `1px solid ${accent}30`,
                  padding: '4px 12px', borderRadius: 99, textDecoration: 'none',
                }}>
                {link.label} ↗
              </a>
            ))}
          </div>
        )}

        {/* Editor comment */}
        {startup.editor_pick_comment && (
          <div style={{
            padding: '14px 16px', borderRadius: 10,
            background: '#f8f8fc', borderLeft: `3px solid ${accent}`,
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: accent, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
              에디터 코멘트
            </div>
            <p style={{ fontSize: 14, color: '#555', fontStyle: 'italic', lineHeight: 1.5 }}>
              "{startup.editor_pick_comment}"
            </p>
          </div>
        )}
      </div>

      {/* Image Modal */}
      {showModal && logoUrl && (
        <ImageModal
          src={logoUrl}
          alt={`${startup.name_en} 로고`}
          onClose={() => setShowModal(false)}
        />
      )}
    </article>
  )
}

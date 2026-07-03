'use client'

import { useState } from 'react'
import FAQAccordion from './FAQAccordion'
import { PageSEO } from '@/lib/page-types'

interface LandingPageProps {
  config: PageSEO
  toolHref: string
  pageId: string
}

// ── Per-page theme colours ─────────────────────────────────────────────────
const PAGE_ACCENT: Record<string, { from: string; to: string; badge: string }> = {
  upscale:               { from: '#6366F1', to: '#8B5CF6', badge: '#EEF2FF' },
  'remove-bg':           { from: '#10B981', to: '#059669', badge: '#ECFDF5' },
  'photo-enhancer':      { from: '#F59E0B', to: '#EF4444', badge: '#FEF3C7' },
  'compress-image':      { from: '#3B82F6', to: '#06B6D4', badge: '#EFF6FF' },
  'watermark-remover':   { from: '#8B5CF6', to: '#EC4899', badge: '#F5F3FF' },
  'change-background':   { from: '#14B8A6', to: '#3B82F6', badge: '#F0FDFA' },
  'make-background-white': { from: '#6B7280', to: '#374151', badge: '#F9FAFB' },
  'passport-photo':      { from: '#EF4444', to: '#B91C1C', badge: '#FEF2F2' },
  'convert-to-png':      { from: '#F97316', to: '#EAB308', badge: '#FFF7ED' },
  'convert-to-jpg':      { from: '#06B6D4', to: '#3B82F6', badge: '#ECFEFF' },
}
const accent = (id: string) => PAGE_ACCENT[id] ?? PAGE_ACCENT['upscale']

// ── Demo visual: SVG illustration for Before state ─────────────────────────
function BeforeVisual({ pageId }: { pageId: string }) {
  const visuals: Record<string, React.ReactNode> = {
    upscale: (
      <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <rect width="400" height="300" fill="#D1D5DB"/>
        {/* Pixelated blocks */}
        {Array.from({ length: 12 }, (_, r) => Array.from({ length: 16 }, (_, c) => {
          const colors = ['#9CA3AF','#D1D5DB','#6B7280','#E5E7EB','#9CA3AF','#4B5563']
          return <rect key={`${r}-${c}`} x={c*25} y={r*25} width={25} height={25} fill={colors[(r*3+c*2)%colors.length]} />
        }))}
        <rect x="80" y="60" width="240" height="180" fill="none" stroke="#6366F1" strokeWidth="3" strokeDasharray="8 4"/>
        <text x="200" y="140" textAnchor="middle" fill="#374151" fontWeight="bold" fontSize="16" fontFamily="sans-serif">Low Resolution</text>
        <text x="200" y="162" textAnchor="middle" fill="#6B7280" fontSize="13" fontFamily="sans-serif">Blurry • Pixelated</text>
      </svg>
    ),
    'remove-bg': (
      <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <defs><linearGradient id="bg1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#E0E7FF"/><stop offset="100%" stopColor="#C7D2FE"/></linearGradient></defs>
        <rect width="400" height="300" fill="url(#bg1)"/>
        <rect x="0" y="180" width="400" height="120" fill="#A5B4FC" opacity="0.6"/>
        {/* Person silhouette */}
        <ellipse cx="200" cy="110" rx="45" ry="55" fill="#818CF8"/>
        <ellipse cx="200" cy="80" rx="28" ry="32" fill="#6366F1"/>
        <text x="200" y="265" textAnchor="middle" fill="#3730A3" fontWeight="bold" fontSize="13" fontFamily="sans-serif">Cluttered Background</text>
      </svg>
    ),
    'watermark-remover': (
      <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <defs><linearGradient id="wm1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#FDE68A"/><stop offset="100%" stopColor="#FCA5A5"/></linearGradient></defs>
        <rect width="400" height="300" fill="url(#wm1)"/>
        <text x="200" y="130" textAnchor="middle" fill="rgba(100,100,100,0.35)" fontSize="28" fontWeight="900" fontFamily="sans-serif" transform="rotate(-25 200 130)">WATERMARK</text>
        <text x="140" y="170" textAnchor="middle" fill="rgba(100,100,100,0.25)" fontSize="20" fontWeight="800" fontFamily="sans-serif" transform="rotate(-25 140 170)">© SAMPLE</text>
        <text x="270" y="100" textAnchor="middle" fill="rgba(100,100,100,0.2)" fontSize="18" fontWeight="800" fontFamily="sans-serif" transform="rotate(-25 270 100)">PREVIEW</text>
        <text x="200" y="265" textAnchor="middle" fill="#92400E" fontWeight="bold" fontSize="13" fontFamily="sans-serif">Watermark Overlaid</text>
      </svg>
    ),
    'photo-enhancer': (
      <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <defs><filter id="blur2"><feGaussianBlur stdDeviation="2.5"/></filter></defs>
        <rect width="400" height="300" fill="#9CA3AF"/>
        <rect x="0" y="150" width="400" height="150" fill="#6B7280"/>
        <ellipse cx="200" cy="140" rx="80" ry="100" fill="#D1D5DB" filter="url(#blur2)"/>
        <ellipse cx="200" cy="100" rx="42" ry="48" fill="#E5E7EB" filter="url(#blur2)"/>
        <rect x="40" y="200" width="120" height="6" rx="3" fill="#4B5563" opacity="0.5"/>
        <rect x="180" y="200" width="80" height="6" rx="3" fill="#4B5563" opacity="0.5"/>
        <text x="200" y="265" textAnchor="middle" fill="#1F2937" fontWeight="bold" fontSize="13" fontFamily="sans-serif">Dull • Dark • Blurry</text>
      </svg>
    ),
    'compress-image': (
      <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <rect width="400" height="300" fill="#EFF6FF"/>
        <rect x="60" y="40" width="280" height="180" rx="8" fill="#DBEAFE" stroke="#93C5FD" strokeWidth="2"/>
        <text x="200" y="115" textAnchor="middle" fill="#1E40AF" fontSize="42" fontWeight="900" fontFamily="sans-serif">4.2</text>
        <text x="200" y="145" textAnchor="middle" fill="#3B82F6" fontSize="22" fontWeight="700" fontFamily="sans-serif">MB</text>
        <text x="200" y="175" textAnchor="middle" fill="#6B7280" fontSize="14" fontFamily="sans-serif">Original File Size</text>
        <rect x="60" y="238" width="280" height="24" rx="4" fill="#BFDBFE"/>
        <rect x="60" y="238" width="280" height="24" rx="4" fill="#3B82F6" opacity="0.8"/>
        <text x="200" y="265" textAnchor="middle" fill="#1E3A8A" fontWeight="bold" fontSize="13" fontFamily="sans-serif">Heavy • Slow Loading</text>
      </svg>
    ),
    'change-background': (
      <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <defs><linearGradient id="cb1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#E5E7EB"/><stop offset="100%" stopColor="#D1D5DB"/></linearGradient></defs>
        <rect width="400" height="300" fill="url(#cb1)"/>
        <rect x="0" y="180" width="400" height="120" fill="#9CA3AF" opacity="0.5"/>
        <ellipse cx="200" cy="100" rx="50" ry="58" fill="#6B7280"/>
        <ellipse cx="200" cy="72" rx="30" ry="35" fill="#9CA3AF"/>
        <text x="200" y="265" textAnchor="middle" fill="#374151" fontWeight="bold" fontSize="13" fontFamily="sans-serif">Plain Background</text>
      </svg>
    ),
    'make-background-white': (
      <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <defs><linearGradient id="mbw1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#FCA5A5"/><stop offset="100%" stopColor="#FDBA74"/></linearGradient></defs>
        <rect width="400" height="300" fill="url(#mbw1)"/>
        <ellipse cx="200" cy="130" rx="70" ry="80" fill="white" opacity="0.7"/>
        <text x="200" y="265" textAnchor="middle" fill="#7F1D1D" fontWeight="bold" fontSize="13" fontFamily="sans-serif">Colored Background</text>
      </svg>
    ),
    'passport-photo': (
      <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <rect width="400" height="300" fill="#E0F2FE"/>
        <rect x="0" y="200" width="400" height="100" fill="#7DD3FC" opacity="0.6"/>
        <ellipse cx="200" cy="130" rx="55" ry="70" fill="#BAE6FD"/>
        <ellipse cx="200" cy="100" rx="33" ry="38" fill="#7DD3FC"/>
        <text x="200" y="265" textAnchor="middle" fill="#0C4A6E" fontWeight="bold" fontSize="13" fontFamily="sans-serif">Informal Photo</text>
      </svg>
    ),
    'convert-to-png': (
      <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <rect width="400" height="300" fill="#FFF7ED"/>
        <rect x="100" y="60" width="200" height="160" rx="12" fill="#FED7AA" stroke="#F97316" strokeWidth="2.5"/>
        <text x="200" y="130" textAnchor="middle" fill="#C2410C" fontSize="36" fontWeight="900" fontFamily="monospace">JPG</text>
        <text x="200" y="165" textAnchor="middle" fill="#EA580C" fontSize="14" fontFamily="sans-serif">Source Format</text>
        <text x="200" y="265" textAnchor="middle" fill="#7C2D12" fontWeight="bold" fontSize="13" fontFamily="sans-serif">Convert to Lossless PNG</text>
      </svg>
    ),
    'convert-to-jpg': (
      <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <rect width="400" height="300" fill="#ECFEFF"/>
        <rect x="100" y="60" width="200" height="160" rx="12" fill="#A5F3FC" stroke="#06B6D4" strokeWidth="2.5"/>
        <text x="200" y="130" textAnchor="middle" fill="#0E7490" fontSize="36" fontWeight="900" fontFamily="monospace">PNG</text>
        <text x="200" y="165" textAnchor="middle" fill="#0891B2" fontSize="14" fontFamily="sans-serif">Source Format</text>
        <text x="200" y="265" textAnchor="middle" fill="#164E63" fontWeight="bold" fontSize="13" fontFamily="sans-serif">Compress to Smaller JPG</text>
      </svg>
    ),
  }
  return (
    <div style={{ width: '100%', height: '100%', background: '#E5E7EB' }}>
      {visuals[pageId] ?? visuals['upscale']}
    </div>
  )
}

// ── Demo visual: SVG illustration for After state ──────────────────────────
function AfterVisual({ pageId }: { pageId: string }) {
  const a = accent(pageId)
  const visuals: Record<string, React.ReactNode> = {
    upscale: (
      <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <defs><linearGradient id="au1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor={a.from}/><stop offset="100%" stopColor={a.to}/></linearGradient></defs>
        <rect width="400" height="300" fill="url(#au1)" opacity="0.15"/>
        <rect x="20" y="20" width="360" height="260" rx="16" fill="white" opacity="0.9"/>
        {/* Crisp lines to show sharpness */}
        {[60,90,120,150,180,210].map(y => <line key={y} x1="40" y1={y} x2="360" y2={y} stroke={a.from} strokeWidth="0.5" opacity="0.3"/>)}
        <ellipse cx="200" cy="140" rx="80" ry="90" fill={a.from} opacity="0.15"/>
        <ellipse cx="200" cy="105" rx="45" ry="52" fill={a.from} opacity="0.25"/>
        <text x="200" y="225" textAnchor="middle" fill={a.from} fontWeight="900" fontSize="18" fontFamily="sans-serif">4x Upscaled</text>
        <text x="200" y="248" textAnchor="middle" fill="#6B7280" fontSize="13" fontFamily="sans-serif">Sharp • Crystal Clear</text>
      </svg>
    ),
    'remove-bg': (
      <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <defs>
          <pattern id="checker" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <rect width="10" height="10" fill="#E5E7EB"/>
            <rect x="10" y="10" width="10" height="10" fill="#E5E7EB"/>
            <rect x="10" y="0" width="10" height="10" fill="#F9FAFB"/>
            <rect x="0" y="10" width="10" height="10" fill="#F9FAFB"/>
          </pattern>
        </defs>
        <rect width="400" height="300" fill="url(#checker)"/>
        <ellipse cx="200" cy="120" rx="45" ry="55" fill={a.from}/>
        <ellipse cx="200" cy="88" rx="28" ry="32" fill={a.to}/>
        <text x="200" y="220" textAnchor="middle" fill={a.from} fontWeight="900" fontSize="18" fontFamily="sans-serif">Background Removed</text>
        <text x="200" y="242" textAnchor="middle" fill="#6B7280" fontSize="13" fontFamily="sans-serif">Transparent PNG</text>
      </svg>
    ),
    'watermark-remover': (
      <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <defs><linearGradient id="aw1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#FDE68A"/><stop offset="100%" stopColor="#FCA5A5"/></linearGradient></defs>
        <rect width="400" height="300" fill="url(#aw1)"/>
        <circle cx="200" cy="130" r="48" fill="white" opacity="0.9"/>
        <text x="200" y="122" textAnchor="middle" fill={a.from} fontSize="28" fontWeight="900" fontFamily="sans-serif">✓</text>
        <text x="200" y="147" textAnchor="middle" fill={a.from} fontSize="13" fontWeight="700" fontFamily="sans-serif">Clean!</text>
        <text x="200" y="222" textAnchor="middle" fill="#92400E" fontWeight="900" fontSize="18" fontFamily="sans-serif">Watermark Removed</text>
        <text x="200" y="244" textAnchor="middle" fill="#6B7280" fontSize="13" fontFamily="sans-serif">Seamlessly Restored</text>
      </svg>
    ),
    'photo-enhancer': (
      <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <defs><linearGradient id="ape1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#FEF3C7"/><stop offset="100%" stopColor="#FDE68A"/></linearGradient></defs>
        <rect width="400" height="300" fill="url(#ape1)"/>
        <rect x="0" y="180" width="400" height="120" fill="#F59E0B" opacity="0.3"/>
        <ellipse cx="200" cy="130" rx="80" ry="90" fill="#FBBF24" opacity="0.4"/>
        <ellipse cx="200" cy="95" rx="45" ry="52" fill="#F59E0B" opacity="0.6"/>
        <text x="200" y="222" textAnchor="middle" fill="#92400E" fontWeight="900" fontSize="18" fontFamily="sans-serif">AI Enhanced</text>
        <text x="200" y="244" textAnchor="middle" fill="#6B7280" fontSize="13" fontFamily="sans-serif">Bright • Sharp • Vivid</text>
      </svg>
    ),
    'compress-image': (
      <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <rect width="400" height="300" fill="#ECFDF5"/>
        <rect x="60" y="40" width="280" height="180" rx="8" fill="#D1FAE5" stroke="#6EE7B7" strokeWidth="2"/>
        <text x="200" y="115" textAnchor="middle" fill="#065F46" fontSize="42" fontWeight="900" fontFamily="sans-serif">840</text>
        <text x="200" y="145" textAnchor="middle" fill="#10B981" fontSize="22" fontWeight="700" fontFamily="sans-serif">KB</text>
        <text x="200" y="175" textAnchor="middle" fill="#6B7280" fontSize="14" fontFamily="sans-serif">80% Smaller File</text>
        <rect x="60" y="238" width="280" height="24" rx="4" fill="#A7F3D0"/>
        <rect x="60" y="238" width="60" height="24" rx="4" fill="#10B981"/>
        <text x="200" y="265" textAnchor="middle" fill="#065F46" fontWeight="bold" fontSize="13" fontFamily="sans-serif">Compressed - Loads Fast</text>
      </svg>
    ),
    'change-background': (
      <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <defs><linearGradient id="acb1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#14B8A6"/><stop offset="100%" stopColor="#3B82F6"/></linearGradient></defs>
        <rect width="400" height="300" fill="url(#acb1)"/>
        <rect x="0" y="200" width="400" height="100" fill="#0F766E" opacity="0.5"/>
        <ellipse cx="200" cy="115" rx="50" ry="58" fill="white" opacity="0.3"/>
        <ellipse cx="200" cy="85" rx="30" ry="35" fill="white" opacity="0.5"/>
        <text x="200" y="265" textAnchor="middle" fill="white" fontWeight="bold" fontSize="13" fontFamily="sans-serif">AI Generated Background</text>
      </svg>
    ),
    'make-background-white': (
      <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <rect width="400" height="300" fill="white"/>
        <rect x="1" y="1" width="398" height="298" fill="none" stroke="#E5E7EB" strokeWidth="2"/>
        <ellipse cx="200" cy="140" rx="70" ry="80" fill="#374151" opacity="0.8"/>
        <ellipse cx="200" cy="106" rx="40" ry="46" fill="#4B5563"/>
        <text x="200" y="265" textAnchor="middle" fill="#374151" fontWeight="bold" fontSize="13" fontFamily="sans-serif">Pure White Background</text>
      </svg>
    ),
    'passport-photo': (
      <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <rect width="400" height="300" fill="white"/>
        <rect x="120" y="30" width="160" height="210" rx="4" fill="none" stroke="#EF4444" strokeWidth="3" strokeDasharray="6 3"/>
        <text x="200" y="22" textAnchor="middle" fill="#EF4444" fontSize="10" fontWeight="700" fontFamily="sans-serif">2 x 2 INCH</text>
        <rect x="132" y="42" width="136" height="186" fill="#F3F4F6"/>
        <ellipse cx="200" cy="140" rx="42" ry="55" fill="#6B7280"/>
        <ellipse cx="200" cy="112" rx="25" ry="30" fill="#9CA3AF"/>
        <text x="200" y="272" textAnchor="middle" fill="#B91C1C" fontWeight="bold" fontSize="13" fontFamily="sans-serif">US Passport Ready</text>
      </svg>
    ),
    'convert-to-png': (
      <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <rect width="400" height="300" fill="#FFF7ED"/>
        <rect x="100" y="60" width="200" height="160" rx="12" fill="#FFEDD5" stroke="#22C55E" strokeWidth="2.5"/>
        <text x="200" y="130" textAnchor="middle" fill="#15803D" fontSize="36" fontWeight="900" fontFamily="monospace">PNG</text>
        <text x="200" y="165" textAnchor="middle" fill="#16A34A" fontSize="14" fontFamily="sans-serif">Lossless Quality</text>
        <text x="200" y="265" textAnchor="middle" fill="#7C2D12" fontWeight="bold" fontSize="13" fontFamily="sans-serif">Converted - Full Quality</text>
      </svg>
    ),
    'convert-to-jpg': (
      <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <rect width="400" height="300" fill="#ECFEFF"/>
        <rect x="100" y="60" width="200" height="160" rx="12" fill="#CFFAFE" stroke="#22C55E" strokeWidth="2.5"/>
        <text x="200" y="130" textAnchor="middle" fill="#0E7490" fontSize="36" fontWeight="900" fontFamily="monospace">JPG</text>
        <text x="200" y="165" textAnchor="middle" fill="#0891B2" fontSize="14" fontFamily="sans-serif">80% Smaller</text>
        <text x="200" y="265" textAnchor="middle" fill="#164E63" fontWeight="bold" fontSize="13" fontFamily="sans-serif">Compressed - Shareable</text>
      </svg>
    ),
  }
  return (
    <div style={{ width: '100%', height: '100%', background: '#F0FDF4' }}>
      {visuals[pageId] ?? visuals['upscale']}
    </div>
  )
}

// ── Inline before/after slider ─────────────────────────────────────────────
function DemoSlider({ pageId, height = 280 }: { pageId: string; height?: number }) {
  const [pos, setPos] = useState(55)
  const [dragging, setDragging] = useState(false)
  const [paused, setPaused] = useState(false)

  const handleMove = (clientX: number, rect: DOMRect) => {
    const p = Math.min(92, Math.max(8, ((clientX - rect.left) / rect.width) * 100))
    setPos(p)
  }

  return (
    <div
      style={{ position: 'relative', width: '100%', height, borderRadius: 16, overflow: 'hidden', cursor: 'ew-resize', userSelect: 'none', boxShadow: '0 8px 40px rgba(0,0,0,0.12)' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => { setPaused(false); setDragging(false) }}
      onMouseDown={e => { setDragging(true); setPaused(true); handleMove(e.clientX, e.currentTarget.getBoundingClientRect()) }}
      onMouseMove={e => { if (dragging) handleMove(e.clientX, e.currentTarget.getBoundingClientRect()) }}
      onMouseUp={() => setDragging(false)}
      onTouchStart={e => { setPaused(true); handleMove(e.touches[0].clientX, e.currentTarget.getBoundingClientRect()) }}
      onTouchMove={e => { e.preventDefault(); handleMove(e.touches[0].clientX, e.currentTarget.getBoundingClientRect()) }}
    >
      {/* After layer (full) */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <AfterVisual pageId={pageId} />
      </div>
      {/* Before layer (clipped) */}
      <div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <BeforeVisual pageId={pageId} />
      </div>
      {/* Divider */}
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${pos}%`, width: 2, background: '#fff', transform: 'translateX(-50%)', zIndex: 10, boxShadow: '0 0 8px rgba(0,0,0,0.4)' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 38, height: 38, borderRadius: '50%', background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="18" height="12" viewBox="0 0 18 12" fill="none">
            <path d="M5 6L1 2.5M5 6L1 9.5M13 6L17 2.5M13 6L17 9.5" stroke="#6366F1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="9" y1="0" x2="9" y2="12" stroke="#6366F1" strokeWidth="1.5"/>
          </svg>
        </div>
      </div>
      {/* Labels */}
      <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(0,0,0,0.65)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6, zIndex: 5, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Before</div>
      <div style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(99,102,241,0.85)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6, zIndex: 5, letterSpacing: '0.06em', textTransform: 'uppercase' }}>After</div>
    </div>
  )
}

// ── Per-page content maps ──────────────────────────────────────────────────
const FEATURE_ROWS: Record<string, { badge: string; heading: string; body: string; visual: 'before' | 'after' | 'split' }[]> = {
  upscale: [
    { badge: 'AI Super-Resolution', heading: 'Recover stunning detail from any low-res photo', body: 'Deep learning super-resolution reconstructs sharp edges, fine textures, and crisp detail that traditional upscaling destroys. Hair, fabric, product labels - all rendered pixel-perfect at 4x the original size.', visual: 'split' },
    { badge: 'Lossless Quality', heading: 'Upscale to print-ready resolution - zero artifacts', body: 'No JPEG artifacts, no ringing, no over-sharpening. JPT AI produces clean, natural-looking high-resolution output ready for large-format printing, retina displays, and e-commerce listings.', visual: 'split' },
    { badge: 'Works on Everything', heading: 'Products, portraits, landscapes, AI art - all supported', body: 'Whether upscaling e-commerce product shots, restoring old family photos, or scaling AI-generated art for print - our model handles every subject type with equal precision.', visual: 'split' },
  ],
  'remove-bg': [
    { badge: 'Pixel-Perfect Cutout', heading: 'Remove backgrounds with studio-quality accuracy', body: 'AI detects subjects with pixel-level precision. Hair strands, fur, translucent fabric - all handled cleanly. Results indistinguishable from a professional Photoshop cutout.', visual: 'split' },
    { badge: 'E-Commerce Ready', heading: 'White background product photos in seconds', body: 'Amazon, Shopify, Etsy - all require clean white backgrounds. JPT AI delivers marketplace-compliant product shots automatically. Save hours vs. manual Photoshop editing.', visual: 'split' },
    { badge: 'Any Subject', heading: 'Works on people, products, pets, and more', body: 'From sharp product edges to wispy hair - our AI handles every subject type. Perfect for headshots, product photography, social media thumbnails, and ad creatives.', visual: 'split' },
  ],
  'watermark-remover': [
    { badge: 'AI Watermark Detection', heading: 'Detect and remove watermarks automatically', body: 'AI identifies text overlays, logos, timestamps, and semi-transparent watermarks of any size or placement - then cleanly fills the area with reconstructed content.', visual: 'split' },
    { badge: 'Content-Aware Fill', heading: 'Remove without leaving a blur or smear', body: 'Unlike basic inpainting tools that smear or blur the removal area, JPT AI reconstructs the underlying image using surrounding context for seamless, undetectable results.', visual: 'split' },
    { badge: 'Every Watermark Type', heading: 'Text, logos, dates, preview marks - all removed', body: 'Handles stock site watermarks, photographer copyright text, date stamps, logo overlays, and promotional banners - regardless of position, opacity, or font style.', visual: 'split' },
  ],
  'photo-enhancer': [
    { badge: 'Auto Enhancement', heading: 'Fix brightness, contrast and sharpness automatically', body: 'AI analyzes each photo and applies optimal corrections - boosting shadow detail, balancing highlights, sharpening edges. No sliders, no guesswork, instant professional results.', visual: 'split' },
    { badge: 'Old Photo Restoration', heading: 'Restore faded vintage photos to vivid color', body: 'Recover detail from aged, faded, or damaged photographs. AI removes grain, corrects color shift, and restores sharpness lost over decades of aging.', visual: 'split' },
    { badge: 'Resolution Upscaling', heading: '4x resolution - retina-ready for print and web', body: 'Increase resolution 2x or 4x using deep learning AI. Results are indistinguishable from the original high-resolution source - perfect for printing and large displays.', visual: 'split' },
  ],
  'compress-image': [
    { badge: 'Smart Compression', heading: 'Reduce file size 80% with zero visible quality loss', body: 'AI-powered compression targets redundant data while preserving visual quality. Results are indistinguishable at full size - but load dramatically faster on web and email.', visual: 'split' },
    { badge: 'Core Web Vitals', heading: 'Pass Google PageSpeed - rank higher in search', body: 'Image size is the #1 cause of slow websites. Google rewards fast pages with higher search rankings. Compress your images and improve your Core Web Vitals score instantly.', visual: 'split' },
    { badge: 'Batch Ready', heading: 'Compress entire image libraries at once', body: 'Process product catalogs, blog image archives, and marketing asset libraries in minutes. Save storage, reduce bandwidth costs, and deliver faster experiences.', visual: 'split' },
  ],
}
const getFeatureRows = (id: string) => FEATURE_ROWS[id] ?? FEATURE_ROWS['upscale']

const USE_CASES: Record<string, { label: string; heading: string; desc: string }[]> = {
  upscale: [
    { label: 'E-Commerce', heading: 'Sharper product images - higher conversions', desc: 'Upscale blurry product photos to retina quality. E-commerce listings with high-resolution images convert up to 94% better. No reshooting needed.' },
    { label: 'Old Photos', heading: 'Restore vintage photos to vivid clarity', desc: 'Bring scanned family photos and vintage prints back to life. AI recovers detail lost to age, scanning artifacts, and compression.' },
    { label: 'AI Art', heading: 'Scale AI art to print-ready resolution', desc: 'AI-generated images at 512px or 1024px upscale beautifully to 2048px and beyond for canvas prints, posters, and merchandise.' },
    { label: 'Social Media', heading: 'Retina-quality visuals for every platform', desc: 'Upload compressed downloads or screenshots and upscale to Instagram, LinkedIn, and TikTok standards - crisp on every screen.' },
    { label: 'Print & Canvas', heading: 'Large-format print from small originals', desc: 'Starting from a small phone photo, upscale 4x for high-quality A1/A2 posters, canvas prints, and merchandise.' },
  ],
  'remove-bg': [
    { label: 'E-Commerce', heading: 'Amazon and Shopify white background shots', desc: 'Amazon requires pure white backgrounds on all main product images. JPT AI delivers marketplace-compliant photos in seconds - no studio needed.' },
    { label: 'Headshots', heading: 'Professional LinkedIn profile photos', desc: 'LinkedIn profiles with professional headshots get 21x more views. Remove distracting backgrounds and add a clean professional backdrop.' },
    { label: 'Thumbnails', heading: 'Eye-catching YouTube and social thumbnails', desc: 'Cut out subjects for bold, high-contrast thumbnails that drive clicks. Place on any background - gradient, solid color, or custom scene.' },
    { label: 'Ad Creatives', heading: 'Marketing assets in minutes, not days', desc: 'Remove backgrounds from product photos and people to create flexible assets for ads, emails, flyers, and presentations across every platform.' },
    { label: 'Real Estate', heading: 'Clean property and furniture photography', desc: 'Remove cluttered backgrounds from furniture and product photos. Create clean shots that highlight the item - not the room it was shot in.' },
  ],
  'watermark-remover': [
    { label: 'Copyright Text', heading: 'Remove copyright text overlays instantly', desc: 'AI precisely detects and removes photographer watermarks, copyright notices, and name overlays - restoring the original image cleanly.' },
    { label: 'Logo Marks', heading: 'Remove brand logo watermarks', desc: 'Strip brand logos and icon watermarks placed over images. AI reconstructs the underlying content so removal is seamless and undetectable.' },
    { label: 'Date Stamps', heading: 'Remove camera date stamps from old photos', desc: 'Those orange date stamps from 90s cameras are gone in seconds. AI fills the area with perfect matching content from the surrounding image.' },
    { label: 'Stock Photos', heading: 'Clean stock site watermarks from previews', desc: 'Identify and remove watermark patterns used by stock photo sites. Perfect for mockups, presentations, and client previews.' },
    { label: 'Preview Marks', heading: 'Remove diagonal PREVIEW and SAMPLE text', desc: 'Strip preview watermarks - diagonal text, repeated patterns, and overlaid banners - leaving only the clean, original image.' },
  ],
  'photo-enhancer': [
    { label: 'Old Photos', heading: 'Restore faded family photographs', desc: 'Recover detail from aged, faded prints. AI corrects yellowing, removes grain, and sharpens detail lost over decades.' },
    { label: 'Portraits', heading: 'Professional portrait enhancement', desc: 'Brighten eyes, enhance portrait clarity - subtly, without the over-processed look of heavy retouching filters.' },
    { label: 'Products', heading: 'Sharper product photos for listings', desc: 'Fix dark, blurry, or dull product shots. AI boosts detail, corrects color, and sharpens edges so your listing stands out.' },
    { label: 'Events', heading: 'Rescue dark or blurry event photos', desc: 'Indoor event photos often suffer from poor lighting and motion blur. AI enhancement rescues dark, noisy, and blurry captures.' },
    { label: 'Travel', heading: 'Bring travel memories back to life', desc: 'Holiday and travel photos taken on older phones or in low light come out dramatically better with AI color restoration and sharpening.' },
  ],
  'compress-image': [
    { label: 'Websites', heading: 'Pass Core Web Vitals. Rank higher.', desc: 'Google uses page speed as a ranking factor. Images account for 60% of page weight. Compress your images and watch your PageSpeed score jump.' },
    { label: 'E-Commerce', heading: 'Faster product pages - more conversions', desc: 'A 1-second improvement in mobile page load improves conversions by 27%. Compress your entire product catalog for measurable revenue impact.' },
    { label: 'Email', heading: 'Email images that actually load', desc: 'Large images in emails trigger spam filters and never load for recipients. Compress to under 200KB and ensure every subscriber sees your campaign.' },
    { label: 'Apps', heading: 'Smaller app bundles, faster downloads', desc: 'Every KB of image assets your app downloads costs users time and data. Compress assets to reduce APK/IPA size and improve app store ratings.' },
    { label: 'Storage', heading: 'Cut storage costs without losing quality', desc: 'Compress your photo library and cloud storage bills drop proportionally. Reduces file sizes 60-80% with zero visible quality difference.' },
  ],
}
const getUseCases = (id: string) => USE_CASES[id] ?? USE_CASES['upscale']

const COMPARISON: Record<string, { feature: string; jpt: boolean; alt1: boolean; alt2: boolean; alt1name: string; alt2name: string }[]> = {
  upscale: [
    { feature: '4x AI Super-Resolution', jpt: true, alt1: false, alt2: true, alt1name: 'Photoshop', alt2name: "Let's Enhance" },
    { feature: 'Free tier - no credit card', jpt: true, alt1: false, alt2: false, alt1name: 'Photoshop', alt2name: "Let's Enhance" },
    { feature: 'No watermark on output', jpt: true, alt1: true, alt2: false, alt1name: 'Photoshop', alt2name: "Let's Enhance" },
    { feature: 'Works 100% in browser', jpt: true, alt1: false, alt2: true, alt1name: 'Photoshop', alt2name: "Let's Enhance" },
    { feature: 'BG removal + AI editing too', jpt: true, alt1: true, alt2: false, alt1name: 'Photoshop', alt2name: "Let's Enhance" },
    { feature: 'No signup to try', jpt: true, alt1: false, alt2: false, alt1name: 'Photoshop', alt2name: "Let's Enhance" },
  ],
  'remove-bg': [
    { feature: 'Free tier - no credit card', jpt: true, alt1: false, alt2: true, alt1name: 'Photoshop', alt2name: 'remove.bg' },
    { feature: 'No watermark on free tier', jpt: true, alt1: false, alt2: false, alt1name: 'Photoshop', alt2name: 'remove.bg' },
    { feature: 'AI image editing included', jpt: true, alt1: true, alt2: false, alt1name: 'Photoshop', alt2name: 'remove.bg' },
    { feature: '4x AI upscaling included', jpt: true, alt1: true, alt2: false, alt1name: 'Photoshop', alt2name: 'remove.bg' },
    { feature: 'Works in browser', jpt: true, alt1: false, alt2: true, alt1name: 'Photoshop', alt2name: 'remove.bg' },
    { feature: 'No signup to try', jpt: true, alt1: false, alt2: true, alt1name: 'Photoshop', alt2name: 'remove.bg' },
  ],
  'watermark-remover': [
    { feature: 'AI-based removal (no smearing)', jpt: true, alt1: false, alt2: false, alt1name: 'GIMP', alt2name: 'Inpaint.io' },
    { feature: 'Free - no credit card', jpt: true, alt1: true, alt2: false, alt1name: 'GIMP', alt2name: 'Inpaint.io' },
    { feature: 'No watermark on output', jpt: true, alt1: true, alt2: false, alt1name: 'GIMP', alt2name: 'Inpaint.io' },
    { feature: 'Works in browser', jpt: true, alt1: false, alt2: true, alt1name: 'GIMP', alt2name: 'Inpaint.io' },
    { feature: 'BG removal + upscaling too', jpt: true, alt1: false, alt2: false, alt1name: 'GIMP', alt2name: 'Inpaint.io' },
    { feature: 'No signup to try', jpt: true, alt1: false, alt2: false, alt1name: 'GIMP', alt2name: 'Inpaint.io' },
  ],
  'compress-image': [
    { feature: 'Free - no credit card', jpt: true, alt1: true, alt2: false, alt1name: 'TinyPNG', alt2name: 'Squoosh Pro' },
    { feature: 'No watermark', jpt: true, alt1: true, alt2: true, alt1name: 'TinyPNG', alt2name: 'Squoosh Pro' },
    { feature: 'AI upscaling too', jpt: true, alt1: false, alt2: false, alt1name: 'TinyPNG', alt2name: 'Squoosh Pro' },
    { feature: 'BG removal too', jpt: true, alt1: false, alt2: false, alt1name: 'TinyPNG', alt2name: 'Squoosh Pro' },
    { feature: 'Works in browser', jpt: true, alt1: true, alt2: true, alt1name: 'TinyPNG', alt2name: 'Squoosh Pro' },
    { feature: 'No signup needed', jpt: true, alt1: true, alt2: false, alt1name: 'TinyPNG', alt2name: 'Squoosh Pro' },
  ],
}

const TESTIMONIALS: Record<string, { name: string; role: string; avatar: string; quote: string }[]> = {
  upscale: [
    { name: 'Marcus Johnson', role: 'E-commerce Seller, Austin TX', avatar: 'MJ', quote: 'Had hundreds of old product photos shot on a phone. After upscaling they look like studio shots. My conversion rate improved noticeably.' },
    { name: 'Sarah Mitchell', role: 'Photographer, New York', avatar: 'SM', quote: 'The AI preserves texture and detail unlike any other online tool. Hair, fabric, skin - all looks natural after upscaling.' },
    { name: 'Derek Chen', role: 'Graphic Designer, San Francisco', avatar: 'DC', quote: 'I use it to upscale AI-generated art before printing. 4x and the results are ready for A2 poster prints. Incredible quality.' },
    { name: 'Priya Nair', role: 'Etsy Seller, Portland', avatar: 'PN', quote: 'My handmade jewelry photos were blurry on Etsy. Upscaling made them look professional. Sales went up 40% that month.' },
    { name: 'Tom Bradley', role: 'Marketing Director, Chicago', avatar: 'TB', quote: 'We use it for old campaign assets that need updating for 4K screens. Saves us a full photo reshoot every time.' },
    { name: 'Lisa Park', role: 'Print Designer, Seattle', avatar: 'LP', quote: 'I regularly upscale client logos for large-format banners. Results are always sharp with zero pixelation artifacts.' },
  ],
  'remove-bg': [
    { name: 'Jessica Park', role: 'E-commerce Owner, Los Angeles', avatar: 'JP', quote: 'Was spending 30 min per product photo in Photoshop. Now I process 40 images before my morning coffee. Store looks completely professional.' },
    { name: 'Ryan Torres', role: 'Freelance Photographer, Miami', avatar: 'RT', quote: 'Background removal on hair and fine edges is flawless. Clients cannot tell the difference from a manual Photoshop cutout.' },
    { name: 'Amanda Lee', role: 'Social Media Manager, Chicago', avatar: 'AL', quote: 'Switched from remove.bg - same quality but JPT AI has all the other tools too. No watermarks, instant results. Love it.' },
    { name: 'Carlos Rivera', role: 'Fashion Brand, Miami', avatar: 'CR', quote: 'We do ghost mannequin shots for our entire clothing line. JPT AI handles fabric edges perfectly every single time.' },
    { name: 'Kevin Walsh', role: 'LinkedIn Coach, Boston', avatar: 'KW', quote: 'My clients use it for headshots. A clean background adds instant professionalism. Connection requests go up noticeably after.' },
    { name: 'Emma Collins', role: 'Content Creator, Nashville', avatar: 'EC', quote: 'Thumbnail backgrounds removed in seconds. My YouTube click-through rate improved 18% after switching to clean cutouts.' },
  ],
  'watermark-remover': [
    { name: 'Alex Morgan', role: 'Blogger, Austin TX', avatar: 'AM', quote: 'I needed clean reference images for my blog posts. JPT AI removed the watermarks perfectly - not a trace left behind.' },
    { name: 'Nina Patel', role: 'Content Creator, Chicago', avatar: 'NP', quote: 'Old family photos had date stamps all over them. This tool removed every single one cleanly. The family was amazed.' },
    { name: 'James Carter', role: 'Marketing Manager, Seattle', avatar: 'JC', quote: 'Used it to clean up stock photo previews for client presentations. The results were seamless - indistinguishable from the original.' },
    { name: 'Sofia Rodriguez', role: 'Graphic Designer, Miami', avatar: 'SR', quote: 'Clients send me photos with overlaid text all the time. JPT AI removes it cleanly in seconds. Saves me an hour of Photoshop.' },
    { name: 'Tyler Brooks', role: 'Social Media Manager, Denver', avatar: 'TB', quote: 'Cleaned up hundreds of old product images that had promotional banners overlaid. The AI reconstruction is remarkably accurate.' },
    { name: 'Rachel Kim', role: 'E-commerce Owner, Phoenix', avatar: 'RK', quote: 'Our supplier sends product photos with their logo watermark. JPT AI removes them perfectly so we can brand them ourselves.' },
  ],
  'photo-enhancer': [
    { name: 'Tyler Brooks', role: 'Family Photographer, Denver', avatar: 'TB', quote: 'My parents wedding photos from the 70s came out of this tool looking like they were taken last year. The family was speechless.' },
    { name: 'Natalie Grant', role: 'Blogger, Seattle', avatar: 'NG', quote: 'My old travel photos from 2012 on a terrible point-and-shoot look stunning now. The color restoration is incredible.' },
    { name: 'Kevin Walsh', role: 'Freelance Consultant, Denver', avatar: 'KW', quote: 'Used it to enhance product shots taken in bad lighting. Clients cannot believe the difference - looks like a professional studio shot.' },
    { name: 'Sophie Anderson', role: 'Event Photographer, Chicago', avatar: 'SA', quote: 'Rescues my indoor event shots. Low-light photos come out sharp and properly exposed. Saves me 2 hours of Lightroom editing per event.' },
    { name: 'James Miller', role: 'Genealogy Researcher, Boston', avatar: 'JM', quote: 'I digitize old family photos for research. JPT AI restores them so clearly you can read text on documents from 1920.' },
    { name: 'Rachel Kim', role: 'Real Estate Agent, Phoenix', avatar: 'RK', quote: 'Enhancing interior listing photos takes 10 seconds per image now. Brighter, sharper, more professional. My listings get more views.' },
  ],
  'compress-image': [
    { name: 'David Wilson', role: 'Web Developer, Austin', avatar: 'DW', quote: 'Cut my homepage image sizes by 70% without any visible quality loss. My Core Web Vitals score jumped 18 points.' },
    { name: 'Emma Davis', role: 'Blogger, Seattle', avatar: 'ED', quote: 'Finally a free image compressor that does not add a watermark. My blog loads 3x faster now. Google loves it.' },
    { name: 'James Taylor', role: 'Shopify Developer, Atlanta', avatar: 'JT', quote: 'Compressed an entire product catalog in minutes. Page load dropped from 4.2s to 1.8s. Client is thrilled.' },
    { name: 'Nina Patel', role: 'SEO Specialist, Chicago', avatar: 'NP', quote: 'Image compression is an SEO non-negotiable. This tool makes it effortless - no more excuses from clients about slow sites.' },
    { name: 'Chris Morgan', role: 'E-commerce Director, Phoenix', avatar: 'CM', quote: 'Reduced our product image library from 4GB to 900MB with zero visible loss. CDN costs dropped significantly.' },
    { name: 'Lauren Kim', role: 'UX Designer, Portland', avatar: 'LK', quote: 'I compress every design export before handing off. Developers love me for it and pages load instantly.' },
  ],
}
const getTestimonials = (id: string) => TESTIMONIALS[id] ?? TESTIMONIALS['upscale']

const RELATED_TOOLS = [
  { label: 'AI Upscale', href: '/upscale', icon: '🔍', desc: 'Enlarge images 4x with AI' },
  { label: 'Remove Background', href: '/remove-bg', icon: '🪄', desc: 'One-click background removal' },
  { label: 'Photo Enhancer', href: '/photo-enhancer', icon: '✨', desc: 'Restore and enhance quality' },
  { label: 'Compress Image', href: '/compress-image', icon: '⚡', desc: 'Reduce file size 80%' },
  { label: 'Change Background', href: '/change-background', icon: '🌅', desc: 'Replace with AI background' },
  { label: 'Watermark Remover', href: '/watermark-remover', icon: '🧹', desc: 'Remove any watermark' },
  { label: 'White Background', href: '/make-background-white', icon: '⬜', desc: 'Amazon-ready white background' },
  { label: 'Convert to PNG', href: '/convert-to-png', icon: '🔄', desc: 'JPG/WEBP to PNG free' },
  { label: 'Convert to JPG', href: '/convert-to-jpg', icon: '🔄', desc: 'PNG/WEBP to JPG free' },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Upload Your Image', desc: 'Drag & drop or click to select any photo. JPG, PNG, WEBP supported. No account needed to start.' },
  { step: '02', title: 'AI Processes in Seconds', desc: 'Our AI analyzes your image and applies the transformation instantly - right in your browser. No waiting.' },
  { step: '03', title: 'Download in Full Quality', desc: 'Preview the before/after result, then download - no watermark, no login, no hidden fees.' },
]

// ── Main Component ─────────────────────────────────────────────────────────
export default function LandingPage({ config, toolHref, pageId }: LandingPageProps) {
  const [activeTab, setActiveTab] = useState(0)
  const a = accent(pageId)
  const featureRows = getFeatureRows(pageId)
  const useCases = getUseCases(pageId)
  const comparison = COMPARISON[pageId]
  const testimonials = getTestimonials(pageId)
  const related = RELATED_TOOLS.filter(t => !t.href.includes(pageId))

  const h2 = { fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontWeight: 900, color: '#111827', lineHeight: 1.1, letterSpacing: '-0.03em', margin: 0 } as const
  const h2Light = { ...h2, color: '#fff' } as const
  const label = { fontSize: 11, fontWeight: 800, color: '#7C3AED', textTransform: 'uppercase' as const, letterSpacing: '0.12em', marginBottom: 12 }
  const body = { fontSize: 16, color: '#4B5563', lineHeight: 1.75, margin: 0 } as const

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif', color: '#111827', background: '#FAFAF8' }}>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section style={{ background: '#FAFAF8', paddingTop: 52, paddingBottom: 0 }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 48, alignItems: 'center' }}>

            {/* Left: demo slider */}
            <div>
              <DemoSlider pageId={pageId} height={300} />
              <p style={{ textAlign: 'center', fontSize: 13, color: '#9CA3AF', marginTop: 10 }}>
                Drag slider to compare &bull; Interactive demo
              </p>
            </div>

            {/* Right: headline + CTA */}
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: a.badge, color: a.from, fontWeight: 700, fontSize: 11, borderRadius: 20, padding: '5px 14px', marginBottom: 18, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
                Free Online Tool - No Signup
              </div>

              <h1 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', fontWeight: 900, color: '#111827', lineHeight: 1.08, letterSpacing: '-0.03em', margin: '0 0 16px' }}>
                {config.h1}
              </h1>

              <p style={{ fontSize: 16, color: '#4B5563', lineHeight: 1.7, margin: '0 0 22px', maxWidth: 440 }}>
                {config.subtitle}
              </p>

              {/* Trust badges */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px', marginBottom: 28 }}>
                {['No credit card required', 'No watermark', 'No signup needed'].map(t => (
                  <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#374151', fontWeight: 500 }}>
                    <svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="8" fill="#22C55E"/><path d="M5 8l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
                    {t}
                  </span>
                ))}
              </div>

              <a href={toolHref} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: '#111827', color: '#fff', fontWeight: 800, fontSize: 16, padding: '15px 36px', borderRadius: 14, textDecoration: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.18)', letterSpacing: '-0.01em' }}>
                {config.cta_text || 'Try It Free'} &rarr;
              </a>
              <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 10 }}>5 free uses &bull; No credit card</div>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div style={{ background: '#111827', marginTop: 52, padding: '20px 24px' }}>
          <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 16 }}>
            {[['500K+', 'Images Processed'], ['< 5 sec', 'Processing Time'], ['No Signup', 'Free to Try'], ['No Watermark', 'On Download']].map(([val, lbl]) => (
              <div key={lbl} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>{val}</div>
                <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500, marginTop: 3, letterSpacing: '0.04em', textTransform: 'uppercase' as const }}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section style={{ padding: '88px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div style={label}>How it works</div>
            <h2 style={h2}>Three steps. Ten seconds total.</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 0 }}>
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.step} style={{ padding: '0 32px', textAlign: 'center', borderRight: i < HOW_IT_WORKS.length - 1 ? '1px solid #E5E7EB' : 'none' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', border: '2px solid #E5E7EB', background: '#FAFAF8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#374151', fontWeight: 900, fontSize: 18 }}>{step.step}</div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: '0 0 10px' }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.7, margin: 0 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURE ROWS ─────────────────────────────────────────────────── */}
      {featureRows.map((row, i) => (
        <section key={i} style={{ padding: '80px 24px', background: i % 2 === 0 ? '#FAFAF8' : '#fff' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 64, alignItems: 'center' }}>
            {/* Text block */}
            <div style={{ order: i % 2 === 0 ? 0 : 1 }}>
              <div style={{ display: 'inline-block', background: a.badge, color: a.from, fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' as const, padding: '5px 14px', borderRadius: 20, marginBottom: 20 }}>{row.badge}</div>
              <h2 style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2.1rem)', fontWeight: 900, color: '#111827', lineHeight: 1.15, letterSpacing: '-0.025em', margin: '0 0 18px' }}>{row.heading}</h2>
              <p style={{ fontSize: 16, color: '#4B5563', lineHeight: 1.75, margin: '0 0 28px' }}>{row.body}</p>
              <a href={toolHref} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#111827', color: '#fff', fontWeight: 700, fontSize: 15, padding: '12px 28px', borderRadius: 12, textDecoration: 'none' }}>
                Try it free &rarr;
              </a>
            </div>
            {/* Visual */}
            <div style={{ order: i % 2 === 0 ? 1 : 0 }}>
              <DemoSlider pageId={pageId} height={260} />
            </div>
          </div>
        </section>
      ))}

      {/* ── USE CASE TABS ─────────────────────────────────────────────────── */}
      <section style={{ padding: '88px 24px', background: '#111827' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ ...label, color: '#A78BFA' }}>Use Cases</div>
            <h2 style={h2Light}>Built for every creative workflow</h2>
          </div>

          {/* Tab pills */}
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 48 }}>
            {useCases.map((uc, i) => (
              <button key={uc.label} onClick={() => setActiveTab(i)} style={{ padding: '8px 20px', borderRadius: 24, border: '1.5px solid', borderColor: activeTab === i ? '#A78BFA' : 'rgba(255,255,255,0.15)', background: activeTab === i ? '#7C3AED' : 'transparent', color: activeTab === i ? '#fff' : 'rgba(255,255,255,0.6)', fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.18s' }}>
                {uc.label}
              </button>
            ))}
          </div>

          {/* Active tab */}
          {useCases[activeTab] && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 56, alignItems: 'center' }}>
              <DemoSlider pageId={pageId} height={260} />
              <div>
                <h3 style={{ fontSize: 'clamp(1.3rem, 2vw, 1.8rem)', fontWeight: 900, color: '#fff', lineHeight: 1.2, margin: '0 0 16px' }}>{useCases[activeTab].heading}</h3>
                <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', lineHeight: 1.75, margin: '0 0 28px' }}>{useCases[activeTab].desc}</p>
                <a href={toolHref} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#7C3AED', color: '#fff', fontWeight: 700, fontSize: 15, padding: '12px 28px', borderRadius: 12, textDecoration: 'none' }}>
                  Try it free &rarr;
                </a>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────────── */}
      <section style={{ padding: '88px 0', background: '#FAFAF8', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', paddingLeft: 24, marginBottom: 48 }}>
          <div style={label}>What users say</div>
          <h2 style={h2}>Loved by creators &amp; businesses</h2>
        </div>
        {[0, 1].map(row => (
          <div key={row} style={{ overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 20, animation: `marquee${row === 0 ? '' : '-rev'} ${row === 0 ? 38 : 42}s linear infinite`, width: 'max-content' }}>
              {[...testimonials, ...testimonials].map((t, idx) => (
                <div key={idx} style={{ width: 320, flexShrink: 0, background: '#fff', borderRadius: 16, padding: '22px 20px', border: '1.5px solid #E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', gap: 2, marginBottom: 12 }}>
                    {Array.from({ length: 5 }).map((_, i) => <span key={i} style={{ color: '#F59E0B', fontSize: 14 }}>★</span>)}
                  </div>
                  <p style={{ margin: '0 0 16px', fontSize: 14, color: '#374151', lineHeight: 1.7, fontStyle: 'italic' }}>&ldquo;{t.quote}&rdquo;</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg, ${a.from}, ${a.to})`, color: '#fff', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{t.avatar}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#111827' }}>{t.name}</div>
                      <div style={{ fontSize: 11, color: '#9CA3AF' }}>{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        <style>{`
          @keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
          @keyframes marquee-rev { from { transform: translateX(-50%) } to { transform: translateX(0) } }
        `}</style>
      </section>

      {/* ── COMPARISON ───────────────────────────────────────────────────── */}
      {comparison && (() => {
        const alt1 = comparison[0].alt1name
        const alt2 = comparison[0].alt2name
        return (
          <section style={{ padding: '88px 24px', background: '#fff' }}>
            <div style={{ maxWidth: 840, margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: 52 }}>
                <div style={label}>Comparison</div>
                <h2 style={h2}>JPT AI vs the alternatives</h2>
                <p style={{ fontSize: 16, color: '#6B7280', marginTop: 14, maxWidth: 480, margin: '14px auto 0' }}>One tool. Everything included. No hidden paywalls.</p>
              </div>
              <div style={{ borderRadius: 20, border: '1.5px solid #E5E7EB', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: '#F9FAFB' }}>
                      <th style={{ textAlign: 'left', padding: '14px 20px', color: '#6B7280', fontWeight: 700, fontSize: 12, borderBottom: '1.5px solid #E5E7EB' }}>Feature</th>
                      <th style={{ textAlign: 'center', padding: '14px 20px', color: '#7C3AED', fontWeight: 900, fontSize: 12, background: '#F5F3FF', borderBottom: '1.5px solid #E5E7EB' }}>JPT AI</th>
                      <th style={{ textAlign: 'center', padding: '14px 20px', color: '#6B7280', fontWeight: 700, fontSize: 12, borderBottom: '1.5px solid #E5E7EB' }}>{alt1}</th>
                      <th style={{ textAlign: 'center', padding: '14px 20px', color: '#6B7280', fontWeight: 700, fontSize: 12, borderBottom: '1.5px solid #E5E7EB' }}>{alt2}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.map((row, i) => (
                      <tr key={row.feature} style={{ borderBottom: i < comparison.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                        <td style={{ padding: '13px 20px', color: '#374151', fontWeight: 500 }}>{row.feature}</td>
                        <td style={{ textAlign: 'center', padding: '13px 20px', background: '#FAFAFF' }}>
                          <span style={{ color: row.jpt ? '#16A34A' : '#DC2626', fontSize: 18, fontWeight: 900 }}>{row.jpt ? '✓' : '✗'}</span>
                        </td>
                        <td style={{ textAlign: 'center', padding: '13px 20px' }}>
                          <span style={{ color: row.alt1 ? '#16A34A' : '#DC2626', fontSize: 18, fontWeight: 900 }}>{row.alt1 ? '✓' : '✗'}</span>
                        </td>
                        <td style={{ textAlign: 'center', padding: '13px 20px' }}>
                          <span style={{ color: row.alt2 ? '#16A34A' : '#DC2626', fontSize: 18, fontWeight: 900 }}>{row.alt2 ? '✓' : '✗'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )
      })()}

      {/* ── RELATED TOOLS ────────────────────────────────────────────────── */}
      <section style={{ padding: '72px 0', background: '#FAFAF8' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', paddingLeft: 24, marginBottom: 36 }}>
          <div style={label}>Related Tools</div>
          <h2 style={{ ...h2, fontSize: 'clamp(1.5rem, 2.5vw, 2rem)' }}>More AI tools you&apos;ll love</h2>
        </div>
        <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingLeft: 24, paddingRight: 24, paddingBottom: 8, scrollbarWidth: 'none' as const }}>
          {related.map(tool => (
            <a key={tool.href} href={tool.href} style={{ flexShrink: 0, width: 210, background: '#fff', borderRadius: 16, border: '1.5px solid #E5E7EB', padding: '20px 18px', textDecoration: 'none' }}>
              <div style={{ fontSize: 26, marginBottom: 10 }}>{tool.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#111827', marginBottom: 5 }}>{tool.label}</div>
              <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.5 }}>{tool.desc}</div>
            </a>
          ))}
        </div>
      </section>

      {/* ── MID-PAGE CTA ─────────────────────────────────────────────────── */}
      <section style={{ padding: '0 24px 88px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', background: '#111827', borderRadius: 28, padding: '56px 48px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -80, right: -80, width: 280, height: 280, background: `radial-gradient(circle, ${a.from}55 0%, transparent 70%)`, pointerEvents: 'none' }} />
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: `${a.from}33`, color: '#C4B5FD', fontWeight: 700, fontSize: 11, borderRadius: 20, padding: '5px 14px', marginBottom: 20, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>Free to try</div>
            <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 900, color: '#fff', margin: '0 0 14px', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              Ready to transform your images?
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', margin: '0 0 32px' }}>No credit card required. Instant results. No watermarks.</p>
            <a href={toolHref} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: '#111827', fontWeight: 800, fontSize: 16, padding: '16px 40px', borderRadius: 14, textDecoration: 'none' }}>
              {config.cta_text || 'Try It Free'} &rarr;
            </a>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      {config.faq?.length > 0 && (
        <section style={{ padding: '0 24px 88px', background: '#fff' }}>
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 52, paddingTop: 72 }}>
              <div style={label}>FAQ</div>
              <h2 style={h2}>Frequently asked questions</h2>
            </div>
            <FAQAccordion faqs={config.faq} />
          </div>
        </section>
      )}

    </div>
  )
}

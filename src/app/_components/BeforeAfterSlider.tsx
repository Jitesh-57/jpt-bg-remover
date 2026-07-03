'use client'

import { useRef, useState, useEffect } from 'react'

interface BeforeAfterSliderProps {
  beforeSrc?: string
  afterSrc?: string
  beforeLabel?: string
  afterLabel?: string
  autoPlay?: boolean          // animate the slider automatically
  autoPlaySpeed?: number      // pixels per frame
  beforeFilter?: string       // CSS filter for before side (e.g. blur/pixelate simulation)
  beforeOverlay?: React.ReactNode   // e.g. watermark text overlay
  aspectRatio?: string        // e.g. '16/9' or '4/3'
  rounded?: number            // border-radius
  height?: number             // fixed height in px (overrides aspectRatio)
}

/**
 * A draggable before/after comparison slider.
 * If autoPlay=true it oscillates back and forth until the user touches it.
 */
export default function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeLabel = 'Before',
  afterLabel = 'After',
  autoPlay = false,
  autoPlaySpeed = 0.3,
  beforeFilter,
  beforeOverlay,
  aspectRatio = '16/9',
  rounded = 16,
  height,
}: BeforeAfterSliderProps) {
  const [pos, setPos] = useState(50)
  const dragging = useRef(false)
  const paused = useRef(false)
  const rafRef = useRef<number | null>(null)
  const dirRef = useRef<1 | -1>(-1)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!autoPlay) return
    let p = 75
    dirRef.current = -1

    function tick() {
      if (!paused.current) {
        p += dirRef.current * autoPlaySpeed
        if (p <= 20) { p = 20; dirRef.current = 1 }
        if (p >= 75) { p = 75; dirRef.current = -1 }
        setPos(p)
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [autoPlay, autoPlaySpeed])

  const updatePos = (clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    setPos(Math.min(95, Math.max(5, ((clientX - rect.left) / rect.width) * 100)))
  }

  const imgStyle: React.CSSProperties = {
    position: 'absolute', inset: 0, width: '100%', height: '100%',
    objectFit: 'cover', display: 'block', userSelect: 'none',
  }

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => { paused.current = true }}
      onMouseLeave={() => { paused.current = false; dragging.current = false }}
      onMouseDown={e => { dragging.current = true; paused.current = true; updatePos(e.clientX) }}
      onMouseMove={e => { if (dragging.current) updatePos(e.clientX) }}
      onMouseUp={() => { dragging.current = false }}
      onTouchStart={e => { paused.current = true; updatePos(e.touches[0].clientX) }}
      onTouchMove={e => { e.preventDefault(); updatePos(e.touches[0].clientX) }}
      onTouchEnd={() => { paused.current = false }}
      style={{
        position: 'relative',
        borderRadius: rounded,
        overflow: 'hidden',
        cursor: 'ew-resize',
        userSelect: 'none',
        aspectRatio: height ? undefined : aspectRatio,
        height: height ? `${height}px` : undefined,
        background: '#e5e7eb',
        boxShadow: '0 4px 32px rgba(0,0,0,0.10)',
      }}
    >
      {/* ── AFTER (bottom layer, full width) */}
      {afterSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={afterSrc} alt={afterLabel} style={{ ...imgStyle }} draggable={false} />
      ) : (
        <div style={{ ...imgStyle, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)' }} />
      )}

      {/* ── BEFORE (top layer, clipped to left of slider) */}
      <div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        {beforeSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={beforeSrc}
            alt={beforeLabel}
            draggable={false}
            style={{ ...imgStyle, filter: beforeFilter }}
          />
        ) : (
          <div style={{ ...imgStyle, background: '#e2e8f0', filter: beforeFilter }} />
        )}
        {/* Watermark / overlay on before side */}
        {beforeOverlay && (
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>{beforeOverlay}</div>
        )}
      </div>

      {/* ── DIVIDER */}
      <div style={{
        position: 'absolute', top: 0, bottom: 0,
        left: `${pos}%`, width: 2, background: '#fff',
        transform: 'translateX(-50%)', pointerEvents: 'none',
        boxShadow: '0 0 8px rgba(0,0,0,0.3)', zIndex: 10,
      }}>
        {/* Handle circle */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          width: 36, height: 36, borderRadius: '50%',
          background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
            <path d="M5 7L1 3.5M5 7L1 10.5M13 7L17 3.5M13 7L17 10.5" stroke="#6366F1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="9" y1="1" x2="9" y2="13" stroke="#6366F1" strokeWidth="1.5"/>
          </svg>
        </div>
      </div>

      {/* ── LABELS */}
      <div style={{
        position: 'absolute', bottom: 12, left: 12,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        color: '#fff', fontSize: 11, fontWeight: 700,
        letterSpacing: '0.08em', textTransform: 'uppercase',
        padding: '4px 10px', borderRadius: 6, pointerEvents: 'none',
        zIndex: 5,
      }}>
        {beforeLabel}
      </div>
      <div style={{
        position: 'absolute', bottom: 12, right: 12,
        background: 'rgba(124,58,237,0.85)', backdropFilter: 'blur(4px)',
        color: '#fff', fontSize: 11, fontWeight: 700,
        letterSpacing: '0.08em', textTransform: 'uppercase',
        padding: '4px 10px', borderRadius: 6, pointerEvents: 'none',
        zIndex: 5,
      }}>
        {afterLabel}
      </div>
    </div>
  )
}

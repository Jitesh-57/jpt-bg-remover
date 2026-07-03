'use client'

import { useRef, useState, useEffect } from 'react'
import { upscaleImage } from '@/lib/upscale-client'

export type InlineToolType = 'upscale' | 'remove-bg' | 'compress' | 'resize' | 'convert-png' | 'convert-jpg'

interface InlineToolProps {
  toolType: InlineToolType
  beforeImg?: string
  afterImg?: string
  beforeLabel?: string
  afterLabel?: string
}

const TOOL_CONFIG: Record<InlineToolType, {
  accept: string
  buttonText: string
  processLabel: string
  downloadName: string
  downloadExt: string
}> = {
  upscale: {
    accept: 'image/*',
    buttonText: '🔍 Upscale My Image',
    processLabel: 'Upscaling with AI...',
    downloadName: 'upscaled',
    downloadExt: 'png',
  },
  'remove-bg': {
    accept: 'image/*',
    buttonText: '🪄 Remove Background',
    processLabel: 'Removing background...',
    downloadName: 'no-background',
    downloadExt: 'png',
  },
  compress: {
    accept: 'image/*',
    buttonText: '⚡ Compress Image',
    processLabel: 'Compressing...',
    downloadName: 'compressed',
    downloadExt: 'jpg',
  },
  resize: {
    accept: 'image/*',
    buttonText: '↔️ Resize Image',
    processLabel: 'Resizing...',
    downloadName: 'resized',
    downloadExt: 'jpg',
  },
  'convert-png': {
    accept: 'image/*',
    buttonText: '🔄 Convert to PNG',
    processLabel: 'Converting...',
    downloadName: 'converted',
    downloadExt: 'png',
  },
  'convert-jpg': {
    accept: 'image/*',
    buttonText: '🔄 Convert to JPG',
    processLabel: 'Converting...',
    downloadName: 'converted',
    downloadExt: 'jpg',
  },
}

// Client-side processors (no auth required — free tier)
async function processImage(toolType: InlineToolType, dataUrl: string): Promise<string> {
  if (toolType === 'upscale') {
    return upscaleImage(dataUrl, '2x')
  }
  if (toolType === 'compress') {
    const img = await loadImg(dataUrl)
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    canvas.getContext('2d')!.drawImage(img, 0, 0)
    return canvas.toDataURL('image/jpeg', 0.72)
  }
  if (toolType === 'convert-png') {
    const img = await loadImg(dataUrl)
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    canvas.getContext('2d')!.drawImage(img, 0, 0)
    return canvas.toDataURL('image/png')
  }
  if (toolType === 'convert-jpg') {
    const img = await loadImg(dataUrl)
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0)
    return canvas.toDataURL('image/jpeg', 0.92)
  }
  // remove-bg and resize — call API
  const res = await fetch(`/api/${toolType === 'remove-bg' ? 'remove-bg' : 'upscale'}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ dataUrl }),
  })
  if (!res.ok) throw new Error('Processing failed')
  const data = await res.json()
  return data.dataUrl
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image()
    img.onload = () => res(img)
    img.onerror = rej
    img.src = src
  })
}

function readFile(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result as string)
    r.onerror = rej
    r.readAsDataURL(file)
  })
}

// ── Animated Before/After Slider ──────────────────────────────────────────────

function AutoSlider({ before, after, beforeLabel, afterLabel }: {
  before: string; after: string; beforeLabel: string; afterLabel: string
}) {
  const [pos, setPos] = useState(50)
  const [dragging, setDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | null>(null)
  const dirRef = useRef<1 | -1>(1)
  const pausedRef = useRef(false)

  useEffect(() => {
    let p = 80
    dirRef.current = -1

    function tick() {
      if (!pausedRef.current) {
        p += dirRef.current * 0.4
        if (p <= 20) { p = 20; dirRef.current = 1 }
        if (p >= 80) { p = 80; dirRef.current = -1 }
        setPos(p)
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [])

  const updateFromEvent = (clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const p = Math.min(95, Math.max(5, ((clientX - rect.left) / rect.width) * 100))
    setPos(p)
  }

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => { pausedRef.current = true }}
      onMouseLeave={() => { pausedRef.current = false; setDragging(false) }}
      onMouseMove={e => { if (dragging) updateFromEvent(e.clientX) }}
      onMouseDown={e => { setDragging(true); pausedRef.current = true; updateFromEvent(e.clientX) }}
      onMouseUp={() => setDragging(false)}
      onTouchStart={e => { pausedRef.current = true; updateFromEvent(e.touches[0].clientX) }}
      onTouchMove={e => { e.preventDefault(); updateFromEvent(e.touches[0].clientX) }}
      onTouchEnd={() => { pausedRef.current = false }}
      style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', cursor: 'ew-resize', userSelect: 'none', aspectRatio: '16/9', maxWidth: '100%' }}
    >
      {/* After image (full) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={after} alt={afterLabel} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      {/* Before image (clipped) */}
      <div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={before} alt={beforeLabel} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'blur(0.5px)', imageRendering: 'pixelated' }} />
      </div>
      {/* Divider line */}
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${pos}%`, width: 3, background: '#fff', transform: 'translateX(-50%)', boxShadow: '0 0 12px rgba(0,0,0,0.4)', zIndex: 10 }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 40, height: 40, borderRadius: '50%', background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#6366F1', fontWeight: 900 }}>⇔</div>
      </div>
      {/* Labels */}
      <div style={{ position: 'absolute', bottom: 14, left: 14, background: 'rgba(0,0,0,0.65)', color: '#fff', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '5px 12px', borderRadius: 8 }}>{beforeLabel}</div>
      <div style={{ position: 'absolute', bottom: 14, right: 14, background: 'rgba(99,102,241,0.92)', color: '#fff', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '5px 12px', borderRadius: 8 }}>✨ {afterLabel}</div>
    </div>
  )
}

// ── CSS Gradient animated demo (fallback when no images) ──────────────────────

function GradientSliderDemo({ beforeLabel, afterLabel }: { beforeLabel: string; afterLabel: string }) {
  const [pos, setPos] = useState(50)
  const dirRef = useRef<1 | -1>(-1)

  useEffect(() => {
    let p = 80
    const id = setInterval(() => {
      p += dirRef.current * 0.5
      if (p <= 20) { p = 20; dirRef.current = 1 }
      if (p >= 80) { p = 80; dirRef.current = -1 }
      setPos(p)
    }, 16)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', aspectRatio: '16/9', maxWidth: '100%' }}>
      {/* After */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' }} />
      {/* Decorative sparkles */}
      {[...Array(6)].map((_, i) => (
        <div key={i} style={{ position: 'absolute', width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.6)', top: `${15 + i * 12}%`, left: `${60 + i * 5}%` }} />
      ))}
      {/* Before */}
      <div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 ${100 - pos}% 0 0)`, background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.04) 0px, rgba(0,0,0,0.04) 1px, transparent 1px, transparent 8px), repeating-linear-gradient(90deg, rgba(0,0,0,0.04) 0px, rgba(0,0,0,0.04) 1px, transparent 1px, transparent 8px)' }} />
      </div>
      {/* Divider */}
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${pos}%`, width: 3, background: '#fff', transform: 'translateX(-50%)', boxShadow: '0 0 12px rgba(0,0,0,0.4)', zIndex: 10 }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 40, height: 40, borderRadius: '50%', background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#6366F1' }}>⇔</div>
      </div>
      <div style={{ position: 'absolute', bottom: 14, left: 14, background: 'rgba(0,0,0,0.65)', color: '#fff', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '5px 12px', borderRadius: 8 }}>{beforeLabel}</div>
      <div style={{ position: 'absolute', bottom: 14, right: 14, background: 'rgba(99,102,241,0.92)', color: '#fff', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '5px 12px', borderRadius: 8 }}>✨ {afterLabel}</div>
    </div>
  )
}

// ── Main InlineTool Component ─────────────────────────────────────────────────

export default function InlineTool({ toolType, beforeImg, afterImg, beforeLabel = 'Original', afterLabel = 'Enhanced' }: InlineToolProps) {
  const cfg = TOOL_CONFIG[toolType]
  const fileRef = useRef<HTMLInputElement>(null)
  const [stage, setStage] = useState<'idle' | 'processing' | 'done' | 'error'>('idle')
  const [originalDataUrl, setOriginalDataUrl] = useState<string | null>(null)
  const [resultDataUrl, setResultDataUrl] = useState<string | null>(null)
  const [originalName, setOriginalName] = useState('image')
  const [dragOver, setDragOver] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [sliderPos, setSliderPos] = useState(50)
  const draggingSlider = useRef(false)
  const resultContainerRef = useRef<HTMLDivElement>(null)

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return
    setOriginalName(file.name.replace(/\.[^.]+$/, ''))
    const dataUrl = await readFile(file)
    setOriginalDataUrl(dataUrl)
    setStage('processing')
    setErrorMsg('')
    try {
      const result = await processImage(toolType, dataUrl)
      setResultDataUrl(result)
      setStage('done')
    } catch (e) {
      setErrorMsg(String(e))
      setStage('error')
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleDownload = () => {
    if (!resultDataUrl) return
    const a = document.createElement('a')
    a.href = resultDataUrl
    a.download = `${originalName}-${cfg.downloadName}.${cfg.downloadExt}`
    a.click()
  }

  const reset = () => {
    setStage('idle')
    setOriginalDataUrl(null)
    setResultDataUrl(null)
    setSliderPos(50)
  }

  const updateSlider = (clientX: number) => {
    const rect = resultContainerRef.current?.getBoundingClientRect()
    if (!rect) return
    setSliderPos(Math.min(95, Math.max(5, ((clientX - rect.left) / rect.width) * 100)))
  }

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      {/* ── Demo Slider (always shown on top) ── */}
      {stage === 'idle' && (
        <div style={{ marginBottom: 32, borderRadius: 20, overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.14)' }}>
          {beforeImg && afterImg ? (
            <AutoSlider before={beforeImg} after={afterImg} beforeLabel={beforeLabel} afterLabel={afterLabel} />
          ) : (
            <GradientSliderDemo beforeLabel={beforeLabel} afterLabel={afterLabel} />
          )}
          <div style={{ textAlign: 'center', padding: '10px 0 4px', fontSize: 12, color: '#9CA3AF', fontWeight: 600 }}>
            ↔ Drag to compare · Auto-playing demo
          </div>
        </div>
      )}

      {/* ── Upload Zone ── */}
      {stage === 'idle' && (
        <div
          onClick={() => fileRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          style={{
            border: `2.5px dashed ${dragOver ? '#6366F1' : '#D1D5DB'}`,
            borderRadius: 20,
            padding: '48px 24px',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragOver ? '#EEF2FF' : '#FAFAFA',
            transition: 'all 0.2s',
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>📂</div>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#111827', marginBottom: 6 }}>Drop your image here or click to browse</div>
          <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 24 }}>JPG, PNG, WEBP supported · Max 20 MB</div>
          <button
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: '#fff', fontWeight: 800, fontSize: 15, padding: '14px 32px', borderRadius: 12, border: 'none', cursor: 'pointer', boxShadow: '0 6px 24px rgba(99,102,241,0.4)' }}
          >
            {cfg.buttonText}
          </button>
          <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 12 }}>Free · No sign-up needed · No watermark</div>
          <input ref={fileRef} type="file" accept={cfg.accept} style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }} />
        </div>
      )}

      {/* ── Processing ── */}
      {stage === 'processing' && (
        <div style={{ textAlign: 'center', padding: '80px 24px' }}>
          <div style={{ display: 'inline-block', width: 56, height: 56, border: '4px solid #EEF2FF', borderTop: '4px solid #6366F1', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: 20 }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#111827', marginBottom: 6 }}>{cfg.processLabel}</div>
          <div style={{ fontSize: 13, color: '#9CA3AF' }}>Hang tight — usually takes 2–5 seconds</div>
        </div>
      )}

      {/* ── Result with before/after slider ── */}
      {stage === 'done' && originalDataUrl && resultDataUrl && (
        <div>
          <div
            ref={resultContainerRef}
            onMouseMove={e => { if (draggingSlider.current) updateSlider(e.clientX) }}
            onMouseDown={e => { draggingSlider.current = true; updateSlider(e.clientX) }}
            onMouseUp={() => { draggingSlider.current = false }}
            onMouseLeave={() => { draggingSlider.current = false }}
            onTouchMove={e => { e.preventDefault(); updateSlider(e.touches[0].clientX) }}
            style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', cursor: 'ew-resize', userSelect: 'none', boxShadow: '0 16px 60px rgba(0,0,0,0.15)', aspectRatio: '4/3' }}
          >
            {/* Result (after) */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={resultDataUrl} alt="Processed result" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', background: '#f8f8f8' }} />
            {/* Original (before) clipped */}
            <div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={originalDataUrl} alt="Original" style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#f0f0f0' }} />
            </div>
            {/* Divider */}
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${sliderPos}%`, width: 3, background: '#fff', transform: 'translateX(-50%)', boxShadow: '0 0 12px rgba(0,0,0,0.4)', zIndex: 10 }}>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 40, height: 40, borderRadius: '50%', background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#6366F1', fontWeight: 900 }}>⇔</div>
            </div>
            <div style={{ position: 'absolute', bottom: 14, left: 14, background: 'rgba(0,0,0,0.65)', color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: 7 }}>Original</div>
            <div style={{ position: 'absolute', bottom: 14, right: 14, background: 'rgba(99,102,241,0.92)', color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: 7 }}>✨ {afterLabel}</div>
          </div>
          <div style={{ textAlign: 'center', fontSize: 12, color: '#9CA3AF', marginTop: 8 }}>← Drag slider to compare</div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' }}>
            <button
              onClick={handleDownload}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: '#fff', fontWeight: 800, fontSize: 15, padding: '14px 36px', borderRadius: 12, border: 'none', cursor: 'pointer', boxShadow: '0 6px 24px rgba(99,102,241,0.4)' }}
            >
              ⬇️ Download {cfg.downloadExt.toUpperCase()}
            </button>
            <button
              onClick={reset}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#F3F4F6', color: '#374151', fontWeight: 700, fontSize: 15, padding: '14px 24px', borderRadius: 12, border: '1.5px solid #E5E7EB', cursor: 'pointer' }}
            >
              🔄 Process Another
            </button>
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {stage === 'error' && (
        <div style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#EF4444', marginBottom: 8 }}>Something went wrong</div>
          <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 20 }}>{errorMsg || 'Please try again with a different image.'}</div>
          <button onClick={reset} style={{ background: '#6366F1', color: '#fff', fontWeight: 700, padding: '12px 28px', borderRadius: 10, border: 'none', cursor: 'pointer' }}>Try Again</button>
        </div>
      )}
    </div>
  )
}

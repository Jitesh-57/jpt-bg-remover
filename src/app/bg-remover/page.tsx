'use client'

import { useRef, useState, useCallback } from 'react'

type Status = 'idle' | 'loading-model' | 'processing' | 'done' | 'error'

export default function BgRemoverPage() {
  const [status, setStatus] = useState<Status>('idle')
  const [original, setOriginal] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState(0)
  const [showOriginal, setShowOriginal] = useState(false)
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const processImage = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return
    const originalUrl = URL.createObjectURL(file)
    setOriginal(originalUrl)
    setResult(null)
    setError('')
    setProgress(0)
    setShowOriginal(false)

    try {
      setStatus('loading-model')
      setProgress(5)
      const { removeBackground } = await import('@imgly/background-removal')

      setStatus('processing')
      setProgress(10)

      // Convert to base64 dataUrl — blob: URLs aren't accessible from Web Workers
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      const blob = await removeBackground(dataUrl, {
        progress: (_key: string, current: number, total: number) => {
          if (total > 0) setProgress(Math.round((current / total) * 85) + 10)
        },
        publicPath: 'https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/',
      })
      const resultUrl = URL.createObjectURL(blob)
      setResult(resultUrl)
      setProgress(100)
      setStatus('done')
    } catch (e) {
      console.error(e)
      setError(String(e))
      setStatus('error')
    }
  }, [])

  const handleFile = (file: File) => processImage(file)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const downloadResult = () => {
    if (!result) return
    const a = document.createElement('a')
    a.href = result
    a.download = 'removed-bg.png'
    a.click()
  }

  const reset = () => {
    setStatus('idle')
    setOriginal(null)
    setResult(null)
    setError('')
    setProgress(0)
  }

  const busy = status === 'loading-model' || status === 'processing'

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', padding: '40px 24px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#EEF2FF', borderRadius: 20, padding: '6px 16px', marginBottom: 16 }}>
            <span style={{ fontSize: 16 }}>🪄</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#6366F1' }}>100% Free · Runs in Your Browser</span>
          </div>
          <h1 style={{ fontSize: 40, fontWeight: 900, color: '#0F172A', margin: '0 0 12px', letterSpacing: '-0.02em' }}>
            Remove Background Free
          </h1>
          <p style={{ fontSize: 17, color: '#64748B', margin: 0 }}>
            AI-powered background removal — no sign-in, no credits, no uploads to any server.
          </p>
        </div>

        {/* Upload zone */}
        {status === 'idle' && (
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            style={{ border: `2px dashed ${dragging ? '#6366F1' : '#CBD5E1'}`, borderRadius: 20, padding: '60px 40px', textAlign: 'center', cursor: 'pointer', background: dragging ? '#EEF2FF' : '#fff', transition: 'all 0.2s' }}
          >
            <div style={{ fontSize: 52, marginBottom: 16 }}>🖼️</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>Drop your image here</div>
            <div style={{ fontSize: 15, color: '#64748B', marginBottom: 24 }}>or click to browse — JPG, PNG, WebP supported</div>
            <div style={{ display: 'inline-block', padding: '12px 28px', background: '#6366F1', color: '#fff', borderRadius: 10, fontWeight: 700, fontSize: 15 }}>
              Choose Image
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }} />
          </div>
        )}

        {/* Processing state */}
        {(busy || status === 'error') && original && (
          <div style={{ background: '#fff', borderRadius: 20, padding: 32, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
            <img src={original} alt="original" style={{ width: '100%', maxHeight: 400, objectFit: 'contain', borderRadius: 12, marginBottom: 24 }} />
            {busy && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>
                    {status === 'loading-model' ? '⏳ Loading AI model…' : '🪄 Removing background…'}
                  </span>
                  <span style={{ fontSize: 14, color: '#6366F1', fontWeight: 700 }}>{progress}%</span>
                </div>
                <div style={{ background: '#F1F5F9', borderRadius: 8, height: 8, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'linear-gradient(90deg, #6366F1, #8B5CF6)', borderRadius: 8, width: `${progress}%`, transition: 'width 0.3s' }} />
                </div>
                <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 12, textAlign: 'center' }}>
                  {status === 'loading-model' ? 'First run downloads the AI model (~5MB). Subsequent uses are instant.' : 'Processing in your browser — your image never leaves your device.'}
                </p>
              </div>
            )}
            {status === 'error' && (
              <div style={{ background: '#FFF1F0', border: '1px solid #FCA5A5', borderRadius: 10, padding: 16, color: '#B91C1C', fontSize: 14 }}>
                <strong>Error:</strong> {error}
                <button onClick={reset} style={{ marginLeft: 16, padding: '4px 12px', background: '#EF4444', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>Try Again</button>
              </div>
            )}
          </div>
        )}

        {/* Result */}
        {status === 'done' && original && result && (
          <div>
            {/* Before / After toggle */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 20 }}>
              {(['After', 'Before'] as const).map(label => (
                <button key={label} onClick={() => setShowOriginal(label === 'Before')}
                  style={{ padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, background: (label === 'Before') === showOriginal ? '#6366F1' : '#F1F5F9', color: (label === 'Before') === showOriginal ? '#fff' : '#374151' }}>
                  {label}
                </button>
              ))}
            </div>

            {/* Image display */}
            <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', marginBottom: 20 }}>
              {/* Checkerboard background for transparency */}
              <div style={{ backgroundImage: showOriginal ? 'none' : 'repeating-conic-gradient(#e2e8f0 0% 25%, #fff 0% 50%) 0 0 / 20px 20px', background: showOriginal ? '#F8FAFC' : undefined, padding: 20, display: 'flex', justifyContent: 'center', minHeight: 300, alignItems: 'center' }}>
                <img src={showOriginal ? original : result} alt={showOriginal ? 'original' : 'background removed'} style={{ maxWidth: '100%', maxHeight: 500, objectFit: 'contain', borderRadius: 8 }} />
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={downloadResult}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 32px', background: '#6366F1', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 16, cursor: 'pointer', boxShadow: '0 4px 14px rgba(99,102,241,0.4)' }}>
                ⬇ Download PNG
              </button>
              <button onClick={reset}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 24px', background: '#F1F5F9', color: '#374151', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>
                🖼️ New Image
              </button>
            </div>

            <p style={{ textAlign: 'center', fontSize: 13, color: '#94A3B8', marginTop: 16 }}>
              Result is a transparent PNG — perfect for logos, product photos, and profile pictures.
            </p>
          </div>
        )}

        {/* Feature pills */}
        {status === 'idle' && (
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 32 }}>
            {['✅ No sign-in required', '🔒 Image stays on your device', '⚡ Instant results', '💰 Always free', '🖼️ Transparent PNG output'].map(f => (
              <div key={f} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 20, padding: '8px 16px', fontSize: 13, color: '#374151', fontWeight: 600 }}>{f}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

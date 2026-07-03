'use client'

import { useState, useRef, useCallback, DragEvent } from 'react'

type ToolId = 'remove-bg' | 'upscale'
type UpscaleMode = 'free' | 'pro'

interface InlineToolProps {
  toolId: ToolId
  pageId: string
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function InlineTool({ toolId }: InlineToolProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [state, setState] = useState<'idle' | 'processing' | 'done' | 'error'>('idle')
  const [progress, setProgress] = useState(0)
  const [originalUrl, setOriginalUrl] = useState<string | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [upscaleMode, setUpscaleMode] = useState<UpscaleMode>('free')

  const reset = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setState('idle')
    setProgress(0)
    setOriginalUrl(null)
    setResultUrl(null)
    setErrorMsg('')
    setIsDragging(false)
  }

  const processFile = useCallback(async (file: File, mode?: UpscaleMode) => {
    if (!file.type.startsWith('image/')) return

    const dataUrl = await readFileAsDataUrl(file)
    setOriginalUrl(dataUrl)
    setState('processing')
    setProgress(5)

    timerRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 88) { clearInterval(timerRef.current!); return 88 }
        return p + (88 - p) * 0.06
      })
    }, 400)

    try {
      const apiPath =
        toolId === 'upscale'
          ? (mode ?? upscaleMode) === 'pro' ? '/api/upscale-pro' : '/api/upscale'
          : '/api/remove-bg'

      const res = await fetch(apiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl }),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error || `Server error ${res.status}`)
      }

      const json = await res.json()
      const result: string = json.dataUrl ?? json.url ?? json.result ?? ''
      if (!result) throw new Error('No result returned from server')

      if (timerRef.current) clearInterval(timerRef.current)
      setProgress(100)
      setResultUrl(result)
      setState('done')
    } catch (err: unknown) {
      if (timerRef.current) clearInterval(timerRef.current)
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
      setState('error')
    }
  }, [toolId, upscaleMode])

  const handleFileChange = (file: File) => processFile(file)
  const handleDrop = (e: DragEvent) => {
    e.preventDefault(); setIsDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f) processFile(f)
  }

  const handleDownload = () => {
    if (!resultUrl) return
    const a = document.createElement('a')
    a.href = resultUrl
    a.download = toolId === 'remove-bg' ? 'removed-bg.png' : 'upscaled.jpg'
    a.click()
  }

  const openInEditor = () => {
    if (resultUrl) { try { sessionStorage.setItem('jpt_pending_image', resultUrl) } catch {} }
    window.location.href = `/editor?tool=${toolId}`
  }

  // ── Idle drop zone ──────────────────────────────────────────────────────
  if (state === 'idle') {
    return (
      <div style={{ padding: '20px' }}>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFileChange(f); e.target.value = '' }} />

        {/* Free / Pro toggle for upscale */}
        {toolId === 'upscale' && (
          <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: 12, padding: 4, marginBottom: 16, gap: 4 }}>
            {(['free', 'pro'] as UpscaleMode[]).map(m => (
              <button key={m} onClick={() => setUpscaleMode(m)} style={{
                flex: 1, padding: '9px 0', borderRadius: 9, border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 13, transition: 'all 0.18s',
                background: upscaleMode === m ? (m === 'pro' ? 'linear-gradient(135deg,#F59E0B,#EF4444)' : 'linear-gradient(135deg,#6366F1,#8B5CF6)') : 'transparent',
                color: upscaleMode === m ? '#fff' : '#6B7280',
                boxShadow: upscaleMode === m ? '0 2px 10px rgba(0,0,0,0.15)' : 'none',
              }}>
                {m === 'free' ? '⚡ Free Model' : '👑 Pro Model'}
              </button>
            ))}
          </div>
        )}

        {/* Mode description */}
        {toolId === 'upscale' && (
          <div style={{ background: upscaleMode === 'pro' ? '#FEF3C7' : '#EEF2FF', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12 }}>
            {upscaleMode === 'free' ? (
              <span style={{ color: '#4338CA' }}><strong>Free model</strong> — 2x AI upscaling, instant results, no credits needed</span>
            ) : (
              <span style={{ color: '#92400E' }}><strong>Pro model</strong> — 4x super-resolution, sharper detail, requires subscription &rarr; <a href="/pricing" style={{ color: '#D97706', fontWeight: 700 }}>Upgrade</a></span>
            )}
          </div>
        )}

        {/* Drop zone */}
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${isDragging ? '#6366F1' : '#D1D5DB'}`,
            borderRadius: 16, padding: '40px 20px', textAlign: 'center', cursor: 'pointer',
            background: isDragging ? '#EEF2FF' : '#FAFAFA', transition: 'all 0.18s',
          }}
        >
          <div style={{ fontSize: 44, marginBottom: 10 }}>
            {toolId === 'remove-bg' ? '🪄' : '🔍'}
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 6 }}>
            Drop your image here
          </div>
          <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 20 }}>
            JPG, PNG, WEBP &mdash; any image
          </div>
          <button style={{
            background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', border: 'none',
            borderRadius: 12, padding: '13px 32px', fontWeight: 800, fontSize: 15, cursor: 'pointer',
            boxShadow: '0 4px 18px rgba(99,102,241,0.35)',
          }}>
            Choose Image
          </button>
          <div style={{ fontSize: 11, color: '#D1D5DB', marginTop: 14 }}>
            No signup &bull; No watermark &bull; Free
          </div>
        </div>
      </div>
    )
  }

  // ── Processing ──────────────────────────────────────────────────────────
  if (state === 'processing') {
    return (
      <div style={{ padding: '40px 24px', textAlign: 'center' }}>
        {originalUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={originalUrl} alt="" style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 12, marginBottom: 20, opacity: 0.45, filter: 'blur(1px)' }} />
        )}
        <div style={{ fontSize: 15, fontWeight: 700, color: '#374151', marginBottom: 18 }}>
          {toolId === 'upscale' ? 'AI upscaling your image...' : 'Removing background...'}
        </div>
        <div style={{ background: '#E5E7EB', borderRadius: 99, height: 10, overflow: 'hidden', maxWidth: 300, margin: '0 auto 10px' }}>
          <div style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg,#6366F1,#8B5CF6)', width: `${progress}%`, transition: 'width 0.5s ease' }} />
        </div>
        <div style={{ fontSize: 12, color: '#9CA3AF' }}>{Math.round(progress)}% &mdash; please wait</div>
      </div>
    )
  }

  // ── Error ───────────────────────────────────────────────────────────────
  if (state === 'error') {
    return (
      <div style={{ padding: '36px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>&#9888;&#65039;</div>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#DC2626', marginBottom: 8 }}>Processing failed</div>
        <div style={{ fontSize: 13, color: '#6B7280', maxWidth: 280, margin: '0 auto 24px', lineHeight: 1.6 }}>{errorMsg}</div>
        <button onClick={reset} style={{ background: '#111827', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 28px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
          Try Again
        </button>
      </div>
    )
  }

  // ── Done ────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '20px' }}>

      {/* Before / After */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
        <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={originalUrl!} alt="Original" style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.65),transparent)', padding: '22px 10px 8px' }}>
            <span style={{ color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Before</span>
          </div>
        </div>
        <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', background: toolId === 'remove-bg' ? 'repeating-conic-gradient(#d1d5db 0% 25%,#fff 0% 50%) 0/14px 14px' : '#0F172A' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={resultUrl!} alt="Result" style={{ width: '100%', height: 200, objectFit: 'contain', display: 'block' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(99,102,241,0.75),transparent)', padding: '22px 10px 8px' }}>
            <span style={{ color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>&#10024; After AI</span>
          </div>
        </div>
      </div>

      {/* Download — primary */}
      <button onClick={handleDownload} style={{
        width: '100%', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff',
        border: 'none', borderRadius: 13, padding: '15px 0', fontWeight: 800, fontSize: 16,
        cursor: 'pointer', marginBottom: 10, boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
        letterSpacing: '-0.01em',
      }}>
        &#11015; Download Free &mdash; No Watermark
      </button>

      {/* Nudge row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
        <button onClick={openInEditor} style={{
          background: '#F9FAFB', color: '#111827', border: '1.5px solid #E5E7EB',
          borderRadius: 11, padding: '11px 0', fontWeight: 700, fontSize: 13, cursor: 'pointer',
        }}>
          &#9998; Edit in AI Editor
        </button>
        <button onClick={() => { window.location.href = `/editor?mode=batch&tool=${toolId}` }} style={{
          background: '#F9FAFB', color: '#111827', border: '1.5px solid #E5E7EB',
          borderRadius: 11, padding: '11px 0', fontWeight: 700, fontSize: 13, cursor: 'pointer',
        }}>
          &#128230; Batch Process
        </button>
      </div>

      {/* Hint */}
      <div style={{ background: '#EEF2FF', borderRadius: 11, padding: '11px 14px', fontSize: 12, color: '#4338CA', lineHeight: 1.55, marginBottom: 10 }}>
        <strong>Want more?</strong> Open in AI Editor to change backgrounds, apply prompts, relight, or swap objects.
      </div>

      {/* Reset */}
      <button onClick={reset} style={{
        width: '100%', background: 'transparent', color: '#9CA3AF',
        border: '1.5px solid #E5E7EB', borderRadius: 11, padding: '10px 0',
        fontWeight: 600, fontSize: 13, cursor: 'pointer',
      }}>
        &#8635; Process Another Image
      </button>
    </div>
  )
}

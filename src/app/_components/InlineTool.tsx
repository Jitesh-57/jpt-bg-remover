'use client'

import { useState, useRef, useCallback, DragEvent } from 'react'

type ToolId = 'remove-bg' | 'upscale'

interface InlineToolProps {
  toolId: ToolId
  pageId: string
}

const TOOL_CONFIG: Record<ToolId, { label: string; apiPath: string; resultLabel: string; acceptHint: string }> = {
  'remove-bg': {
    label: 'Remove Background',
    apiPath: '/api/remove-bg',
    resultLabel: 'Background Removed',
    acceptHint: 'JPG, PNG, WEBP — any subject',
  },
  upscale: {
    label: 'Upscale Image',
    apiPath: '/api/upscale',
    resultLabel: '4× AI Upscaled',
    acceptHint: 'JPG, PNG, WEBP — any photo',
  },
}

export default function InlineTool({ toolId, pageId }: InlineToolProps) {
  const cfg = TOOL_CONFIG[toolId]
  const fileRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<'idle' | 'processing' | 'done' | 'error'>('idle')
  const [progress, setProgress] = useState(0)
  const [originalUrl, setOriginalUrl] = useState<string | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const reset = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (originalUrl) URL.revokeObjectURL(originalUrl)
    setState('idle')
    setProgress(0)
    setOriginalUrl(null)
    setResultUrl(null)
    setErrorMsg('')
    setIsDragging(false)
  }

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return
    if (originalUrl) URL.revokeObjectURL(originalUrl)

    const preview = URL.createObjectURL(file)
    setOriginalUrl(preview)
    setState('processing')
    setProgress(5)

    // Animate progress bar while waiting
    timerRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 88) { clearInterval(timerRef.current!); return 88 }
        return p + (88 - p) * 0.07
      })
    }, 300)

    try {
      const form = new FormData()
      form.append('image', file)
      // upscale API expects 'scale' param
      if (toolId === 'upscale') form.append('scale', '4')

      const res = await fetch(cfg.apiPath, { method: 'POST', body: form })

      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(text || `Server error ${res.status}`)
      }

      // Result may be JSON with url/dataUrl, or raw image blob
      const contentType = res.headers.get('content-type') ?? ''
      let resultDataUrl: string

      if (contentType.includes('application/json')) {
        const json = await res.json()
        resultDataUrl = json.url ?? json.dataUrl ?? json.result ?? json.image ?? ''
        if (!resultDataUrl) throw new Error('No result URL in response')
      } else {
        const blob = await res.blob()
        resultDataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(blob)
        })
      }

      if (timerRef.current) clearInterval(timerRef.current)
      setProgress(100)
      setResultUrl(resultDataUrl)
      setState('done')
    } catch (err: unknown) {
      if (timerRef.current) clearInterval(timerRef.current)
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setState('error')
    }
  }, [toolId, cfg.apiPath, originalUrl])

  const pickFile = () => fileRef.current?.click()

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const handleDownload = () => {
    if (!resultUrl) return
    const a = document.createElement('a')
    a.href = resultUrl
    a.download = toolId === 'remove-bg' ? 'removed-bg.png' : 'upscaled.jpg'
    a.click()
  }

  const openInEditor = () => {
    if (resultUrl) {
      try { sessionStorage.setItem('jpt_pending_image', resultUrl) } catch {}
    }
    const tool = toolId === 'remove-bg' ? 'remove-bg' : 'upscale'
    window.location.href = `/editor?tool=${tool}`
  }

  const openBatch = () => {
    window.location.href = `/editor?mode=batch&tool=${toolId}`
  }

  // ── Idle / drop zone ────────────────────────────────────────────────────
  if (state === 'idle') {
    return (
      <div style={{ width: '100%' }}>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); e.target.value = '' }} />
        <div
          onClick={pickFile}
          onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${isDragging ? '#6366F1' : '#D1D5DB'}`,
            borderRadius: 18,
            padding: '44px 24px',
            textAlign: 'center',
            cursor: 'pointer',
            background: isDragging ? '#EEF2FF' : '#FAFAFA',
            transition: 'all 0.18s',
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>📂</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 6 }}>
            Drop your image here
          </div>
          <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 20 }}>{cfg.acceptHint}</div>
          <button
            style={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 28px', fontWeight: 800, fontSize: 15, cursor: 'pointer', boxShadow: '0 4px 18px rgba(99,102,241,0.35)' }}
          >
            Choose Image
          </button>
          <div style={{ fontSize: 11, color: '#D1D5DB', marginTop: 14 }}>No signup &bull; No watermark &bull; Free</div>
        </div>
      </div>
    )
  }

  // ── Processing ───────────────────────────────────────────────────────────
  if (state === 'processing') {
    return (
      <div style={{ padding: '36px 24px', textAlign: 'center' }}>
        {originalUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={originalUrl} alt="Uploading" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 14, marginBottom: 20, opacity: 0.5, filter: 'blur(1px)' }} />
        )}
        <div style={{ fontSize: 15, fontWeight: 700, color: '#374151', marginBottom: 16 }}>
          AI is processing your image...
        </div>
        <div style={{ background: '#E5E7EB', borderRadius: 99, height: 8, overflow: 'hidden', maxWidth: 280, margin: '0 auto' }}>
          <div style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg,#6366F1,#8B5CF6)', width: `${progress}%`, transition: 'width 0.4s ease' }} />
        </div>
        <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 10 }}>{Math.round(progress)}% complete</div>
      </div>
    )
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (state === 'error') {
    return (
      <div style={{ padding: '32px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#DC2626', marginBottom: 8 }}>Processing failed</div>
        <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 20, maxWidth: 300, margin: '0 auto 20px' }}>{errorMsg}</div>
        <button onClick={reset} style={{ background: '#111827', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
          Try Again
        </button>
      </div>
    )
  }

  // ── Done ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '20px' }}>
      {/* Before / After side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={originalUrl!} alt="Original" style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }} />
          <span style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Original</span>
        </div>
        <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', background: toolId === 'remove-bg' ? 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 0 0/16px 16px' : '#000' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={resultUrl!} alt={cfg.resultLabel} style={{ width: '100%', height: 180, objectFit: 'contain', display: 'block' }} />
          <span style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(99,102,241,0.9)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>&#10024; {cfg.resultLabel}</span>
        </div>
      </div>

      {/* Primary: Download */}
      <button
        onClick={handleDownload}
        style={{ width: '100%', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', border: 'none', borderRadius: 12, padding: '13px 0', fontWeight: 800, fontSize: 15, cursor: 'pointer', marginBottom: 10, boxShadow: '0 4px 18px rgba(99,102,241,0.3)' }}
      >
        &#11015; Download Free &mdash; No Watermark
      </button>

      {/* Secondary nudges */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
        <button
          onClick={openInEditor}
          style={{ background: '#F3F4F6', color: '#111827', border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '10px 0', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
        >
          &#9998; Edit in AI Editor
        </button>
        <button
          onClick={openBatch}
          style={{ background: '#F3F4F6', color: '#111827', border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '10px 0', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
        >
          &#128230; Batch Process
        </button>
      </div>

      {/* Hint */}
      <div style={{ background: '#EEF2FF', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#4338CA', marginBottom: 10 }}>
        <strong>Want more?</strong> Open in AI Editor to change backgrounds, apply styles, swap objects, and more.
      </div>

      {/* Reset */}
      <button
        onClick={reset}
        style={{ width: '100%', background: 'transparent', color: '#9CA3AF', border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '9px 0', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
      >
        Process Another Image
      </button>
    </div>
  )
}

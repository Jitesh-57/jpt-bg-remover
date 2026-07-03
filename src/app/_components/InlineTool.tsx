'use client'

import { useState, useRef, useCallback, DragEvent } from 'react'

type ToolId = 'remove-bg' | 'upscale'

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

type Scale = '2x' | '4x'

export default function InlineTool({ toolId }: InlineToolProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [state, setState] = useState<'idle' | 'selected' | 'processing' | 'done' | 'error'>('idle')
  const [progress, setProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [originalUrl, setOriginalUrl] = useState<string | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [scale, setScale] = useState<Scale>('2x')

  const reset = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setState('idle')
    setProgress(0)
    setSelectedFile(null)
    setOriginalUrl(null)
    setResultUrl(null)
    setErrorMsg('')
    setIsDragging(false)
    setScale('2x')
  }

  const selectFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    const url = URL.createObjectURL(file)
    setSelectedFile(file)
    setOriginalUrl(url)
    setState('selected')
  }, [])

  const handleDrop = (e: DragEvent) => {
    e.preventDefault(); setIsDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f) selectFile(f)
  }

  const runTransform = useCallback(async () => {
    if (!selectedFile) return
    setState('processing')
    setProgress(5)

    timerRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 88) { clearInterval(timerRef.current!); return 88 }
        return p + (88 - p) * 0.06
      })
    }, 400)

    try {
      const dataUrl = await readFileAsDataUrl(selectedFile)

      const apiPath =
        toolId === 'upscale'
          ? scale === '4x' ? '/api/upscale-pro' : '/api/upscale'
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
  }, [selectedFile, toolId, scale])

  const handleDownload = () => {
    if (!resultUrl) return
    const a = document.createElement('a')
    a.href = resultUrl
    a.download = toolId === 'remove-bg' ? 'removed-bg.png' : `upscaled-${scale}.jpg`
    a.click()
  }

  const openInEditor = () => {
    if (resultUrl) { try { sessionStorage.setItem('jpt_pending_image', resultUrl) } catch {} }
    window.location.href = `/editor?tool=${toolId}`
  }

  // ─── IDLE: drop zone ────────────────────────────────────────────────────
  if (state === 'idle') {
    return (
      <div style={{ padding: '20px 20px 24px' }}>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) selectFile(f); e.target.value = '' }} />

        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${isDragging ? '#6366F1' : '#D1D5DB'}`,
            borderRadius: 16, padding: '48px 24px', textAlign: 'center', cursor: 'pointer',
            background: isDragging ? '#EEF2FF' : '#FAFAFA', transition: 'all 0.18s',
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 12, lineHeight: 1 }}>
            {toolId === 'remove-bg' ? '🪄' : '🔍'}
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 6 }}>
            Drop your image here
          </div>
          <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 24 }}>
            JPG, PNG, WEBP supported
          </div>
          <button
            onClick={e => { e.stopPropagation(); fileRef.current?.click() }}
            style={{
              background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', border: 'none',
              borderRadius: 12, padding: '13px 36px', fontWeight: 800, fontSize: 15, cursor: 'pointer',
              boxShadow: '0 4px 18px rgba(99,102,241,0.35)',
            }}
          >
            Choose Image
          </button>
          <div style={{ fontSize: 11, color: '#C4C8D4', marginTop: 16 }}>
            No signup &bull; No watermark &bull; Free
          </div>
        </div>
      </div>
    )
  }

  // ─── SELECTED: show preview + options + transform button ────────────────
  if (state === 'selected') {
    return (
      <div style={{ padding: '20px 20px 24px' }}>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) selectFile(f); e.target.value = '' }} />

        {/* Image preview */}
        <div style={{ borderRadius: 14, overflow: 'hidden', marginBottom: 16, position: 'relative' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={originalUrl!} alt="Selected" style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }} />
          <button
            onClick={() => fileRef.current?.click()}
            style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.55)', color: '#fff', border: 'none', borderRadius: 8, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
          >
            Change
          </button>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top,rgba(0,0,0,0.5),transparent)', padding: '28px 12px 10px' }}>
            <span style={{ color: '#fff', fontSize: 11, fontWeight: 600 }}>{selectedFile?.name}</span>
          </div>
        </div>

        {/* Scale options — only for upscale */}
        {toolId === 'upscale' && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Select upscale size
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {([
                { value: '2x' as Scale, label: '2x Upscale', sub: 'Free &bull; Instant', badge: 'FREE', color: '#6366F1' },
                { value: '4x' as Scale, label: '4x Upscale', sub: 'Pro &bull; HD quality', badge: 'PRO', color: '#F59E0B' },
              ] as { value: Scale; label: string; sub: string; badge: string; color: string }[]).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setScale(opt.value)}
                  style={{
                    border: `2px solid ${scale === opt.value ? opt.color : '#E5E7EB'}`,
                    borderRadius: 12, padding: '12px 10px', background: scale === opt.value ? (opt.value === '4x' ? '#FFFBEB' : '#EEF2FF') : '#FAFAFA',
                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 15, fontWeight: 900, color: '#111827' }}>{opt.label}</span>
                    <span style={{ fontSize: 9, fontWeight: 800, background: opt.color, color: '#fff', borderRadius: 6, padding: '2px 6px', letterSpacing: '0.06em' }}>{opt.badge}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }} dangerouslySetInnerHTML={{ __html: opt.sub }} />
                  {scale === opt.value && (
                    <div style={{ position: 'absolute', top: 8, left: 8, width: 8, height: 8, borderRadius: '50%', background: opt.color }} />
                  )}
                </button>
              ))}
            </div>
            {scale === '4x' && (
              <div style={{ background: '#FEF3C7', borderRadius: 10, padding: '9px 13px', marginTop: 10, fontSize: 12, color: '#92400E' }}>
                &#128081; <strong>Pro feature</strong> &mdash; requires subscription.{' '}
                <a href="/pricing" style={{ color: '#D97706', fontWeight: 700 }}>Upgrade &rarr;</a>
              </div>
            )}
          </div>
        )}

        {/* Transform button */}
        <button
          onClick={runTransform}
          style={{
            width: '100%', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff',
            border: 'none', borderRadius: 13, padding: '15px 0', fontWeight: 900, fontSize: 16,
            cursor: 'pointer', boxShadow: '0 4px 20px rgba(99,102,241,0.38)', letterSpacing: '-0.01em',
            marginBottom: 10,
          }}
        >
          {toolId === 'upscale' ? `&#9889; Upscale ${scale} Now` : '&#9889; Remove Background Now'}
        </button>

        <button onClick={reset} style={{ width: '100%', background: 'transparent', color: '#9CA3AF', border: '1.5px solid #E5E7EB', borderRadius: 11, padding: '9px 0', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
          &#8592; Choose Different Image
        </button>
      </div>
    )
  }

  // ─── PROCESSING ─────────────────────────────────────────────────────────
  if (state === 'processing') {
    return (
      <div style={{ padding: '44px 24px', textAlign: 'center' }}>
        {originalUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={originalUrl} alt="" style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 14, marginBottom: 20, opacity: 0.4, filter: 'blur(1px)' }} />
        )}
        <div style={{ fontSize: 15, fontWeight: 700, color: '#374151', marginBottom: 20 }}>
          {toolId === 'upscale' ? `AI upscaling ${scale}...` : 'Removing background...'}
        </div>
        <div style={{ background: '#E5E7EB', borderRadius: 99, height: 10, overflow: 'hidden', maxWidth: 300, margin: '0 auto 10px' }}>
          <div style={{
            height: '100%', borderRadius: 99,
            background: 'linear-gradient(90deg,#6366F1,#8B5CF6,#6366F1)',
            backgroundSize: '200% 100%',
            width: `${progress}%`, transition: 'width 0.5s ease',
          }} />
        </div>
        <div style={{ fontSize: 12, color: '#9CA3AF' }}>{Math.round(progress)}% &mdash; please wait</div>
      </div>
    )
  }

  // ─── ERROR ──────────────────────────────────────────────────────────────
  if (state === 'error') {
    return (
      <div style={{ padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>&#9888;&#65039;</div>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#DC2626', marginBottom: 8 }}>Processing failed</div>
        <div style={{ fontSize: 13, color: '#6B7280', maxWidth: 280, margin: '0 auto 24px', lineHeight: 1.65 }}>{errorMsg}</div>
        <button onClick={reset} style={{ background: '#111827', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 32px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
          Try Again
        </button>
      </div>
    )
  }

  // ─── DONE ───────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '20px 20px 24px' }}>

      {/* Before / After comparison */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
        <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={originalUrl!} alt="Original" style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top,rgba(0,0,0,0.65),transparent)', padding: '28px 10px 10px' }}>
            <span style={{ color: '#fff', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Original</span>
          </div>
        </div>
        <div style={{
          position: 'relative', borderRadius: 14, overflow: 'hidden',
          background: toolId === 'remove-bg' ? 'repeating-conic-gradient(#d1d5db 0% 25%,#fff 0% 50%) 0/14px 14px' : '#0F172A',
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={resultUrl!} alt="Result" style={{ width: '100%', height: 200, objectFit: 'contain', display: 'block' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top,rgba(99,102,241,0.75),transparent)', padding: '28px 10px 10px', textAlign: 'right' }}>
            <span style={{ color: '#fff', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>&#10024; After AI</span>
          </div>
        </div>
      </div>

      {/* Download — primary CTA */}
      <button onClick={handleDownload} style={{
        width: '100%', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff',
        border: 'none', borderRadius: 13, padding: '15px 0', fontWeight: 900, fontSize: 16,
        cursor: 'pointer', marginBottom: 10, boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
        letterSpacing: '-0.01em',
      }}>
        &#11015; Download Free &mdash; No Watermark
      </button>

      {/* Upsell nudges */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
        <button onClick={openInEditor} style={{
          background: '#F9FAFB', color: '#111827', border: '1.5px solid #E5E7EB',
          borderRadius: 11, padding: '12px 0', fontWeight: 700, fontSize: 13, cursor: 'pointer',
        }}>
          &#9998; Edit in AI Editor
        </button>
        <button onClick={() => { window.location.href = `/editor?mode=batch&tool=${toolId}` }} style={{
          background: '#F9FAFB', color: '#111827', border: '1.5px solid #E5E7EB',
          borderRadius: 11, padding: '12px 0', fontWeight: 700, fontSize: 13, cursor: 'pointer',
        }}>
          &#128230; Batch Process
        </button>
      </div>

      {/* Hint */}
      <div style={{ background: '#EEF2FF', borderRadius: 11, padding: '11px 14px', fontSize: 12, color: '#4338CA', lineHeight: 1.55, marginBottom: 10 }}>
        <strong>Want more?</strong> Open in AI Editor to swap backgrounds, apply styles, or relight your image.
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

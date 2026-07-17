'use client'

import { useState, useEffect, useRef } from 'react'

interface BlogStickyBarProps {
  toolHref: string
  toolLabel: string
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onloadend = () => resolve(r.result as string)
    r.onerror = reject
    r.readAsDataURL(file)
  })
}

/** Resolve toolHref → where to redirect after upload (and which editor tool key to set) */
function resolveDestination(toolHref: string): { dest: string; editorTool: string | null } {
  if (toolHref.startsWith('/remove-bg')) return { dest: '/editor?tool=remove-bg', editorTool: 'remove-bg' }
  if (toolHref.startsWith('/upscale'))   return { dest: '/editor?tool=upscale',    editorTool: 'upscale'   }
  // Free in-browser tools → open the editor pre-set to that tool.
  if (toolHref.startsWith('/compress-image')) return { dest: '/editor?tool=compress', editorTool: 'compress' }
  if (toolHref.startsWith('/convert-image'))  return { dest: '/editor?tool=convert',  editorTool: 'convert'  }
  if (toolHref.startsWith('/crop-image'))     return { dest: '/editor?tool=crop',     editorTool: 'crop'     }
  if (toolHref.startsWith('/rotate-image'))   return { dest: '/editor?tool=rotate',   editorTool: 'rotate'   }
  if (toolHref.startsWith('/watermark-image')) return { dest: '/editor?tool=watermark', editorTool: 'watermark' }
  if (toolHref.startsWith('/meme-generator')) return { dest: '/editor?tool=meme',     editorTool: 'meme'     }
  if (toolHref.startsWith('/image-to-pdf'))   return { dest: '/editor?tool=pdf',      editorTool: 'pdf'      }
  if (toolHref.startsWith('/editor') || toolHref.startsWith('/ai-editor'))
    return { dest: toolHref, editorTool: 'ai-edit' }
  if (toolHref.startsWith('/creative'))
    return { dest: toolHref, editorTool: 'creative' }
  // headshot, batch-editor → no upload, just navigate
  return { dest: toolHref, editorTool: null }
}

function getToolIcon(toolHref: string): string {
  if (toolHref.startsWith('/remove-bg'))  return '🪄'
  if (toolHref.startsWith('/upscale'))    return '🔍'
  if (toolHref.startsWith('/compress-image')) return '🗜️'
  if (toolHref.startsWith('/convert-image'))  return '🔀'
  if (toolHref.startsWith('/crop-image'))     return '✂️'
  if (toolHref.startsWith('/rotate-image'))   return '🔄'
  if (toolHref.startsWith('/watermark-image')) return '🔖'
  if (toolHref.startsWith('/meme-generator')) return '😂'
  if (toolHref.startsWith('/image-to-pdf'))   return '📄'
  if (toolHref.startsWith('/creative'))   return '✨'
  if (toolHref.startsWith('/ai-editor') || toolHref.startsWith('/editor')) return '🎨'
  if (toolHref.startsWith('/ai-headshot')) return '💼'
  if (toolHref.startsWith('/batch'))      return '📦'
  return '⚡'
}

export default function BlogStickyBar({ toolHref, toolLabel }: BlogStickyBarProps) {
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const { dest, editorTool } = resolveDestination(toolHref)
  const icon = getToolIcon(toolHref)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 320)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !file.type.startsWith('image/')) return
    setLoading(true)
    try {
      const dataUrl = await readFileAsDataUrl(file)
      sessionStorage.setItem('jpt_pending_image', dataUrl)
      if (editorTool) sessionStorage.setItem('jpt_pending_tool', editorTool)
    } catch {}
    window.location.href = dest
  }

  const handleClick = () => {
    if (editorTool) {
      fileRef.current?.click()
    } else {
      window.location.href = dest
    }
  }

  return (
    <>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />

      {/* Sticky bar */}
      <div
        style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          zIndex: 999,
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.32s cubic-bezier(0.4,0,0.2,1)',
          pointerEvents: visible ? 'auto' : 'none',
        }}
      >
        {/* Subtle gradient fade above the bar */}
        <div style={{
          height: 48,
          background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.04))',
          pointerEvents: 'none',
        }} />

        <div style={{
          background: '#fff',
          borderTop: '1px solid #EAECF0',
          boxShadow: '0 -4px 32px rgba(0,0,0,0.10)',
          padding: '14px 20px',
        }}>
          <div style={{
            maxWidth: 780,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}>
            {/* Left: icon + copy */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <span style={{ fontSize: 18, lineHeight: 1 }}>{icon}</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Try it free — no sign up needed
                </span>
              </div>
              <div style={{ fontSize: 12, color: '#9CA3AF', paddingLeft: 26 }}>
                {editorTool ? 'Upload an image and we\'ll open it for you' : 'Open the tool and get started instantly'}
              </div>
            </div>

            {/* Right: CTA button */}
            <button
              onClick={handleClick}
              disabled={loading}
              style={{
                flexShrink: 0,
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: loading ? '#A5B4FC' : 'linear-gradient(135deg,#6366F1,#8B5CF6)',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                padding: '12px 22px',
                fontWeight: 800,
                fontSize: 14,
                cursor: loading ? 'default' : 'pointer',
                boxShadow: '0 4px 18px rgba(99,102,241,0.38)',
                letterSpacing: '-0.01em',
                whiteSpace: 'nowrap',
                transition: 'background 0.15s, transform 0.12s',
              }}
              onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.03)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)' }}
            >
              {loading ? (
                <>
                  <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.5)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                  Opening…
                </>
              ) : (
                <>
                  {editorTool ? '📂 Upload & Try Now' : `${icon} ${toolLabel}`}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </>
  )
}

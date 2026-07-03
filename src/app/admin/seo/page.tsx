'use client'

import { useState, useEffect, useCallback } from 'react'
import { PageSEO, PageFeature, PageFAQ } from '@/lib/page-types'

const ADMIN_EMAILS = ['jiteshpatil@gofynd.com', 'patil.jitesh866@gmail.com']

const PAGES = [
  { id: 'upscale', label: 'AI Upscale' },
  { id: 'remove-bg', label: 'Remove BG' },
  { id: 'headshot', label: 'AI Headshot' },
  { id: 'ai-editor', label: 'AI Editor' },
]

type ToastType = 'success' | 'error'

function Toast({ message, type, onClose }: { message: string; type: ToastType; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white font-medium transition-all ${
        type === 'success' ? 'bg-green-600' : 'bg-red-600'
      }`}
    >
      {message}
    </div>
  )
}

export default function AdminSEOPage() {
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [selectedPage, setSelectedPage] = useState('upscale')
  const [config, setConfig] = useState<Partial<PageSEO>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)

  // Check auth
  useEffect(() => {
    fetch('/api/auth/google/me')
      .then((r) => r.json())
      .then((d: { email?: string }) => {
        setAuthed(!!d.email && ADMIN_EMAILS.includes(d.email))
      })
      .catch(() => setAuthed(false))
  }, [])

  const loadConfig = useCallback(async (pageId: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/page-config/${pageId}`)
      const data = (await res.json()) as PageSEO
      setConfig(data)
    } catch {
      setToast({ message: 'Failed to load config', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authed) loadConfig(selectedPage)
  }, [authed, selectedPage, loadConfig])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/page-config/${selectedPage}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      if (!res.ok) throw new Error('Save failed')
      setToast({ message: 'Saved successfully!', type: 'success' })
    } catch {
      setToast({ message: 'Failed to save', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const updateField = (field: keyof PageSEO, value: unknown) => {
    setConfig((prev) => ({ ...prev, [field]: value }))
  }

  const updateFeature = (i: number, key: keyof PageFeature, value: string) => {
    const features = [...(config.features ?? [])]
    features[i] = { ...features[i], [key]: value }
    updateField('features', features)
  }

  const addFeature = () => {
    updateField('features', [...(config.features ?? []), { icon: '', title: '', desc: '' }])
  }

  const removeFeature = (i: number) => {
    updateField(
      'features',
      (config.features ?? []).filter((_, idx) => idx !== i)
    )
  }

  const updateFaq = (i: number, key: keyof PageFAQ, value: string) => {
    const faq = [...(config.faq ?? [])]
    faq[i] = { ...faq[i], [key]: value }
    updateField('faq', faq)
  }

  const addFaq = () => {
    updateField('faq', [...(config.faq ?? []), { q: '', a: '' }])
  }

  const removeFaq = (i: number) => {
    updateField(
      'faq',
      (config.faq ?? []).filter((_, idx) => idx !== i)
    )
  }

  if (authed === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400">Checking access...</div>
      </div>
    )
  }

  if (authed === false) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
          <p className="text-gray-600">You do not have admin access to this page.</p>
        </div>
      </div>
    )
  }

  const inputCls =
    'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400'
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1'
  const sectionCls = 'mb-6'

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-[#1E1E2E] flex-shrink-0 pt-8 px-4">
        <h2 className="text-white text-xs font-semibold uppercase tracking-widest mb-6 px-2">
          SEO Pages
        </h2>
        <nav className="space-y-1">
          {PAGES.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPage(p.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedPage === p.id
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto py-10 px-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              Edit: {PAGES.find((p) => p.id === selectedPage)?.label}
            </h1>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>

          {loading ? (
            <div className="text-gray-400 text-center py-20">Loading...</div>
          ) : (
            <div className="space-y-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              {/* SEO Meta */}
              <section>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                  SEO Meta
                </h3>
                <div className={sectionCls}>
                  <label className={labelCls}>Title</label>
                  <input
                    className={inputCls}
                    value={config.title ?? ''}
                    onChange={(e) => updateField('title', e.target.value)}
                  />
                </div>
                <div className={sectionCls}>
                  <label className={labelCls}>Meta Description</label>
                  <textarea
                    className={inputCls}
                    rows={3}
                    value={config.meta_description ?? ''}
                    onChange={(e) => updateField('meta_description', e.target.value)}
                  />
                </div>
                <div className={sectionCls}>
                  <label className={labelCls}>Keywords (comma-separated)</label>
                  <textarea
                    className={inputCls}
                    rows={2}
                    value={config.keywords ?? ''}
                    onChange={(e) => updateField('keywords', e.target.value)}
                  />
                </div>
              </section>

              {/* Open Graph */}
              <section>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                  Open Graph
                </h3>
                <div className={sectionCls}>
                  <label className={labelCls}>OG Title</label>
                  <input
                    className={inputCls}
                    value={config.og_title ?? ''}
                    onChange={(e) => updateField('og_title', e.target.value)}
                  />
                </div>
                <div className={sectionCls}>
                  <label className={labelCls}>OG Description</label>
                  <textarea
                    className={inputCls}
                    rows={2}
                    value={config.og_description ?? ''}
                    onChange={(e) => updateField('og_description', e.target.value)}
                  />
                </div>
                <div className={sectionCls}>
                  <label className={labelCls}>OG Image URL</label>
                  <input
                    className={inputCls}
                    type="url"
                    value={config.og_image ?? ''}
                    onChange={(e) => updateField('og_image', e.target.value)}
                  />
                </div>
              </section>

              {/* Page Content */}
              <section>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                  Page Content
                </h3>
                <div className={sectionCls}>
                  <label className={labelCls}>H1 Heading</label>
                  <input
                    className={inputCls}
                    value={config.h1 ?? ''}
                    onChange={(e) => updateField('h1', e.target.value)}
                  />
                </div>
                <div className={sectionCls}>
                  <label className={labelCls}>Subtitle</label>
                  <textarea
                    className={inputCls}
                    rows={2}
                    value={config.subtitle ?? ''}
                    onChange={(e) => updateField('subtitle', e.target.value)}
                  />
                </div>
                <div className={sectionCls}>
                  <label className={labelCls}>CTA Button Text</label>
                  <input
                    className={inputCls}
                    value={config.cta_text ?? ''}
                    onChange={(e) => updateField('cta_text', e.target.value)}
                  />
                </div>
              </section>

              {/* Features */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                    Features
                  </h3>
                  <button
                    onClick={addFeature}
                    className="text-indigo-600 text-sm font-medium hover:text-indigo-800"
                  >
                    + Add Feature
                  </button>
                </div>
                <div className="space-y-4">
                  {(config.features ?? []).map((f, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-4 space-y-2">
                      <div className="flex gap-2">
                        <div className="w-20">
                          <label className={labelCls}>Icon</label>
                          <input
                            className={inputCls}
                            value={f.icon}
                            onChange={(e) => updateFeature(i, 'icon', e.target.value)}
                          />
                        </div>
                        <div className="flex-1">
                          <label className={labelCls}>Title</label>
                          <input
                            className={inputCls}
                            value={f.title}
                            onChange={(e) => updateFeature(i, 'title', e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <label className={labelCls}>Description</label>
                        <input
                          className={inputCls}
                          value={f.desc}
                          onChange={(e) => updateFeature(i, 'desc', e.target.value)}
                        />
                      </div>
                      <button
                        onClick={() => removeFeature(i)}
                        className="text-red-500 text-xs hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              {/* FAQ */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">FAQ</h3>
                  <button
                    onClick={addFaq}
                    className="text-indigo-600 text-sm font-medium hover:text-indigo-800"
                  >
                    + Add FAQ
                  </button>
                </div>
                <div className="space-y-4">
                  {(config.faq ?? []).map((item, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-4 space-y-2">
                      <div>
                        <label className={labelCls}>Question</label>
                        <input
                          className={inputCls}
                          value={item.q}
                          onChange={(e) => updateFaq(i, 'q', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Answer</label>
                        <textarea
                          className={inputCls}
                          rows={2}
                          value={item.a}
                          onChange={(e) => updateFaq(i, 'a', e.target.value)}
                        />
                      </div>
                      <button
                        onClick={() => removeFaq(i)}
                        className="text-red-500 text-xs hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>
      </main>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  )
}


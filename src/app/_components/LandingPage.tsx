'use client'

import FAQAccordion from './FAQAccordion'
import { PageSEO } from '@/lib/page-config'
import { PAGE_IMAGES } from '@/lib/landing-images'

interface LandingPageProps {
  config: PageSEO
  toolHref: string
  pageId: string
}

const HOW_IT_WORKS = [
  { step: '01', title: 'Upload Your Photo', desc: 'Drag & drop or click to select any image from your device. JPG, PNG, WEBP supported.' },
  { step: '02', title: 'AI Processes It', desc: 'Our Gemini AI analyzes your image and applies the transformation in seconds.' },
  { step: '03', title: 'Download Result', desc: 'Preview the result and download in full quality — PNG or JPEG, your choice.' },
]

// Gradient hero image previews per page
const PAGE_VISUALS: Record<string, { before: string; after: string; label: string }> = {
  upscale: {
    before: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
    after: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
    label: 'Enhanced Resolution',
  },
  'remove-bg': {
    before: 'linear-gradient(135deg, #fde68a 0%, #fca5a5 100%)',
    after: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
    label: 'Clean Cutout',
  },
  headshot: {
    before: 'linear-gradient(135deg, #d1fae5 0%, #6ee7b7 100%)',
    after: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
    label: 'Pro Headshot',
  },
  'ai-editor': {
    before: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)',
    after: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
    label: 'AI Edited',
  },
}

export default function LandingPage({ config, toolHref, pageId }: LandingPageProps) {
  const visual = PAGE_VISUALS[pageId] ?? PAGE_VISUALS['upscale']
  const heroImg = PAGE_IMAGES[pageId]

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', color: '#111827', background: '#fff' }}>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section style={{ background: 'linear-gradient(160deg, #F5F5FF 0%, #fff 50%, #F0FDF4 100%)', padding: '80px 24px 72px', textAlign: 'center' }}>
        <div style={{ maxWidth: 780, margin: '0 auto' }}>
          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#EEF2FF', color: '#6366F1', fontWeight: 700, fontSize: 12, borderRadius: 20, padding: '6px 14px', marginBottom: 28, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            ✦ JPT AI
          </div>

          <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.6rem)', fontWeight: 900, color: '#0F172A', lineHeight: 1.1, letterSpacing: '-0.03em', margin: '0 0 20px' }}>
            {config.h1}
          </h1>
          <p style={{ fontSize: 'clamp(1rem, 2vw, 1.2rem)', color: '#4B5563', lineHeight: 1.7, maxWidth: 560, margin: '0 auto 36px' }}>
            {config.subtitle}
          </p>

          <a
            href={toolHref}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: '#fff', fontWeight: 800, fontSize: 16, padding: '16px 36px', borderRadius: 14, textDecoration: 'none', boxShadow: '0 8px 30px rgba(99,102,241,0.4)', letterSpacing: '-0.01em' }}
          >
            {config.cta_text || 'Try It Free'} →
          </a>
          <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 12 }}>No credit card required · 10 free credits included</div>
        </div>

        {/* Showcase visual — real AI-generated image, gradient fallback */}
        {heroImg ? (
          <div style={{ maxWidth: 900, margin: '56px auto 0', borderRadius: 24, overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.16)', position: 'relative' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={heroImg} alt={`${visual.label} example`} style={{ display: 'block', width: '100%', height: 'auto' }} />
            <span style={{ position: 'absolute', bottom: 16, right: 16, padding: '8px 16px', background: 'rgba(99,102,241,0.92)', color: '#fff', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>✨ {visual.label}</span>
          </div>
        ) : (
          <div style={{ maxWidth: 820, margin: '56px auto 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, borderRadius: 24, overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.12)' }}>
            <div style={{ position: 'relative', height: 280, background: visual.before, display: 'flex', alignItems: 'flex-end' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.04)' }} />
              <div style={{ width: '100%', height: '100%', backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 8px)', position: 'absolute' }} />
              <span style={{ position: 'relative', padding: '10px 16px', background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', borderTopRightRadius: 10 }}>Original</span>
            </div>
            <div style={{ position: 'relative', height: 280, background: visual.after, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 30% 40%, rgba(255,255,255,0.18) 0%, transparent 60%)' }} />
              <span style={{ position: 'relative', padding: '10px 16px', background: 'rgba(99,102,241,0.85)', color: '#fff', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', borderTopLeftRadius: 10 }}>✨ {visual.label}</span>
            </div>
          </div>
        )}
      </section>

      {/* ── STATS BAR ────────────────────────────────────────────────────── */}
      <section style={{ background: '#0F172A', padding: '28px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 20 }}>
          {[
            { num: '10M+', label: 'Images Processed' },
            { num: '< 5s', label: 'Average Processing Time' },
            { num: '4×', label: 'Max Resolution Boost' },
            { num: 'Free', label: 'To Get Started' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#A5B4FC', letterSpacing: '-0.02em' }}>{s.num}</div>
              <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      {config.features?.length > 0 && (
        <section style={{ padding: '88px 24px', background: '#fff' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#6366F1', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Features</div>
              <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>Everything you need, nothing you don&apos;t</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
              {config.features.map((f, i) => (
                <div key={i} style={{ background: '#F9FAFB', border: '1.5px solid #F3F4F6', borderRadius: 20, padding: '28px 24px', transition: 'transform 0.2s, box-shadow 0.2s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 32px rgba(99,102,241,0.12)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}>
                  <div style={{ width: 52, height: 52, background: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 16 }}>{f.icon}</div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: '0 0 8px' }}>{f.title}</h3>
                  <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section style={{ padding: '88px 24px', background: 'linear-gradient(160deg, #F5F5FF 0%, #EEF2FF 100%)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#6366F1', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>How It Works</div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>Three steps, seconds to complete</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 32, position: 'relative' }}>
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.step} style={{ textAlign: 'center', position: 'relative' }}>
                {i < HOW_IT_WORKS.length - 1 && (
                  <div style={{ display: 'none' /* hidden on mobile */ }} />
                )}
                <div style={{ width: 72, height: 72, background: '#fff', border: '2px solid #E0E7FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 4px 20px rgba(99,102,241,0.12)' }}>
                  <span style={{ fontSize: 22, fontWeight: 900, color: '#6366F1', fontVariantNumeric: 'tabular-nums' }}>{step.step}</span>
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#111827', margin: '0 0 10px' }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.7, margin: 0 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── UPLOAD CTA SECTION ───────────────────────────────────────────── */}
      <section style={{ padding: '88px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ background: '#0F172A', borderRadius: 28, padding: '56px 48px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -60, right: -60, width: 240, height: 240, background: 'radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: -40, left: -40, width: 180, height: 180, background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(99,102,241,0.25)', color: '#A5B4FC', fontWeight: 700, fontSize: 12, borderRadius: 20, padding: '6px 14px', marginBottom: 20, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Free to try</div>
              <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 900, color: '#fff', margin: '0 0 14px', letterSpacing: '-0.02em' }}>
                Ready to transform your images?
              </h2>
              <p style={{ fontSize: 16, color: '#94A3B8', margin: '0 0 32px' }}>No credit card required. 10 free credits when you sign up.</p>
              <a
                href={toolHref}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: '#fff', fontWeight: 800, fontSize: 16, padding: '16px 40px', borderRadius: 14, textDecoration: 'none', boxShadow: '0 8px 30px rgba(99,102,241,0.5)' }}
              >
                {config.cta_text || 'Try It Free'} →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      {config.faq?.length > 0 && (
        <section style={{ padding: '0 24px 88px', background: '#fff' }}>
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#6366F1', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>FAQ</div>
              <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.2rem)', fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>Frequently Asked Questions</h2>
            </div>
            <FAQAccordion faqs={config.faq} />
          </div>
        </section>
      )}

    </div>
  )
}

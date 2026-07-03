'use client'

import { useState } from 'react'
import { PageFAQ } from '@/lib/page-config'

export default function FAQAccordion({ faqs }: { faqs: PageFAQ[] }) {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {faqs.map((faq, i) => (
        <div key={i} style={{ border: '1.5px solid #E5E7EB', borderRadius: 14, overflow: 'hidden', boxShadow: open === i ? '0 4px 20px rgba(99,102,241,0.08)' : 'none', transition: 'box-shadow 0.2s' }}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            style={{ width: '100%', textAlign: 'left', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: open === i ? '#F5F5FF' : '#fff', border: 'none', cursor: 'pointer', gap: 16 }}
          >
            <span style={{ fontWeight: 700, fontSize: 15, color: '#111827', lineHeight: 1.4 }}>{faq.q}</span>
            <span style={{ width: 28, height: 28, borderRadius: '50%', background: open === i ? '#6366F1' : '#F3F4F6', color: open === i ? '#fff' : '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, flexShrink: 0, transition: 'all 0.2s' }}>
              {open === i ? '−' : '+'}
            </span>
          </button>
          {open === i && (
            <div style={{ padding: '0 24px 20px', background: '#F5F5FF', color: '#4B5563', fontSize: 15, lineHeight: 1.7 }}>
              {faq.a}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

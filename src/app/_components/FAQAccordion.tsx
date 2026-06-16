'use client'

import { useState } from 'react'
import { PageFAQ } from '@/lib/page-config'

export default function FAQAccordion({ faqs }: { faqs: PageFAQ[] }) {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className="space-y-3">
      {faqs.map((faq, i) => (
        <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full text-left px-6 py-4 flex justify-between items-center bg-white hover:bg-gray-50 transition-colors"
          >
            <span className="font-semibold text-gray-900">{faq.q}</span>
            <span className="text-2xl text-indigo-500 ml-4 flex-shrink-0">
              {open === i ? '−' : '+'}
            </span>
          </button>
          {open === i && (
            <div className="px-6 py-4 bg-gray-50 text-gray-600 leading-relaxed">
              {faq.a}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

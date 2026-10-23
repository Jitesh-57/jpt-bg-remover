import { PageFAQ } from '@/lib/page-config'

/**
 * FAQ list, one question open at a time by the reader's choice.
 *
 * Built on <details>/<summary> so every answer is in the server HTML: the
 * pages also publish these as FAQPage structured data, and an answer that only
 * exists after a click is one search engines never read. Opening and closing
 * is the browser's own, so it works before any script loads.
 */
export default function FAQAccordion({ faqs }: { faqs: PageFAQ[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {faqs.map((faq, i) => (
        <details key={i} className="jpt-faq">
          <summary className="jpt-faq-q">
            <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', lineHeight: 1.4 }}>{faq.q}</span>
            <span className="jpt-faq-icon" aria-hidden />
          </summary>
          <div style={{ padding: '0 24px 20px', color: 'var(--text-muted)', fontSize: 15, lineHeight: 1.7 }}>
            {faq.a}
          </div>
        </details>
      ))}
    </div>
  )
}

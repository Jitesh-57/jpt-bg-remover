import FAQAccordion from './FAQAccordion'
import { PageSEO } from '@/lib/page-config'

interface LandingPageProps {
  config: PageSEO
  toolHref: string
}

const HOW_IT_WORKS = [
  { step: '1', title: 'Upload your photo', desc: 'Drag and drop or click to select any image from your device.' },
  { step: '2', title: 'AI processes it', desc: 'Our AI analyzes and processes your image in seconds.' },
  { step: '3', title: 'Download result', desc: 'Get your enhanced image and download in full quality.' },
]

export default function LandingPage({ config, toolHref }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-extrabold text-gray-900 mb-5 leading-tight">
            {config.h1}
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            {config.subtitle}
          </p>
          <a
            href={toolHref}
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-lg px-10 py-4 rounded-xl shadow-lg transition-colors"
          >
            {config.cta_text || 'Try It Free'}
          </a>
          {/* Before/After placeholder */}
          <div className="mt-14 flex gap-4 max-w-2xl mx-auto rounded-2xl overflow-hidden shadow-xl">
            <div className="flex-1 h-48 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
              <span className="text-gray-500 font-medium">Before</span>
            </div>
            <div className="flex-1 h-48 bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
              <span className="text-white font-medium">After</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      {config.features?.length > 0 && (
        <section className="py-16 px-4 bg-white">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Why Choose JPT AI?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {config.features.map((f, i) => (
                <div key={i} className="bg-gray-50 rounded-2xl p-6 text-center hover:shadow-md transition-shadow">
                  <div className="text-4xl mb-3">{f.icon}</div>
                  <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-gray-500 text-sm">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="py-16 px-4 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.step} className="text-center">
                <div className="w-14 h-14 bg-indigo-600 text-white text-xl font-bold rounded-full flex items-center justify-center mx-auto mb-4">
                  {step.step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      {config.faq?.length > 0 && (
        <section className="py-16 px-4 bg-white">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Frequently Asked Questions
            </h2>
            <FAQAccordion faqs={config.faq} />
          </div>
        </section>
      )}

      {/* CTA bottom */}
      <section className="py-16 px-4 bg-indigo-600">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to get started?</h2>
          <p className="text-indigo-200 mb-8">Free to use. No sign-up required to try.</p>
          <a
            href={toolHref}
            className="inline-block bg-white text-indigo-600 font-semibold text-lg px-10 py-4 rounded-xl shadow-lg hover:bg-indigo-50 transition-colors"
          >
            {config.cta_text || 'Try It Free'}
          </a>
        </div>
      </section>
    </div>
  )
}

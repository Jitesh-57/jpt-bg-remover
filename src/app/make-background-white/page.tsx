import { Metadata } from 'next'
import LandingPage from '../_components/LandingPage'

export const metadata: Metadata = {
  title: 'Make Image Background White Free Online — Amazon & E-commerce | JPT AI',
  description: 'Make any photo background pure white instantly with AI. Perfect for Amazon, Shopify, eBay, Etsy product photos. Free online, no watermark, meets marketplace standards.',
  keywords: 'make background white free online, white background image online, remove background make white, amazon product photo white background, change background to white, white background for product photos, ecommerce white background tool',
  alternates: { canonical: 'https://www.sjpt.io/make-background-white' },
  openGraph: {
    title: 'Make Photo Background White — Free for Amazon & Shopify | JPT AI',
    description: 'Make any image background pure white with AI. Perfect for Amazon, Shopify, eBay product photos. Free, instant, no watermark.',
    url: 'https://www.sjpt.io/make-background-white',
  },
}

const config = {
  h1: 'Make Photo Background White — Free Online',
  subtitle: 'Instantly replace any background with pure white using AI. Meets Amazon, Shopify, eBay, and Etsy marketplace standards. Perfect cutout, no manual editing required.',
  cta_text: '⬜ Make Background White',
  meta_description: metadata.description as string,
  keywords: metadata.keywords as string,
  title: metadata.title as string,
  features: [
    { icon: '⬜', title: 'Pure White Background (#FFFFFF)', desc: 'AI removes your background and fills it with pure #FFFFFF white — the exact shade required by Amazon, Shopify, eBay, and Etsy.' },
    { icon: '🛍️', title: 'Marketplace Ready', desc: 'Amazon requires white backgrounds on main product images. Our tool delivers compliant photos in seconds, not hours.' },
    { icon: '🪄', title: 'Perfect Edge Detection', desc: 'AI handles fine details like product edges, reflections, and shadows with pixel-level precision.' },
    { icon: '📤', title: 'Clean PNG Download', desc: 'Download a high-resolution PNG or JPG with a clean white background — no fringing, no grey artifacts.' },
    { icon: '⚡', title: 'Batch Ready', desc: 'Process product photos one at a time or use our batch editor for your entire catalog in minutes.' },
    { icon: '✅', title: 'No Watermark', desc: 'Your product photos are ready to list — no logo or watermark added. Fully professional results.' },
  ],
  faq: [
    { q: 'Does Amazon require white backgrounds on product images?', a: 'Yes — Amazon requires that main product images have a pure white background (#FFFFFF) with the product filling at least 85% of the frame. JPT AI produces compliant images that meet Amazon\'s exact specifications.' },
    { q: 'What\'s the difference between transparent and white background?', a: 'Transparent background (PNG with alpha) shows the checkerboard pattern in design tools and appears as the page color on websites. White background (PNG or JPG with white fill) looks white everywhere. For e-commerce listings, white background is standard.' },
    { q: 'Can I process product photos with complex shapes?', a: 'Yes — AI handles complex product shapes including jewelry, clothing, electronics, furniture, and reflective surfaces. Edge detection works on intricate shapes with fine details.' },
    { q: 'Is there a resolution limit?', a: 'No. Your product photos are processed at full resolution. Amazon recommends at least 1000×1000 pixels for zoom functionality — our tool supports this and higher.' },
    { q: 'How many photos can I process for free?', a: 'The free tier includes 5 product photo edits with no credit card required. For unlimited batch processing of your entire catalog, see our Pro plan.' },
  ],
  og_title: '',
  og_description: '',
  og_image: '',
  page_id: 'make-background-white',
}

export default function MakeBackgroundWhitePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Make Background White Online Free — JPT AI',
        description: config.meta_description,
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'Web',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        url: 'https://www.sjpt.io/make-background-white',
      }) }} />
      <LandingPage config={config} toolHref="/editor?tool=remove-bg" pageId="remove-bg" />
    </>
  )
}

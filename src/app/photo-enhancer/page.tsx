import { Metadata } from 'next'
import LandingPage from '../_components/LandingPage'

export const metadata: Metadata = {
  title: 'AI Photo Enhancer Online Free — Restore & Enhance Old Photos | JPT AI',
  description: 'Enhance and restore old, blurry, or low-quality photos with AI. Fix brightness, contrast, sharpness, and resolution automatically. Free online, no watermark, instant results.',
  keywords: 'photo enhancer online free, enhance photo quality ai, restore old photos online free, improve photo quality, photo quality enhancer, fix blurry photo online, sharpen image online free, ai photo restoration',
  alternates: { canonical: 'https://www.sjpt.io/photo-enhancer' },
  openGraph: {
    title: 'AI Photo Enhancer — Restore & Enhance Photos Free Online | JPT AI',
    description: 'Enhance and restore old, blurry photos with AI. Fix brightness, contrast, sharpness and resolution automatically. Free, no watermark.',
    url: 'https://www.sjpt.io/photo-enhancer',
  },
}

const config = {
  h1: 'AI Photo Enhancer & Restorer — Free Online',
  subtitle: 'Restore and enhance old, blurry, or low-quality photos using AI. Fix resolution, sharpness, brightness and color automatically in seconds. No watermark.',
  cta_text: '✨ Enhance My Photo',
  meta_description: metadata.description as string,
  keywords: metadata.keywords as string,
  title: metadata.title as string,
  features: [
    { icon: '🔍', title: 'AI Resolution Upscaling', desc: 'Increase image resolution 2× or 4× using deep learning super-resolution. Recover fine detail lost to compression or low-res capture.' },
    { icon: '✨', title: 'Automatic Enhancement', desc: 'AI automatically optimizes brightness, contrast, saturation, and sharpness to bring out the best in every photo.' },
    { icon: '📸', title: 'Old Photo Restoration', desc: 'Restore faded, scratched, or damaged old photographs. AI recovers detail and corrects color shift from aged photos.' },
    { icon: '🎨', title: 'Portrait Retouching', desc: 'Smooth skin, brighten eyes, and enhance portraits automatically without looking over-processed.' },
    { icon: '📤', title: 'No Watermark on Download', desc: 'Download enhanced photos without any logo, watermark, or overlay. Full quality, ready to use immediately.' },
    { icon: '⚡', title: 'Results in Under 5 Seconds', desc: 'AI enhancement is fast — upload your photo and get a polished result in seconds, not minutes.' },
  ],
  faq: [
    { q: 'Can AI really fix a blurry photo?', a: 'AI can significantly improve blurry photos through super-resolution upscaling that reconstructs sharp edges and fine detail. Results are best when blur is from low-resolution capture rather than severe camera shake or motion blur.' },
    { q: 'What types of photos can be enhanced?', a: 'Old family photos, scanned prints, low-resolution social media downloads, blurry product shots, dark indoor photos, and portraits. AI enhancement works on any photograph regardless of subject matter.' },
    { q: 'Will my old photos look like they were taken today?', a: 'AI enhancement can dramatically improve quality, clarity, and color of old photos. While it can\'t always reach modern camera quality, the improvement is often remarkable — especially for restoring faded or low-resolution prints.' },
    { q: 'Is photo enhancement free?', a: 'Basic 2× enhancement is completely free — no signup, no credit card needed. For 4× pro quality enhancement with priority processing, upgrade to our Pro plan starting at $9/month.' },
    { q: 'What image formats are supported?', a: 'JPG, JPEG, PNG, and WEBP are all supported. Maximum file size is 20MB. The enhanced image is downloaded as a high-quality PNG or JPG.' },
  ],
  og_title: '',
  og_description: '',
  og_image: '',
  page_id: 'photo-enhancer',
}

export default function PhotoEnhancerPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'AI Photo Enhancer Online Free — JPT AI',
        description: config.meta_description,
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'Web',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        url: 'https://www.sjpt.io/photo-enhancer',
      }) }} />
      <LandingPage config={config} toolHref="/editor?tool=upscale" pageId="upscale" inlineToolType="upscale" />
    </>
  )
}

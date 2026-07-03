import { Metadata } from 'next'
import LandingPage from '../_components/LandingPage'

export const metadata: Metadata = {
  title: 'Remove Watermark from Image Online Free | JPT AI',
  description: 'Remove watermarks, logos, text, and objects from photos online using AI. Free to try, no signup required, no watermark added. Clean, professional results in seconds.',
  keywords: 'remove watermark from image free, watermark remover online, remove logo from photo, remove text from image, ai watermark remover, free watermark remover no watermark, erase watermark online',
  alternates: { canonical: 'https://www.sjpt.io/watermark-remover' },
  openGraph: {
    title: 'Remove Watermark from Image Free Online | JPT AI',
    description: 'Remove watermarks, logos, and text from photos online with AI. Free to try, no signup, no watermark added.',
    url: 'https://www.sjpt.io/watermark-remover',
  },
}

const config = {
  h1: 'Remove Watermarks from Images Free',
  subtitle: 'AI-powered watermark removal — erase logos, text overlays, and unwanted objects from photos instantly. No signup, no watermark added to your result.',
  cta_text: '✨ Remove Watermark',
  meta_description: metadata.description as string,
  keywords: metadata.keywords as string,
  title: metadata.title as string,
  features: [
    { icon: '✨', title: 'AI-Powered Removal', desc: 'Advanced AI detects and removes watermarks, logos, text overlays, and objects while intelligently reconstructing the background.' },
    { icon: '🎯', title: 'Works on Any Watermark', desc: 'Remove text watermarks, logo overlays, date stamps, and semi-transparent watermarks from JPG, PNG, and WEBP images.' },
    { icon: '🖼️', title: 'Clean Background Reconstruction', desc: 'AI fills in the removed area with realistic background content — no visible patch or blur where the watermark was.' },
    { icon: '⚡', title: 'Results in Seconds', desc: 'Upload your image and get a clean, watermark-free result in under 5 seconds. No waiting, no queue.' },
    { icon: '📤', title: 'No Watermark Added', desc: 'We never add our own watermark to your result. Download clean, professional images instantly.' },
    { icon: '🔒', title: 'Privacy First', desc: 'Your images are processed securely and never stored permanently. Complete privacy guaranteed.' },
  ],
  faq: [
    { q: 'Can AI really remove watermarks cleanly?', a: 'AI watermark removal works best on simple watermarks with consistent backgrounds. The AI reconstructs the area under the watermark by analyzing surrounding pixels. Results are excellent for transparent watermarks on plain or textured backgrounds.' },
    { q: 'What types of watermarks can be removed?', a: 'Text watermarks, semi-transparent logo overlays, date stamps, copyright marks, and basic graphic watermarks. Results vary based on watermark complexity and background content beneath it.' },
    { q: 'Does it work on Getty Images or Shutterstock watermarks?', a: 'Our tool uses AI editing capabilities to work on any type of overlay. For licensed stock images, please note that removing watermarks on content you don\'t own may violate copyright law — use this tool only on images you have rights to.' },
    { q: 'Is watermark removal free?', a: 'Basic watermark removal is free to try — no credit card or signup required. Free users get 5 trial uses. For unlimited access, our Pro plan starts at just $9/month.' },
    { q: 'What image formats are supported?', a: 'JPG, JPEG, PNG, and WEBP images are all supported. Maximum file size is 20MB.' },
  ],
  og_title: '',
  og_description: '',
  og_image: '',
  page_id: 'watermark-remover',
}

export default function WatermarkRemoverPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Watermark Remover Online Free — JPT AI',
        description: config.meta_description,
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'Web',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        url: 'https://www.sjpt.io/watermark-remover',
      }) }} />
      <LandingPage config={config} toolHref="/editor?tool=ai-edit" pageId="watermark-remover" />
    </>
  )
}

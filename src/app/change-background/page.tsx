import { Metadata } from 'next'
import LandingPage from '../_components/LandingPage'

export const metadata: Metadata = {
  title: 'Change Image Background Online Free — AI Background Changer | JPT AI',
  description: 'Change photo backgrounds instantly with AI. Replace any background with a solid color, gradient, AI-generated scene, or your own image. Free online, no watermark, no Photoshop needed.',
  keywords: 'change background online free, ai background changer, replace photo background, change image background, background changer for photos, remove and replace background, background editor online free, ai background replacement',
  alternates: { canonical: 'https://www.sjpt.io/change-background' },
  openGraph: {
    title: 'Change Photo Background Online Free — AI Background Changer | JPT AI',
    description: 'Replace any photo background instantly with AI. Solid colors, gradients, AI scenes, or custom images. Free, no watermark.',
    url: 'https://www.sjpt.io/change-background',
  },
}

const config = {
  h1: 'Change Photo Background Online Free',
  subtitle: 'Replace any background instantly with AI. Choose from solid colors, gradients, AI-generated studio scenes, or upload your own background image. No Photoshop, no watermark.',
  cta_text: '🌅 Change Background',
  meta_description: metadata.description as string,
  keywords: metadata.keywords as string,
  title: metadata.title as string,
  features: [
    { icon: '🪄', title: 'One-Click Background Removal', desc: 'AI automatically detects and removes the original background with pixel-level precision — handles hair, fur, and complex edges.' },
    { icon: '🌅', title: 'AI Background Generation', desc: 'Type a description and AI generates a professional studio background: "soft bokeh", "sunset beach", "modern office".' },
    { icon: '🎨', title: 'Solid Colors & Gradients', desc: 'Choose from 10+ solid colors and 6 gradient presets for e-commerce, LinkedIn, and social media use cases.' },
    { icon: '📸', title: 'Upload Your Own Background', desc: 'Use any image as a custom background. Perfect for matching brand guidelines or placing subjects in specific locations.' },
    { icon: '📤', title: 'No Watermark on Download', desc: 'Download your background-changed image as a clean PNG — no logo, no watermark, full quality.' },
    { icon: '⚡', title: 'Under 10 Seconds', desc: 'Remove background and apply new background in under 10 seconds total. Faster than Canva, free unlike Photoshop.' },
  ],
  faq: [
    { q: 'Can I change the background of a photo for free?', a: 'Yes — JPT AI lets you change photo backgrounds for free. The free tier includes 5 background changes. Sign up for free credits, no credit card required.' },
    { q: 'How accurate is AI background removal for hair and fur?', a: 'Very accurate. Our AI handles fine edges like hair, fur, and loose fabric with sub-pixel precision. Results are typically indistinguishable from manual Photoshop cutouts.' },
    { q: 'Can I use this for LinkedIn profile photos?', a: 'Absolutely — this is one of the most popular use cases. Remove the background from your photo and add a professional studio background for a polished LinkedIn headshot.' },
    { q: 'What backgrounds can I replace it with?', a: 'Solid colors (white, black, gray, etc.), gradient presets, AI-generated scenes (describe any background), or upload your own image. The possibilities are unlimited.' },
    { q: 'What formats are supported?', a: 'JPG, PNG, and WEBP images up to 20MB. The result is downloaded as a high-quality PNG with the new background applied.' },
  ],
  og_title: '',
  og_description: '',
  og_image: '',
  page_id: 'change-background',
}

export default function ChangeBackgroundPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Change Background Online Free — JPT AI',
        description: config.meta_description,
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'Web',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        url: 'https://www.sjpt.io/change-background',
      }) }} />
      <LandingPage config={config} toolHref="/editor?tool=generate-bg" pageId="ai-editor" />
    </>
  )
}

import { Metadata } from 'next'
import LandingPage from '../_components/LandingPage'

export const metadata: Metadata = {
  title: 'Convert Image to PNG Online Free — JPG, WEBP to PNG | JPT AI',
  description: 'Convert JPG, WEBP, BMP or GIF to PNG online for free. Lossless quality, transparency preserved, instant download. No signup, no watermark, no file size limits.',
  keywords: 'convert jpg to png, jpg to png online free, convert image to png, webp to png converter, convert photo to png, free png converter online, image to png no watermark, png converter no signup',
  alternates: { canonical: 'https://www.sjpt.io/convert-to-png' },
  openGraph: {
    title: 'Convert to PNG Online Free — Instant, No Watermark | JPT AI',
    description: 'Convert JPG, WEBP, BMP or GIF to PNG for free. Lossless quality, transparency preserved. No signup, no watermark.',
    url: 'https://www.sjpt.io/convert-to-png',
  },
}

const config = {
  h1: 'Convert Image to PNG Free Online',
  subtitle: 'Convert any JPG, WEBP, BMP or GIF to PNG instantly. Lossless quality, transparency preserved, no watermark. Download immediately — no signup required.',
  cta_text: '🔄 Convert to PNG',
  meta_description: metadata.description as string,
  keywords: metadata.keywords as string,
  title: metadata.title as string,
  features: [
    { icon: '🔄', title: 'All Formats Supported', desc: 'Convert JPG, JPEG, WEBP, BMP, GIF, and TIFF to PNG. Handles any image format you throw at it.' },
    { icon: '✅', title: 'Transparency Preserved', desc: 'Alpha channels and transparent backgrounds are fully preserved when converting to PNG. Perfect for logos and icons.' },
    { icon: '🎯', title: 'Lossless Quality', desc: 'PNG uses lossless compression — every pixel is preserved exactly. No quality degradation, ever.' },
    { icon: '🔒', title: 'Runs in Your Browser', desc: 'Conversion happens locally in your browser — no upload, no server, no privacy risk.' },
    { icon: '📤', title: 'No Watermark', desc: 'Download clean PNG files with no branding or watermark added.' },
    { icon: '⚡', title: 'Instant Download', desc: 'Conversion takes less than a second. Download your PNG immediately, no email or account required.' },
  ],
  faq: [
    { q: 'Does converting JPG to PNG improve quality?', a: 'No — PNG conversion preserves the quality from the source JPG but does not add detail that wasn\'t there. PNG is lossless, so it won\'t degrade quality further. For actual quality improvement, use our AI Upscaler.' },
    { q: 'Will my PNG have a transparent background?', a: 'If your source image has transparency (like a WEBP or PNG with alpha channel), the transparency is preserved in the output PNG. If you want to remove the background entirely, use our Background Remover tool.' },
    { q: 'Why is PNG larger than JPG?', a: 'PNG uses lossless compression which preserves every pixel exactly — this makes files larger than JPG (which uses lossy compression that discards some detail). Use PNG for logos, icons, and screenshots; use JPG for photographs.' },
    { q: 'Is there a file size limit for conversion?', a: 'No. Conversion runs entirely in your browser so there are no server-side file size restrictions. Very large images may take a moment to process.' },
    { q: 'Can I convert multiple images at once?', a: 'Currently the tool processes one image at a time. For batch conversion of many images, visit our full editor tool which supports batch processing.' },
  ],
  og_title: '',
  og_description: '',
  og_image: '',
  page_id: 'convert-to-png',
}

export default function ConvertToPngPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Convert to PNG Online Free — JPT AI',
        description: config.meta_description,
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'Web',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        url: 'https://www.sjpt.io/convert-to-png',
      }) }} />
      <LandingPage config={config} toolHref="/editor" pageId="convert-to-png" inlineToolType="convert-png" />
    </>
  )
}

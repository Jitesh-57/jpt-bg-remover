import { Metadata } from 'next'
import LandingPage from '../_components/LandingPage'

export const metadata: Metadata = {
  title: 'Convert Image to JPG Online Free — PNG, WEBP to JPG | JPT AI',
  description: 'Convert PNG, WEBP, BMP or GIF to JPG online for free. High-quality JPEG output, instant download. No signup, no watermark, no file size limits.',
  keywords: 'convert png to jpg, png to jpg online free, convert image to jpg, webp to jpg converter, convert photo to jpeg, free jpg converter online, image to jpg no watermark, heic to jpg converter',
  alternates: { canonical: 'https://www.sjpt.io/convert-to-jpg' },
  openGraph: {
    title: 'Convert to JPG Online Free — Instant, No Watermark | JPT AI',
    description: 'Convert PNG, WEBP, BMP or GIF to JPG for free. High-quality output, instant download. No signup, no watermark.',
    url: 'https://www.sjpt.io/convert-to-jpg',
  },
}

const config = {
  h1: 'Convert Image to JPG Free Online',
  subtitle: 'Convert any PNG, WEBP, BMP or GIF to high-quality JPG instantly. 50–80% smaller file sizes, universal compatibility, no watermark. No signup required.',
  cta_text: '🔄 Convert to JPG',
  meta_description: metadata.description as string,
  keywords: metadata.keywords as string,
  title: metadata.title as string,
  features: [
    { icon: '🔄', title: 'All Formats → JPG', desc: 'Convert PNG, WEBP, BMP, GIF, and TIFF to JPG. Any image format converted to the universal JPEG standard.' },
    { icon: '📉', title: '50–80% Smaller Files', desc: 'JPG compression dramatically reduces file sizes compared to PNG — perfect for email, web, and social media.' },
    { icon: '🌐', title: 'Universal Compatibility', desc: 'JPG files open in every browser, operating system, design tool, and social platform — guaranteed.' },
    { icon: '🔒', title: 'Runs in Your Browser', desc: 'Conversion happens locally in your browser — no upload, no server, no privacy risk. Your images stay private.' },
    { icon: '📤', title: 'No Watermark', desc: 'Download clean JPG files with no branding, watermark, or overlay added — ever.' },
    { icon: '⚡', title: 'Instant Download', desc: 'Conversion takes less than a second. Download your JPG immediately, no email or account required.' },
  ],
  faq: [
    { q: 'Does converting PNG to JPG reduce quality?', a: 'JPG uses lossy compression which removes some image data to achieve smaller file sizes. For photos, the quality loss is typically invisible. For images with text, sharp lines, or transparency, PNG is a better format as JPG can introduce artifacts.' },
    { q: 'What happens to transparent backgrounds when converting to JPG?', a: 'JPG does not support transparency. Transparent areas in your PNG or WEBP will be filled with white when converting to JPG. If you need transparency, keep the image as PNG instead.' },
    { q: 'What JPG quality setting do you use?', a: 'We use a quality setting of 92%, which provides excellent visual quality while achieving significant file size reduction. This is higher than most online converters which default to lower quality settings.' },
    { q: 'Can I convert a screenshot to JPG?', a: 'Yes — screenshots are typically saved as PNG. Converting to JPG reduces file size significantly. However, if the screenshot contains sharp text, keep it as PNG for cleaner readability.' },
    { q: 'Is there a file size limit?', a: 'No. Conversion runs in your browser with no server-side limits. Very large files may take a moment to process depending on your device.' },
  ],
  og_title: '',
  og_description: '',
  og_image: '',
  page_id: 'convert-to-jpg',
}

export default function ConvertToJpgPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Convert to JPG Online Free — JPT AI',
        description: config.meta_description,
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'Web',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        url: 'https://www.sjpt.io/convert-to-jpg',
      }) }} />
      <LandingPage config={config} toolHref="/editor" pageId="convert-to-jpg" inlineToolType="convert-jpg" />
    </>
  )
}

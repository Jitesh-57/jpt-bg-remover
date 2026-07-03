import { Metadata } from 'next'
import LandingPage from '../_components/LandingPage'

export const metadata: Metadata = {
  title: 'Compress Image Online Free — Reduce File Size Without Losing Quality | JPT AI',
  description: 'Compress JPG, PNG and WEBP images online for free. Reduce file size by up to 80% without visible quality loss. No watermark, no signup, instant results. Perfect for websites, email, and social media.',
  keywords: 'compress image online free, image compressor, reduce image file size, jpg compressor, png compressor, compress photo online, image size reducer, optimize images for web, free image compression no watermark',
  alternates: { canonical: 'https://www.sjpt.io/compress-image' },
  openGraph: {
    title: 'Compress Image Online Free — Reduce File Size Instantly | JPT AI',
    description: 'Compress JPG, PNG and WEBP images online for free. Reduce file size by up to 80% without visible quality loss. No watermark, instant results.',
    url: 'https://www.sjpt.io/compress-image',
  },
}

const config = {
  h1: 'Compress Images Online Free',
  subtitle: 'Reduce image file size by up to 80% without losing quality. Perfect for websites, email, and social media. No watermark, no signup required.',
  cta_text: '⚡ Compress My Image',
  meta_description: metadata.description as string,
  keywords: metadata.keywords as string,
  title: metadata.title as string,
  features: [
    { icon: '⚡', title: 'Up to 80% Size Reduction', desc: 'Dramatically reduce image file sizes while maintaining visual quality indistinguishable to the human eye.' },
    { icon: '🎯', title: 'Smart Quality Optimization', desc: 'AI-powered compression finds the optimal balance between file size and quality for each image automatically.' },
    { icon: '🌐', title: 'Boost Google Rankings', desc: 'Faster page load speeds from compressed images improve Core Web Vitals scores and Google SEO rankings.' },
    { icon: '🔒', title: 'Runs in Your Browser', desc: 'Images are processed locally — no upload to servers, no privacy risk, no file size limits.' },
    { icon: '📤', title: 'No Watermark Ever', desc: 'Your compressed images are clean and ready to use — no logo or watermark added, ever.' },
    { icon: '✅', title: 'All Formats Supported', desc: 'Compress JPG, PNG, WEBP, and BMP. Output as JPG for maximum compression or PNG for lossless quality.' },
  ],
  faq: [
    { q: 'How much can I compress an image without losing quality?', a: 'For JPG images, you can typically reduce file size by 50–80% with no visible quality difference. PNG files can be compressed 20–40% losslessly. Our smart compression algorithm finds the optimal quality setting for each image.' },
    { q: 'Does compressing an image reduce its dimensions (width/height)?', a: 'No. Image compression only reduces the file size — the pixel dimensions (width and height) stay exactly the same. Your image will look identical but download much faster.' },
    { q: 'Why should I compress images for my website?', a: 'Page speed is a direct Google ranking factor. Large images are the #1 cause of slow websites. Google recommends images under 100KB for fast Core Web Vitals scores. Compressed images can improve rankings and reduce bounce rates.' },
    { q: 'Is my image data safe when I compress it?', a: 'Yes — completely. Compression runs entirely in your browser using JavaScript. Your images never leave your device and are never uploaded to any server.' },
    { q: 'What is the best image format for websites?', a: 'JPG is best for photographs (50–80% smaller than PNG). PNG is best for logos, icons, and images with transparency. WEBP is the modern format supported by Chrome/Firefox that offers the best compression for both types.' },
  ],
  og_title: '',
  og_description: '',
  og_image: '',
  page_id: 'compress-image',
}

export default function CompressImagePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Free Image Compressor — JPT AI',
    description: config.meta_description,
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    url: 'https://www.sjpt.io/compress-image',
  }
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <LandingPage config={config} toolHref="/editor" pageId="compress-image" inlineToolType="compress" />
    </>
  )
}

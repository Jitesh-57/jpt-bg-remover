import { Metadata } from 'next'
import LandingPage from '../_components/LandingPage'

export const metadata: Metadata = {
  title: 'Passport Photo Maker Online Free — US Passport Size | JPT AI',
  description: 'Create US passport photos online free. AI removes background, adds white backdrop, and formats to 2×2 inch passport size. Meets US State Department standards. No watermark.',
  keywords: 'passport photo online free, us passport photo maker, passport size photo generator, make passport photo at home, online passport photo 2x2, passport photo background removal, digital passport photo free',
  alternates: { canonical: 'https://www.sjpt.io/passport-photo' },
  openGraph: {
    title: 'US Passport Photo Maker Free Online | JPT AI',
    description: 'Create US passport photos online free. AI formats to 2×2 inch with white background. Meets State Department standards. No watermark.',
    url: 'https://www.sjpt.io/passport-photo',
  },
}

const config = {
  h1: 'US Passport Photo Maker — Free Online',
  subtitle: 'Create compliant US passport photos at home. AI removes background, adds white backdrop, and formats to the required 2×2 inch size. State Department compliant. No watermark.',
  cta_text: '📸 Create Passport Photo',
  meta_description: metadata.description as string,
  keywords: metadata.keywords as string,
  title: metadata.title as string,
  features: [
    { icon: '📸', title: '2×2 Inch US Passport Format', desc: 'Automatically formats your photo to the required 2×2 inch (51×51mm) size required by the US State Department.' },
    { icon: '⬜', title: 'White Background Added', desc: 'AI removes your existing background and replaces it with the required plain white or off-white background.' },
    { icon: '✅', title: 'State Department Compliant', desc: 'Output meets all US State Department requirements: correct dimensions, white background, 600 DPI resolution.' },
    { icon: '🎯', title: 'Perfect Face Centering', desc: 'AI detects and centers your face automatically, ensuring your head takes up the correct portion of the frame.' },
    { icon: '📤', title: 'Print at Home or CVS', desc: 'Download print-ready files sized for 4×6 photo paper with four 2×2 passport photos per sheet.' },
    { icon: '⚡', title: 'Done in 30 Seconds', desc: 'From upload to compliant passport photo in under 30 seconds. Skip the Walgreens or CVS photo service fee.' },
  ],
  faq: [
    { q: 'Does the US government accept digital passport photos?', a: 'The US State Department now accepts electronically submitted digital passport photos for online renewals. The photo must meet specific requirements: 2×2 inches, white background, taken within 6 months, eyes open, neutral expression.' },
    { q: 'What are US passport photo requirements?', a: 'US passport photos must be: 2×2 inches (51×51mm), taken against a plain white or off-white background, within the last 6 months, showing full face with eyes open, head centered and filling 70-80% of the frame, printed at 600 DPI or higher.' },
    { q: 'Can I use this for visa photos too?', a: 'Yes — most visa applications accept the same 2×2 inch format. For specific country visa requirements that differ (like India or China visas), check the consulate\'s specifications as dimensions may vary.' },
    { q: 'Is this free?', a: 'Yes — creating a passport photo is free to try. No credit card, no signup required. Download the formatted photo immediately.' },
    { q: 'What photo should I take for best results?', a: 'Take a photo with even lighting, against a light-colored wall or door. Look directly at the camera, maintain a neutral expression, and make sure your entire face is visible. Our AI will handle background removal and formatting.' },
  ],
  og_title: '',
  og_description: '',
  og_image: '',
  page_id: 'passport-photo',
}

export default function PassportPhotoPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'US Passport Photo Maker Online Free — JPT AI',
        description: config.meta_description,
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'Web',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        url: 'https://www.sjpt.io/passport-photo',
      }) }} />
      <LandingPage config={config} toolHref="/editor?tool=remove-bg" pageId="remove-bg" />
    </>
  )
}

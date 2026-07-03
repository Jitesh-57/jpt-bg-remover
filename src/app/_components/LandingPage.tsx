'use client'

import { useState } from 'react'
import FAQAccordion from './FAQAccordion'
import InlineTool, { InlineToolType } from './InlineTool'
import BeforeAfterSlider from './BeforeAfterSlider'
import { PageSEO } from '@/lib/page-config'
import { PAGE_BEFORE_AFTER, landingImg } from '@/lib/landing-images'

interface LandingPageProps {
  config: PageSEO
  toolHref: string
  pageId: string
  inlineToolType?: InlineToolType
}

// ─── per-page inline tool mapping ────────────────────────────────────────────
const PAGE_INLINE_TOOL: Record<string, InlineToolType> = {
  upscale: 'upscale',
  'photo-enhancer': 'upscale',
  'remove-bg': 'remove-bg',
  'compress-image': 'compress',
  'resize-image': 'resize',
  'convert-to-png': 'convert-png',
  'convert-to-jpg': 'convert-jpg',
}

// ─── labels for before/after ──────────────────────────────────────────────────
const PAGE_BA_LABELS: Record<string, { before: string; after: string }> = {
  upscale: { before: 'Low-Res Original', after: '4× AI Upscaled' },
  'photo-enhancer': { before: 'Original Photo', after: 'AI Enhanced' },
  'remove-bg': { before: 'Original', after: 'Background Removed' },
  'compress-image': { before: 'Original (Large)', after: 'Compressed (80% smaller)' },
  'convert-to-png': { before: 'Source Image', after: 'PNG Converted' },
  'convert-to-jpg': { before: 'Source Image', after: 'JPG (80% smaller)' },
  'watermark-remover': { before: 'With Watermark', after: 'Watermark Removed' },
  'change-background': { before: 'Original Background', after: 'New AI Background' },
  'make-background-white': { before: 'Colored Background', after: 'Pure White Background' },
  'passport-photo': { before: 'Casual Photo', after: 'Passport Ready' },
}

// ─── hero before/after images (Supabase where real images exist, CSS sim otherwise) ──
const PAGE_HERO_IMAGES: Record<string, { before: string; after: string; beforeFilter?: string; beforeOverlay?: string }> = {
  upscale: {
    before: landingImg('upscale-before.jpg'),
    after: landingImg('upscale-after.jpg'),
    beforeFilter: 'blur(2px) contrast(0.8) saturate(0.75)',
  },
  'photo-enhancer': {
    before: landingImg('upscale-before.jpg'),
    after: landingImg('upscale-after.jpg'),
    beforeFilter: 'blur(2.5px) sepia(0.3) contrast(0.75)',
  },
  'remove-bg': {
    before: landingImg('page-remove-bg.png'),
    after: landingImg('page-remove-bg.png'),
    beforeFilter: undefined,
    beforeOverlay: 'bg',
  },
  'compress-image': {
    before: landingImg('upscale-after.jpg'),
    after: landingImg('upscale-after.jpg'),
    beforeFilter: 'blur(0.8px) contrast(0.9)',
    beforeOverlay: undefined,
  },
}

// ─── feature rows ─────────────────────────────────────────────────────────────
interface FeatureRow {
  badge: string
  heading: string
  body: string
  beforeLabel: string
  afterLabel: string
  beforeFilter: string
  beforeOverlay?: 'watermark' | 'pixels'
  side: 'left' | 'right'
}

const PAGE_FEATURE_ROWS: Record<string, FeatureRow[]> = {
  upscale: [
    {
      badge: 'AI Super-Resolution',
      heading: 'Recover stunning detail from any low-res photo',
      body: 'Deep learning super-resolution reconstructs sharp edges, fine textures, and crisp detail that traditional upscaling destroys. Hair, fabric, product labels — all rendered pixel-perfect.',
      beforeLabel: 'Pixelated Original',
      afterLabel: '4× AI Upscaled',
      beforeFilter: 'blur(3px) contrast(0.75) saturate(0.6)',
      side: 'right',
    },
    {
      badge: 'Lossless Quality',
      heading: 'Upscale to print-ready resolution — zero artifacts',
      body: 'No JPEG artifacts, no ringing, no over-sharpening. JPT AI produces clean, natural-looking high-resolution output ready for large-format printing, retina displays, and e-commerce listings.',
      beforeLabel: 'Original (Blurry)',
      afterLabel: 'Upscaled (Sharp)',
      beforeFilter: 'blur(2px) brightness(0.9)',
      side: 'left',
    },
    {
      badge: 'Works on Everything',
      heading: 'Products, portraits, landscapes, AI art — all supported',
      body: 'Whether upscaling e-commerce product shots, restoring old family photos, or scaling AI-generated art for print — our model handles every subject type with equal precision.',
      beforeLabel: 'Low Resolution',
      afterLabel: 'AI Enhanced',
      beforeFilter: 'blur(2px) contrast(0.8)',
      side: 'right',
    },
  ],
  'photo-enhancer': [
    {
      badge: 'Auto Enhancement',
      heading: 'Fix brightness, contrast & sharpness automatically',
      body: 'AI analyzes each photo and applies optimal corrections — boosting shadow detail, balancing highlights, sharpening edges. No sliders, no guesswork.',
      beforeLabel: 'Dull Original',
      afterLabel: 'AI Enhanced',
      beforeFilter: 'blur(1.5px) brightness(0.8) saturate(0.6) contrast(0.8)',
      side: 'right',
    },
    {
      badge: 'Old Photo Restoration',
      heading: 'Restore faded vintage photos to vivid color',
      body: 'Recover detail from aged, faded, or damaged photographs. AI removes grain, corrects color shift, and restores sharpness lost over decades.',
      beforeLabel: 'Faded Original',
      afterLabel: 'AI Restored',
      beforeFilter: 'sepia(0.7) blur(1.5px) contrast(0.7) saturate(0.3)',
      side: 'left',
    },
    {
      badge: 'Resolution Upscaling',
      heading: '4× resolution — retina-ready for print and web',
      body: 'Increase resolution 2× or 4× using the same deep learning used by Google Photos and Apple\'s intelligent upscaler. Results are indistinguishable from the original high-resolution source.',
      beforeLabel: 'Low Resolution',
      afterLabel: '4× AI Upscaled',
      beforeFilter: 'blur(3px) contrast(0.8) saturate(0.7)',
      side: 'right',
    },
  ],
  'remove-bg': [
    {
      badge: 'Pixel-Perfect Cutout',
      heading: 'Remove backgrounds with studio-quality accuracy',
      body: 'AI detects subjects with pixel-level precision. Hair strands, fur, translucent fabric — all handled cleanly. Results indistinguishable from a professional Photoshop cutout.',
      beforeLabel: 'Original Background',
      afterLabel: 'Clean Cutout',
      beforeFilter: 'contrast(0.85)',
      beforeOverlay: 'bg',
      side: 'right',
    },
    {
      badge: 'E-Commerce Ready',
      heading: 'White background product photos in seconds',
      body: 'Amazon, Shopify, Etsy — all require clean white backgrounds. JPT AI delivers marketplace-compliant product shots automatically. Save hours vs. manual Photoshop editing.',
      beforeLabel: 'Original',
      afterLabel: 'White Background',
      beforeFilter: undefined,
      beforeOverlay: 'bg',
      side: 'left',
    },
    {
      badge: 'Any Subject',
      heading: 'Works on people, products, pets, and more',
      body: 'From sharp product edges to wispy hair — our AI handles every subject type. Perfect for headshots, product photography, social media thumbnails, and ad creatives.',
      beforeLabel: 'With Background',
      afterLabel: 'Removed',
      beforeFilter: 'contrast(0.9)',
      side: 'right',
    },
  ],
  'watermark-remover': [
    {
      badge: 'AI Watermark Detection',
      heading: 'Detect and remove watermarks automatically',
      body: 'AI identifies text overlays, logos, timestamp stamps, and semi-transparent watermarks of any size or placement — then cleanly fills the area.',
      beforeLabel: 'Watermarked',
      afterLabel: 'Clean',
      beforeFilter: undefined,
      beforeOverlay: 'watermark',
      side: 'right',
    },
    {
      badge: 'Content-Aware Fill',
      heading: 'Remove without leaving a blur or smear',
      body: 'Unlike basic inpainting tools that smear or blur the removal area, JPT AI reconstructs the underlying image using surrounding context for seamless results.',
      beforeLabel: 'With Stamp',
      afterLabel: 'Restored',
      beforeFilter: undefined,
      beforeOverlay: 'watermark',
      side: 'left',
    },
    {
      badge: 'Every Watermark Type',
      heading: 'Text, logos, dates, preview marks — all removed',
      body: 'Handles stock site watermarks, photographer copyright text, date stamps, logo overlays, and promotional banners — regardless of position, opacity, or font.',
      beforeLabel: 'Before',
      afterLabel: 'After',
      beforeFilter: undefined,
      beforeOverlay: 'watermark',
      side: 'right',
    },
  ],
  'compress-image': [
    {
      badge: 'Smart Compression',
      heading: 'Reduce file size 80% with zero visible quality loss',
      body: 'AI-powered compression targets redundant data while preserving visual quality. Results are indistinguishable at full size — but load dramatically faster on web and email.',
      beforeLabel: 'Original (Large File)',
      afterLabel: 'Compressed (80% Smaller)',
      beforeFilter: 'blur(0.5px)',
      side: 'right',
    },
    {
      badge: 'Core Web Vitals',
      heading: 'Pass Google Page Speed — rank higher in search',
      body: 'Image size is the #1 cause of slow websites. Google rewards fast pages with higher search rankings. Compress your images and improve your Core Web Vitals score instantly.',
      beforeLabel: 'Unoptimized (Slow)',
      afterLabel: 'Compressed (Fast)',
      beforeFilter: undefined,
      side: 'left',
    },
    {
      badge: 'Batch Ready',
      heading: 'Compress entire image libraries at once',
      body: 'Process product catalogs, blog image archives, and marketing asset libraries in minutes. Save storage, reduce bandwidth costs, and deliver faster experiences to every visitor.',
      beforeLabel: 'Before',
      afterLabel: 'After',
      beforeFilter: undefined,
      side: 'right',
    },
  ],
}

// Fall back to upscale rows for pages without dedicated rows
const getFeatureRows = (pageId: string): FeatureRow[] =>
  PAGE_FEATURE_ROWS[pageId] ?? PAGE_FEATURE_ROWS['upscale']

// ─── use case tabs ────────────────────────────────────────────────────────────
interface UseCase {
  label: string
  heading: string
  desc: string
  beforeLabel: string
  afterLabel: string
  beforeFilter?: string
  beforeOverlay?: 'watermark' | 'bg'
}

const PAGE_USE_CASES: Record<string, UseCase[]> = {
  upscale: [
    { label: 'E-Commerce', heading: 'Sharper product images — higher conversions', desc: 'Upscale blurry product photos to retina quality. E-commerce listings with high-resolution images convert up to 94% better. No reshooting needed.', beforeLabel: 'Low-Res Product', afterLabel: '4× Upscaled', beforeFilter: 'blur(3px) contrast(0.75) saturate(0.6)' },
    { label: 'Old Photos', heading: 'Restore vintage photos to vivid clarity', desc: 'Bring scanned family photos and vintage prints back to life. AI recovers detail lost to age, scanning artifacts, and compression.', beforeLabel: 'Scanned Original', afterLabel: 'AI Restored', beforeFilter: 'sepia(0.6) blur(2px) contrast(0.7)' },
    { label: 'AI Art & Design', heading: 'Scale AI art to print-ready resolution', desc: 'AI-generated images at 512px or 1024px upscale beautifully to 2048px and beyond for canvas prints, posters, and merchandise.', beforeLabel: 'AI Art (Small)', afterLabel: 'Print Ready', beforeFilter: 'blur(2.5px) contrast(0.8)' },
    { label: 'Social Media', heading: 'Retina-quality visuals for every platform', desc: 'Upload compressed downloads or screenshots and upscale to Instagram, LinkedIn, and TikTok standards — crisp on every screen.', beforeLabel: 'Downloaded (Blurry)', afterLabel: 'Upscaled (Sharp)', beforeFilter: 'blur(2px) brightness(0.9) saturate(0.8)' },
    { label: 'Print & Canvas', heading: 'Large-format print from small originals', desc: 'Starting from a 1MP phone photo or web image, upscale 4× for high-quality A1/A2 posters, canvas prints, and merchandise.', beforeLabel: 'Small Original', afterLabel: 'Large Format Ready', beforeFilter: 'blur(3.5px) contrast(0.7)' },
  ],
  'remove-bg': [
    { label: 'E-Commerce', heading: 'Amazon & Shopify white background shots', desc: 'Amazon requires pure white backgrounds on all main product images. JPT AI delivers marketplace-compliant photos in seconds — no studio, no photographer.', beforeLabel: 'Product in Scene', afterLabel: 'White Background', beforeFilter: undefined, beforeOverlay: 'bg' },
    { label: 'Headshots', heading: 'Professional LinkedIn profile photos', desc: 'LinkedIn profiles with professional headshots get 21× more views. Remove distracting backgrounds and add a clean professional backdrop.', beforeLabel: 'Casual Photo', afterLabel: 'Studio Look', beforeFilter: undefined, beforeOverlay: 'bg' },
    { label: 'Thumbnails', heading: 'Eye-catching YouTube & social thumbnails', desc: 'Cut out subjects for bold, high-contrast thumbnails that drive clicks. Place on any background — gradient, solid color, or custom scene.', beforeLabel: 'Original Background', afterLabel: 'Clean Cutout', beforeFilter: undefined, beforeOverlay: 'bg' },
    { label: 'Ad Creatives', heading: 'Marketing assets in minutes, not days', desc: 'Remove backgrounds from product photos and people to create flexible assets for ads, emails, flyers, and presentations across every platform.', beforeLabel: 'With Background', afterLabel: 'Asset Ready', beforeFilter: 'contrast(0.85)', beforeOverlay: 'bg' },
    { label: 'Real Estate', heading: 'Clean property and furniture photography', desc: 'Remove cluttered backgrounds from furniture and product photos. Create clean shots that highlight the item — not the room it was photographed in.', beforeLabel: 'In-Room Photo', afterLabel: 'Clean Product', beforeFilter: undefined, beforeOverlay: 'bg' },
  ],
  'photo-enhancer': [
    { label: 'Old Photos', heading: 'Restore faded family photographs', desc: 'Recover detail from aged, faded prints. AI corrects yellowing, removes grain, and sharpens detail lost over decades of storage.', beforeLabel: 'Faded Original', afterLabel: 'Restored', beforeFilter: 'sepia(0.7) blur(2px) brightness(0.8)' },
    { label: 'Portraits', heading: 'Professional portrait enhancement', desc: 'Brighten eyes, smooth skin, and enhance portrait clarity — subtly, without the over-processed look of heavy retouching filters.', beforeLabel: 'Unedited', afterLabel: 'Enhanced', beforeFilter: 'blur(1.5px) brightness(0.85) saturate(0.7)' },
    { label: 'Products', heading: 'Sharper product photos for listings', desc: 'Fix dark, blurry, or dull product shots. AI boosts detail, corrects color, and sharpens edges so your listing stands out.', beforeLabel: 'Dull Product Shot', afterLabel: 'Professional Look', beforeFilter: 'blur(1px) contrast(0.8) saturate(0.6)' },
    { label: 'Events', heading: 'Rescue dark or blurry event photos', desc: 'Indoor event photos often suffer from poor lighting and motion blur. AI enhancement rescues dark, noisy, and blurry captures.', beforeLabel: 'Dark / Blurry', afterLabel: 'Clear & Bright', beforeFilter: 'blur(2px) brightness(0.6) contrast(0.8)' },
    { label: 'Travel', heading: 'Bring travel memories back to life', desc: 'Holiday and travel photos taken on older phones or in low light come out dramatically better with AI color restoration and sharpening.', beforeLabel: 'Hazy Travel Shot', afterLabel: 'Vivid & Sharp', beforeFilter: 'blur(1px) brightness(0.85) saturate(0.65) hue-rotate(-5deg)' },
  ],
  'compress-image': [
    { label: 'Websites', heading: 'Pass Core Web Vitals. Rank higher.', desc: 'Google uses page speed as a ranking factor. Images account for 60% of page weight. Compress your images and watch your PageSpeed score jump.', beforeLabel: 'Unoptimized (Slow)', afterLabel: 'Compressed (Fast)', beforeFilter: undefined },
    { label: 'E-Commerce', heading: 'Faster product pages — more conversions', desc: 'A 1-second improvement in mobile page load improves conversions by 27%. Compress your entire product catalog for measurable revenue impact.', beforeLabel: 'Heavy Images', afterLabel: 'Optimized Images', beforeFilter: undefined },
    { label: 'Email', heading: 'Email images that actually load', desc: 'Large images in emails trigger spam filters and never load for recipients. Compress to under 200KB and ensure every subscriber sees your campaign.', beforeLabel: 'Too Large (Spam Risk)', afterLabel: 'Email Ready', beforeFilter: undefined },
    { label: 'Apps', heading: 'Smaller app bundles, faster downloads', desc: 'Every KB of image assets your app downloads costs users time and data. Compress assets to reduce APK/IPA size and improve app store ratings.', beforeLabel: 'Large Assets', afterLabel: 'Optimized Bundle', beforeFilter: undefined },
    { label: 'Cloud Storage', heading: 'Cut storage costs without losing quality', desc: 'Compress your photo library and cloud storage bills drop proportionally. JPT AI reduces file sizes 60-80% with zero visible quality difference.', beforeLabel: 'Original (Full Size)', afterLabel: 'Compressed (Tiny)', beforeFilter: undefined },
  ],
}

// ─── type/scenario grid ───────────────────────────────────────────────────────
interface TypeCard {
  title: string
  desc: string
  icon: string
  beforeFilter?: string
  beforeOverlay?: 'watermark' | 'bg' | 'pixels'
  tag?: string
}

const PAGE_TYPE_CARDS: Record<string, TypeCard[]> = {
  upscale: [
    { title: 'Product Photos', desc: 'Upscale e-commerce shots to retina quality', icon: '🛍️', beforeFilter: 'blur(3px) contrast(0.75)', tag: 'Most Popular' },
    { title: 'Old & Scanned Photos', desc: 'Restore vintage prints to digital clarity', icon: '📷', beforeFilter: 'sepia(0.6) blur(2px) contrast(0.7)' },
    { title: 'Portraits & Headshots', desc: 'Sharp faces, crisp skin texture, clear eyes', icon: '👤', beforeFilter: 'blur(2px) contrast(0.8) saturate(0.8)' },
    { title: 'AI-Generated Art', desc: 'Scale 512px AI images to print-ready 4K', icon: '🎨', beforeFilter: 'blur(4px) contrast(0.7) saturate(0.5)', tag: 'Trending' },
    { title: 'Screenshots & UI', desc: 'Crisp screenshots for docs, blogs, and ads', icon: '🖥️', beforeFilter: 'blur(1.5px) contrast(0.85)' },
    { title: 'Logos & Brand Assets', desc: 'Enlarge logos without pixelation or blur', icon: '✦', beforeFilter: 'blur(2.5px) contrast(0.7) saturate(0.6)' },
  ],
  'remove-bg': [
    { title: 'Product Photography', desc: 'White-background shots for Amazon & Shopify', icon: '🛍️', beforeOverlay: 'bg', tag: 'Most Popular' },
    { title: 'Profile Photos', desc: 'Clean headshots for LinkedIn & team pages', icon: '👤', beforeOverlay: 'bg' },
    { title: 'YouTube Thumbnails', desc: 'Subject cutouts for eye-catching thumbnails', icon: '▶️', beforeOverlay: 'bg', tag: 'Trending' },
    { title: 'Clothing & Apparel', desc: 'Ghost mannequin effect for fashion listings', icon: '👕', beforeOverlay: 'bg' },
    { title: 'Pets & Animals', desc: 'Precise fur-edge cutouts for pet portraits', icon: '🐾', beforeOverlay: 'bg' },
    { title: 'Ad Creatives', desc: 'Flexible assets for any campaign background', icon: '📣', beforeOverlay: 'bg' },
  ],
  'watermark-remover': [
    { title: 'Text Watermarks', desc: 'Remove copyright text and name overlays', icon: '©', beforeOverlay: 'watermark', tag: 'Most Common' },
    { title: 'Logo Watermarks', desc: 'Remove brand logos placed over images', icon: '🏷️', beforeOverlay: 'watermark' },
    { title: 'Date & Time Stamps', desc: 'Remove camera date stamps from old photos', icon: '📅', beforeOverlay: 'watermark' },
    { title: 'Stock Photo Marks', desc: 'Identify and clean stock site watermarks', icon: '🖼️', beforeOverlay: 'watermark', tag: 'Popular' },
    { title: 'Preview Watermarks', desc: 'Remove diagonal "PREVIEW" and "SAMPLE" text', icon: '🔒', beforeOverlay: 'watermark' },
    { title: 'Promotional Banners', desc: 'Remove overlaid promotional text banners', icon: '📢', beforeOverlay: 'watermark' },
  ],
  'compress-image': [
    { title: 'JPEG Photos', desc: 'Compress product & lifestyle photography', icon: '📸', tag: 'Most Popular' },
    { title: 'PNG Graphics', desc: 'Compress UI screenshots and graphics', icon: '🖥️' },
    { title: 'E-Commerce Catalogs', desc: 'Batch optimize entire product libraries', icon: '🛍️', tag: 'Power User' },
    { title: 'Blog Images', desc: 'Optimize hero images for Core Web Vitals', icon: '✍️' },
    { title: 'Social Media Assets', desc: 'Resize and compress for Instagram & LinkedIn', icon: '📱' },
    { title: 'Email Images', desc: 'Under 200KB for perfect email rendering', icon: '📧' },
  ],
  'photo-enhancer': [
    { title: 'Old Family Photos', desc: 'Restore faded vintage and scanned prints', icon: '📷', tag: 'Most Popular' },
    { title: 'Portrait Retouching', desc: 'Bright eyes, smooth skin, natural look', icon: '👤' },
    { title: 'Product Photos', desc: 'Sharper, brighter e-commerce listing images', icon: '🛍️' },
    { title: 'Travel Photography', desc: 'Enhance hazy and underexposed travel shots', icon: '✈️', tag: 'Trending' },
    { title: 'Event Photography', desc: 'Rescue dark or motion-blurred event photos', icon: '🎉' },
    { title: 'Landscape Photos', desc: 'Vivid colors, sharp detail, clear skies', icon: '🏔️' },
  ],
}

const getTypeCards = (pageId: string): TypeCard[] =>
  PAGE_TYPE_CARDS[pageId] ?? PAGE_TYPE_CARDS['upscale']

// ─── testimonials ─────────────────────────────────────────────────────────────
const PAGE_TESTIMONIALS: Record<string, { name: string; role: string; avatar: string; quote: string }[]> = {
  upscale: [
    { name: 'Marcus Johnson', role: 'E-commerce Seller, Austin TX', avatar: 'MJ', quote: 'Had hundreds of old product photos shot on a phone. After upscaling they look like studio shots. My conversion rate improved noticeably.' },
    { name: 'Sarah Mitchell', role: 'Photographer, New York', avatar: 'SM', quote: 'The AI preserves texture and detail unlike any other online tool. Hair, fabric, skin — all looks natural after upscaling.' },
    { name: 'Derek Chen', role: 'Graphic Designer, San Francisco', avatar: 'DC', quote: 'I use it to upscale AI-generated art before printing. 4× and the results are ready for A2 poster prints. Incredible quality.' },
    { name: 'Priya Nair', role: 'Etsy Seller, Portland', avatar: 'PN', quote: 'My handmade jewelry photos were blurry on Etsy. Upscaling made them look professional. Sales went up 40% that month.' },
    { name: 'Tom Bradley', role: 'Marketing Director, Chicago', avatar: 'TB', quote: 'We use it for old campaign assets that need updating for 4K screens. Saves us a full photo reshoot every time.' },
    { name: 'Lisa Park', role: 'Print Designer, Seattle', avatar: 'LP', quote: 'I regularly upscale client logos for large-format banners. Results are always sharp with zero pixelation artifacts.' },
  ],
  'remove-bg': [
    { name: 'Jessica Park', role: 'E-commerce Owner, Los Angeles', avatar: 'JP', quote: 'Was spending 30 min per product photo in Photoshop. Now I process 40 images before my morning coffee. Store looks completely professional.' },
    { name: 'Ryan Torres', role: 'Freelance Photographer, Miami', avatar: 'RT', quote: 'Background removal on hair and fine edges is flawless. Clients can\'t tell the difference from a manual Photoshop cutout.' },
    { name: 'Amanda Lee', role: 'Social Media Manager, Chicago', avatar: 'AL', quote: 'Switched from remove.bg — same quality but JPT AI has all the other tools too. No watermarks, instant results. Love it.' },
    { name: 'Carlos Rivera', role: 'Fashion Brand, Miami', avatar: 'CR', quote: 'We do ghost mannequin shots for our entire clothing line. JPT AI handles fabric edges perfectly every single time.' },
    { name: 'Kevin Walsh', role: 'LinkedIn Coach, Boston', avatar: 'KW', quote: 'My clients use it for headshots. A clean background adds instant professionalism. Connection requests go up noticeably after.' },
    { name: 'Emma Collins', role: 'Content Creator, Nashville', avatar: 'EC', quote: 'Thumbnail backgrounds removed in seconds. My YouTube click-through rate improved 18% after switching to clean cutouts.' },
  ],
  'photo-enhancer': [
    { name: 'Tyler Brooks', role: 'Family Photographer, Denver', avatar: 'TB', quote: 'My parents\' wedding photos from the 70s came out of this tool looking like they were taken last year. The family was speechless.' },
    { name: 'Natalie Grant', role: 'Blogger, Seattle', avatar: 'NG', quote: 'My old travel photos from 2012 on a terrible point-and-shoot look stunning now. The color restoration is incredible.' },
    { name: 'Kevin Walsh', role: 'Freelance Consultant, Denver', avatar: 'KW', quote: 'Used it to enhance product shots taken in bad lighting. Clients can\'t believe the difference — looks like a professional studio shot.' },
    { name: 'Sophie Anderson', role: 'Event Photographer, Chicago', avatar: 'SA', quote: 'Rescues my indoor event shots. Low-light photos come out sharp and properly exposed. Saves me 2 hours of Lightroom editing per event.' },
    { name: 'James Miller', role: 'Genealogy Researcher, Boston', avatar: 'JM', quote: 'I digitize old family photos for research. JPT AI restores them so clearly you can read text on documents from 1920.' },
    { name: 'Rachel Kim', role: 'Real Estate Agent, Phoenix', avatar: 'RK', quote: 'Enhancing interior listing photos takes 10 seconds per image now. Brighter, sharper, more professional. My listings get more views.' },
  ],
  'compress-image': [
    { name: 'David Wilson', role: 'Web Developer, Austin', avatar: 'DW', quote: 'Cut my homepage image sizes by 70% without any visible quality loss. My Core Web Vitals score jumped 18 points.' },
    { name: 'Emma Davis', role: 'Blogger, Seattle', avatar: 'ED', quote: 'Finally a free image compressor that doesn\'t add a watermark. My blog loads 3× faster now. Google loves it.' },
    { name: 'James Taylor', role: 'Shopify Developer, Atlanta', avatar: 'JT', quote: 'Compressed an entire product catalog in minutes. Page load dropped from 4.2s to 1.8s. Client is thrilled.' },
    { name: 'Nina Patel', role: 'SEO Specialist, Chicago', avatar: 'NP', quote: 'Image compression is an SEO non-negotiable. This tool makes it effortless — no more excuses from clients about slow sites.' },
    { name: 'Chris Morgan', role: 'E-commerce Director, Phoenix', avatar: 'CM', quote: 'Reduced our product image library from 4GB to 900MB with zero visible loss. CDN costs dropped significantly.' },
    { name: 'Lauren Kim', role: 'UX Designer, Portland', avatar: 'LK', quote: 'I compress every design export before handing off. Developers love me for it and pages load instantly.' },
  ],
}

const getTestimonials = (pageId: string) =>
  PAGE_TESTIMONIALS[pageId] ?? PAGE_TESTIMONIALS['upscale']

// ─── comparison ───────────────────────────────────────────────────────────────
const PAGE_COMPARISON: Record<string, { feature: string; jpt: boolean; alt1: boolean; alt2: boolean; alt1name: string; alt2name: string }[]> = {
  upscale: [
    { feature: '4× AI Super-Resolution', jpt: true, alt1: false, alt2: true, alt1name: 'Photoshop', alt2name: "Let's Enhance" },
    { feature: 'Free tier (no credit card)', jpt: true, alt1: false, alt2: false, alt1name: 'Photoshop', alt2name: "Let's Enhance" },
    { feature: 'No watermark on output', jpt: true, alt1: true, alt2: false, alt1name: 'Photoshop', alt2name: "Let's Enhance" },
    { feature: 'Works 100% in browser', jpt: true, alt1: false, alt2: true, alt1name: 'Photoshop', alt2name: "Let's Enhance" },
    { feature: 'BG removal + AI editing too', jpt: true, alt1: true, alt2: false, alt1name: 'Photoshop', alt2name: "Let's Enhance" },
    { feature: 'No signup to try', jpt: true, alt1: false, alt2: false, alt1name: 'Photoshop', alt2name: "Let's Enhance" },
  ],
  'remove-bg': [
    { feature: 'Free tier (no credit card)', jpt: true, alt1: false, alt2: true, alt1name: 'Photoshop', alt2name: 'remove.bg' },
    { feature: 'No watermark on free tier', jpt: true, alt1: false, alt2: false, alt1name: 'Photoshop', alt2name: 'remove.bg' },
    { feature: 'AI image editing included', jpt: true, alt1: true, alt2: false, alt1name: 'Photoshop', alt2name: 'remove.bg' },
    { feature: '4× AI upscaling included', jpt: true, alt1: true, alt2: false, alt1name: 'Photoshop', alt2name: 'remove.bg' },
    { feature: 'Works in browser', jpt: true, alt1: false, alt2: true, alt1name: 'Photoshop', alt2name: 'remove.bg' },
    { feature: 'No signup to try', jpt: true, alt1: false, alt2: true, alt1name: 'Photoshop', alt2name: 'remove.bg' },
  ],
  'compress-image': [
    { feature: 'Free (no credit card)', jpt: true, alt1: true, alt2: false, alt1name: 'TinyPNG', alt2name: 'Squoosh Pro' },
    { feature: 'No watermark', jpt: true, alt1: true, alt2: true, alt1name: 'TinyPNG', alt2name: 'Squoosh Pro' },
    { feature: 'AI upscaling too', jpt: true, alt1: false, alt2: false, alt1name: 'TinyPNG', alt2name: 'Squoosh Pro' },
    { feature: 'BG removal too', jpt: true, alt1: false, alt2: false, alt1name: 'TinyPNG', alt2name: 'Squoosh Pro' },
    { feature: 'Works in browser', jpt: true, alt1: true, alt2: true, alt1name: 'TinyPNG', alt2name: 'Squoosh Pro' },
    { feature: 'No signup needed', jpt: true, alt1: true, alt2: false, alt1name: 'TinyPNG', alt2name: 'Squoosh Pro' },
  ],
}

// ─── seo content ─────────────────────────────────────────────────────────────
const PAGE_SEO: Record<string, { heading: string; body: string }[]> = {
  upscale: [
    { heading: 'What is AI image upscaling?', body: 'AI image upscaling uses deep learning super-resolution to intelligently reconstruct detail when enlarging images — unlike traditional upscaling which just stretches pixels and creates blurry results. JPT AI analyzes textures, edges, and fine patterns to produce sharp, high-resolution output up to 4× the original size.' },
    { heading: 'Upscale images to 4K free online', body: 'JPT AI lets you upscale any photo to 2× or 4× resolution directly in your browser — no software to install, no credit card required. Process images instantly for e-commerce, print, social media, and professional use.' },
    { heading: 'Best for e-commerce, print & photography', body: 'Whether you\'re a seller needing retina-quality product photos, a photographer restoring old scans, or a designer scaling AI art for print — JPT AI delivers professional results in seconds. Works on portraits, products, landscapes, screenshots, and AI-generated images.' },
  ],
  'remove-bg': [
    { heading: 'What is AI background removal?', body: 'AI background removal uses deep learning image segmentation to precisely detect and separate the subject from the background — no manual selection, magic wand, or green screen needed. JPT AI handles people, products, animals, and complex edges like hair with pixel-level accuracy.' },
    { heading: 'Remove background online free — no watermark', body: 'JPT AI removes backgrounds instantly in your browser. Output is a full-resolution transparent PNG with no watermarks, no quality loss, free to use immediately. Perfect for Amazon product photos, LinkedIn headshots, YouTube thumbnails, and ad creatives.' },
    { heading: 'The best remove.bg alternative', body: 'Unlike remove.bg, JPT AI gives you an all-in-one toolkit: remove backgrounds AND upscale images, edit with AI text prompts, generate new backgrounds, and resize — all in one place, completely free to start with no credit card.' },
  ],
  'photo-enhancer': [
    { heading: 'What is AI photo enhancement?', body: 'AI photo enhancement uses neural networks to automatically analyze and correct brightness, contrast, sharpness, color balance, and noise in a single pass — delivering professional-grade results without manual slider adjustments or expert knowledge.' },
    { heading: 'Restore old photos online free', body: 'Old family photos, scanned prints, and damaged photographs respond beautifully to AI restoration. JPT AI corrects fading, removes grain, sharpens detail, and restores color shift from aging — all in seconds, completely free.' },
    { heading: 'AI photo enhancer vs. Lightroom', body: 'Professional photo editing tools require skill, time, and subscription costs. JPT AI delivers comparable results instantly, for free, directly in your browser — no export workflow, no adjustment presets, no learning curve required.' },
  ],
  'compress-image': [
    { heading: 'What is image compression?', body: 'Image compression reduces file size by removing redundant data and optimizing encoding without significantly affecting visual quality. Smart compression can cut image sizes 60–80% while remaining indistinguishable to the human eye.' },
    { heading: 'Why compress images for your website?', body: 'Page speed is a direct Google ranking factor. Large images are the #1 cause of slow websites. Google recommends images under 100KB for fast Core Web Vitals scores. Compress your images and rank higher in search results.' },
    { heading: 'Compress images free online — no watermark', body: 'JPT AI compresses JPG and PNG images instantly in your browser. No upload limits, no watermarks, no account required. Perfect for optimizing website images, email attachments, and cloud storage.' },
  ],
}

const getSEO = (pageId: string) => PAGE_SEO[pageId] ?? PAGE_SEO['upscale']

// ─── related tools ────────────────────────────────────────────────────────────
const RELATED_TOOLS = [
  { label: 'AI Upscale', href: '/upscale', icon: '🔍', desc: 'Enlarge images 4× with AI' },
  { label: 'Remove Background', href: '/remove-bg', icon: '🪄', desc: 'One-click background removal' },
  { label: 'Photo Enhancer', href: '/photo-enhancer', icon: '✨', desc: 'Restore & enhance quality' },
  { label: 'Compress Image', href: '/compress-image', icon: '⚡', desc: 'Reduce file size 80%' },
  { label: 'Change Background', href: '/change-background', icon: '🌅', desc: 'Replace with AI background' },
  { label: 'Watermark Remover', href: '/watermark-remover', icon: '©', desc: 'Remove any watermark' },
  { label: 'White Background', href: '/make-background-white', icon: '⬜', desc: 'Amazon-ready white BG' },
  { label: 'Convert to PNG', href: '/convert-to-png', icon: '🔄', desc: 'JPG/WEBP → PNG free' },
  { label: 'Convert to JPG', href: '/convert-to-jpg', icon: '🔄', desc: 'PNG/WEBP → JPG free' },
]

// ─── HOW IT WORKS ─────────────────────────────────────────────────────────────
const HOW_IT_WORKS = [
  { step: '01', title: 'Upload Your Image', desc: 'Drag & drop or click to select any photo. JPG, PNG, WEBP supported. No account needed to try.' },
  { step: '02', title: 'AI Processes in Seconds', desc: 'Our AI analyzes your image and applies the transformation instantly — right in your browser. No waiting.' },
  { step: '03', title: 'Download in Full Quality', desc: 'Preview the before/after result, then download — no watermark, no login, no hidden fees.' },
]

// ─── WATERMARK OVERLAY helper ─────────────────────────────────────────────────
function WatermarkOverlay() {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
      {[0, 1, 2].map(row => (
        <div key={row} style={{ display: 'flex', gap: 24, opacity: row === 1 ? 0.55 : 0.3 }}>
          {['© SAMPLE', 'WATERMARK', '© SAMPLE'].map((txt, i) => (
            <span key={i} style={{ color: 'rgba(200,200,200,0.9)', fontSize: 13, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', transform: 'rotate(-25deg)', display: 'block', whiteSpace: 'nowrap', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>{txt}</span>
          ))}
        </div>
      ))}
    </div>
  )
}

// ─── BACKGROUND overlay for remove-bg demos ──────────────────────────────────
function BgOverlay() {
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #CBD5E1 0%, #94A3B8 100%)', opacity: 0.6, pointerEvents: 'none' }} />
  )
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function LandingPage({ config, toolHref, pageId, inlineToolType }: LandingPageProps) {
  const [activeTab, setActiveTab] = useState(0)

  const baLabels = PAGE_BA_LABELS[pageId] ?? { before: 'Original', after: 'Enhanced' }
  const heroImages = PAGE_HERO_IMAGES[pageId]
  const inlineTool = inlineToolType ?? PAGE_INLINE_TOOL[pageId]
  const featureRows = getFeatureRows(pageId)
  const useCases = PAGE_USE_CASES[pageId] ?? PAGE_USE_CASES['upscale']
  const typeCards = getTypeCards(pageId)
  const testimonials = getTestimonials(pageId)
  const comparison = PAGE_COMPARISON[pageId]
  const seoContent = getSEO(pageId)

  const supabaseImages = PAGE_BEFORE_AFTER[pageId] ?? PAGE_BEFORE_AFTER['upscale']

  // ── Decide what image to use for demo sliders
  const demoAfterSrc = supabaseImages?.after ?? heroImages?.after
  const demoBeforeSrc = supabaseImages?.before ?? heroImages?.before

  const related = RELATED_TOOLS.filter(t => !t.href.includes(pageId) && !t.href.includes(config.page_id ?? ''))

  const styles = {
    sectionLabel: {
      fontSize: 11, fontWeight: 800, color: '#9B7EC8',
      textTransform: 'uppercase' as const, letterSpacing: '0.12em', marginBottom: 12,
    },
    h2: {
      fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, color: '#1A1008',
      lineHeight: 1.1, letterSpacing: '-0.03em', margin: 0,
    },
    h2Light: {
      fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, color: '#fff',
      lineHeight: 1.1, letterSpacing: '-0.03em', margin: 0,
    },
    body: { fontSize: 16, color: '#5C5047', lineHeight: 1.75, margin: 0 },
  } as const

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif', color: '#1A1008', background: '#FAFAF8' }}>

      {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
      <section style={{ background: '#FAFAF8', paddingTop: 56, paddingBottom: 0 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'start' }}>

          {/* Left: animated before/after slider */}
          <div>
            <BeforeAfterSlider
              beforeSrc={demoBeforeSrc}
              afterSrc={demoAfterSrc}
              beforeLabel={baLabels.before}
              afterLabel={baLabels.after}
              autoPlay
              autoPlaySpeed={0.25}
              beforeFilter={heroImages?.beforeFilter}
              beforeOverlay={heroImages?.beforeOverlay === 'watermark' ? <WatermarkOverlay /> : heroImages?.beforeOverlay === 'bg' ? <BgOverlay /> : undefined}
              aspectRatio="4/3"
              rounded={20}
            />
            {/* Caption */}
            <p style={{ textAlign: 'center', fontSize: 13, color: '#8B7355', marginTop: 12 }}>
              ← Drag the slider to compare · Auto-plays as demo
            </p>
          </div>

          {/* Right: title + tool */}
          <div style={{ paddingTop: 8 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#F0EBE3', color: '#7C5C2E', fontWeight: 700, fontSize: 11, borderRadius: 20, padding: '5px 14px', marginBottom: 20, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              ✦ Free Online Tool · No Signup
            </div>

            <h1 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', fontWeight: 900, color: '#1A1008', lineHeight: 1.08, letterSpacing: '-0.03em', margin: '0 0 16px' }}>
              {config.h1}
            </h1>

            <p style={{ fontSize: 16, color: '#5C5047', lineHeight: 1.7, margin: '0 0 20px', maxWidth: 440 }}>
              {config.subtitle}
            </p>

            {/* Trust signals */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px', marginBottom: 24 }}>
              {['No credit card required', 'No watermark', 'No signup needed'].map(t => (
                <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#5C5047', fontWeight: 500 }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="7" fill="#22C55E"/><path d="M4 7l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  {t}
                </span>
              ))}
            </div>

            {/* Inline tool OR CTA button */}
            {inlineTool ? (
              <div style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #E8E0D8', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
                <InlineTool
                  toolType={inlineTool}
                  beforeImg={demoBeforeSrc}
                  afterImg={demoAfterSrc}
                  beforeLabel={baLabels.before}
                  afterLabel={baLabels.after}
                />
              </div>
            ) : (
              <div>
                <a
                  href={toolHref}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: '#1A1008', color: '#fff', fontWeight: 800, fontSize: 16, padding: '16px 36px', borderRadius: 14, textDecoration: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', letterSpacing: '-0.01em' }}
                >
                  {config.cta_text || 'Try It Free'} →
                </a>
                <div style={{ fontSize: 12, color: '#9B8B7C', marginTop: 10 }}>5 free uses · No credit card</div>
              </div>
            )}
          </div>
        </div>

        {/* Stats bar */}
        <div style={{ background: '#1A1008', marginTop: 56, padding: '18px 24px' }}>
          <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 12 }}>
            {[['500K+', 'Images Processed'], ['< 5 sec', 'Average Processing Time'], ['No Signup', 'Free to Try'], ['No Watermark', 'On Download']].map(([val, label]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>{val}</div>
                <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500, marginTop: 2, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ═══════════════════════════════════════════════════════ */}
      <section style={{ padding: '96px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={styles.sectionLabel}>How it works</div>
            <h2 style={styles.h2}>Three steps. Ten seconds total.</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 0, position: 'relative' }}>
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.step} style={{ padding: '0 32px', textAlign: 'center', borderRight: i < HOW_IT_WORKS.length - 1 ? '1px solid #E8E4DC' : 'none' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', border: '2px solid #E8E4DC', background: '#FAFAF8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#7C5C2E', fontWeight: 900, fontSize: 18, letterSpacing: '-0.02em' }}>{step.step}</div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1A1008', margin: '0 0 10px', letterSpacing: '-0.02em' }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: '#6B5B4E', lineHeight: 1.7, margin: 0 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURE ROWS ═══════════════════════════════════════════════════════ */}
      {featureRows.map((row, i) => {
        const bgColor = i % 2 === 0 ? '#FAFAF8' : '#fff'
        const textLeft = row.side === 'right'
        return (
          <section key={i} style={{ padding: '80px 24px', background: bgColor }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
              {/* Text block */}
              <div style={{ order: textLeft ? 0 : 1 }}>
                <div style={{ display: 'inline-block', background: '#F0EBE3', color: '#7C5C2E', fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '5px 14px', borderRadius: 20, marginBottom: 20 }}>{row.badge}</div>
                <h2 style={{ fontSize: 'clamp(1.6rem, 2.5vw, 2.2rem)', fontWeight: 900, color: '#1A1008', lineHeight: 1.15, letterSpacing: '-0.025em', margin: '0 0 18px' }}>{row.heading}</h2>
                <p style={{ fontSize: 16, color: '#5C5047', lineHeight: 1.75, margin: '0 0 28px' }}>{row.body}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  {inlineTool ? (
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#1A1008', color: '#fff', fontWeight: 700, fontSize: 15, padding: '12px 28px', borderRadius: 12, cursor: 'pointer', letterSpacing: '-0.01em' }}>
                      Try it now →
                    </label>
                  ) : (
                    <a href={toolHref} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#1A1008', color: '#fff', fontWeight: 700, fontSize: 15, padding: '12px 28px', borderRadius: 12, textDecoration: 'none', letterSpacing: '-0.01em' }}>
                      Try it free →
                    </a>
                  )}
                </div>
              </div>
              {/* Slider */}
              <div style={{ order: textLeft ? 1 : 0 }}>
                <BeforeAfterSlider
                  beforeSrc={demoBeforeSrc}
                  afterSrc={demoAfterSrc}
                  beforeLabel={row.beforeLabel}
                  afterLabel={row.afterLabel}
                  beforeFilter={row.beforeFilter}
                  beforeOverlay={row.beforeOverlay === 'watermark' ? <WatermarkOverlay /> : row.beforeOverlay === 'bg' ? <BgOverlay /> : undefined}
                  aspectRatio="4/3"
                  rounded={16}
                />
              </div>
            </div>
          </section>
        )
      })}

      {/* ══ USE CASE TABS ══════════════════════════════════════════════════════ */}
      <section style={{ padding: '96px 24px', background: '#1A1008' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ ...styles.sectionLabel, color: '#9B7EC8' }}>Use Cases</div>
            <h2 style={styles.h2Light}>Built for every creative workflow</h2>
          </div>

          {/* Tab pills */}
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 48 }}>
            {useCases.map((uc, i) => (
              <button
                key={uc.label}
                onClick={() => setActiveTab(i)}
                style={{
                  padding: '8px 20px', borderRadius: 24, border: '1.5px solid',
                  borderColor: activeTab === i ? '#C4B5FD' : 'rgba(255,255,255,0.15)',
                  background: activeTab === i ? '#7C3AED' : 'transparent',
                  color: activeTab === i ? '#fff' : 'rgba(255,255,255,0.65)',
                  fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s',
                  letterSpacing: '-0.01em',
                }}
              >
                {uc.label}
              </button>
            ))}
          </div>

          {/* Active tab content */}
          {useCases[activeTab] && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, alignItems: 'center' }}>
              <BeforeAfterSlider
                beforeSrc={demoBeforeSrc}
                afterSrc={demoAfterSrc}
                beforeLabel={useCases[activeTab].beforeLabel}
                afterLabel={useCases[activeTab].afterLabel}
                beforeFilter={useCases[activeTab].beforeFilter}
                beforeOverlay={useCases[activeTab].beforeOverlay === 'watermark' ? <WatermarkOverlay /> : useCases[activeTab].beforeOverlay === 'bg' ? <BgOverlay /> : undefined}
                aspectRatio="4/3"
                rounded={16}
              />
              <div>
                <h3 style={{ fontSize: 'clamp(1.4rem, 2vw, 1.9rem)', fontWeight: 900, color: '#fff', lineHeight: 1.2, letterSpacing: '-0.025em', margin: '0 0 16px' }}>{useCases[activeTab].heading}</h3>
                <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.65)', lineHeight: 1.75, margin: '0 0 28px' }}>{useCases[activeTab].desc}</p>
                {inlineTool ? (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#7C3AED', color: '#fff', fontWeight: 700, fontSize: 15, padding: '12px 28px', borderRadius: 12, cursor: 'pointer', letterSpacing: '-0.01em' }}>
                    Upload your image →
                  </div>
                ) : (
                  <a href={toolHref} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#7C3AED', color: '#fff', fontWeight: 700, fontSize: 15, padding: '12px 28px', borderRadius: 12, textDecoration: 'none', letterSpacing: '-0.01em' }}>
                    Try it free →
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ══ TYPE GRID ══════════════════════════════════════════════════════════ */}
      <section style={{ padding: '96px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={styles.sectionLabel}>Works on Every Type</div>
            <h2 style={styles.h2}>Every scenario. One tool.</h2>
            <p style={{ fontSize: 16, color: '#6B5B4E', marginTop: 16, maxWidth: 520, margin: '16px auto 0' }}>
              From e-commerce product shots to personal photos and professional assets — JPT AI handles every use case with equal precision.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {typeCards.map(card => (
              <div key={card.title} style={{ borderRadius: 20, border: '1.5px solid #E8E4DC', background: '#FAFAF8', overflow: 'hidden' }}>
                {/* Mini before/after */}
                <div style={{ height: 180 }}>
                  <BeforeAfterSlider
                    beforeSrc={demoBeforeSrc}
                    afterSrc={demoAfterSrc}
                    beforeLabel="Before"
                    afterLabel="After"
                    beforeFilter={card.beforeFilter}
                    beforeOverlay={card.beforeOverlay === 'watermark' ? <WatermarkOverlay /> : card.beforeOverlay === 'bg' ? <BgOverlay /> : undefined}
                    height={180}
                    rounded={0}
                  />
                </div>
                {/* Card text */}
                <div style={{ padding: '18px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 18 }}>{card.icon}</span>
                      <span style={{ fontSize: 15, fontWeight: 800, color: '#1A1008', letterSpacing: '-0.01em' }}>{card.title}</span>
                    </div>
                    {card.tag && (
                      <span style={{ background: '#7C3AED', color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 10, letterSpacing: '0.04em' }}>{card.tag}</span>
                    )}
                  </div>
                  <p style={{ fontSize: 13, color: '#6B5B4E', lineHeight: 1.6, margin: 0 }}>{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIALS ═══════════════════════════════════════════════════════ */}
      <section style={{ padding: '96px 0', background: '#FAFAF8', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', paddingLeft: 24 }}>
          <div style={{ marginBottom: 48 }}>
            <div style={styles.sectionLabel}>Testimonials</div>
            <h2 style={styles.h2}>Loved by creators & businesses</h2>
          </div>
        </div>
        {/* Scrolling marquee — split into 2 rows */}
        {[0, 1].map(row => (
          <div key={row} style={{ overflow: 'hidden', marginBottom: 16 }}>
            <div style={{
              display: 'flex', gap: 20,
              animation: `marquee${row === 0 ? '' : '-rev'} 40s linear infinite`,
              width: 'max-content',
            }}>
              {[...testimonials, ...testimonials].map((t, idx) => (
                <div key={idx} style={{ width: 320, flexShrink: 0, background: '#fff', borderRadius: 16, padding: '24px 22px', border: '1.5px solid #E8E4DC', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', gap: 2, marginBottom: 12 }}>
                    {Array.from({ length: 5 }).map((_, i) => <span key={i} style={{ color: '#F59E0B', fontSize: 14 }}>★</span>)}
                  </div>
                  <p style={{ margin: '0 0 16px', fontSize: 14, color: '#3D2E1E', lineHeight: 1.7, fontStyle: 'italic' }}>&ldquo;{t.quote}&rdquo;</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #7C3AED, #9B5CF6)', color: '#fff', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t.avatar}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#1A1008' }}>{t.name}</div>
                      <div style={{ fontSize: 11, color: '#8B7355' }}>{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        <style>{`
          @keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
          @keyframes marquee-rev { from { transform: translateX(-50%) } to { transform: translateX(0) } }
        `}</style>
      </section>

      {/* ══ COMPARISON ═════════════════════════════════════════════════════════ */}
      {comparison && (() => {
        const alt1 = comparison[0].alt1name
        const alt2 = comparison[0].alt2name
        return (
          <section style={{ padding: '96px 24px', background: '#fff' }}>
            <div style={{ maxWidth: 860, margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: 56 }}>
                <div style={styles.sectionLabel}>Comparison</div>
                <h2 style={styles.h2}>JPT AI vs the alternatives</h2>
                <p style={{ fontSize: 16, color: '#6B5B4E', marginTop: 14, margin: '14px auto 0', maxWidth: 480 }}>One tool. Everything included. No hidden paywalls.</p>
              </div>
              <div style={{ overflowX: 'auto', borderRadius: 20, border: '1.5px solid #E8E4DC', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: '#FAFAF8' }}>
                      <th style={{ textAlign: 'left', padding: '14px 20px', color: '#6B5B4E', fontWeight: 700, fontSize: 12, borderBottom: '1.5px solid #E8E4DC' }}>Feature</th>
                      <th style={{ textAlign: 'center', padding: '14px 20px', color: '#7C3AED', fontWeight: 900, fontSize: 12, background: '#F5F0FF', borderBottom: '1.5px solid #E8E4DC' }}>✦ JPT AI</th>
                      <th style={{ textAlign: 'center', padding: '14px 20px', color: '#6B5B4E', fontWeight: 700, fontSize: 12, borderBottom: '1.5px solid #E8E4DC' }}>{alt1}</th>
                      <th style={{ textAlign: 'center', padding: '14px 20px', color: '#6B5B4E', fontWeight: 700, fontSize: 12, borderBottom: '1.5px solid #E8E4DC' }}>{alt2}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.map((row, i) => (
                      <tr key={row.feature} style={{ borderBottom: i < comparison.length - 1 ? '1px solid #F0EAE0' : 'none' }}>
                        <td style={{ padding: '13px 20px', color: '#3D2E1E', fontWeight: 500 }}>{row.feature}</td>
                        <td style={{ textAlign: 'center', padding: '13px 20px', background: '#FAF8FF' }}>
                          <span style={{ color: row.jpt ? '#16A34A' : '#DC2626', fontSize: 20, fontWeight: 900 }}>{row.jpt ? '✓' : '✗'}</span>
                        </td>
                        <td style={{ textAlign: 'center', padding: '13px 20px' }}>
                          <span style={{ color: row.alt1 ? '#16A34A' : '#DC2626', fontSize: 20, fontWeight: 900 }}>{row.alt1 ? '✓' : '✗'}</span>
                        </td>
                        <td style={{ textAlign: 'center', padding: '13px 20px' }}>
                          <span style={{ color: row.alt2 ? '#16A34A' : '#DC2626', fontSize: 20, fontWeight: 900 }}>{row.alt2 ? '✓' : '✗'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )
      })()}

      {/* ══ RELATED TOOLS ══════════════════════════════════════════════════════ */}
      <section style={{ padding: '80px 0', background: '#FAFAF8', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', paddingLeft: 24, marginBottom: 40 }}>
          <div style={styles.sectionLabel}>Related Tools</div>
          <h2 style={{ ...styles.h2, fontSize: 'clamp(1.6rem, 2.5vw, 2.2rem)' }}>More AI tools you&apos;ll love</h2>
        </div>
        <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingLeft: 24, paddingRight: 24, paddingBottom: 8, scrollbarWidth: 'none' }}>
          {related.map(tool => (
            <a
              key={tool.href}
              href={tool.href}
              style={{ flexShrink: 0, width: 220, background: '#fff', borderRadius: 16, border: '1.5px solid #E8E4DC', padding: '20px 18px', textDecoration: 'none', display: 'block', transition: 'box-shadow 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
            >
              <div style={{ fontSize: 28, marginBottom: 10 }}>{tool.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#1A1008', marginBottom: 6, letterSpacing: '-0.01em' }}>{tool.label}</div>
              <div style={{ fontSize: 13, color: '#6B5B4E', lineHeight: 1.5 }}>{tool.desc}</div>
            </a>
          ))}
        </div>
      </section>

      {/* ══ MID-PAGE CTA ═══════════════════════════════════════════════════════ */}
      <section style={{ padding: '0 24px 96px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', background: '#1A1008', borderRadius: 28, padding: '64px 56px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -80, right: -80, width: 280, height: 280, background: 'radial-gradient(circle, rgba(124,58,237,0.3) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(124,58,237,0.25)', color: '#C4B5FD', fontWeight: 700, fontSize: 11, borderRadius: 20, padding: '5px 14px', marginBottom: 20, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Free to try</div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', fontWeight: 900, color: '#fff', margin: '0 0 14px', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              Ready to transform your images?
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.55)', margin: '0 0 36px' }}>No credit card required. Instant results. No watermarks.</p>
            <a
              href={toolHref}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: '#1A1008', fontWeight: 800, fontSize: 16, padding: '16px 40px', borderRadius: 14, textDecoration: 'none', letterSpacing: '-0.01em' }}
            >
              {config.cta_text || 'Try It Free'} →
            </a>
          </div>
        </div>
      </section>

      {/* ══ SEO CONTENT ════════════════════════════════════════════════════════ */}
      <section style={{ padding: '0 24px 96px', background: '#FAFAF8' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '40px 56px' }}>
            {seoContent.map(block => (
              <div key={block.heading}>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1A1008', margin: '0 0 12px', letterSpacing: '-0.02em' }}>{block.heading}</h3>
                <p style={{ margin: 0, fontSize: 15, color: '#5C5047', lineHeight: 1.8 }}>{block.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FAQ ════════════════════════════════════════════════════════════════ */}
      {config.faq?.length > 0 && (
        <section style={{ padding: '0 24px 96px', background: '#fff' }}>
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 56, paddingTop: 80 }}>
              <div style={styles.sectionLabel}>FAQ</div>
              <h2 style={styles.h2}>Frequently asked questions</h2>
            </div>
            <FAQAccordion faqs={config.faq} />
          </div>
        </section>
      )}

    </div>
  )
}

'use client'

import { useState, useRef, useEffect } from 'react'
import FAQAccordion from './FAQAccordion'
import InlineTool, { InlineToolType } from './InlineTool'
import { PageSEO } from '@/lib/page-types'

interface LandingPageProps {
  config: PageSEO
  toolHref: string
  pageId: string
  inlineToolType?: InlineToolType
}

// ── Stable demo images: picsum.photos with fixed seeds ────────────────────
// Each page gets a unique set of seeds so every section shows a different photo.
const PAGE_SEEDS: Record<string, string[]> = {
  upscale:               ['lens','portrait','pixel','product','gallery','texture','sharp','macro','camera','bokeh','detail','clarity'],
  'remove-bg':           ['cutout','fashion','studio','person','headshot','model','apparel','ghost','product-bg','clean','white-bg','backdrop'],
  'watermark-remover':   ['stock','preview','sample','copyright','logo-mark','watermark','stamp','overlay','mark','brand','label','sign'],
  'photo-enhancer':      ['enhance','vintage','restore','faded','color','bright','vivid','old-photo','memory','family','film','classic'],
  'compress-image':      ['compress','file','storage','speed','web','load','optimize','size','jpeg','png','bandwidth','performance'],
  'change-background':   ['background','scene','replace','swap','ai-bg','nature','office','studio-bg','landscape','gradient','abstract','color-bg'],
  'make-background-white': ['white','clean-bg','minimal','product-white','ecommerce','catalog','listing','marketplace','plain','simple','clarity-white','pure'],
  'passport-photo':      ['passport','id-photo','portrait-formal','headshot-clean','face','identity','document','compliance','us-passport','official','mug','formal'],
  'convert-to-png':      ['convert','format','lossless','alpha','transparent','graphic','ui','icon','logo','vector','digital','design'],
  'convert-to-jpg':      ['jpeg','compress-jpg','photo-web','thumbnail','social','share','download','email','small','fast','web-img','cdn'],
}
const seeds = (id: string) => PAGE_SEEDS[id] ?? PAGE_SEEDS['upscale']

// Build a picsum URL: w x h at a specific seed
const pic = (seed: string, w = 800, h = 560) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`

// CSS filters that simulate the "before" state per page
const PAGE_BEFORE_FILTER: Record<string, string> = {
  upscale:             'blur(3.5px) contrast(0.7) saturate(0.55)',
  'remove-bg':         'contrast(0.85) brightness(0.9)',
  'watermark-remover': 'none',
  'photo-enhancer':    'sepia(0.55) blur(1.5px) brightness(0.75) contrast(0.8)',
  'compress-image':    'blur(0.8px) contrast(0.9)',
  'change-background': 'contrast(0.85)',
  'make-background-white': 'hue-rotate(30deg) saturate(1.3)',
  'passport-photo':    'brightness(0.8) contrast(0.85)',
  'convert-to-png':    'none',
  'convert-to-jpg':    'none',
}

// Watermark overlay for watermark-remover demos
function WatermarkOverlay() {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {[[-30, '30%', '20%'], [-30, '10%', '50%'], [-30, '55%', '60%'], [-30, '25%', '75%']].map(([rot, x, y], i) => (
        <span key={i} style={{ position: 'absolute', left: x as string, top: y as string, color: 'rgba(255,255,255,0.55)', fontSize: 22, fontWeight: 900, letterSpacing: 4, textTransform: 'uppercase', transform: `rotate(${rot}deg)`, whiteSpace: 'nowrap', textShadow: '0 1px 4px rgba(0,0,0,0.5)', userSelect: 'none' }}>
          {i % 2 === 0 ? '© SAMPLE' : 'WATERMARK'}
        </span>
      ))}
    </div>
  )
}

// ── Draggable before/after comparison slider ───────────────────────────────
function CompareSlider({
  beforeSrc, afterSrc, beforeFilter, beforeLabel = 'Before', afterLabel = 'After',
  height = 320, autoPlay = false, showWatermark = false,
}: {
  beforeSrc: string; afterSrc: string; beforeFilter?: string;
  beforeLabel?: string; afterLabel?: string;
  height?: number; autoPlay?: boolean; showWatermark?: boolean;
}) {
  const [pos, setPos] = useState(60)
  const dragging = useRef(false)
  const paused = useRef(false)
  const rafRef = useRef<number | null>(null)
  const dirRef = useRef<-1 | 1>(-1)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!autoPlay) return
    let p = 75
    const tick = () => {
      if (!paused.current) {
        p += dirRef.current * 0.28
        if (p <= 22) { p = 22; dirRef.current = 1 }
        if (p >= 76) { p = 76; dirRef.current = -1 }
        setPos(p)
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [autoPlay])

  const move = (clientX: number) => {
    const r = containerRef.current?.getBoundingClientRect()
    if (!r) return
    setPos(Math.min(94, Math.max(6, ((clientX - r.left) / r.width) * 100)))
  }

  const img: React.CSSProperties = { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block', userSelect: 'none' }

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => { paused.current = true }}
      onMouseLeave={() => { paused.current = false; dragging.current = false }}
      onMouseDown={e => { dragging.current = true; paused.current = true; move(e.clientX) }}
      onMouseMove={e => { if (dragging.current) move(e.clientX) }}
      onMouseUp={() => { dragging.current = false }}
      onTouchStart={e => { paused.current = true; move(e.touches[0].clientX) }}
      onTouchMove={e => { e.preventDefault(); move(e.touches[0].clientX) }}
      onTouchEnd={() => { paused.current = false }}
      style={{ position: 'relative', height, borderRadius: 18, overflow: 'hidden', cursor: 'ew-resize', userSelect: 'none', boxShadow: '0 8px 40px rgba(0,0,0,0.14)', background: '#E5E7EB', flexShrink: 0 }}
    >
      {/* After (bottom) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={afterSrc} alt={afterLabel} style={img} draggable={false} />
      {/* Before (clipped) */}
      <div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={beforeSrc} alt={beforeLabel} style={{ ...img, filter: beforeFilter }} draggable={false} />
        {showWatermark && <WatermarkOverlay />}
      </div>
      {/* Divider */}
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${pos}%`, width: 2, background: '#fff', transform: 'translateX(-50%)', zIndex: 10, boxShadow: '0 0 8px rgba(0,0,0,0.3)' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 38, height: 38, borderRadius: '50%', background: '#fff', boxShadow: '0 2px 14px rgba(0,0,0,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="18" height="12" viewBox="0 0 18 12"><path d="M5 6L1 2.5M5 6L1 9.5M13 6L17 2.5M13 6L17 9.5" stroke="#6366F1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/><line x1="9" y1="0" x2="9" y2="12" stroke="#6366F1" strokeWidth="1.5"/></svg>
        </div>
      </div>
      {/* Labels */}
      <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(0,0,0,0.62)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6, zIndex: 5, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{beforeLabel}</div>
      <div style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(99,102,241,0.88)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6, zIndex: 5, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{afterLabel}</div>
    </div>
  )
}

// ── inline tool type mapping ───────────────────────────────────────────────
const PAGE_TOOL: Record<string, InlineToolType> = {
  upscale: 'upscale',
  'photo-enhancer': 'upscale',
  'remove-bg': 'remove-bg',
  'compress-image': 'compress',
  'convert-to-png': 'convert-png',
  'convert-to-jpg': 'convert-jpg',
}

// ── Page content data ──────────────────────────────────────────────────────
interface Row { badge: string; heading: string; body: string }
const FEATURE_ROWS: Record<string, Row[]> = {
  upscale: [
    { badge: 'AI Super-Resolution', heading: 'Recover stunning detail from any low-res photo', body: 'Deep learning super-resolution reconstructs sharp edges, fine textures, and crisp detail that traditional upscaling destroys. Hair, fabric, product labels - all rendered pixel-perfect at 4x the original size.' },
    { badge: 'Zero Artifacts', heading: 'Upscale to print-ready resolution - no blur, no noise', body: 'No JPEG artifacts, no ringing, no over-sharpening. JPT AI produces clean, natural-looking high-resolution output ready for large-format printing, retina displays, and e-commerce listings.' },
    { badge: 'Any Subject', heading: 'Products, portraits, landscapes, AI art - all supported', body: 'Whether upscaling e-commerce product shots, restoring old family photos, or scaling AI-generated art for print - our model handles every subject type with equal precision.' },
  ],
  'remove-bg': [
    { badge: 'Pixel-Perfect Cutout', heading: 'Remove backgrounds with studio-quality accuracy', body: 'AI detects subjects with pixel-level precision. Hair strands, fur, translucent fabric - all handled cleanly. Results indistinguishable from a professional Photoshop cutout in seconds.' },
    { badge: 'E-Commerce Ready', heading: 'White background product photos in seconds', body: 'Amazon, Shopify, Etsy - all require clean white backgrounds. JPT AI delivers marketplace-compliant product shots automatically. Save hours vs. manual editing.' },
    { badge: 'Works on Any Subject', heading: 'People, products, pets - all handled perfectly', body: 'From sharp product edges to wispy hair - our AI handles every subject type. Perfect for headshots, product photography, social media thumbnails, and ad creatives.' },
  ],
  'watermark-remover': [
    { badge: 'AI Detection', heading: 'Detect and erase watermarks automatically', body: 'AI identifies text overlays, logos, timestamps, and semi-transparent watermarks of any size or placement - then cleanly fills the area using content-aware reconstruction.' },
    { badge: 'Content-Aware Fill', heading: 'Seamless removal - no smearing, no blur', body: 'Unlike basic tools that smear or blur the removal area, JPT AI reconstructs the underlying image using surrounding context. The result looks like the watermark was never there.' },
    { badge: 'Every Type', heading: 'Text, logos, dates, preview marks - all gone', body: 'Handles stock site watermarks, photographer copyright text, date stamps, logo overlays, and promotional banners - regardless of position, opacity, or font style.' },
  ],
  'photo-enhancer': [
    { badge: 'Auto Enhancement', heading: 'Fix brightness, contrast and sharpness automatically', body: 'AI analyzes each photo and applies optimal corrections - boosting shadow detail, balancing highlights, sharpening edges. No sliders, no guesswork, professional results instantly.' },
    { badge: 'Old Photo Restoration', heading: 'Restore faded vintage photos to vivid, sharp clarity', body: 'Recover detail from aged, faded, or damaged photographs. AI removes grain, corrects color shift, and restores sharpness lost over decades of aging.' },
    { badge: '4x Resolution', heading: 'Retina-ready output for print, display, and web', body: 'Increase resolution 2x or 4x using deep learning AI. Results are indistinguishable from the original high-resolution source - perfect for printing and large displays.' },
  ],
  'compress-image': [
    { badge: 'Smart Compression', heading: 'Cut file size 80% with zero visible quality loss', body: 'AI-powered compression targets redundant data while preserving visual quality. Results are indistinguishable at full size - but load dramatically faster on web and email.' },
    { badge: 'SEO Impact', heading: 'Pass Google PageSpeed and rank higher in search', body: 'Image size is the #1 cause of slow websites. Google rewards fast pages with higher search rankings. Compress your images and improve Core Web Vitals instantly.' },
    { badge: 'Batch Ready', heading: 'Compress entire image libraries in minutes', body: 'Process product catalogs, blog archives, and marketing libraries at scale. Save storage, reduce bandwidth costs, and deliver faster page loads to every visitor.' },
  ],
  'change-background': [
    { badge: 'AI Background Swap', heading: 'Replace any background with AI-generated scenes', body: 'Describe any background in plain text and AI generates it behind your subject - studio, nature, abstract, cityscape, or any custom setting you can imagine.' },
    { badge: 'E-Commerce', heading: 'Lifestyle product photos without expensive shoots', body: 'Put your products in aspirational lifestyle scenes without paying for location shoots. 10x your creative output for ads, social posts, and product pages.' },
    { badge: 'Seamless Blending', heading: 'Perfect light matching and edge blending', body: 'AI matches the lighting, shadows, and color temperature of your subject to the new background so the composite looks completely natural.' },
  ],
  'make-background-white': [
    { badge: 'Marketplace Ready', heading: 'Pure white background for Amazon, Shopify, Etsy', body: 'All major marketplaces require white backgrounds on main product images. JPT AI removes any background and replaces it with a clean, compliant white in seconds.' },
    { badge: 'Professional Quality', heading: 'Studio-quality white background from any photo', body: 'Turn casual product photos taken at home into professional marketplace listings. Clean white backgrounds make products pop and increase customer trust.' },
    { badge: 'Any Product Type', heading: 'Works on every product shape and surface', body: 'From glassware and jewelry to clothing and electronics - our AI handles reflective, transparent, and complex-edged products with equal precision.' },
  ],
  'passport-photo': [
    { badge: 'US Compliant', heading: 'Meets all US State Department requirements', body: 'Automatically formats your photo to the required 2x2 inch (51x51mm) size with white background, proper face positioning, and 600 DPI output. Accepted for all US passport applications.' },
    { badge: 'Instant Formatting', heading: 'Perfect face centering and background in seconds', body: 'AI detects your face, crops to the correct dimensions, removes the background, and adds the required white backdrop - all automatically in under 10 seconds.' },
    { badge: 'Print Ready', heading: 'Print at home or at CVS, Walgreens, or FedEx', body: 'Download print-ready files sized for 4x6 photo paper with four 2x2 passport photos per sheet. Ready to print anywhere, same day.' },
  ],
  'convert-to-png': [
    { badge: 'Lossless Format', heading: 'Convert to PNG with full transparency support', body: 'PNG is the standard for graphics, logos, and images requiring transparent backgrounds. Convert from JPG, WEBP, or any format to lossless PNG - no quality loss.' },
    { badge: 'Transparency', heading: 'Preserve or add alpha channel transparency', body: 'PNG supports full alpha channel transparency. Convert your images and maintain or create transparent backgrounds for use in design tools and web projects.' },
    { badge: 'Universal Compatibility', heading: 'PNG works everywhere - web, print, and design tools', body: 'PNG is supported by every browser, design tool, and platform. Convert once and use across Figma, Canva, Photoshop, web, and print without format conversion headaches.' },
  ],
  'convert-to-jpg': [
    { badge: 'Smallest File Size', heading: 'Convert to JPG for maximum shareability', body: 'JPG is the most widely-shared image format on the web. Convert PNG or WEBP to optimized JPG - smaller files that load faster and are accepted everywhere.' },
    { badge: 'Email Friendly', heading: 'Under 200KB for perfect email rendering', body: 'Large PNG files get blocked by email clients and trigger spam filters. Convert to JPG and compress simultaneously for email-safe, fast-loading images.' },
    { badge: 'Social Optimized', heading: 'Platform-ready for Instagram, LinkedIn, Twitter', body: 'All major social platforms prefer JPG. Convert your images for consistent rendering, faster uploads, and better quality retention across Instagram, LinkedIn, and Twitter.' },
  ],
}
const getRows = (id: string) => FEATURE_ROWS[id] ?? FEATURE_ROWS['upscale']

interface UseCase { label: string; heading: string; desc: string }
const USE_CASES: Record<string, UseCase[]> = {
  upscale: [
    { label: 'E-Commerce', heading: 'Sharper product images drive higher conversions', desc: 'Upscale blurry product photos to retina quality. E-commerce listings with high-resolution images convert up to 94% better. No reshooting needed.' },
    { label: 'Old Photos', heading: 'Restore vintage prints to vivid clarity', desc: 'Bring scanned family photos and vintage prints back to life. AI recovers detail lost to age, scanning artifacts, and decades of compression.' },
    { label: 'AI Art', heading: 'Scale AI art to print-ready 4K resolution', desc: 'AI-generated images at 512px or 1024px upscale beautifully to 2048px and beyond for canvas prints, posters, and large-format merchandise.' },
    { label: 'Social Media', heading: 'Retina-quality visuals for every platform', desc: 'Upload compressed downloads or screenshots and upscale to Instagram, LinkedIn, and TikTok standards - crisp and sharp on every screen.' },
    { label: 'Print & Canvas', heading: 'Large-format print from any small original', desc: 'Starting from a small phone photo, upscale 4x for high-quality A1/A2 posters, canvas prints, and merchandise with zero pixelation.' },
  ],
  'remove-bg': [
    { label: 'E-Commerce', heading: 'Amazon and Shopify white background shots', desc: 'Amazon requires pure white backgrounds on all main product images. JPT AI delivers marketplace-compliant photos in seconds - no studio needed.' },
    { label: 'Headshots', heading: 'Professional LinkedIn profile photos', desc: 'LinkedIn profiles with professional headshots get 21x more views. Remove distracting backgrounds and add a clean professional backdrop instantly.' },
    { label: 'Thumbnails', heading: 'Eye-catching YouTube and social thumbnails', desc: 'Cut out subjects for bold, high-contrast thumbnails that drive clicks. Place on any background - gradient, solid color, or custom scene.' },
    { label: 'Ad Creatives', heading: 'Marketing assets in minutes, not days', desc: 'Remove backgrounds from product photos and people to create flexible assets for ads, emails, flyers, and presentations across every platform.' },
    { label: 'Real Estate', heading: 'Clean property and furniture photography', desc: 'Remove cluttered backgrounds from furniture and product photos. Create clean shots that highlight the item - not the room it was shot in.' },
  ],
  'watermark-remover': [
    { label: 'Copyright Text', heading: 'Remove copyright overlays instantly', desc: 'AI precisely detects and removes photographer watermarks, copyright notices, and name overlays - restoring the clean original image.' },
    { label: 'Logo Marks', heading: 'Remove brand logo watermarks seamlessly', desc: 'Strip brand logos and icon watermarks placed over images. AI reconstructs underlying content so removal is completely seamless.' },
    { label: 'Date Stamps', heading: 'Erase camera date stamps from old photos', desc: 'Those orange date stamps from 90s cameras are removed in seconds. AI fills the area with perfect matching content from the surrounding image.' },
    { label: 'Stock Photos', heading: 'Clean stock site watermarks from previews', desc: 'Identify and remove watermark patterns used by stock photo sites. Perfect for mockups, presentations, and client approval previews.' },
    { label: 'Preview Marks', heading: 'Remove diagonal PREVIEW and SAMPLE text', desc: 'Strip preview watermarks - diagonal text, repeated patterns, and overlaid banners - leaving only the clean, original image.' },
  ],
  'photo-enhancer': [
    { label: 'Old Photos', heading: 'Restore faded family photographs', desc: 'Recover detail from aged, faded prints. AI corrects yellowing, removes grain, and sharpens detail lost over decades of storage and aging.' },
    { label: 'Portraits', heading: 'Professional portrait enhancement', desc: 'Brighten eyes, enhance clarity, balance exposure - subtly, without the over-processed look of heavy filter retouching.' },
    { label: 'Products', heading: 'Sharper product photos for e-commerce listings', desc: 'Fix dark, blurry, or dull product shots. AI boosts detail, corrects color, and sharpens edges so your listing stands out in search.' },
    { label: 'Events', heading: 'Rescue dark or blurry event photos', desc: 'Indoor event photos suffer from poor lighting and motion blur. AI enhancement rescues dark, noisy, and blurry captures automatically.' },
    { label: 'Travel', heading: 'Bring travel memories back to vivid life', desc: 'Holiday and travel photos taken on older phones or in low light come out dramatically better with AI color restoration and sharpening.' },
  ],
  'compress-image': [
    { label: 'Websites', heading: 'Pass Core Web Vitals and rank higher', desc: 'Google uses page speed as a ranking factor. Images account for 60% of page weight. Compress and watch your PageSpeed score jump immediately.' },
    { label: 'E-Commerce', heading: 'Faster product pages drive more conversions', desc: 'A 1-second improvement in mobile page load improves conversions by 27%. Compress your entire product catalog for measurable revenue impact.' },
    { label: 'Email', heading: 'Email images that actually load for everyone', desc: 'Large images trigger spam filters and never load for recipients. Compress to under 200KB and ensure every subscriber sees your campaign.' },
    { label: 'Apps', heading: 'Smaller app bundles, faster downloads', desc: 'Every KB of image assets your app downloads costs users time and data. Compress assets to reduce APK/IPA size and improve store ratings.' },
    { label: 'Storage', heading: 'Cut cloud storage costs without quality loss', desc: 'Compress your photo library and cloud storage bills drop proportionally. Reduces file sizes 60-80% with zero visible quality difference.' },
  ],
}
const getUseCases = (id: string) => USE_CASES[id] ?? USE_CASES['upscale']

const TYPE_CARDS: Record<string, { title: string; desc: string; emoji: string; tag?: string }[]> = {
  upscale: [
    { title: 'Product Photos', desc: 'Upscale e-commerce shots to retina quality', emoji: '🛍️', tag: 'Most Popular' },
    { title: 'Old & Scanned Photos', desc: 'Restore vintage prints to digital clarity', emoji: '📷' },
    { title: 'Portraits & Headshots', desc: 'Sharp faces, crisp skin texture, clear eyes', emoji: '👤' },
    { title: 'AI-Generated Art', desc: 'Scale 512px AI images to print-ready 4K', emoji: '🎨', tag: 'Trending' },
    { title: 'Screenshots & UI', desc: 'Crisp screenshots for docs, blogs, and ads', emoji: '🖥️' },
    { title: 'Logos & Brand Assets', desc: 'Enlarge logos without pixelation or blur', emoji: '⭐' },
  ],
  'remove-bg': [
    { title: 'Product Photography', desc: 'White-background shots for Amazon and Shopify', emoji: '🛍️', tag: 'Most Popular' },
    { title: 'Profile Photos', desc: 'Clean headshots for LinkedIn and team pages', emoji: '👤' },
    { title: 'YouTube Thumbnails', desc: 'Subject cutouts for eye-catching thumbnails', emoji: '▶️', tag: 'Trending' },
    { title: 'Clothing & Apparel', desc: 'Ghost mannequin effect for fashion listings', emoji: '👕' },
    { title: 'Pets & Animals', desc: 'Precise fur-edge cutouts for pet portraits', emoji: '🐾' },
    { title: 'Ad Creatives', desc: 'Flexible assets for any campaign background', emoji: '📣' },
  ],
  'watermark-remover': [
    { title: 'Text Watermarks', desc: 'Remove copyright text and name overlays', emoji: '©', tag: 'Most Common' },
    { title: 'Logo Watermarks', desc: 'Remove brand logos placed over images', emoji: '🏷️' },
    { title: 'Date & Time Stamps', desc: 'Remove camera date stamps from old photos', emoji: '📅' },
    { title: 'Stock Photo Marks', desc: 'Clean stock site watermark patterns', emoji: '🖼️', tag: 'Popular' },
    { title: 'Preview Watermarks', desc: 'Remove diagonal PREVIEW and SAMPLE text', emoji: '🔒' },
    { title: 'Promo Banners', desc: 'Remove overlaid promotional text banners', emoji: '📢' },
  ],
  'photo-enhancer': [
    { title: 'Old Family Photos', desc: 'Restore faded vintage and scanned prints', emoji: '📷', tag: 'Most Popular' },
    { title: 'Portrait Retouching', desc: 'Bright eyes, balanced exposure, natural look', emoji: '👤' },
    { title: 'Product Photos', desc: 'Sharper, brighter e-commerce listing images', emoji: '🛍️' },
    { title: 'Travel Photography', desc: 'Enhance hazy and underexposed travel shots', emoji: '✈️', tag: 'Trending' },
    { title: 'Event Photography', desc: 'Rescue dark or motion-blurred event photos', emoji: '🎉' },
    { title: 'Landscape Photos', desc: 'Vivid colors, sharp detail, and clear skies', emoji: '🏔️' },
  ],
  'compress-image': [
    { title: 'JPEG Photos', desc: 'Compress product and lifestyle photography', emoji: '📸', tag: 'Most Popular' },
    { title: 'PNG Graphics', desc: 'Compress UI screenshots and design graphics', emoji: '🖥️' },
    { title: 'E-Commerce Catalogs', desc: 'Batch optimize entire product libraries', emoji: '🛍️', tag: 'Power Users' },
    { title: 'Blog Images', desc: 'Optimize hero images for Core Web Vitals', emoji: '✏️' },
    { title: 'Social Media Assets', desc: 'Compress for Instagram, LinkedIn, TikTok', emoji: '📱' },
    { title: 'Email Images', desc: 'Under 200KB for perfect email rendering', emoji: '📧' },
  ],
}
const getTypeCards = (id: string) => TYPE_CARDS[id] ?? TYPE_CARDS['upscale']

const TESTIMONIALS: Record<string, { name: string; role: string; avatar: string; quote: string }[]> = {
  upscale: [
    { name: 'Marcus Johnson', role: 'E-commerce Seller, Austin TX', avatar: 'MJ', quote: 'Had hundreds of old product photos shot on a phone. After upscaling they look like studio shots. My conversion rate improved noticeably.' },
    { name: 'Sarah Mitchell', role: 'Photographer, New York', avatar: 'SM', quote: 'The AI preserves texture and detail unlike any other online tool. Hair, fabric, skin - all looks natural after upscaling.' },
    { name: 'Derek Chen', role: 'Graphic Designer, San Francisco', avatar: 'DC', quote: 'I use it to upscale AI-generated art before printing. 4x and the results are ready for A2 poster prints. Incredible quality.' },
    { name: 'Priya Nair', role: 'Etsy Seller, Portland', avatar: 'PN', quote: 'My handmade jewelry photos were blurry on Etsy. Upscaling made them look professional. Sales went up 40% that month.' },
    { name: 'Tom Bradley', role: 'Marketing Director, Chicago', avatar: 'TB', quote: 'We use it for old campaign assets that need updating for 4K screens. Saves us a full photo reshoot every time.' },
    { name: 'Lisa Park', role: 'Print Designer, Seattle', avatar: 'LP', quote: 'I regularly upscale client logos for large-format banners. Results are always sharp with zero pixelation artifacts.' },
  ],
  'remove-bg': [
    { name: 'Jessica Park', role: 'E-commerce Owner, Los Angeles', avatar: 'JP', quote: 'Was spending 30 min per product photo in Photoshop. Now I process 40 images before my morning coffee. Looks completely professional.' },
    { name: 'Ryan Torres', role: 'Freelance Photographer, Miami', avatar: 'RT', quote: 'Background removal on hair and fine edges is flawless. Clients cannot tell the difference from a manual Photoshop cutout.' },
    { name: 'Amanda Lee', role: 'Social Media Manager, Chicago', avatar: 'AL', quote: 'Switched from remove.bg - same quality but JPT AI has all the other tools too. No watermarks, instant results.' },
    { name: 'Carlos Rivera', role: 'Fashion Brand, Miami', avatar: 'CR', quote: 'We do ghost mannequin shots for our entire clothing line. JPT AI handles fabric edges perfectly every single time.' },
    { name: 'Kevin Walsh', role: 'LinkedIn Coach, Boston', avatar: 'KW', quote: 'My clients use it for headshots. A clean background adds instant professionalism. Connection requests go up noticeably.' },
    { name: 'Emma Collins', role: 'Content Creator, Nashville', avatar: 'EC', quote: 'Thumbnail backgrounds removed in seconds. My YouTube click-through rate improved 18% after switching to clean cutouts.' },
  ],
  'watermark-remover': [
    { name: 'Alex Morgan', role: 'Blogger, Austin TX', avatar: 'AM', quote: 'I needed clean reference images for my blog posts. JPT AI removed the watermarks perfectly - not a trace left behind.' },
    { name: 'Nina Patel', role: 'Content Creator, Chicago', avatar: 'NP', quote: 'Old family photos had date stamps all over them. This tool removed every single one cleanly. The family was amazed.' },
    { name: 'James Carter', role: 'Marketing Manager, Seattle', avatar: 'JC', quote: 'Used it to clean up stock photo previews for client presentations. The results were seamless - indistinguishable from the original.' },
    { name: 'Sofia Rodriguez', role: 'Graphic Designer, Miami', avatar: 'SR', quote: 'Clients send me photos with overlaid text all the time. JPT AI removes it cleanly in seconds. Saves an hour of Photoshop work.' },
    { name: 'Tyler Brooks', role: 'Social Media Manager, Denver', avatar: 'TB', quote: 'Cleaned up hundreds of old product images that had promotional banners overlaid. The AI reconstruction is remarkably accurate.' },
    { name: 'Rachel Kim', role: 'E-commerce Owner, Phoenix', avatar: 'RK', quote: 'Our supplier sends product photos with their logo watermark. JPT AI removes them so we can brand them ourselves.' },
  ],
  'photo-enhancer': [
    { name: 'Tyler Brooks', role: 'Family Photographer, Denver', avatar: 'TB', quote: 'My parents wedding photos from the 70s came out of this tool looking like they were taken last year. The family was speechless.' },
    { name: 'Natalie Grant', role: 'Blogger, Seattle', avatar: 'NG', quote: 'My old travel photos from 2012 on a terrible point-and-shoot look stunning now. The color restoration is incredible.' },
    { name: 'Kevin Walsh', role: 'Freelance Consultant, Denver', avatar: 'KW', quote: 'Used it to enhance product shots taken in bad lighting. Clients cannot believe the difference - looks like a professional studio shot.' },
    { name: 'Sophie Anderson', role: 'Event Photographer, Chicago', avatar: 'SA', quote: 'Rescues my indoor event shots. Low-light photos come out sharp and properly exposed. Saves me 2 hours of Lightroom editing per event.' },
    { name: 'James Miller', role: 'Genealogy Researcher, Boston', avatar: 'JM', quote: 'I digitize old family photos for research. JPT AI restores them so clearly you can read text on documents from 1920.' },
    { name: 'Rachel Kim', role: 'Real Estate Agent, Phoenix', avatar: 'RK', quote: 'Enhancing interior listing photos takes 10 seconds per image now. Brighter, sharper, more professional. My listings get more views.' },
  ],
  'compress-image': [
    { name: 'David Wilson', role: 'Web Developer, Austin', avatar: 'DW', quote: 'Cut my homepage image sizes by 70% without any visible quality loss. My Core Web Vitals score jumped 18 points.' },
    { name: 'Emma Davis', role: 'Blogger, Seattle', avatar: 'ED', quote: 'Finally a free image compressor that does not add a watermark. My blog loads 3x faster now. Google loves it.' },
    { name: 'James Taylor', role: 'Shopify Developer, Atlanta', avatar: 'JT', quote: 'Compressed an entire product catalog in minutes. Page load dropped from 4.2s to 1.8s. Client is thrilled.' },
    { name: 'Nina Patel', role: 'SEO Specialist, Chicago', avatar: 'NP', quote: 'Image compression is an SEO non-negotiable. This tool makes it effortless - no more excuses from clients about slow sites.' },
    { name: 'Chris Morgan', role: 'E-commerce Director, Phoenix', avatar: 'CM', quote: 'Reduced our product image library from 4GB to 900MB with zero visible loss. CDN costs dropped significantly.' },
    { name: 'Lauren Kim', role: 'UX Designer, Portland', avatar: 'LK', quote: 'I compress every design export before handing off. Developers love me for it and pages load instantly.' },
  ],
}
const getTestimonials = (id: string) => TESTIMONIALS[id] ?? TESTIMONIALS['upscale']

const COMPARISON: Record<string, { feature: string; jpt: boolean; alt1: boolean; alt2: boolean; alt1name: string; alt2name: string }[]> = {
  upscale: [
    { feature: '4x AI Super-Resolution', jpt: true, alt1: false, alt2: true, alt1name: 'Photoshop', alt2name: "Let's Enhance" },
    { feature: 'Free - no credit card needed', jpt: true, alt1: false, alt2: false, alt1name: 'Photoshop', alt2name: "Let's Enhance" },
    { feature: 'No watermark on output', jpt: true, alt1: true, alt2: false, alt1name: 'Photoshop', alt2name: "Let's Enhance" },
    { feature: 'Works 100% in browser', jpt: true, alt1: false, alt2: true, alt1name: 'Photoshop', alt2name: "Let's Enhance" },
    { feature: 'BG removal + AI editing', jpt: true, alt1: true, alt2: false, alt1name: 'Photoshop', alt2name: "Let's Enhance" },
    { feature: 'No signup to try', jpt: true, alt1: false, alt2: false, alt1name: 'Photoshop', alt2name: "Let's Enhance" },
  ],
  'remove-bg': [
    { feature: 'Free - no credit card needed', jpt: true, alt1: false, alt2: true, alt1name: 'Photoshop', alt2name: 'remove.bg' },
    { feature: 'No watermark on free tier', jpt: true, alt1: false, alt2: false, alt1name: 'Photoshop', alt2name: 'remove.bg' },
    { feature: 'AI image editing included', jpt: true, alt1: true, alt2: false, alt1name: 'Photoshop', alt2name: 'remove.bg' },
    { feature: '4x AI upscaling included', jpt: true, alt1: true, alt2: false, alt1name: 'Photoshop', alt2name: 'remove.bg' },
    { feature: 'Works in browser', jpt: true, alt1: false, alt2: true, alt1name: 'Photoshop', alt2name: 'remove.bg' },
    { feature: 'No signup to try', jpt: true, alt1: false, alt2: true, alt1name: 'Photoshop', alt2name: 'remove.bg' },
  ],
  'watermark-remover': [
    { feature: 'AI-based removal (no smearing)', jpt: true, alt1: false, alt2: false, alt1name: 'GIMP', alt2name: 'Inpaint.io' },
    { feature: 'Free - no credit card', jpt: true, alt1: true, alt2: false, alt1name: 'GIMP', alt2name: 'Inpaint.io' },
    { feature: 'No watermark on output', jpt: true, alt1: true, alt2: false, alt1name: 'GIMP', alt2name: 'Inpaint.io' },
    { feature: 'Works in browser', jpt: true, alt1: false, alt2: true, alt1name: 'GIMP', alt2name: 'Inpaint.io' },
    { feature: 'BG removal + upscaling too', jpt: true, alt1: false, alt2: false, alt1name: 'GIMP', alt2name: 'Inpaint.io' },
    { feature: 'No signup to try', jpt: true, alt1: false, alt2: false, alt1name: 'GIMP', alt2name: 'Inpaint.io' },
  ],
  'compress-image': [
    { feature: 'Free - no credit card', jpt: true, alt1: true, alt2: false, alt1name: 'TinyPNG', alt2name: 'Squoosh Pro' },
    { feature: 'No watermark', jpt: true, alt1: true, alt2: true, alt1name: 'TinyPNG', alt2name: 'Squoosh Pro' },
    { feature: 'AI upscaling too', jpt: true, alt1: false, alt2: false, alt1name: 'TinyPNG', alt2name: 'Squoosh Pro' },
    { feature: 'BG removal too', jpt: true, alt1: false, alt2: false, alt1name: 'TinyPNG', alt2name: 'Squoosh Pro' },
    { feature: 'Works in browser', jpt: true, alt1: true, alt2: true, alt1name: 'TinyPNG', alt2name: 'Squoosh Pro' },
    { feature: 'No signup needed', jpt: true, alt1: true, alt2: false, alt1name: 'TinyPNG', alt2name: 'Squoosh Pro' },
  ],
}

const RELATED_TOOLS = [
  { label: 'AI Upscale', href: '/upscale', emoji: '🔍', desc: 'Enlarge images 4x with AI' },
  { label: 'Remove Background', href: '/remove-bg', emoji: '🪄', desc: 'One-click background removal' },
  { label: 'Photo Enhancer', href: '/photo-enhancer', emoji: '✨', desc: 'Restore and enhance quality' },
  { label: 'Compress Image', href: '/compress-image', emoji: '⚡', desc: 'Reduce file size 80%' },
  { label: 'Change Background', href: '/change-background', emoji: '🌅', desc: 'Replace with AI background' },
  { label: 'Watermark Remover', href: '/watermark-remover', emoji: '🧹', desc: 'Remove any watermark' },
  { label: 'White Background', href: '/make-background-white', emoji: '⬜', desc: 'Amazon-ready white background' },
  { label: 'Convert to PNG', href: '/convert-to-png', emoji: '🔄', desc: 'JPG/WEBP to PNG free' },
  { label: 'Convert to JPG', href: '/convert-to-jpg', emoji: '🔄', desc: 'PNG/WEBP to JPG free' },
  { label: 'Passport Photo', href: '/passport-photo', emoji: '🪪', desc: 'US passport photo in seconds' },
]

// ── Main Component ─────────────────────────────────────────────────────────
export default function LandingPage({ config, toolHref, pageId, inlineToolType }: LandingPageProps) {
  const [activeTab, setActiveTab] = useState(0)
  const s = seeds(pageId)
  const bf = PAGE_BEFORE_FILTER[pageId] ?? 'blur(2px) contrast(0.8)'
  const toolType = inlineToolType ?? PAGE_TOOL[pageId]
  const rows = getRows(pageId)
  const useCases = getUseCases(pageId)
  const cards = getTypeCards(pageId)
  const testimonials = getTestimonials(pageId)
  const comparison = COMPARISON[pageId]
  const related = RELATED_TOOLS.filter(t => !t.href.includes(pageId))
  const showWatermark = pageId === 'watermark-remover'

  const H2: React.CSSProperties = { fontSize: 'clamp(1.8rem, 3.5vw, 2.75rem)', fontWeight: 900, color: '#111827', lineHeight: 1.1, letterSpacing: '-0.03em', margin: 0 }
  const H2W: React.CSSProperties = { ...H2, color: '#fff' }
  const LABEL: React.CSSProperties = { fontSize: 11, fontWeight: 800, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }
  const BODY: React.CSSProperties = { fontSize: 16, color: '#4B5563', lineHeight: 1.75, margin: 0 }

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif', color: '#111827', background: '#FAFAF8' }}>

      {/* ── HERO: demo slider LEFT + tool RIGHT ──────────────────────────── */}
      <section style={{ background: '#FAFAF8', paddingTop: 52, paddingBottom: 0 }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 48, alignItems: 'start' }}>

            {/* Left: demo slider */}
            <div>
              <CompareSlider
                beforeSrc={pic(s[0], 720, 520)}
                afterSrc={pic(s[1], 720, 520)}
                beforeFilter={bf}
                beforeLabel="Before"
                afterLabel="After AI"
                height={340}
                autoPlay
                showWatermark={showWatermark}
              />
              <p style={{ textAlign: 'center', fontSize: 12, color: '#9CA3AF', marginTop: 8 }}>
                Drag slider to compare &bull; Live demo
              </p>
            </div>

            {/* Right: headline + inline upload tool */}
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#EEF2FF', color: '#4338CA', fontWeight: 700, fontSize: 11, borderRadius: 20, padding: '5px 14px', marginBottom: 16, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Free Online Tool &bull; No Signup
              </div>
              <h1 style={{ fontSize: 'clamp(1.7rem, 3vw, 2.4rem)', fontWeight: 900, color: '#111827', lineHeight: 1.08, letterSpacing: '-0.03em', margin: '0 0 12px' }}>
                {config.h1}
              </h1>
              <p style={{ fontSize: 15, color: '#4B5563', lineHeight: 1.65, margin: '0 0 20px' }}>
                {config.subtitle}
              </p>

              {/* Trust signals */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 18px', marginBottom: 20 }}>
                {['No credit card', 'No watermark', 'No signup'].map(t => (
                  <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#374151', fontWeight: 600 }}>
                    <svg width="15" height="15" viewBox="0 0 15 15"><circle cx="7.5" cy="7.5" r="7.5" fill="#22C55E"/><path d="M5 7.5l2 2 3.5-3.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
                    {t}
                  </span>
                ))}
              </div>

              {/* Inline upload tool OR CTA */}
              {toolType ? (
                <div style={{ background: '#fff', borderRadius: 18, border: '1.5px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 4px 28px rgba(0,0,0,0.06)' }}>
                  <InlineTool toolType={toolType} beforeLabel="Original" afterLabel="Processed" />
                </div>
              ) : (
                <div>
                  <a href={toolHref} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: '#111827', color: '#fff', fontWeight: 800, fontSize: 16, padding: '15px 36px', borderRadius: 14, textDecoration: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.18)' }}>
                    {config.cta_text || 'Try It Free'} &rarr;
                  </a>
                  <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 10 }}>5 free uses &bull; No credit card</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div style={{ background: '#111827', marginTop: 52, padding: '20px 24px' }}>
          <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 16 }}>
            {[['500K+', 'Images Processed'], ['< 5 sec', 'Processing Time'], ['No Signup', 'Free to Try'], ['No Watermark', 'On Download']].map(([val, lbl]) => (
              <div key={lbl} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>{val}</div>
                <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500, marginTop: 3, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section style={{ padding: '88px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div style={LABEL}>How it works</div>
            <h2 style={H2}>Three steps. Done in seconds.</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 0 }}>
            {[
              { step: '01', title: 'Upload Your Image', desc: 'Drag & drop or click to select. JPG, PNG, WEBP supported. No account needed.' },
              { step: '02', title: 'AI Transforms It', desc: 'Our AI processes your image in seconds - right in your browser. No waiting in queues.' },
              { step: '03', title: 'Download & Edit', desc: 'Download free, no watermark. Then open in AI Editor for further edits or batch more images.' },
            ].map((step, i, arr) => (
              <div key={step.step} style={{ padding: '0 32px', textAlign: 'center', borderRight: i < arr.length - 1 ? '1px solid #E5E7EB' : 'none' }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', border: '2px solid #E5E7EB', background: '#FAFAF8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#374151', fontWeight: 900, fontSize: 17 }}>{step.step}</div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#111827', margin: '0 0 10px' }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.7, margin: 0 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURE ROWS — alternating, each with a DIFFERENT image ─────── */}
      {rows.map((row, i) => (
        <section key={i} style={{ padding: '80px 24px', background: i % 2 === 0 ? '#FAFAF8' : '#fff' }}>
          <div style={{ maxWidth: 1180, margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 60, alignItems: 'center' }}>
            {/* Text */}
            <div style={{ order: i % 2 === 0 ? 0 : 1 }}>
              <div style={{ display: 'inline-block', background: '#EEF2FF', color: '#4338CA', fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '5px 14px', borderRadius: 20, marginBottom: 18 }}>{row.badge}</div>
              <h2 style={{ fontSize: 'clamp(1.45rem, 2.4vw, 2rem)', fontWeight: 900, color: '#111827', lineHeight: 1.15, letterSpacing: '-0.025em', margin: '0 0 16px' }}>{row.heading}</h2>
              <p style={{ ...BODY, marginBottom: 28 }}>{row.body}</p>
              <a href={toolHref} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#111827', color: '#fff', fontWeight: 700, fontSize: 15, padding: '13px 28px', borderRadius: 12, textDecoration: 'none' }}>
                Try it free &rarr;
              </a>
            </div>
            {/* Unique image for each row: seeds [2+i*2] and [3+i*2] */}
            <div style={{ order: i % 2 === 0 ? 1 : 0 }}>
              <CompareSlider
                beforeSrc={pic(s[2 + i * 2] ?? s[i % s.length], 640, 460)}
                afterSrc={pic(s[3 + i * 2] ?? s[(i + 1) % s.length], 640, 460)}
                beforeFilter={bf}
                beforeLabel="Before"
                afterLabel="After"
                height={280}
                showWatermark={showWatermark && i === 0}
              />
            </div>
          </div>
        </section>
      ))}

      {/* ── USE CASE TABS — dark section, each tab its own image ─────────── */}
      <section style={{ padding: '88px 24px', background: '#111827' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ ...LABEL, color: '#A78BFA' }}>Use Cases</div>
            <h2 style={H2W}>Built for every creative workflow</h2>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 44 }}>
            {useCases.map((uc, i) => (
              <button key={uc.label} onClick={() => setActiveTab(i)} style={{ padding: '8px 20px', borderRadius: 24, border: '1.5px solid', borderColor: activeTab === i ? '#A78BFA' : 'rgba(255,255,255,0.15)', background: activeTab === i ? '#7C3AED' : 'transparent', color: activeTab === i ? '#fff' : 'rgba(255,255,255,0.6)', fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.18s' }}>
                {uc.label}
              </button>
            ))}
          </div>
          {useCases[activeTab] && (
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 52, alignItems: 'center' }}>
              {/* Unique image per tab: index into seeds starting at 8 */}
              <CompareSlider
                beforeSrc={pic(s[(8 + activeTab * 2) % s.length], 640, 460)}
                afterSrc={pic(s[(9 + activeTab * 2) % s.length], 640, 460)}
                beforeFilter={bf}
                beforeLabel={useCases[activeTab].label}
                afterLabel="After AI"
                height={260}
                showWatermark={showWatermark && activeTab === 0}
              />
              <div>
                <h3 style={{ fontSize: 'clamp(1.3rem, 2vw, 1.8rem)', fontWeight: 900, color: '#fff', lineHeight: 1.2, margin: '0 0 16px' }}>{useCases[activeTab].heading}</h3>
                <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.62)', lineHeight: 1.75, margin: '0 0 28px' }}>{useCases[activeTab].desc}</p>
                <a href={toolHref} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#7C3AED', color: '#fff', fontWeight: 700, fontSize: 15, padding: '13px 28px', borderRadius: 12, textDecoration: 'none' }}>
                  Try it free &rarr;
                </a>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── TYPE GRID — 6 cards, each with its own image ─────────────────── */}
      <section style={{ padding: '88px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={LABEL}>Works on Every Type</div>
            <h2 style={H2}>Every scenario. One tool.</h2>
            <p style={{ fontSize: 15, color: '#6B7280', marginTop: 14, maxWidth: 500, margin: '14px auto 0' }}>
              From e-commerce product shots to personal photos - JPT AI handles every use case with equal precision.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {cards.map((card, i) => (
              <a key={card.title} href={toolHref} style={{ borderRadius: 20, border: '1.5px solid #E5E7EB', background: '#FAFAF8', overflow: 'hidden', textDecoration: 'none', display: 'block', transition: 'box-shadow 0.2s' }}>
                {/* Unique image per card */}
                <div style={{ height: 190, position: 'relative', overflow: 'hidden' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={pic(s[i % s.length], 640, 380)} alt={card.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  {card.tag && (
                    <div style={{ position: 'absolute', top: 12, left: 12, background: '#7C3AED', color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 10, letterSpacing: '0.05em' }}>{card.tag}</div>
                  )}
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 60%)' }} />
                </div>
                <div style={{ padding: '16px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                    <span style={{ fontSize: 18 }}>{card.emoji}</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>{card.title}</span>
                  </div>
                  <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.55, margin: 0 }}>{card.desc}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS marquee ─────────────────────────────────────────── */}
      <section style={{ padding: '88px 0', background: '#FAFAF8', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', paddingLeft: 24, marginBottom: 48 }}>
          <div style={LABEL}>What users say</div>
          <h2 style={H2}>Loved by creators &amp; businesses</h2>
        </div>
        {[0, 1].map(row => (
          <div key={row} style={{ overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 20, animation: `marquee${row === 0 ? '' : '-rev'} ${row === 0 ? 38 : 44}s linear infinite`, width: 'max-content' }}>
              {[...testimonials, ...testimonials].map((t, idx) => (
                <div key={idx} style={{ width: 310, flexShrink: 0, background: '#fff', borderRadius: 16, padding: '20px 20px', border: '1.5px solid #E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', gap: 2, marginBottom: 10 }}>
                    {Array.from({ length: 5 }).map((_, i) => <span key={i} style={{ color: '#F59E0B', fontSize: 13 }}>★</span>)}
                  </div>
                  <p style={{ margin: '0 0 14px', fontSize: 13, color: '#374151', lineHeight: 1.65, fontStyle: 'italic' }}>&ldquo;{t.quote}&rdquo;</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{t.avatar}</div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: '#111827' }}>{t.name}</div>
                      <div style={{ fontSize: 11, color: '#9CA3AF' }}>{t.role}</div>
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

      {/* ── COMPARISON TABLE ─────────────────────────────────────────────── */}
      {comparison && (() => {
        const alt1 = comparison[0].alt1name, alt2 = comparison[0].alt2name
        return (
          <section style={{ padding: '88px 24px', background: '#fff' }}>
            <div style={{ maxWidth: 820, margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: 52 }}>
                <div style={LABEL}>Comparison</div>
                <h2 style={H2}>JPT AI vs the alternatives</h2>
                <p style={{ fontSize: 15, color: '#6B7280', marginTop: 14, maxWidth: 480, margin: '14px auto 0' }}>One tool. Everything included. No hidden paywalls.</p>
              </div>
              <div style={{ borderRadius: 20, border: '1.5px solid #E5E7EB', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: '#F9FAFB' }}>
                      <th style={{ textAlign: 'left', padding: '14px 20px', color: '#6B7280', fontWeight: 700, fontSize: 12, borderBottom: '1.5px solid #E5E7EB' }}>Feature</th>
                      <th style={{ textAlign: 'center', padding: '14px 20px', color: '#7C3AED', fontWeight: 900, fontSize: 12, background: '#F5F3FF', borderBottom: '1.5px solid #E5E7EB' }}>JPT AI</th>
                      <th style={{ textAlign: 'center', padding: '14px 20px', color: '#6B7280', fontWeight: 700, fontSize: 12, borderBottom: '1.5px solid #E5E7EB' }}>{alt1}</th>
                      <th style={{ textAlign: 'center', padding: '14px 20px', color: '#6B7280', fontWeight: 700, fontSize: 12, borderBottom: '1.5px solid #E5E7EB' }}>{alt2}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.map((r, i) => (
                      <tr key={r.feature} style={{ borderBottom: i < comparison.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                        <td style={{ padding: '12px 20px', color: '#374151', fontWeight: 500 }}>{r.feature}</td>
                        <td style={{ textAlign: 'center', padding: '12px 20px', background: '#FAFAFF' }}><span style={{ color: r.jpt ? '#16A34A' : '#DC2626', fontSize: 17, fontWeight: 900 }}>{r.jpt ? '✓' : '✗'}</span></td>
                        <td style={{ textAlign: 'center', padding: '12px 20px' }}><span style={{ color: r.alt1 ? '#16A34A' : '#DC2626', fontSize: 17, fontWeight: 900 }}>{r.alt1 ? '✓' : '✗'}</span></td>
                        <td style={{ textAlign: 'center', padding: '12px 20px' }}><span style={{ color: r.alt2 ? '#16A34A' : '#DC2626', fontSize: 17, fontWeight: 900 }}>{r.alt2 ? '✓' : '✗'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )
      })()}

      {/* ── RELATED TOOLS horizontal scroll ──────────────────────────────── */}
      <section style={{ padding: '72px 0', background: '#FAFAF8' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', paddingLeft: 24, marginBottom: 32 }}>
          <div style={LABEL}>Related Tools</div>
          <h2 style={{ ...H2, fontSize: 'clamp(1.4rem, 2.5vw, 1.9rem)' }}>More AI tools you&apos;ll love</h2>
        </div>
        <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingLeft: 24, paddingRight: 24, paddingBottom: 8, scrollbarWidth: 'none' }}>
          {related.map(tool => (
            <a key={tool.href} href={tool.href} style={{ flexShrink: 0, width: 200, background: '#fff', borderRadius: 16, border: '1.5px solid #E5E7EB', padding: '18px 16px', textDecoration: 'none' }}>
              <div style={{ fontSize: 26, marginBottom: 8 }}>{tool.emoji}</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#111827', marginBottom: 4 }}>{tool.label}</div>
              <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.5 }}>{tool.desc}</div>
            </a>
          ))}
        </div>
      </section>

      {/* ── MID-PAGE CTA ─────────────────────────────────────────────────── */}
      <section style={{ padding: '0 24px 88px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', background: '#111827', borderRadius: 28, padding: '56px 48px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, background: 'radial-gradient(circle,rgba(99,102,241,0.35) 0%,transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(99,102,241,0.25)', color: '#C4B5FD', fontWeight: 700, fontSize: 11, borderRadius: 20, padding: '5px 14px', marginBottom: 18, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Free to try</div>
            <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 900, color: '#fff', margin: '0 0 12px', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              Ready to transform your images?
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', margin: '0 0 28px' }}>No credit card required. Instant results. No watermarks.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href={toolHref} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: '#111827', fontWeight: 800, fontSize: 16, padding: '15px 36px', borderRadius: 14, textDecoration: 'none' }}>
                {config.cta_text || 'Try It Free'} &rarr;
              </a>
              <a href="/editor" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.1)', color: '#fff', fontWeight: 700, fontSize: 15, padding: '15px 28px', borderRadius: 14, textDecoration: 'none', border: '1.5px solid rgba(255,255,255,0.2)' }}>
                Open AI Editor
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      {config.faq?.length > 0 && (
        <section style={{ padding: '0 24px 88px', background: '#fff' }}>
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 52, paddingTop: 72 }}>
              <div style={LABEL}>FAQ</div>
              <h2 style={H2}>Frequently asked questions</h2>
            </div>
            <FAQAccordion faqs={config.faq} />
          </div>
        </section>
      )}

    </div>
  )
}

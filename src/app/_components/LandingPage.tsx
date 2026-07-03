'use client'

import { useRef } from 'react'
import FAQAccordion from './FAQAccordion'
import { PageSEO } from '@/lib/page-config'
import { PAGE_IMAGES, PAGE_BEFORE_AFTER } from '@/lib/landing-images'

interface LandingPageProps {
  config: PageSEO
  toolHref: string
  pageId: string
}

// Map pageId → editor tool id (matches editor's Tool type)
const PAGE_TOOL: Record<string, string> = {
  'remove-bg': 'remove-bg',
  upscale: 'upscale',
  'ai-editor': 'ai-edit',
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onloadend = () => resolve(r.result as string)
    r.onerror = reject
    r.readAsDataURL(file)
  })
}

const HOW_IT_WORKS = [
  { step: '01', title: 'Upload Your Photo', desc: 'Drag & drop or click to select any image from your device. JPG, PNG, WEBP supported.' },
  { step: '02', title: 'AI Processes It', desc: 'Our Gemini AI analyzes your image and applies the transformation in seconds.' },
  { step: '03', title: 'Download Result', desc: 'Preview the result and download in full quality — PNG or JPEG, your choice.' },
]

// ── Per-page SEO content ──────────────────────────────────────────────────────

const PAGE_USE_CASES: Record<string, { icon: string; title: string; stat?: string; desc: string }[]> = {
  upscale: [
    { icon: '🛍️', title: 'E-commerce Product Photos', stat: '94% higher conversion', desc: 'Turn low-res product photos into crisp, high-definition images. High-quality product photos increase conversion rates by up to 94%.' },
    { icon: '📸', title: 'Old Photo Restoration', desc: 'Bring blurry, pixelated family memories back to life. AI upscaling recovers fine details that traditional enlargement destroys.' },
    { icon: '🎨', title: 'AI Art & Digital Content', desc: 'Upscale AI-generated images to print-quality resolution. Export at 4× for posters, merchandise, and large-format prints.' },
    { icon: '🖥️', title: 'Web & Marketing Assets', desc: 'Fix low-resolution screenshots, logos, or assets for retina displays. Never compromise on image quality in campaigns.' },
  ],
  'remove-bg': [
    { icon: '🛍️', title: 'E-commerce & Product Shots', stat: '94% higher conversion', desc: 'Create consistent, white-background product photos for Amazon, Shopify, and Flipkart. High-quality product images boost conversion rates significantly.' },
    { icon: '💼', title: 'LinkedIn Headshots', stat: '21× more profile views', desc: 'Remove distracting backgrounds from profile photos. Professional headshots get 21× more LinkedIn profile views and 9× more connection requests.' },
    { icon: '🎥', title: 'Content Creation', stat: '35% more shares', desc: 'Make YouTube thumbnails, social media posts, and banners pop. High-quality images with clean cutouts get 35% more shares.' },
    { icon: '📣', title: 'Marketing & Advertising', desc: 'Produce on-brand visuals at scale. Remove backgrounds from product and lifestyle shots to use in any campaign or creative.' },
  ],
  headshot: [
    { icon: '💼', title: 'LinkedIn Profiles', stat: '21× more profile views', desc: 'Profiles with professional headshots get 21× more profile views and 9× more connection requests than those without.' },
    { icon: '🏢', title: 'Corporate Directories', desc: 'Get consistent, professional-looking headshots for your company website and team pages without expensive studio sessions.' },
    { icon: '📄', title: 'Resumes & CVs', desc: 'Add a polished headshot to your resume or portfolio. Stand out from the crowd with a professional photo in seconds.' },
    { icon: '🎤', title: 'Speaker Profiles & Media Kits', desc: 'Generate professional photos for conference bios, press releases, and media kits quickly.' },
  ],
  'ai-editor': [
    { icon: '🛍️', title: 'E-commerce', stat: '94% higher conversion', desc: 'Generate studio-quality backgrounds, adjust lighting, and retouch product photos for marketplaces — without a photographer.' },
    { icon: '🎥', title: 'Content Creators', stat: '35% more shares', desc: 'Create eye-catching thumbnails, social media images, and banners with AI edits using plain English descriptions.' },
    { icon: '📣', title: 'Marketing Teams', desc: 'Produce on-brand campaign visuals at scale. Change backgrounds, apply styles, and relight images with simple text prompts.' },
    { icon: '🎨', title: 'Designers', desc: 'Prototype ideas and explore creative directions faster. Use AI editing to iterate without committing to full production.' },
  ],
}

const PAGE_TESTIMONIALS: Record<string, { name: string; role: string; avatar: string; quote: string; stars: number }[]> = {
  upscale: [
    { name: 'Arjun Verma', role: 'E-commerce Seller', avatar: 'AV', quote: 'I had hundreds of old product photos taken on a phone. After upscaling, they look like professional studio shots. Sales improved noticeably.', stars: 5 },
    { name: 'Meera Nair', role: 'Photographer', avatar: 'MN', quote: 'The AI preserves texture and detail in a way no other online tool does. Hair, fabric, skin — it all looks natural after upscaling.', stars: 5 },
    { name: 'Kiran Shah', role: 'Graphic Designer', avatar: 'KS', quote: 'I use it to upscale AI-generated art before printing. 4× boost and the results are ready for A2 poster prints. Incredible.', stars: 5 },
  ],
  'remove-bg': [
    { name: 'Priya Sharma', role: 'E-commerce Owner', avatar: 'PS', quote: 'I was spending 30 minutes per product photo in Photoshop. Now I process 40 images before morning coffee. My store looks completely professional.', stars: 5 },
    { name: 'Rahul Mehta', role: 'Freelance Photographer', avatar: 'RM', quote: 'Background removal on hair and fine details is flawless. My clients can\'t tell the difference from a manual Photoshop cutout.', stars: 5 },
    { name: 'Sneha Patel', role: 'Social Media Manager', avatar: 'SP', quote: 'Switched from remove.bg — same quality, but JPT AI has all the other tools too. No watermarks, instant results. Perfect.', stars: 5 },
  ],
  headshot: [
    { name: 'Aditya Kumar', role: 'Software Engineer', avatar: 'AK', quote: 'Updated my LinkedIn with a JPT AI headshot. Got 3 recruiter messages in the same week. The photo looks completely professional.', stars: 5 },
    { name: 'Nisha Gupta', role: 'Marketing Manager', avatar: 'NG', quote: 'Used it for our entire team\'s company page. Saved us a ₹30,000 studio session. Everyone looks consistent and polished.', stars: 5 },
    { name: 'Vivek Joshi', role: 'Freelance Consultant', avatar: 'VJ', quote: 'I needed a quick headshot for a conference speaker profile. Done in 2 minutes, looked better than my old studio photo.', stars: 5 },
  ],
  'ai-editor': [
    { name: 'Pooja Reddy', role: 'Content Creator', avatar: 'PR', quote: 'I just type what I want — "add a sunset background", "make it look cinematic" — and it\'s done. No Photoshop skills needed at all.', stars: 5 },
    { name: 'Suresh Bhat', role: 'Digital Marketer', avatar: 'SB', quote: 'Changed 50 product backgrounds for a campaign in one afternoon. What used to take a design agency 3 days now takes me hours.', stars: 5 },
    { name: 'Kavya Singh', role: 'Graphic Designer', avatar: 'KS', quote: 'Perfect for rapid prototyping. I try 10 different styles with AI prompts before committing to one direction. Massive time saver.', stars: 5 },
  ],
}

const PAGE_COMPARISON: Record<string, { feature: string; jpt: boolean; alt1: boolean; alt2: boolean; alt1name: string; alt2name: string }[]> = {
  upscale: [
    { feature: '4× AI Upscaling', jpt: true, alt1: false, alt2: true, alt1name: 'Photoshop', alt2name: "Let's Enhance" },
    { feature: 'Free tier (no credit card)', jpt: true, alt1: false, alt2: false, alt1name: 'Photoshop', alt2name: "Let's Enhance" },
    { feature: 'No watermark', jpt: true, alt1: true, alt2: false, alt1name: 'Photoshop', alt2name: "Let's Enhance" },
    { feature: 'Works in browser', jpt: true, alt1: false, alt2: true, alt1name: 'Photoshop', alt2name: "Let's Enhance" },
    { feature: 'AI editing + BG removal too', jpt: true, alt1: true, alt2: false, alt1name: 'Photoshop', alt2name: "Let's Enhance" },
    { feature: 'No signup to try', jpt: true, alt1: false, alt2: false, alt1name: 'Photoshop', alt2name: "Let's Enhance" },
  ],
  'remove-bg': [
    { feature: 'Free tier (no credit card)', jpt: true, alt1: false, alt2: true, alt1name: 'Photoshop', alt2name: 'remove.bg' },
    { feature: 'No watermark on free tier', jpt: true, alt1: false, alt2: false, alt1name: 'Photoshop', alt2name: 'remove.bg' },
    { feature: 'AI image editing too', jpt: true, alt1: true, alt2: false, alt1name: 'Photoshop', alt2name: 'remove.bg' },
    { feature: 'AI upscaling too', jpt: true, alt1: true, alt2: false, alt1name: 'Photoshop', alt2name: 'remove.bg' },
    { feature: 'Works in browser', jpt: true, alt1: false, alt2: true, alt1name: 'Photoshop', alt2name: 'remove.bg' },
    { feature: 'No signup to try', jpt: true, alt1: false, alt2: true, alt1name: 'Photoshop', alt2name: 'remove.bg' },
  ],
  headshot: [
    { feature: 'AI headshot generation', jpt: true, alt1: true, alt2: true, alt1name: 'Aragon AI', alt2name: 'Canva' },
    { feature: 'Free tier available', jpt: true, alt1: false, alt2: true, alt1name: 'Aragon AI', alt2name: 'Canva' },
    { feature: 'No watermark on free tier', jpt: true, alt1: false, alt2: false, alt1name: 'Aragon AI', alt2name: 'Canva' },
    { feature: 'Background removal included', jpt: true, alt1: false, alt2: true, alt1name: 'Aragon AI', alt2name: 'Canva' },
    { feature: 'AI image editing too', jpt: true, alt1: false, alt2: true, alt1name: 'Aragon AI', alt2name: 'Canva' },
    { feature: 'Works in browser', jpt: true, alt1: true, alt2: true, alt1name: 'Aragon AI', alt2name: 'Canva' },
  ],
  'ai-editor': [
    { feature: 'Text-prompt editing', jpt: true, alt1: false, alt2: true, alt1name: 'Photoshop', alt2name: 'Adobe Firefly' },
    { feature: 'Free tier (no credit card)', jpt: true, alt1: false, alt2: true, alt1name: 'Photoshop', alt2name: 'Adobe Firefly' },
    { feature: 'No watermark on free tier', jpt: true, alt1: false, alt2: false, alt1name: 'Photoshop', alt2name: 'Adobe Firefly' },
    { feature: 'BG removal included', jpt: true, alt1: true, alt2: false, alt1name: 'Photoshop', alt2name: 'Adobe Firefly' },
    { feature: '4× AI Upscaling', jpt: true, alt1: false, alt2: false, alt1name: 'Photoshop', alt2name: 'Adobe Firefly' },
    { feature: 'Works in browser', jpt: true, alt1: false, alt2: true, alt1name: 'Photoshop', alt2name: 'Adobe Firefly' },
  ],
}

const PAGE_SEO_CONTENT: Record<string, { heading: string; body: string }[]> = {
  upscale: [
    { heading: 'What is AI image upscaling?', body: 'AI image upscaling uses deep learning super-resolution to intelligently add detail when enlarging images — unlike traditional upscaling which just stretches pixels and creates blurry results. JPT AI\'s upscaler analyses textures, edges, and patterns to reconstruct sharp, high-resolution output up to 4× the original size.' },
    { heading: 'Upscale images to 4K online for free', body: 'JPT AI lets you upscale any photo to 2× or 4× resolution directly in your browser — no software to install, no credit card required. Basic upscale is free and unlimited for everyone. Upgrade for unlimited 4K Pro AI upscaling with priority processing.' },
    { heading: 'Best for e-commerce, photography & print', body: 'Whether you\'re a seller needing high-resolution product photos, a photographer restoring old images, or a designer upscaling AI art for print — JPT AI delivers professional results in seconds. Works on portraits, products, landscapes, screenshots, and AI-generated images.' },
  ],
  'remove-bg': [
    { heading: 'What is AI background removal?', body: 'AI background removal uses deep learning image segmentation to detect and separate the subject from the background automatically — no manual selection, no magic wand tool, no green screen required. JPT AI handles people, products, objects, animals, and complex edges like hair with pixel-level precision.' },
    { heading: 'Remove background online free — no watermark', body: 'JPT AI removes backgrounds instantly in your browser. The output is a full-resolution transparent PNG — no watermarks, no quality degradation, free to use. Perfect for e-commerce product photos, LinkedIn headshots, YouTube thumbnails, and marketing materials.' },
    { heading: 'The best remove.bg alternative for India', body: 'Unlike remove.bg, JPT AI gives you an all-in-one toolkit: remove backgrounds AND upscale, edit with AI prompts, generate new backgrounds, and resize — all in one place, with pricing in INR and no foreign card required.' },
  ],
  headshot: [
    { heading: 'What is an AI headshot generator?', body: 'An AI headshot generator uses artificial intelligence to transform casual photos into professional-looking headshots. JPT AI analyses your photo and applies professional lighting, background removal, and image enhancement to produce corporate-quality portraits without a studio session.' },
    { heading: 'Professional AI headshots for LinkedIn — free to try', body: 'LinkedIn profiles with professional headshots get 21× more profile views and 9× more connection requests. JPT AI generates LinkedIn-ready headshots in seconds — no photographer, no studio, no expensive session. Free credits included when you sign up.' },
    { heading: 'AI headshots for companies and teams', body: 'Get consistent, professional headshots for your entire team without booking a studio. JPT AI delivers uniform lighting and style across all photos — ideal for company websites, directories, and corporate materials. Process multiple team members quickly with batch uploads.' },
  ],
  'ai-editor': [
    { heading: 'Edit photos with text prompts — no Photoshop needed', body: 'JPT AI lets you describe any edit in plain English and applies it instantly. "Change the background to a sunset", "add soft studio lighting", "make it look cinematic" — no design skills, no complex tools, no learning curve. Just type and transform.' },
    { heading: 'The best AI photo editor online free', body: 'Unlike Photoshop or Adobe Firefly, JPT AI is free to start with no credit card required. Edit images in your browser — remove backgrounds, generate new backgrounds, apply styles, and upscale quality all in one tool. No watermarks on free tier.' },
    { heading: 'AI image editing for e-commerce and marketing', body: 'Create professional product photos, ad creatives, and social media visuals in minutes. Change backgrounds, adjust lighting, apply brand styles, and generate consistent imagery at scale — without a designer or agency. Perfect for Shopify, Amazon, Instagram, and paid ads.' },
  ],
}

// Gradient hero image previews per page
const PAGE_VISUALS: Record<string, { before: string; after: string; label: string }> = {
  upscale: {
    before: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
    after: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
    label: 'Enhanced Resolution',
  },
  'remove-bg': {
    before: 'linear-gradient(135deg, #fde68a 0%, #fca5a5 100%)',
    after: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
    label: 'Clean Cutout',
  },
  headshot: {
    before: 'linear-gradient(135deg, #d1fae5 0%, #6ee7b7 100%)',
    after: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
    label: 'Pro Headshot',
  },
  'ai-editor': {
    before: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)',
    after: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
    label: 'AI Edited',
  },
}

export default function LandingPage({ config, toolHref, pageId }: LandingPageProps) {
  const visual = PAGE_VISUALS[pageId] ?? PAGE_VISUALS['upscale']
  const heroImg = PAGE_IMAGES[pageId]
  const beforeAfter = PAGE_BEFORE_AFTER[pageId]
  const fileRef = useRef<HTMLInputElement>(null)

  const editorTool = PAGE_TOOL[pageId]

  const handleUploadAndRedirect = async (file: File) => {
    if (!file.type.startsWith('image/')) return
    if (editorTool) {
      const dataUrl = await readFileAsDataUrl(file)
      try {
        sessionStorage.setItem('jpt_pending_image', dataUrl)
        sessionStorage.setItem('jpt_pending_tool', editorTool)
      } catch {}
      window.location.href = `/editor?tool=${editorTool}`
    } else {
      // headshot — just navigate, the headshot page has its own upload
      window.location.href = toolHref
    }
  }

  const handleCTAClick = () => {
    if (editorTool) {
      fileRef.current?.click()
    } else {
      window.location.href = toolHref
    }
  }

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', color: '#111827', background: '#fff' }}>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section style={{ background: 'linear-gradient(160deg, #F5F5FF 0%, #fff 50%, #F0FDF4 100%)', padding: '80px 24px 72px', textAlign: 'center' }}>
        <div style={{ maxWidth: 780, margin: '0 auto' }}>
          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#EEF2FF', color: '#6366F1', fontWeight: 700, fontSize: 12, borderRadius: 20, padding: '6px 14px', marginBottom: 28, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            ✦ JPT AI
          </div>

          <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.6rem)', fontWeight: 900, color: '#0F172A', lineHeight: 1.1, letterSpacing: '-0.03em', margin: '0 0 20px' }}>
            {config.h1}
          </h1>
          <p style={{ fontSize: 'clamp(1rem, 2vw, 1.2rem)', color: '#4B5563', lineHeight: 1.7, maxWidth: 560, margin: '0 auto 36px' }}>
            {config.subtitle}
          </p>

          {/* Hidden file input for upload-then-redirect */}
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadAndRedirect(f); e.target.value = ''; }} />

          <button
            onClick={handleCTAClick}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: '#fff', fontWeight: 800, fontSize: 16, padding: '16px 36px', borderRadius: 14, border: 'none', cursor: 'pointer', boxShadow: '0 8px 30px rgba(99,102,241,0.4)', letterSpacing: '-0.01em' }}
          >
            {editorTool ? '📂 ' : ''}{config.cta_text || 'Try It Free'} →
          </button>
          <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 12 }}>
            {editorTool ? 'Upload an image to get started · No credit card required' : 'No credit card required · 5 free trials included'}
          </div>
        </div>

        {/* Showcase visual — before/after split, single image, or gradient fallback */}
        {beforeAfter ? (
          <div style={{ maxWidth: 820, margin: '56px auto 0', borderRadius: 24, overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.16)', display: 'flex', position: 'relative' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={beforeAfter.before} alt="Before upscaling — low resolution" style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(1.5px)', imageRendering: 'pixelated' }} />
              <span style={{ position: 'absolute', bottom: 14, left: 14, padding: '6px 14px', background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', borderRadius: 8 }}>Low-Res Input</span>
            </div>
            <div style={{ width: 3, background: '#fff', flexShrink: 0 }} />
            <div style={{ flex: 1, position: 'relative' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={beforeAfter.after} alt="After upscaling — HD enhanced" style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }} />
              <span style={{ position: 'absolute', bottom: 14, right: 14, padding: '6px 14px', background: 'rgba(99,102,241,0.92)', color: '#fff', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', borderRadius: 8 }}>✨ 4K AI Upscaled</span>
            </div>
          </div>
        ) : heroImg ? (
          <div style={{ maxWidth: 900, margin: '56px auto 0', borderRadius: 24, overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.16)', position: 'relative' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={heroImg} alt={`${visual.label} example`} style={{ display: 'block', width: '100%', height: 'auto' }} />
            <span style={{ position: 'absolute', bottom: 16, right: 16, padding: '8px 16px', background: 'rgba(99,102,241,0.92)', color: '#fff', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>✨ {visual.label}</span>
          </div>
        ) : (
          <div style={{ maxWidth: 820, margin: '56px auto 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, borderRadius: 24, overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.12)' }}>
            <div style={{ position: 'relative', height: 280, background: visual.before, display: 'flex', alignItems: 'flex-end' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.04)' }} />
              <div style={{ width: '100%', height: '100%', backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 8px)', position: 'absolute' }} />
              <span style={{ position: 'relative', padding: '10px 16px', background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', borderTopRightRadius: 10 }}>Original</span>
            </div>
            <div style={{ position: 'relative', height: 280, background: visual.after, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 30% 40%, rgba(255,255,255,0.18) 0%, transparent 60%)' }} />
              <span style={{ position: 'relative', padding: '10px 16px', background: 'rgba(99,102,241,0.85)', color: '#fff', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', borderTopLeftRadius: 10 }}>✨ {visual.label}</span>
            </div>
          </div>
        )}
      </section>

      {/* ── PRODUCT HIGHLIGHTS BAR ───────────────────────────────────────── */}
      <section style={{ background: '#0F172A', padding: '20px 24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 16 }}>
          {({
            upscale: [
              { icon: '🔍', label: '2× & 4× Super-Resolution' },
              { icon: '✨', label: 'AI Sharpening & Detail Recovery' },
              { icon: '🖼️', label: 'Restore Old & Blurry Photos' },
              { icon: '📤', label: 'No Watermark on Download' },
              { icon: '⚡', label: 'Results in Seconds' },
            ],
            'remove-bg': [
              { icon: '🪄', label: 'One-Click Background Removal' },
              { icon: '👤', label: 'Perfect Hair & Edge Detection' },
              { icon: '🛍️', label: 'White or Custom Backgrounds' },
              { icon: '📤', label: 'Transparent PNG Export' },
              { icon: '⚡', label: 'No Photoshop Needed' },
            ],
            headshot: [
              { icon: '💼', label: 'LinkedIn-Ready Headshots' },
              { icon: '🎨', label: 'Multiple Professional Styles' },
              { icon: '📸', label: 'High-Resolution Output' },
              { icon: '📤', label: 'No Watermark on Download' },
              { icon: '⚡', label: 'Ready in Seconds' },
            ],
            'ai-editor': [
              { icon: '✍️', label: 'Edit with Plain English Prompts' },
              { icon: '🌅', label: 'AI Background Generation' },
              { icon: '🎨', label: 'Style & Lighting Transfer' },
              { icon: '📤', label: 'No Watermark on Download' },
              { icon: '⚡', label: 'No Photoshop Skills Needed' },
            ],
          } as Record<string, { icon: string; label: string }[]>)[pageId]?.map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#CBD5E1', whiteSpace: 'nowrap' }}>{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      {config.features?.length > 0 && (
        <section style={{ padding: '88px 24px', background: '#fff' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#6366F1', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Features</div>
              <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>Everything you need, nothing you don&apos;t</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
              {config.features.map((f, i) => (
                <div key={i} style={{ background: '#F9FAFB', border: '1.5px solid #F3F4F6', borderRadius: 20, padding: '28px 24px', transition: 'transform 0.2s, box-shadow 0.2s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 32px rgba(99,102,241,0.12)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}>
                  <div style={{ width: 52, height: 52, background: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 16 }}>{f.icon}</div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: '0 0 8px' }}>{f.title}</h3>
                  <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section style={{ padding: '88px 24px', background: 'linear-gradient(160deg, #F5F5FF 0%, #EEF2FF 100%)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#6366F1', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>How It Works</div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>Three steps, seconds to complete</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 32, position: 'relative' }}>
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.step} style={{ textAlign: 'center', position: 'relative' }}>
                {i < HOW_IT_WORKS.length - 1 && (
                  <div style={{ display: 'none' /* hidden on mobile */ }} />
                )}
                <div style={{ width: 72, height: 72, background: '#fff', border: '2px solid #E0E7FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 4px 20px rgba(99,102,241,0.12)' }}>
                  <span style={{ fontSize: 22, fontWeight: 900, color: '#6366F1', fontVariantNumeric: 'tabular-nums' }}>{step.step}</span>
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#111827', margin: '0 0 10px' }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.7, margin: 0 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── UPLOAD CTA SECTION ───────────────────────────────────────────── */}
      <section style={{ padding: '88px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ background: '#0F172A', borderRadius: 28, padding: '56px 48px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -60, right: -60, width: 240, height: 240, background: 'radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: -40, left: -40, width: 180, height: 180, background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(99,102,241,0.25)', color: '#A5B4FC', fontWeight: 700, fontSize: 12, borderRadius: 20, padding: '6px 14px', marginBottom: 20, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Free to try</div>
              <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 900, color: '#fff', margin: '0 0 14px', letterSpacing: '-0.02em' }}>
                Ready to transform your images?
              </h2>
              <p style={{ fontSize: 16, color: '#94A3B8', margin: '0 0 32px' }}>No credit card required. 5 free trials when you sign up.</p>
              <a
                href={toolHref}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: '#fff', fontWeight: 800, fontSize: 16, padding: '16px 40px', borderRadius: 14, textDecoration: 'none', boxShadow: '0 8px 30px rgba(99,102,241,0.5)' }}
              >
                {config.cta_text || 'Try It Free'} →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Use Cases ────────────────────────────────────────────────────── */}
      {PAGE_USE_CASES[pageId] && (
        <section style={{ padding: '80px 24px', background: '#fff' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#6366F1', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Use Cases</div>
              <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>Built for every creative workflow</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
              {PAGE_USE_CASES[pageId].map(u => (
                <div key={u.title} style={{ background: '#F7F8FC', borderRadius: 16, padding: '24px 22px', border: '1px solid #EAECF0' }}>
                  <div style={{ fontSize: 28, marginBottom: 10 }}>{u.icon}</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#111827', marginBottom: 6 }}>{u.title}</div>
                  {u.stat && (
                    <div style={{ display: 'inline-block', background: '#EEF2FF', color: '#6366F1', fontSize: 11, fontWeight: 800, borderRadius: 20, padding: '3px 10px', marginBottom: 8 }}>📈 {u.stat}</div>
                  )}
                  <p style={{ margin: 0, fontSize: 13, color: '#6B7280', lineHeight: 1.65 }}>{u.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      {PAGE_TESTIMONIALS[pageId] && (
        <section style={{ padding: '80px 24px', background: 'linear-gradient(160deg, #F5F5FF 0%, #EEF2FF 100%)' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#6366F1', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Testimonials</div>
              <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>Loved by creators & businesses</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
              {PAGE_TESTIMONIALS[pageId].map(t => (
                <div key={t.name} style={{ background: '#fff', borderRadius: 16, padding: '24px 22px', border: '1px solid #E5E7EF', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', gap: 3, marginBottom: 14 }}>
                    {Array.from({ length: t.stars }).map((_, i) => <span key={i} style={{ color: '#F59E0B', fontSize: 16 }}>★</span>)}
                  </div>
                  <p style={{ margin: '0 0 18px', fontSize: 14, color: '#374151', lineHeight: 1.7, fontStyle: 'italic' }}>&ldquo;{t.quote}&rdquo;</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: '#fff', fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t.avatar}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#111' }}>{t.name}</div>
                      <div style={{ fontSize: 12, color: '#6B7280' }}>{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Comparison Table ─────────────────────────────────────────────── */}
      {PAGE_COMPARISON[pageId] && (() => {
        const rows = PAGE_COMPARISON[pageId]
        const alt1 = rows[0].alt1name
        const alt2 = rows[0].alt2name
        return (
          <section style={{ padding: '80px 24px', background: '#fff' }}>
            <div style={{ maxWidth: 860, margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: 48 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#6366F1', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Comparison</div>
                <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 900, color: '#0F172A', margin: '0 0 12px', letterSpacing: '-0.02em' }}>JPT AI vs the alternatives</h2>
                <p style={{ fontSize: 16, color: '#6B7280', margin: 0 }}>One tool. Everything included. No hidden paywalls.</p>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #E5E7EB' }}>
                      <th style={{ textAlign: 'left', padding: '12px 16px', color: '#6B7280', fontWeight: 700, fontSize: 13 }}>Feature</th>
                      <th style={{ textAlign: 'center', padding: '12px 16px', color: '#6366F1', fontWeight: 900, fontSize: 13, background: '#EEF2FF' }}>✦ JPT AI</th>
                      <th style={{ textAlign: 'center', padding: '12px 16px', color: '#6B7280', fontWeight: 700, fontSize: 13 }}>{alt1}</th>
                      <th style={{ textAlign: 'center', padding: '12px 16px', color: '#6B7280', fontWeight: 700, fontSize: 13 }}>{alt2}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={row.feature} style={{ borderBottom: '1px solid #F3F4F6', background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                        <td style={{ padding: '12px 16px', color: '#374151', fontWeight: 500 }}>{row.feature}</td>
                        <td style={{ textAlign: 'center', padding: '12px 16px', background: '#EEF2FF' }}>
                          <span style={{ color: row.jpt ? '#10B981' : '#EF4444', fontSize: 18, fontWeight: 900 }}>{row.jpt ? '✓' : '✗'}</span>
                        </td>
                        <td style={{ textAlign: 'center', padding: '12px 16px' }}>
                          <span style={{ color: row.alt1 ? '#10B981' : '#EF4444', fontSize: 18, fontWeight: 900 }}>{row.alt1 ? '✓' : '✗'}</span>
                        </td>
                        <td style={{ textAlign: 'center', padding: '12px 16px' }}>
                          <span style={{ color: row.alt2 ? '#10B981' : '#EF4444', fontSize: 18, fontWeight: 900 }}>{row.alt2 ? '✓' : '✗'}</span>
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

      {/* ── SEO Content ──────────────────────────────────────────────────── */}
      {PAGE_SEO_CONTENT[pageId] && (
        <section style={{ padding: '80px 24px', background: '#F9FAFB' }}>
          <div style={{ maxWidth: 860, margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 36, fontSize: 15, color: '#4B5563', lineHeight: 1.8 }}>
              {PAGE_SEO_CONTENT[pageId].map(block => (
                <div key={block.heading}>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: '#111827', marginBottom: 10, marginTop: 0 }}>{block.heading}</h3>
                  <p style={{ margin: 0 }}>{block.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      {config.faq?.length > 0 && (
        <section style={{ padding: '0 24px 88px', background: '#fff' }}>
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#6366F1', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>FAQ</div>
              <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.2rem)', fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>Frequently Asked Questions</h2>
            </div>
            <FAQAccordion faqs={config.faq} />
          </div>
        </section>
      )}

    </div>
  )
}

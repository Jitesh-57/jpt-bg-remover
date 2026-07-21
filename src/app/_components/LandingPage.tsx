'use client'

import { useRef, useState, useEffect, DragEvent } from 'react'
import FAQAccordion from './FAQAccordion'
import { PageSEO } from '@/lib/page-config'
import { PAGE_IMAGES, PAGE_BEFORE_AFTER } from '@/lib/landing-images'

interface LandingPageProps {
  config: PageSEO
  toolHref: string
  pageId: string
  isHome?: boolean
}

const SITE_BASE = 'https://www.sjpt.io'

// Map pageId → editor tool id (matches editor's Tool type)
const PAGE_TOOL: Record<string, string> = {
  'remove-bg': 'remove-bg',
  upscale: 'upscale',
  'ai-editor': 'ai-edit',
  'compress-image': 'compress',
  'convert-image': 'convert',
  'crop-image': 'crop',
  'rotate-image': 'rotate',
  'image-to-pdf': 'pdf',
  'watermark-image': 'watermark',
  'meme-generator': 'meme',
}

// Free, online tools — used for the "More free tools" cross-link hub.
const FREE_TOOL_LINKS: { id: string; icon: string; title: string; href: string }[] = [
  { id: 'upscale', icon: '🔍', title: 'Image Upscaler', href: '/upscale' },
  { id: 'compress-image', icon: '🗜️', title: 'Image Compressor', href: '/compress-image' },
  { id: 'convert-image', icon: '🔀', title: 'Image Converter', href: '/convert-image' },
  { id: 'crop-image', icon: '✂️', title: 'Crop Image', href: '/crop-image' },
  { id: 'rotate-image', icon: '🔄', title: 'Rotate & Flip', href: '/rotate-image' },
  { id: 'watermark-image', icon: '🔖', title: 'Add Watermark', href: '/watermark-image' },
  { id: 'meme-generator', icon: '😂', title: 'Meme Generator', href: '/meme-generator' },
  { id: 'image-to-pdf', icon: '📄', title: 'Image to PDF', href: '/image-to-pdf' },
]

// Per-tool floating hero decorations. Two "cards" (left + right) that theme
// each page — either a colored file badge (text) or a white icon card (emoji).
type DecoBadge = { text?: string; emoji?: string; color?: string; bg?: string }
const FILE_BLUE = { color: '#2563EB', bg: 'linear-gradient(135deg,#DBEAFE,#BFDBFE)' }
const FILE_GREEN = { color: '#16A34A', bg: 'linear-gradient(135deg,#DCFCE7,#BBF7D0)' }
const FILE_AMBER = { color: '#D97706', bg: 'linear-gradient(135deg,#FEF3C7,#FDE68A)' }
const FILE_VIOLET = { color: '#7C3AED', bg: 'linear-gradient(135deg,#EDE9FE,#DDD6FE)' }
const FILE_RED = { color: '#DC2626', bg: 'linear-gradient(135deg,#FEE2E2,#FECACA)' }

const PAGE_DECOR: Record<string, [DecoBadge, DecoBadge]> = {
  upscale: [{ text: 'HD', ...FILE_BLUE }, { text: '4K', ...FILE_VIOLET }],
  'remove-bg': [{ emoji: '🪄' }, { emoji: '✂️' }],
  headshot: [{ emoji: '💼' }, { emoji: '📸' }],
  'ai-editor': [{ emoji: '✍️' }, { emoji: '🎨' }],
  'compress-image': [{ text: 'KB', ...FILE_BLUE }, { emoji: '🗜️' }],
  'convert-image': [{ text: 'PNG', ...FILE_GREEN }, { text: 'WEBP', ...FILE_AMBER }],
  'crop-image': [{ emoji: '✂️' }, { text: '1:1', ...FILE_BLUE }],
  'rotate-image': [{ emoji: '🔄' }, { emoji: '🪞' }],
  'watermark-image': [{ emoji: '🔖' }, { text: '©', ...FILE_VIOLET }],
  'meme-generator': [{ emoji: '😂' }, { emoji: '💬' }],
  'image-to-pdf': [{ text: 'PDF', ...FILE_RED }, { emoji: '🖼️' }],
}
const DEFAULT_DECOR: [DecoBadge, DecoBadge] = [{ text: 'JPG', ...FILE_BLUE }, { text: 'PNG', ...FILE_GREEN }]

function DecoCard({ badge }: { badge: DecoBadge }) {
  if (badge.emoji) {
    return (
      <div style={{ width: 60, height: 60, borderRadius: 16, background: '#fff', boxShadow: '0 8px 24px rgba(99,102,241,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>
        {badge.emoji}
      </div>
    )
  }
  return (
    <div style={{ width: 58, height: 72, borderRadius: 10, background: badge.bg, boxShadow: '0 8px 24px rgba(0,0,0,0.14)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 8 }}>
      <span style={{ fontSize: 11, fontWeight: 800, color: badge.color }}>{badge.text}</span>
    </div>
  )
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
  { step: '02', title: 'Process Instantly', desc: 'Advanced online image processing transforms your photo in seconds — nothing is uploaded to a server.' },
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
  'compress-image': [
    { icon: '🌐', title: 'Faster Websites', stat: 'Better Core Web Vitals', desc: 'Smaller images load quicker, improving page speed and SEO. Compress hero images and thumbnails before uploading.' },
    { icon: '📧', title: 'Email Attachments', desc: 'Get photos under email size limits without emailing a blurry mess. Compress to a few hundred KB in seconds.' },
    { icon: '📱', title: 'App & Form Uploads', desc: 'Meet strict upload size limits on government portals, job sites, and apps that reject large files.' },
    { icon: '💾', title: 'Save Storage', desc: 'Shrink an entire photo library to reclaim space on your phone, drive, or cloud storage.' },
  ],
  'convert-image': [
    { icon: '🪟', title: 'Need Transparency', desc: 'Convert JPG to PNG when you need a transparent background for logos, stickers, or overlays.' },
    { icon: '📉', title: 'Smaller Files', desc: 'Convert PNG to JPG or WEBP to cut file size dramatically for web pages and email.' },
    { icon: '🧩', title: 'App Compatibility', desc: 'Some apps and platforms only accept certain formats. Convert to exactly what they require.' },
    { icon: '⚡', title: 'Modern Web Format', desc: 'Convert to WEBP for the best quality-to-size ratio on fast-loading websites.' },
  ],
  'crop-image': [
    { icon: '📸', title: 'Instagram & Reels', desc: 'One-tap crops for square posts (1:1), tall posts (4:5), and Stories/Reels (9:16).' },
    { icon: '▶️', title: 'YouTube Thumbnails', desc: 'Crop to a clean 16:9 so your thumbnail fills the frame with no awkward bars.' },
    { icon: '⭕', title: 'Profile Pictures', desc: 'Make a perfect round avatar with the circle crop for social profiles and team pages.' },
    { icon: '🖼️', title: 'Prints & Frames', desc: 'Crop to classic photo ratios like 3:2 so prints fit standard frame sizes.' },
  ],
  'rotate-image': [
    { icon: '📱', title: 'Fix Sideways Photos', desc: 'Phone photos that uploaded rotated? Straighten them with a 90° turn in one tap.' },
    { icon: '🪞', title: 'Mirror Selfies', desc: 'Flip selfies horizontally so text reads correctly or the framing feels natural.' },
    { icon: '🎨', title: 'Creative Effects', desc: 'Flip and rotate for reflections, symmetry, and layout experiments.' },
    { icon: '📄', title: 'Scanned Documents', desc: 'Turn upside-down or sideways scans the right way up before sharing.' },
  ],
  'image-to-pdf': [
    { icon: '📑', title: 'Documents & Forms', desc: 'Turn a photo of a form, ID, or receipt into a PDF that portals and offices accept.' },
    { icon: '📚', title: 'Share & Archive', desc: 'PDFs are universal and easy to store — perfect for keeping records tidy.' },
    { icon: '🖨️', title: 'Easy Printing', desc: 'A PDF prints predictably at the right size, unlike loose image files.' },
    { icon: '📤', title: 'Professional Sending', desc: 'Send a clean PDF instead of a raw photo when it needs to look official.' },
  ],
  'watermark-image': [
    { icon: '📸', title: 'Photographers', desc: 'Stamp your name across proofs and previews before sharing with clients.' },
    { icon: '🛍️', title: 'Online Sellers', desc: 'Brand product photos so competitors cannot reuse them on other listings.' },
    { icon: '©️', title: 'Copyright Protection', desc: 'Add a © notice to protect artwork, designs, and original photos online.' },
    { icon: '📦', title: 'Bulk Branding', desc: 'Watermark a whole batch of up to 100 images with one consistent mark.' },
  ],
  'meme-generator': [
    { icon: '📱', title: 'Social Media', desc: 'Whip up memes for Instagram, WhatsApp, X, and Reddit in seconds.' },
    { icon: '💬', title: 'Group Chats', desc: 'Caption a photo and drop the perfect reaction meme into any chat.' },
    { icon: '🎯', title: 'Marketing', desc: 'Meme marketing gets shares — brand-friendly, on-trend, and free to make.' },
    { icon: '😄', title: 'Just for Fun', desc: 'Turn any picture into a classic top/bottom-text meme instantly.' },
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
    { feature: 'Works online', jpt: true, alt1: false, alt2: true, alt1name: 'Photoshop', alt2name: "Let's Enhance" },
    { feature: 'AI editing + BG removal too', jpt: true, alt1: true, alt2: false, alt1name: 'Photoshop', alt2name: "Let's Enhance" },
    { feature: 'No signup to try', jpt: true, alt1: false, alt2: false, alt1name: 'Photoshop', alt2name: "Let's Enhance" },
  ],
  'remove-bg': [
    { feature: 'Free tier (no credit card)', jpt: true, alt1: false, alt2: true, alt1name: 'Photoshop', alt2name: 'remove.bg' },
    { feature: 'No watermark on free tier', jpt: true, alt1: false, alt2: false, alt1name: 'Photoshop', alt2name: 'remove.bg' },
    { feature: 'AI image editing too', jpt: true, alt1: true, alt2: false, alt1name: 'Photoshop', alt2name: 'remove.bg' },
    { feature: 'AI upscaling too', jpt: true, alt1: true, alt2: false, alt1name: 'Photoshop', alt2name: 'remove.bg' },
    { feature: 'Works online', jpt: true, alt1: false, alt2: true, alt1name: 'Photoshop', alt2name: 'remove.bg' },
    { feature: 'No signup to try', jpt: true, alt1: false, alt2: true, alt1name: 'Photoshop', alt2name: 'remove.bg' },
  ],
  headshot: [
    { feature: 'AI headshot generation', jpt: true, alt1: true, alt2: true, alt1name: 'Aragon AI', alt2name: 'Canva' },
    { feature: 'Free tier available', jpt: true, alt1: false, alt2: true, alt1name: 'Aragon AI', alt2name: 'Canva' },
    { feature: 'No watermark on free tier', jpt: true, alt1: false, alt2: false, alt1name: 'Aragon AI', alt2name: 'Canva' },
    { feature: 'Background removal included', jpt: true, alt1: false, alt2: true, alt1name: 'Aragon AI', alt2name: 'Canva' },
    { feature: 'AI image editing too', jpt: true, alt1: false, alt2: true, alt1name: 'Aragon AI', alt2name: 'Canva' },
    { feature: 'Works online', jpt: true, alt1: true, alt2: true, alt1name: 'Aragon AI', alt2name: 'Canva' },
  ],
  'ai-editor': [
    { feature: 'Text-prompt editing', jpt: true, alt1: false, alt2: true, alt1name: 'Photoshop', alt2name: 'Adobe Firefly' },
    { feature: 'Free tier (no credit card)', jpt: true, alt1: false, alt2: true, alt1name: 'Photoshop', alt2name: 'Adobe Firefly' },
    { feature: 'No watermark on free tier', jpt: true, alt1: false, alt2: false, alt1name: 'Photoshop', alt2name: 'Adobe Firefly' },
    { feature: 'BG removal included', jpt: true, alt1: true, alt2: false, alt1name: 'Photoshop', alt2name: 'Adobe Firefly' },
    { feature: '4× AI Upscaling', jpt: true, alt1: false, alt2: false, alt1name: 'Photoshop', alt2name: 'Adobe Firefly' },
    { feature: 'Works online', jpt: true, alt1: false, alt2: true, alt1name: 'Photoshop', alt2name: 'Adobe Firefly' },
  ],
}

const PAGE_SEO_CONTENT: Record<string, { heading: string; body: string }[]> = {
  upscale: [
    { heading: 'What is AI image upscaling?', body: 'AI image upscaling uses deep learning super-resolution to intelligently add detail when enlarging images — unlike traditional upscaling which just stretches pixels and creates blurry results. JPT AI\'s upscaler analyses textures, edges, and patterns to reconstruct sharp, high-resolution output up to 4× the original size.' },
    { heading: 'Upscale images to 4K online for free', body: 'JPT AI lets you upscale any photo to 2× or 4× resolution directly online — no software to install, no credit card required. Basic upscale is free and unlimited for everyone. Upgrade for unlimited 4K Pro AI upscaling with priority processing.' },
    { heading: 'Best for e-commerce, photography & print', body: 'Whether you\'re a seller needing high-resolution product photos, a photographer restoring old images, or a designer upscaling AI art for print — JPT AI delivers professional results in seconds. Works on portraits, products, landscapes, screenshots, and AI-generated images.' },
  ],
  'remove-bg': [
    { heading: 'What is AI background removal?', body: 'AI background removal uses deep learning image segmentation to detect and separate the subject from the background automatically — no manual selection, no magic wand tool, no green screen required. JPT AI handles people, products, objects, animals, and complex edges like hair with pixel-level precision.' },
    { heading: 'Remove background online free — no watermark', body: 'JPT AI removes backgrounds instantly online. The output is a full-resolution transparent PNG — no watermarks, no quality degradation, free to use. Perfect for e-commerce product photos, LinkedIn headshots, YouTube thumbnails, and marketing materials.' },
    { heading: 'The best remove.bg alternative for India', body: 'Unlike remove.bg, JPT AI gives you an all-in-one toolkit: remove backgrounds AND upscale, edit with AI prompts, generate new backgrounds, and resize — all in one place, with pricing in INR and no foreign card required.' },
  ],
  headshot: [
    { heading: 'What is an AI headshot generator?', body: 'An AI headshot generator uses artificial intelligence to transform casual photos into professional-looking headshots. JPT AI analyses your photo and applies professional lighting, background removal, and image enhancement to produce corporate-quality portraits without a studio session.' },
    { heading: 'Professional AI headshots for LinkedIn — free to try', body: 'LinkedIn profiles with professional headshots get 21× more profile views and 9× more connection requests. JPT AI generates LinkedIn-ready headshots in seconds — no photographer, no studio, no expensive session. Free credits included when you sign up.' },
    { heading: 'AI headshots for companies and teams', body: 'Get consistent, professional headshots for your entire team without booking a studio. JPT AI delivers uniform lighting and style across all photos — ideal for company websites, directories, and corporate materials. Process multiple team members quickly with batch uploads.' },
  ],
  'ai-editor': [
    { heading: 'Edit photos with text prompts — no Photoshop needed', body: 'JPT AI lets you describe any edit in plain English and applies it instantly. "Change the background to a sunset", "add soft studio lighting", "make it look cinematic" — no design skills, no complex tools, no learning curve. Just type and transform.' },
    { heading: 'The best AI photo editor online free', body: 'Unlike Photoshop or Adobe Firefly, JPT AI is free to start with no credit card required. Edit images online — remove backgrounds, generate new backgrounds, apply styles, and upscale quality all in one tool. No watermarks on free tier.' },
    { heading: 'AI image editing for e-commerce and marketing', body: 'Create professional product photos, ad creatives, and social media visuals in minutes. Change backgrounds, adjust lighting, apply brand styles, and generate consistent imagery at scale — without a designer or agency. Perfect for Shopify, Amazon, Instagram, and paid ads.' },
  ],
  'compress-image': [
    { heading: 'How to compress an image for free', body: 'JPT AI shrinks your image file size online — no upload, no sign-up, no watermark. Just drag the quality slider until the estimated size is where you want it, then download. Most photos drop to a fraction of their original size with quality loss that is almost impossible to see.' },
    { heading: 'Reduce photo size to KB without losing quality', body: 'Need a photo under 100 KB or 200 KB for a form, website, or email? Lower the quality slider and the live size read-out shows you exactly where you land. Because compression happens on your device, it is instant and completely private.' },
    { heading: 'Why compress images?', body: 'Smaller images load faster, improving your website speed and Google ranking, slip under email and upload limits, and save storage on your phone or drive. JPT AI makes it a one-slider, one-click job — free and unlimited.' },
  ],
  'convert-image': [
    { heading: 'How to convert an image format for free', body: 'Upload your image, pick JPG, PNG, or WEBP, and click convert — JPT AI does it instantly online with no watermark and no sign-up. Your file never leaves your device, so conversion is private and fast.' },
    { heading: 'JPG to PNG, PNG to JPG, and WEBP explained', body: 'Choose PNG when you need transparency or the sharpest edges for logos and graphics. Choose JPG for the smallest photo files that every app accepts. Choose WEBP for the best of both — small size with transparency support — ideal for modern, fast-loading websites.' },
    { heading: 'A free image converter that respects your privacy', body: 'Unlike many online converters, JPT AI processes everything privately on your device. No queue, no upload limits, no account — convert as many images as you like between JPG, PNG, and WEBP, completely free.' },
  ],
  'crop-image': [
    { heading: 'How to crop an image online for free', body: 'Upload your photo, choose a ready-made ratio — Square, Portrait, Story, Wide, Classic, or Circle — and JPT AI crops it instantly online. No watermark, no sign-up, and your image stays private on your device.' },
    { heading: 'Crop photos for Instagram, YouTube, and profiles', body: 'Get the exact aspect ratios each platform wants: 1:1 for Instagram feed, 4:5 for tall posts, 9:16 for Stories and Reels, and 16:9 for YouTube thumbnails. The circle crop turns any photo into a clean round profile picture with a transparent background.' },
    { heading: 'Free, unlimited, and private', body: 'Cropping only trims edges, so your image keeps full quality. Because everything runs online, there are no upload limits and no waiting — crop as many photos as you like for free.' },
  ],
  'rotate-image': [
    { heading: 'How to rotate an image online for free', body: 'Upload your photo and tap Rotate Left, Rotate Right, or 180° — JPT AI turns it instantly online. Rotation is lossless, so your image keeps its full quality. No watermark, no sign-up.' },
    { heading: 'Flip and mirror images in one click', body: 'Use Flip Horizontal to mirror a photo left-to-right (great for selfies) or Flip Vertical to mirror top-to-bottom. Perfect for fixing orientation, correcting mirrored text, or creating reflection effects.' },
    { heading: 'Fix sideways and upside-down photos', body: 'Phone photos and scanned documents often upload rotated. A quick 90° or 180° turn straightens them right away. Everything runs on your device, so it is fast, private, and free with no limits.' },
  ],
  'image-to-pdf': [
    { heading: 'How to convert an image to PDF for free', body: 'Upload a JPG, PNG, or WEBP and click Download as PDF — JPT AI builds the PDF online with no watermark and no sign-up. The page is sized to your image so it looks clean and professional.' },
    { heading: 'JPG to PDF and PNG to PDF, instantly', body: 'Turning photos into PDFs makes them easy to share, print, and archive. Forms, IDs, receipts, and notes all become tidy, universal PDF files that any device and office can open.' },
    { heading: 'Private, unlimited, and watermark-free', body: 'Because the PDF is generated privately on your device, your image never leaves your device. Convert as many images to PDF as you like — completely free, with no watermark and no account required.' },
  ],
  'watermark-image': [
    { heading: 'How to add a watermark to a photo for free', body: 'Upload your image, type your watermark text, and choose the position, size, color, and opacity. Apply and download — free, no sign-up, and the tool never stamps its own branding on your photo. Everything runs online, so your image stays private.' },
    { heading: 'Protect your photos and brand', body: 'A watermark deters people from reusing your images without credit. Add your name, studio, or © notice to proofs, product shots, and original artwork. Choose a subtle corner mark or a repeating tiled pattern for stronger protection.' },
    { heading: 'Watermark up to 100 images at once', body: 'Need to brand a whole gallery or product catalog? Open the Batch Editor, add your watermark once, and apply it to up to 100 images in a single run — consistent, fast, and free.' },
  ],
  'meme-generator': [
    { heading: 'How to make a meme for free', body: 'Upload any image, type your top and bottom captions, and click Create Meme. Your text renders in the classic bold Impact style with a black outline, then downloads instantly — free, no sign-up, no watermark.' },
    { heading: 'The classic meme look, done right', body: 'JPT AI uses uppercase Impact with a heavy outline — the format everyone recognises. Long captions wrap automatically to fit the image, so your meme always looks clean on any picture.' },
    { heading: 'Private and unlimited', body: 'Memes are generated entirely online, so your images never leave your device. Make as many as you like for Instagram, WhatsApp, X, Reddit, and group chats — completely free with no limits.' },
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
  'compress-image': {
    before: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
    after: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
    label: 'Smaller File',
  },
  'convert-image': {
    before: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
    after: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
    label: 'Converted',
  },
  'crop-image': {
    before: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
    after: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
    label: 'Cropped',
  },
  'rotate-image': {
    before: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
    after: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
    label: 'Rotated',
  },
  'image-to-pdf': {
    before: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
    after: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
    label: 'PDF Ready',
  },
  'watermark-image': {
    before: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)',
    after: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
    label: 'Watermarked',
  },
  'meme-generator': {
    before: 'linear-gradient(135deg, #fef9c3 0%, #fde68a 100%)',
    after: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
    label: 'Meme Ready',
  },
}

export default function LandingPage({ config, toolHref, pageId, isHome }: LandingPageProps) {
  // ── Structured data (rich results) ──────────────────────────────────────────
  // FAQ schema → the "People also ask"-style expandable answers in Google.
  const faqLd = config.faq?.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: config.faq.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      }
    : null
  // Breadcrumb schema → the Home › Tool trail under the search result title.
  const crumbLink = FREE_TOOL_LINKS.find((l) => l.id === pageId)
  const breadcrumbLd = !isHome && crumbLink
    ? {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_BASE },
          { '@type': 'ListItem', position: 2, name: crumbLink.title, item: `${SITE_BASE}${crumbLink.href}` },
        ],
      }
    : null

  // Two-tone H1: the last word gets a gradient fill (e.g. "Free Image Compressor").
  const h1Words = (config.h1 || '').trim().split(/\s+/)
  const h1Last = h1Words.length > 1 ? h1Words[h1Words.length - 1] : ''
  const h1First = h1Words.slice(0, h1Words.length - 1).join(' ')
  const gradientText: React.CSSProperties = {
    background: 'linear-gradient(120deg,#6366F1,#8B5CF6)',
    WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', color: 'transparent',
  }

  const decor = PAGE_DECOR[pageId] ?? DEFAULT_DECOR

  const visual = PAGE_VISUALS[pageId] ?? PAGE_VISUALS['upscale']
  const heroImg = PAGE_IMAGES[pageId]
  const beforeAfter = PAGE_BEFORE_AFTER[pageId]
  const fileRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  // Scroll-reveal: sections fade + rise into view as the user scrolls. Applied
  // generically to every <section>, so all pages using this component animate.
  // The reveal class is added by JS, so with JS off the content stays visible.
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const sections = Array.from(root.querySelectorAll('section')) as HTMLElement[]
    sections.forEach((el) => el.classList.add('jpt-reveal'))
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { e.target.classList.add('jpt-in'); io.unobserve(e.target) }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -8% 0px' }
    )
    sections.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

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
      window.location.href = toolHref
    }
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f) handleUploadAndRedirect(f)
  }

  const handleCTAClick = () => {
    if (editorTool) {
      fileRef.current?.click()
    } else {
      window.location.href = toolHref
    }
  }

  return (
    <div ref={rootRef} style={{ fontFamily: 'system-ui, -apple-system, sans-serif', color: '#111827', background: '#fff' }}>

      {/* Structured data for rich results */}
      {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />}
      {breadcrumbLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />}


      {/* Animations: floating hero decor, scroll reveal, CTA shine */}
      <style>{`
        @keyframes jptFloat { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-12px) } }
        .jpt-hero-deco { animation: jptFloat 5.5s ease-in-out infinite; }
        @media (max-width: 900px) { .jpt-hero-deco { display: none !important; } }

        /* Scroll-reveal — added to every <section> by JS. */
        .jpt-reveal { opacity: 0; transform: translateY(28px); transition: opacity .7s cubic-bezier(.16,1,.3,1), transform .7s cubic-bezier(.16,1,.3,1); will-change: opacity, transform; }
        .jpt-reveal.jpt-in { opacity: 1; transform: none; }

        /* Sweeping shine across primary CTAs. */
        @keyframes jptShine { 0% { left: -60% } 60%,100% { left: 130% } }
        .jpt-shine { position: relative; overflow: hidden; }
        .jpt-shine::after { content: ''; position: absolute; top: 0; left: -60%; width: 45%; height: 100%; background: linear-gradient(100deg, transparent, rgba(255,255,255,.45), transparent); transform: skewX(-18deg); animation: jptShine 3.6s ease-in-out infinite; pointer-events: none; }

        @media (prefers-reduced-motion: reduce) {
          .jpt-reveal { opacity: 1 !important; transform: none !important; }
          .jpt-hero-deco, .jpt-shine::after { animation: none !important; }
        }
      `}</style>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(160deg, #F5F5FF 0%, #fff 50%, #F0FDF4 100%)', padding: '80px 24px 72px', textAlign: 'center' }}>

        {/* Floating decorations — themed per tool */}
        <div className="jpt-hero-deco" style={{ position: 'absolute', left: '13%', top: 300, transform: 'rotate(-12deg)', pointerEvents: 'none' }}>
          <DecoCard badge={decor[0]} />
        </div>
        <div className="jpt-hero-deco" style={{ position: 'absolute', right: '13%', top: 330, transform: 'rotate(11deg)', animationDelay: '1.2s', pointerEvents: 'none' }}>
          <DecoCard badge={decor[1]} />
        </div>
        <div className="jpt-hero-deco" style={{ position: 'absolute', left: '20%', top: 210, fontSize: 20, color: '#C4B5FD', animationDelay: '0.6s', pointerEvents: 'none' }}>✦</div>
        <div className="jpt-hero-deco" style={{ position: 'absolute', right: '19%', top: 200, fontSize: 16, color: '#A5B4FC', animationDelay: '2s', pointerEvents: 'none' }}>✦</div>
        <div className="jpt-hero-deco" style={{ position: 'absolute', left: '17%', top: 430, width: 14, height: 14, borderRadius: '50%', border: '2px solid #C7D2FE', animationDelay: '1.6s', pointerEvents: 'none' }} />
        <div className="jpt-hero-deco" style={{ position: 'absolute', right: '22%', top: 420, width: 22, height: 22, borderRadius: '50%', border: '2px solid #BBF7D0', animationDelay: '0.9s', pointerEvents: 'none' }} />
        <div className="jpt-hero-deco" style={{ position: 'absolute', right: '15%', top: 250, fontSize: 22, color: '#8B5CF6', animationDelay: '2.4s', pointerEvents: 'none' }}>✓</div>

        <div style={{ position: 'relative', maxWidth: 780, margin: '0 auto' }}>
          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#EEF2FF', color: '#6366F1', fontWeight: 700, fontSize: 12, borderRadius: 20, padding: '6px 14px', marginBottom: 28, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            ☁️ JPT AI
          </div>

          <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.6rem)', fontWeight: 900, color: '#0F172A', lineHeight: 1.1, letterSpacing: '-0.03em', margin: '0 0 20px' }}>
            {h1Last ? (<>{h1First} <span style={gradientText}>{h1Last}</span></>) : (<span style={gradientText}>{config.h1}</span>)}
          </h1>
          <p style={{ fontSize: 'clamp(1rem, 2vw, 1.2rem)', color: '#4B5563', lineHeight: 1.7, maxWidth: 560, margin: '0 auto 36px' }}>
            {config.subtitle}
          </p>

          {/* Hidden file input */}
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadAndRedirect(f); e.target.value = '' }} />

          {editorTool ? (
            /* ── Upload box ── */
            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              style={{
                maxWidth: 540, margin: '0 auto',
                border: `2px dashed ${isDragging ? '#6366F1' : '#C4C9F0'}`,
                borderRadius: 20,
                background: isDragging ? '#EEF2FF' : '#FAFBFF',
                padding: '36px 32px 28px',
                cursor: 'pointer',
                transition: 'border-color 0.18s, background 0.18s',
                boxShadow: isDragging ? '0 0 0 4px rgba(99,102,241,0.12)' : '0 2px 24px rgba(99,102,241,0.07)',
              }}
              onClick={() => fileRef.current?.click()}
            >
              {/* Upload icon */}
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#EEF2FF,#E0E7FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24 }}>
                📤
              </div>

              <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 6 }}>
                Drop your image here
              </div>
              <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 22 }}>
                or click to browse from your device
              </div>

              <button
                className="jpt-shine"
                onClick={e => { e.stopPropagation(); fileRef.current?.click() }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff',
                  fontWeight: 800, fontSize: 15, padding: '13px 32px', borderRadius: 12,
                  border: 'none', cursor: 'pointer', boxShadow: '0 6px 22px rgba(99,102,241,0.38)',
                  letterSpacing: '-0.01em', marginBottom: 16,
                }}
              >
                + Upload Image
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 14 }}>
                <div style={{ height: 1, flex: 1, background: '#E5E7EB' }} />
                <span style={{ fontSize: 12, color: '#CBD5E1', fontWeight: 600 }}>or drop image anywhere</span>
                <div style={{ height: 1, flex: 1, background: '#E5E7EB' }} />
              </div>

              <div style={{ fontSize: 11, color: '#C4C8D4', lineHeight: 1.6 }}>
                Supports JPG · JPEG · PNG · WEBP · up to 16 MB
              </div>
              <div style={{ fontSize: 11, color: '#D1D5DB', marginTop: 10 }}>
                By uploading you agree to our{' '}
                <a href="/terms" onClick={e => e.stopPropagation()} style={{ color: '#9CA3AF', textDecoration: 'underline' }}>Terms of Use</a>
                {' '}and{' '}
                <a href="/privacy" onClick={e => e.stopPropagation()} style={{ color: '#9CA3AF', textDecoration: 'underline' }}>Privacy Policy</a>
              </div>
            </div>
          ) : (
            /* ── Regular CTA for pages without direct upload (headshot etc.) ── */
            <>
              <button
                onClick={handleCTAClick}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: '#fff', fontWeight: 800, fontSize: 16, padding: '16px 36px', borderRadius: 14, border: 'none', cursor: 'pointer', boxShadow: '0 8px 30px rgba(99,102,241,0.4)', letterSpacing: '-0.01em' }}
              >
                {config.cta_text || 'Try It Free'} →
              </button>
              <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 12 }}>
                No credit card required · 5 free trials included
              </div>
            </>
          )}
        </div>

        {/* Showcase visual — before/after split, single image, or gradient fallback */}
        {beforeAfter ? (
          <div style={{ maxWidth: 820, margin: '56px auto 0', borderRadius: 24, overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.16)', display: 'flex', position: 'relative' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={beforeAfter.before} alt={`${config.h1} — before (low resolution photo)`} style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(1.5px)', imageRendering: 'pixelated' }} />
              <span style={{ position: 'absolute', bottom: 14, left: 14, padding: '6px 14px', background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', borderRadius: 8 }}>Low-Res Input</span>
            </div>
            <div style={{ width: 3, background: '#fff', flexShrink: 0 }} />
            <div style={{ flex: 1, position: 'relative' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={beforeAfter.after} alt={`${config.h1} — after (free 4K enhanced result, no watermark)`} style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }} />
              <span style={{ position: 'absolute', bottom: 14, right: 14, padding: '6px 14px', background: 'rgba(99,102,241,0.92)', color: '#fff', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', borderRadius: 8 }}>✨ 4K AI Upscaled</span>
            </div>
          </div>
        ) : heroImg ? (
          <div style={{ position: 'relative', maxWidth: 940, margin: '56px auto 0', borderRadius: 24, overflow: 'hidden', background: '#fff', padding: 10, boxShadow: '0 24px 80px rgba(99,102,241,0.16)', border: '1px solid #EEF0FF' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={heroImg} alt={`${config.h1} — free online tool, no watermark (${visual.label})`} style={{ display: 'block', width: '100%', height: 'auto', borderRadius: 16 }} />
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

      {/* ── "PERFECT FOR" CHIP BAR ───────────────────────────────────────── */}
      <section style={{ background: '#fff', padding: '30px 24px 10px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginRight: 4 }}>Perfect for</span>
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
            'compress-image': [
              { icon: '🗜️', label: 'Reduce File Size to KB' },
              { icon: '🎚️', label: 'One-Slider Quality Control' },
              { icon: '🔒', label: 'Private — Nothing Uploaded' },
              { icon: '📤', label: 'No Watermark on Download' },
              { icon: '⚡', label: 'Instant, Unlimited & Free' },
            ],
            'convert-image': [
              { icon: '🔀', label: 'JPG · PNG · WEBP' },
              { icon: '🪟', label: 'Keeps Transparency' },
              { icon: '🔒', label: 'Private — Nothing Uploaded' },
              { icon: '📤', label: 'No Watermark on Download' },
              { icon: '⚡', label: 'Instant, Unlimited & Free' },
            ],
            'crop-image': [
              { icon: '✂️', label: 'One-Tap Social Ratios' },
              { icon: '⭕', label: 'Circle Profile Crop' },
              { icon: '🔒', label: 'Private — Nothing Uploaded' },
              { icon: '📤', label: 'No Watermark on Download' },
              { icon: '⚡', label: 'Instant, Unlimited & Free' },
            ],
            'rotate-image': [
              { icon: '🔄', label: 'Rotate 90° / 180°' },
              { icon: '🪞', label: 'Flip & Mirror' },
              { icon: '🔒', label: 'Private — Nothing Uploaded' },
              { icon: '📤', label: 'No Watermark on Download' },
              { icon: '⚡', label: 'Instant, Unlimited & Free' },
            ],
            'image-to-pdf': [
              { icon: '📄', label: 'JPG & PNG to PDF' },
              { icon: '📐', label: 'Right-Sized Pages' },
              { icon: '🔒', label: 'Private — Nothing Uploaded' },
              { icon: '📤', label: 'No Watermark on Download' },
              { icon: '⚡', label: 'Instant, Unlimited & Free' },
            ],
            'watermark-image': [
              { icon: '🔖', label: 'Custom Text Watermark' },
              { icon: '🎯', label: 'Any Position + Tiled' },
              { icon: '🎚️', label: 'Size, Color & Opacity' },
              { icon: '📦', label: 'Batch Up to 100 Images' },
              { icon: '⚡', label: 'Free — No Tool Watermark' },
            ],
            'meme-generator': [
              { icon: '😂', label: 'Classic Impact Text' },
              { icon: '⬆️', label: 'Top & Bottom Captions' },
              { icon: '↩️', label: 'Auto Text Wrap' },
              { icon: '📤', label: 'No Watermark on Download' },
              { icon: '⚡', label: 'Instant, Unlimited & Free' },
            ],
          } as Record<string, { icon: string; label: string }[]>)[pageId]?.map(item => (
            <div key={item.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#F5F6FB', border: '1px solid #EAECF5', borderRadius: 999, padding: '8px 14px' }}>
              <span style={{ fontSize: 15 }}>{item.icon}</span>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>{item.label}</span>
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
              <p style={{ fontSize: 16, color: '#94A3B8', margin: '0 0 32px' }}>100% free · No sign-up required · No watermark.</p>
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

      {/* ── More Free Tools (cross-link hub) ─────────────────────────────── */}
      {FREE_TOOL_LINKS.some(l => l.id === pageId) && (
        <section style={{ padding: '72px 24px', background: 'linear-gradient(160deg, #F5F5FF 0%, #EEF2FF 100%)' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#6366F1', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>More Free Tools</div>
              <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 900, color: '#0F172A', margin: '0 0 10px', letterSpacing: '-0.02em' }}>All your image tools in one place</h2>
              <p style={{ fontSize: 16, color: '#6B7280', margin: 0 }}>100% free · No sign-up · No watermark · No install needed</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14 }}>
              {FREE_TOOL_LINKS.filter(l => l.id !== pageId).map(l => (
                <a key={l.id} href={l.href}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #E5E7EF', borderRadius: 16, padding: '22px 16px', textDecoration: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', transition: 'transform 0.18s, box-shadow 0.18s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 8px 28px rgba(99,102,241,0.16)'; (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)'; (e.currentTarget as HTMLAnchorElement).style.transform = 'none'; }}>
                  <span style={{ fontSize: 30 }}>{l.icon}</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#111827', textAlign: 'center' }}>{l.title}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#6366F1' }}>Try free →</span>
                </a>
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

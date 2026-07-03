'use client'

import FAQAccordion from './FAQAccordion'
import InlineTool, { InlineToolType } from './InlineTool'
import { PageSEO } from '@/lib/page-config'
import { PAGE_BEFORE_AFTER } from '@/lib/landing-images'

interface LandingPageProps {
  config: PageSEO
  toolHref: string
  pageId: string
  inlineToolType?: InlineToolType
}

// Map pageId → inline tool type
const PAGE_INLINE_TOOL: Record<string, InlineToolType> = {
  upscale: 'upscale',
  'remove-bg': 'remove-bg',
  'compress-image': 'compress',
  'resize-image': 'resize',
  'convert-to-png': 'convert-png',
  'convert-to-jpg': 'convert-jpg',
}

const PAGE_BEFORE_AFTER_LABELS: Record<string, { before: string; after: string }> = {
  upscale: { before: 'Low-Res Original', after: '4× AI Upscaled' },
  'remove-bg': { before: 'With Background', after: 'Background Removed' },
  'compress-image': { before: 'Original (Large)', after: 'Compressed (Tiny)' },
  'convert-to-png': { before: 'Source Image', after: 'PNG Converted' },
  'convert-to-jpg': { before: 'Source Image', after: 'JPG Converted' },
}

const HOW_IT_WORKS = [
  { step: '01', title: 'Upload Your Image', desc: 'Drag & drop or click to select any image. JPG, PNG, WEBP — all supported. No account needed.' },
  { step: '02', title: 'AI Processes Instantly', desc: 'Our AI analyzes your image and applies the transformation in 2–5 seconds, right in your browser.' },
  { step: '03', title: 'Download Your Result', desc: 'Preview the before/after, then download in full quality — no watermark, no login required.' },
]

const PAGE_USE_CASES: Record<string, { icon: string; title: string; stat?: string; desc: string }[]> = {
  upscale: [
    { icon: '🛍️', title: 'E-commerce Product Photos', stat: '94% higher conversion', desc: 'Turn blurry product shots into crisp, retina-ready images. High-quality photos increase add-to-cart rates by up to 94%.' },
    { icon: '📸', title: 'Old Photo Restoration', desc: 'Bring faded family photos and pixelated memories back to life with AI detail recovery.' },
    { icon: '🎨', title: 'AI Art Print Quality', desc: 'Upscale AI-generated images 4× for large-format printing, posters, merchandise and canvas prints.' },
    { icon: '🖥️', title: 'Marketing & Web Assets', desc: 'Fix blurry logos, screenshots and visuals for retina displays, ads and social media posts.' },
  ],
  'remove-bg': [
    { icon: '🛍️', title: 'E-commerce Product Shots', stat: '94% higher conversion', desc: 'Create white-background product photos for Amazon, Shopify and Etsy. Professional cutouts boost sales.' },
    { icon: '💼', title: 'LinkedIn Headshots', stat: '21× more profile views', desc: 'Remove distracting backgrounds from profile photos. Clean headshots get 21× more LinkedIn views.' },
    { icon: '🎥', title: 'YouTube & Social Thumbnails', stat: '35% more clicks', desc: 'Cut out subjects for eye-catching thumbnails. Clean cutouts on bold backgrounds drive 35% more clicks.' },
    { icon: '📣', title: 'Ad Creatives & Banners', desc: 'Place products and people on any background for ads, flyers, email campaigns and presentations.' },
  ],
  headshot: [
    { icon: '💼', title: 'LinkedIn Profiles', stat: '21× more profile views', desc: 'Profiles with professional headshots get 21× more views and 9× more connection requests.' },
    { icon: '🏢', title: 'Corporate Team Pages', desc: 'Consistent, professional headshots for your company website without expensive studio sessions.' },
    { icon: '📄', title: 'Resumes & CVs', desc: 'Add a polished photo to your resume or portfolio to stand out from the competition.' },
    { icon: '🎤', title: 'Speaker Profiles & Media Kits', desc: 'Professional photos for conference bios, press releases and media kits — done in seconds.' },
  ],
  'ai-editor': [
    { icon: '🛍️', title: 'E-commerce', stat: '94% higher conversion', desc: 'Generate studio-quality backgrounds and retouch product photos for any marketplace — no photographer needed.' },
    { icon: '🎥', title: 'Content Creators', stat: '35% more shares', desc: 'Create eye-catching thumbnails, social posts and banners with plain-English AI edits.' },
    { icon: '📣', title: 'Marketing Teams', desc: 'Produce on-brand visuals at scale. Change backgrounds, adjust lighting and apply styles with a simple text prompt.' },
    { icon: '🎨', title: 'Designers', desc: 'Prototype creative directions instantly. Iterate with AI edits before committing to full production.' },
  ],
  'compress-image': [
    { icon: '🌐', title: 'Website Speed Optimization', stat: 'Google Core Web Vitals', desc: 'Compress images to improve page load speed and pass Google Core Web Vitals. Faster sites rank higher.' },
    { icon: '📧', title: 'Email Campaigns', desc: 'Reduce image file sizes so emails load fast and don\'t hit attachment limits.' },
    { icon: '📱', title: 'Mobile App Assets', desc: 'Compress images for mobile apps to reduce download sizes and improve performance.' },
    { icon: '☁️', title: 'Cloud Storage Savings', desc: 'Cut storage costs by compressing image libraries. Same quality, fraction of the file size.' },
  ],
  'convert-to-png': [
    { icon: '🎨', title: 'Transparent Backgrounds', desc: 'Convert JPG or WEBP to PNG to preserve transparency for logos, icons and overlays.' },
    { icon: '🖼️', title: 'Lossless Quality', desc: 'PNG uses lossless compression — perfect for screenshots, UI elements and text-heavy images.' },
    { icon: '💻', title: 'Web & App Design', desc: 'PNG is the standard for web design assets, favicons, and any image requiring transparent backgrounds.' },
    { icon: '📤', title: 'Universal Compatibility', desc: 'PNG files open in every operating system, design tool and browser without quality loss.' },
  ],
  'convert-to-jpg': [
    { icon: '📸', title: 'Photos & Portraits', desc: 'JPG is the universal format for photos — small file sizes, wide compatibility, perfect for sharing.' },
    { icon: '🌐', title: 'Web Images', desc: 'Convert PNG or WEBP to JPG to reduce file size for faster website loading.' },
    { icon: '📤', title: 'Email & Social Sharing', desc: 'JPG files are smaller and universally compatible — ideal for email attachments and social uploads.' },
    { icon: '🖨️', title: 'Printing', desc: 'Most print labs and photo printers require JPG format. Convert instantly at full quality.' },
  ],
}

const PAGE_TESTIMONIALS: Record<string, { name: string; role: string; avatar: string; quote: string; stars: number }[]> = {
  upscale: [
    { name: 'Marcus Johnson', role: 'E-commerce Seller, Austin TX', avatar: 'MJ', quote: 'Had hundreds of old product photos shot on a phone. After upscaling they look like studio shots. My conversion rate improved noticeably.', stars: 5 },
    { name: 'Sarah Mitchell', role: 'Photographer, New York', avatar: 'SM', quote: 'The AI preserves texture and detail unlike any other online tool. Hair, fabric, skin — it all looks natural after upscaling.', stars: 5 },
    { name: 'Derek Chen', role: 'Graphic Designer, San Francisco', avatar: 'DC', quote: 'I use it to upscale AI-generated art before printing. 4× and the results are ready for A2 poster prints. Incredible quality.', stars: 5 },
  ],
  'remove-bg': [
    { name: 'Jessica Park', role: 'E-commerce Owner, Los Angeles', avatar: 'JP', quote: 'Was spending 30 min per product photo in Photoshop. Now I process 40 images before my morning coffee. Store looks completely professional.', stars: 5 },
    { name: 'Ryan Torres', role: 'Freelance Photographer, Miami', avatar: 'RT', quote: 'Background removal on hair and fine edges is flawless. Clients can\'t tell the difference from a manual Photoshop cutout.', stars: 5 },
    { name: 'Amanda Lee', role: 'Social Media Manager, Chicago', avatar: 'AL', quote: 'Switched from remove.bg — same quality but JPT AI has all the other tools too. No watermarks, instant results. Love it.', stars: 5 },
  ],
  headshot: [
    { name: 'Tyler Brooks', role: 'Software Engineer, Seattle', avatar: 'TB', quote: 'Updated my LinkedIn with a JPT AI headshot. Got 3 recruiter messages in the same week. Looks completely professional.', stars: 5 },
    { name: 'Natalie Grant', role: 'Marketing Manager, Boston', avatar: 'NG', quote: 'Used it for our entire team\'s company page. Saved us an expensive studio session. Everyone looks consistent and polished.', stars: 5 },
    { name: 'Kevin Walsh', role: 'Freelance Consultant, Denver', avatar: 'KW', quote: 'Needed a quick headshot for a conference speaker profile. Done in 2 minutes, looked better than my old studio photo.', stars: 5 },
  ],
  'ai-editor': [
    { name: 'Olivia Barnes', role: 'Content Creator, Nashville', avatar: 'OB', quote: 'I just type what I want — "add a sunset background", "make it cinematic" — and it\'s done. No Photoshop skills needed at all.', stars: 5 },
    { name: 'Chris Morgan', role: 'Digital Marketer, Phoenix', avatar: 'CM', quote: 'Changed 50 product backgrounds for a campaign in one afternoon. What used to take a design agency 3 days now takes me hours.', stars: 5 },
    { name: 'Lauren Kim', role: 'Graphic Designer, Portland', avatar: 'LK', quote: 'Perfect for rapid prototyping. I try 10 different styles with AI prompts before committing to a direction. Massive time saver.', stars: 5 },
  ],
  'compress-image': [
    { name: 'David Wilson', role: 'Web Developer, Austin', avatar: 'DW', quote: 'Cut my homepage image sizes by 70% without any visible quality loss. My Core Web Vitals score jumped 18 points.', stars: 5 },
    { name: 'Emma Davis', role: 'Blogger, Seattle', avatar: 'ED', quote: 'Finally a free image compressor that doesn\'t add a watermark. My blog loads 3× faster now. Google loves it.', stars: 5 },
    { name: 'James Taylor', role: 'Shopify Developer, Atlanta', avatar: 'JT', quote: 'Compressed an entire product catalog in minutes. Page load dropped from 4.2s to 1.8s. Client is thrilled.', stars: 5 },
  ],
  'convert-to-png': [
    { name: 'Sophie Anderson', role: 'UI/UX Designer, San Francisco', avatar: 'SA', quote: 'Super fast PNG conversion that actually preserves transparency. No more hunting for conversion tools that strip alpha channels.', stars: 5 },
    { name: 'Michael Brown', role: 'Frontend Developer, Austin', avatar: 'MB', quote: 'Converts to PNG instantly, no upload limits, no watermark. Exactly what I needed for converting design exports.', stars: 5 },
    { name: 'Rachel Green', role: 'Graphic Designer, New York', avatar: 'RG', quote: 'Clean, fast, free. The PNG quality is excellent — perfect for logos and icons with transparent backgrounds.', stars: 5 },
  ],
  'convert-to-jpg': [
    { name: 'Alex Carter', role: 'Photographer, Denver', avatar: 'AC', quote: 'Converts PNG screenshots to JPG instantly for email. File size drops from 4MB to 180KB — perfect for client sends.', stars: 5 },
    { name: 'Megan Hill', role: 'Social Media Manager, Dallas', avatar: 'MH', quote: 'So easy. Upload, convert, download. My WEBP images are now JPG and work everywhere I need them.', stars: 5 },
    { name: 'Brandon Lee', role: 'E-commerce Seller, Chicago', avatar: 'BL', quote: 'Finally a converter that doesn\'t ruin quality. My product photos look great after converting to JPG.', stars: 5 },
  ],
}

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
  headshot: [
    { feature: 'AI headshot generation', jpt: true, alt1: true, alt2: true, alt1name: 'Aragon AI', alt2name: 'Canva' },
    { feature: 'Free tier available', jpt: true, alt1: false, alt2: true, alt1name: 'Aragon AI', alt2name: 'Canva' },
    { feature: 'No watermark on free tier', jpt: true, alt1: false, alt2: false, alt1name: 'Aragon AI', alt2name: 'Canva' },
    { feature: 'BG removal included', jpt: true, alt1: false, alt2: true, alt1name: 'Aragon AI', alt2name: 'Canva' },
    { feature: 'AI image editing included', jpt: true, alt1: false, alt2: true, alt1name: 'Aragon AI', alt2name: 'Canva' },
    { feature: 'Works in browser', jpt: true, alt1: true, alt2: true, alt1name: 'Aragon AI', alt2name: 'Canva' },
  ],
  'ai-editor': [
    { feature: 'Text-prompt AI editing', jpt: true, alt1: false, alt2: true, alt1name: 'Photoshop', alt2name: 'Adobe Firefly' },
    { feature: 'Free tier (no credit card)', jpt: true, alt1: false, alt2: true, alt1name: 'Photoshop', alt2name: 'Adobe Firefly' },
    { feature: 'No watermark on free tier', jpt: true, alt1: false, alt2: false, alt1name: 'Photoshop', alt2name: 'Adobe Firefly' },
    { feature: 'BG removal included', jpt: true, alt1: true, alt2: false, alt1name: 'Photoshop', alt2name: 'Adobe Firefly' },
    { feature: '4× AI Upscaling included', jpt: true, alt1: false, alt2: false, alt1name: 'Photoshop', alt2name: 'Adobe Firefly' },
    { feature: 'Works in browser', jpt: true, alt1: false, alt2: true, alt1name: 'Photoshop', alt2name: 'Adobe Firefly' },
  ],
  'compress-image': [
    { feature: 'Free (no credit card)', jpt: true, alt1: true, alt2: false, alt1name: 'TinyPNG', alt2name: 'Squoosh Pro' },
    { feature: 'No watermark', jpt: true, alt1: true, alt2: true, alt1name: 'TinyPNG', alt2name: 'Squoosh Pro' },
    { feature: 'AI upscaling too', jpt: true, alt1: false, alt2: false, alt1name: 'TinyPNG', alt2name: 'Squoosh Pro' },
    { feature: 'BG removal too', jpt: true, alt1: false, alt2: false, alt1name: 'TinyPNG', alt2name: 'Squoosh Pro' },
    { feature: 'Works in browser', jpt: true, alt1: true, alt2: true, alt1name: 'TinyPNG', alt2name: 'Squoosh Pro' },
    { feature: 'No signup needed', jpt: true, alt1: true, alt2: false, alt1name: 'TinyPNG', alt2name: 'Squoosh Pro' },
  ],
  'convert-to-png': [
    { feature: 'Free (no credit card)', jpt: true, alt1: true, alt2: false, alt1name: 'Convertio', alt2name: 'CloudConvert' },
    { feature: 'No watermark', jpt: true, alt1: true, alt2: true, alt1name: 'Convertio', alt2name: 'CloudConvert' },
    { feature: 'Preserves transparency', jpt: true, alt1: true, alt2: true, alt1name: 'Convertio', alt2name: 'CloudConvert' },
    { feature: 'AI upscaling too', jpt: true, alt1: false, alt2: false, alt1name: 'Convertio', alt2name: 'CloudConvert' },
    { feature: 'No file upload limit', jpt: true, alt1: false, alt2: false, alt1name: 'Convertio', alt2name: 'CloudConvert' },
    { feature: 'No signup needed', jpt: true, alt1: false, alt2: false, alt1name: 'Convertio', alt2name: 'CloudConvert' },
  ],
  'convert-to-jpg': [
    { feature: 'Free (no credit card)', jpt: true, alt1: true, alt2: false, alt1name: 'Convertio', alt2name: 'CloudConvert' },
    { feature: 'No watermark', jpt: true, alt1: true, alt2: true, alt1name: 'Convertio', alt2name: 'CloudConvert' },
    { feature: 'Quality control slider', jpt: true, alt1: false, alt2: true, alt1name: 'Convertio', alt2name: 'CloudConvert' },
    { feature: 'AI upscaling too', jpt: true, alt1: false, alt2: false, alt1name: 'Convertio', alt2name: 'CloudConvert' },
    { feature: 'No file upload limit', jpt: true, alt1: false, alt2: false, alt1name: 'Convertio', alt2name: 'CloudConvert' },
    { feature: 'No signup needed', jpt: true, alt1: false, alt2: false, alt1name: 'Convertio', alt2name: 'CloudConvert' },
  ],
}

const PAGE_SEO_CONTENT: Record<string, { heading: string; body: string }[]> = {
  upscale: [
    { heading: 'What is AI image upscaling?', body: 'AI image upscaling uses deep learning super-resolution to intelligently reconstruct detail when enlarging images — unlike traditional upscaling which just stretches pixels and creates blurry results. JPT AI\'s upscaler analyzes textures, edges, and fine patterns to produce sharp, high-resolution output up to 4× the original size.' },
    { heading: 'Upscale images to 4K free online', body: 'JPT AI lets you upscale any photo to 2× or 4× resolution directly in your browser — no software to install, no credit card required. Process images instantly for e-commerce, print, social media, and professional use.' },
    { heading: 'Best for e-commerce, print & photography', body: 'Whether you\'re a seller needing retina-quality product photos, a photographer restoring old scans, or a designer scaling AI art for print — JPT AI delivers professional results in seconds. Works on portraits, products, landscapes, screenshots, and AI-generated images.' },
  ],
  'remove-bg': [
    { heading: 'What is AI background removal?', body: 'AI background removal uses deep learning image segmentation to precisely detect and separate the subject from the background — no manual selection, magic wand, or green screen needed. JPT AI handles people, products, animals, and complex edges like hair with pixel-level accuracy.' },
    { heading: 'Remove background online free — no watermark', body: 'JPT AI removes backgrounds instantly in your browser. Output is a full-resolution transparent PNG with no watermarks, no quality loss, free to use immediately. Perfect for Amazon product photos, LinkedIn headshots, YouTube thumbnails, and ad creatives.' },
    { heading: 'The best remove.bg alternative in the US', body: 'Unlike remove.bg, JPT AI gives you an all-in-one toolkit: remove backgrounds AND upscale images, edit with AI text prompts, generate new backgrounds, and resize — all in one place, completely free to start with no credit card.' },
  ],
  headshot: [
    { heading: 'What is an AI headshot generator?', body: 'An AI headshot generator uses artificial intelligence to transform casual photos into professional-looking portraits. JPT AI analyzes your photo and applies professional lighting, clean backgrounds, and image enhancement to produce corporate-quality headshots without a studio session.' },
    { heading: 'Professional AI headshots for LinkedIn — free to try', body: 'LinkedIn profiles with professional headshots get 21× more profile views and 9× more connection requests. JPT AI generates LinkedIn-ready headshots in seconds — no photographer, no expensive session, free credits included when you sign up.' },
    { heading: 'AI headshots for companies and remote teams', body: 'Get consistent, professional headshots for your entire team without booking a studio. JPT AI delivers uniform lighting and style across all photos — ideal for company websites, Zoom profiles, and corporate directories.' },
  ],
  'ai-editor': [
    { heading: 'Edit photos with text prompts — no Photoshop needed', body: 'JPT AI lets you describe any edit in plain English and applies it instantly. "Change the background to a sunset", "add soft studio lighting", "make it look cinematic" — no design skills, no complex tools, no learning curve. Just type and transform.' },
    { heading: 'The best free AI photo editor online', body: 'Unlike Photoshop or Adobe Firefly, JPT AI is free to start with no credit card required. Edit images in your browser — remove backgrounds, generate new backgrounds, apply styles, and upscale quality all in one tool. No watermarks.' },
    { heading: 'AI photo editing for e-commerce and marketing', body: 'Create professional product photos, ad creatives, and social media visuals in minutes. Change backgrounds, adjust lighting, apply brand styles, and generate consistent imagery at scale — without a designer or agency.' },
  ],
  'compress-image': [
    { heading: 'What is image compression?', body: 'Image compression reduces file size by removing redundant data and optimizing encoding — without significantly affecting visual quality. Smart compression can cut image sizes by 60–80% while remaining indistinguishable to the human eye.' },
    { heading: 'Compress images free online — no watermark', body: 'JPT AI compresses JPG and PNG images instantly in your browser. No upload limits, no watermarks, no account required. Perfect for optimizing website images, email attachments, and cloud storage.' },
    { heading: 'Why compress images for your website?', body: 'Page speed is a direct Google ranking factor. Large images are the #1 cause of slow websites. Google recommends images under 100KB for fast Core Web Vitals scores. Compress your images and rank higher in search results.' },
  ],
  'convert-to-png': [
    { heading: 'Why convert images to PNG?', body: 'PNG (Portable Network Graphics) uses lossless compression — meaning no quality is lost during compression. It\'s the best format for images that need transparent backgrounds, sharp edges, text overlays, or pixel-perfect quality.' },
    { heading: 'Convert to PNG free online — no signup', body: 'JPT AI converts any JPG, WEBP, BMP, or GIF to PNG instantly in your browser. Transparency is preserved, quality is lossless, and there are no watermarks or file size limits. Download your PNG immediately.' },
    { heading: 'PNG vs JPG — when to use each', body: 'Use PNG for logos, icons, screenshots, UI elements, and any image with transparency or sharp text. Use JPG for photos, product images, and anything you\'re sharing on social media or email where file size matters more than lossless quality.' },
  ],
  'convert-to-jpg': [
    { heading: 'Why convert images to JPG?', body: 'JPG (JPEG) is the universal photo format — widely supported, small file sizes, and perfect for photographs and product images. Converting PNG, WEBP, or other formats to JPG reduces file size by 50–80% while maintaining excellent visual quality.' },
    { heading: 'Convert to JPG free online — no watermark', body: 'JPT AI converts any PNG, WEBP, BMP, or GIF to high-quality JPG instantly in your browser. No account needed, no watermark, and the output is full-resolution. Perfect for photos, product listings, and email attachments.' },
    { heading: 'When should you use JPG format?', body: 'JPG is the right choice for photographs, product photos, social media images, and any content where small file size matters. JPG files load faster on websites, send easier via email, and are accepted everywhere — from print labs to social platforms.' },
  ],
}

const PAGE_HIGHLIGHTS: Record<string, { icon: string; label: string }[]> = {
  upscale: [
    { icon: '🔍', label: '2× & 4× Super-Resolution' },
    { icon: '✨', label: 'AI Sharpening & Detail Recovery' },
    { icon: '🖼️', label: 'Restore Old & Blurry Photos' },
    { icon: '📤', label: 'No Watermark on Download' },
    { icon: '⚡', label: 'Results in Under 5 Seconds' },
  ],
  'remove-bg': [
    { icon: '🪄', label: 'One-Click Background Removal' },
    { icon: '👤', label: 'Perfect Hair & Edge Detection' },
    { icon: '🛍️', label: 'White or Transparent Background' },
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
    { icon: '✍️', label: 'Edit with Plain-English Prompts' },
    { icon: '🌅', label: 'AI Background Generation' },
    { icon: '🎨', label: 'Style & Lighting Transfer' },
    { icon: '📤', label: 'No Watermark on Download' },
    { icon: '⚡', label: 'No Design Skills Needed' },
  ],
  'compress-image': [
    { icon: '⚡', label: 'Up to 80% File Size Reduction' },
    { icon: '🎯', label: 'Lossless Visual Quality' },
    { icon: '🌐', label: 'Boost Core Web Vitals Score' },
    { icon: '📤', label: 'No Watermark on Download' },
    { icon: '🔒', label: 'No Upload, Runs in Browser' },
  ],
  'convert-to-png': [
    { icon: '🔄', label: 'JPG / WEBP / BMP → PNG' },
    { icon: '✅', label: 'Transparency Preserved' },
    { icon: '🎯', label: 'Lossless Quality' },
    { icon: '📤', label: 'No Watermark on Download' },
    { icon: '⚡', label: 'Instant — No Signup Needed' },
  ],
  'convert-to-jpg': [
    { icon: '🔄', label: 'PNG / WEBP / BMP → JPG' },
    { icon: '📉', label: '50-80% Smaller File Size' },
    { icon: '🌐', label: 'Universal Compatibility' },
    { icon: '📤', label: 'No Watermark on Download' },
    { icon: '⚡', label: 'Instant — No Signup Needed' },
  ],
}

export default function LandingPage({ config, toolHref, pageId, inlineToolType }: LandingPageProps) {
  const beforeAfter = PAGE_BEFORE_AFTER[pageId]
  const baLabels = PAGE_BEFORE_AFTER_LABELS[pageId] ?? { before: 'Original', after: 'Enhanced' }
  const inlineTool = inlineToolType ?? PAGE_INLINE_TOOL[pageId]
  const highlights = PAGE_HIGHLIGHTS[pageId] ?? PAGE_HIGHLIGHTS['upscale']

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', color: '#111827', background: '#fff' }}>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section style={{ background: 'linear-gradient(160deg, #F5F5FF 0%, #fff 50%, #F0FDF4 100%)', padding: '72px 24px 56px', textAlign: 'center' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#EEF2FF', color: '#6366F1', fontWeight: 700, fontSize: 12, borderRadius: 20, padding: '6px 14px', marginBottom: 24, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            ✦ JPT AI · Free Online Tool
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.4rem)', fontWeight: 900, color: '#0F172A', lineHeight: 1.1, letterSpacing: '-0.03em', margin: '0 0 18px' }}>
            {config.h1}
          </h1>
          <p style={{ fontSize: 'clamp(1rem, 2vw, 1.15rem)', color: '#4B5563', lineHeight: 1.7, maxWidth: 540, margin: '0 auto 16px' }}>
            {config.subtitle}
          </p>
          <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', fontSize: 13, color: '#6B7280', marginBottom: 8 }}>
            <span>✅ Free — no credit card</span>
            <span>✅ No watermark</span>
            <span>✅ No signup needed</span>
          </div>
        </div>

        {/* ── Inline Tool (upload + process + download on same page) ── */}
        {inlineTool ? (
          <div style={{ maxWidth: 820, margin: '40px auto 0', padding: '0 8px' }}>
            <InlineTool
              toolType={inlineTool}
              beforeImg={beforeAfter?.before}
              afterImg={beforeAfter?.after}
              beforeLabel={baLabels.before}
              afterLabel={baLabels.after}
            />
          </div>
        ) : (
          /* Fallback for tools without inline support (headshot, ai-editor) */
          <div style={{ maxWidth: 820, margin: '48px auto 0' }}>
            <a
              href={toolHref}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: '#fff', fontWeight: 800, fontSize: 16, padding: '16px 36px', borderRadius: 14, textDecoration: 'none', boxShadow: '0 8px 30px rgba(99,102,241,0.4)' }}
            >
              {config.cta_text || 'Try It Free'} →
            </a>
            <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 12 }}>No credit card required · 5 free trials included</div>
          </div>
        )}
      </section>

      {/* ── PRODUCT HIGHLIGHTS BAR ───────────────────────────────────────── */}
      <section style={{ background: '#0F172A', padding: '20px 24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 16 }}>
          {highlights.map(item => (
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
                <div key={i} style={{ background: '#F9FAFB', border: '1.5px solid #F3F4F6', borderRadius: 20, padding: '28px 24px' }}>
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
            <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>Three steps. Seconds to complete.</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 32 }}>
            {HOW_IT_WORKS.map(step => (
              <div key={step.step} style={{ textAlign: 'center' }}>
                <div style={{ width: 72, height: 72, background: '#fff', border: '2px solid #E0E7FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 4px 20px rgba(99,102,241,0.12)' }}>
                  <span style={{ fontSize: 22, fontWeight: 900, color: '#6366F1' }}>{step.step}</span>
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#111827', margin: '0 0 10px' }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.7, margin: 0 }}>{step.desc}</p>
              </div>
            ))}
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

      {/* ── Mid-page CTA ─────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ background: '#0F172A', borderRadius: 28, padding: '56px 48px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -60, right: -60, width: 240, height: 240, background: 'radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: -40, left: -40, width: 180, height: 180, background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(99,102,241,0.25)', color: '#A5B4FC', fontWeight: 700, fontSize: 12, borderRadius: 20, padding: '6px 14px', marginBottom: 20, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Free to try</div>
              <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 900, color: '#fff', margin: '0 0 14px', letterSpacing: '-0.02em' }}>
                Ready to transform your images?
              </h2>
              <p style={{ fontSize: 16, color: '#94A3B8', margin: '0 0 32px' }}>No credit card required. Instant results. No watermarks.</p>
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
            <div style={{ textAlign: 'center', marginBottom: 48, paddingTop: 80 }}>
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

import { createAdminSupabase } from '@/lib/auth'

export interface PageFeature {
  icon: string
  title: string
  desc: string
}

export interface PageFAQ {
  q: string
  a: string
}

export interface PageSEO {
  page_id: string
  title: string
  meta_description: string
  og_title: string
  og_description: string
  og_image: string
  keywords: string
  h1: string
  subtitle: string
  cta_text: string
  features: PageFeature[]
  faq: PageFAQ[]
  updated_at?: string
}

export const DEFAULT_CONFIGS: Record<string, PageSEO> = {
  upscale: {
    page_id: 'upscale',
    title: 'AI Image Upscaler — Enhance Photo Resolution Online | JPT AI',
    meta_description:
      "Upscale images up to 4× without losing quality using JPT AI's super-resolution technology. Enhance photos, sharpen details, and improve clarity instantly.",
    og_title: 'AI Image Upscaler | JPT AI',
    og_description: 'Upscale images up to 4× without losing quality.',
    og_image: '',
    keywords: 'ai image upscaler, photo upscale, image resolution enhancer, super resolution',
    h1: 'AI Image Upscaler',
    subtitle:
      'Enhance any photo to 2× or 4× resolution in seconds. Crystal-clear results powered by AI super-resolution.',
    cta_text: 'Upscale Your Image Free',
    features: [
      {
        icon: '🔍',
        title: '2× & 4× Upscaling',
        desc: 'Double or quadruple your image resolution while preserving detail',
      },
      {
        icon: '✨',
        title: 'AI Sharpening',
        desc: 'Intelligent sharpness enhancement for hair, skin, and fabric texture',
      },
      { icon: '⚡', title: 'Instant Results', desc: 'Get your upscaled image in seconds, no waiting' },
      { icon: '📥', title: 'Free Download', desc: 'Download as high-quality JPEG or PNG' },
    ],
    faq: [
      { q: 'How does AI upscaling work?', a: 'Our AI uses deep learning super-resolution to predict and reconstruct fine detail when enlarging images — unlike traditional upscaling which just stretches pixels and creates blur. The result looks sharp and natural at 2× or 4× the original size.' },
      { q: 'Can I upscale images to 4K online for free?', a: 'Yes. JPT AI lets you upscale images to 4× resolution free in your browser. Free users get daily credits — no credit card required to start.' },
      { q: "What's the maximum upscale size?", a: 'You can upscale images up to 4× their original dimensions. Starting images up to 1024px are supported for AI super-resolution processing.' },
      { q: 'Is there a watermark on the output?', a: 'No watermarks, ever. Your upscaled image downloads clean and ready to use — on both free and paid plans.' },
      { q: 'Does AI upscaling work on old blurry photos?', a: 'Yes — AI upscaling is especially effective on old or low-resolution photos. The model recovers detail, reduces noise, and sharpens edges that were lost in the original.' },
      { q: 'What formats are supported?', a: 'Upload JPG, PNG, or WEBP. Download your upscaled image as high-quality JPEG or PNG.' },
      { q: 'Can I use the results commercially?', a: 'Yes. All upscaled images are yours to use for personal, professional, or commercial purposes — no attribution required.' },
      { q: 'Do I need to install anything?', a: 'No. JPT AI runs entirely in your browser. No downloads, no plugins, no setup required.' },
    ],
  },
  'remove-bg': {
    page_id: 'remove-bg',
    title: 'Remove Image Background Free Online — AI Background Remover | JPT AI',
    meta_description:
      'Remove backgrounds from photos instantly using AI. Get transparent PNG in one click. Perfect for product photos, portraits, and e-commerce. Free online tool.',
    og_title: 'AI Background Remover | JPT AI',
    og_description: 'Remove backgrounds from photos instantly using AI. Get transparent PNG in one click.',
    og_image: '',
    keywords: 'remove background, background remover, transparent background, png background removal',
    h1: 'AI Background Remover',
    subtitle:
      'Remove any background in one click. Get a clean transparent PNG — perfect for product photos, portraits, and more.',
    cta_text: 'Remove Background Free',
    features: [
      {
        icon: '🪄',
        title: 'One-Click Removal',
        desc: 'AI detects the subject and removes the background automatically',
      },
      {
        icon: '👤',
        title: 'Perfect for Portraits',
        desc: 'Clean edge detection for hair, skin, and fine details',
      },
      {
        icon: '🛍',
        title: 'E-commerce Ready',
        desc: 'Get product photos with transparent backgrounds for your store',
      },
      { icon: '📤', title: 'PNG Export', desc: 'Download as transparent PNG ready for any use' },
    ],
    faq: [
      { q: 'Can it remove complex backgrounds?', a: 'Yes — JPT AI handles complex backgrounds including nature scenes, crowds, gradients, and busy environments with pixel-level precision.' },
      { q: 'Does it work on hair and fine edges?', a: 'Yes. The AI model is specifically trained to handle fine hair strands, fur, and complex edges that trip up most background removers.' },
      { q: 'Will the output have a watermark?', a: 'No watermarks, ever. Your transparent PNG downloads clean and full-resolution on both free and paid plans.' },
      { q: 'What format does it output?', a: 'Always outputs as a transparent PNG, ready to place on any background or use in any design tool.' },
      { q: 'Is it free to remove backgrounds online?', a: 'Yes. Sign in with Google to get free daily credits. No credit card required.' },
      { q: 'Can I use it for e-commerce product photos?', a: 'Absolutely. JPT AI is ideal for creating clean white-background product photos for Amazon, Shopify, Flipkart, and any marketplace. Process multiple images quickly.' },
      { q: 'Can I use the result commercially?', a: 'Yes. All outputs are yours to use for personal, professional, or commercial purposes — no attribution required.' },
      { q: 'Do I need to install anything?', a: 'No. The background remover works entirely in your browser — no downloads, no Photoshop, no plugins.' },
    ],
  },
  headshot: {
    page_id: 'headshot',
    title: 'AI Headshot Generator — Professional Photos Online | JPT AI',
    meta_description:
      'Generate professional AI headshots from any photo. Perfect for LinkedIn, resumes, and corporate profiles. No photographer needed.',
    og_title: 'AI Headshot Generator | JPT AI',
    og_description:
      'Generate professional AI headshots from any photo. Perfect for LinkedIn and corporate profiles.',
    og_image: '',
    keywords: 'ai headshot, professional headshot generator, linkedin photo, corporate headshot',
    h1: 'AI Headshot Generator',
    subtitle:
      'Turn any photo into a professional headshot. LinkedIn-ready, corporate-quality results in seconds.',
    cta_text: 'Generate Your Headshot Free',
    features: [
      {
        icon: '💼',
        title: 'LinkedIn Ready',
        desc: 'Professional headshots optimized for LinkedIn and corporate profiles',
      },
      { icon: '🎨', title: 'Multiple Styles', desc: 'Choose from corporate, casual, creative and more styles' },
      { icon: '⚡', title: 'Instant Generation', desc: 'Get your professional headshot in seconds' },
      {
        icon: '📸',
        title: 'High Resolution',
        desc: 'Download full resolution images for print and digital use',
      },
    ],
    faq: [
      { q: 'What photo should I upload for best results?', a: 'Upload a clear, well-lit photo of your face looking roughly straight at the camera. Good lighting matters most — indoor or natural light both work well.' },
      { q: 'How long does it take to generate a headshot?', a: 'AI headshots are typically ready in 10–30 seconds. You can generate multiple styles and choose your favourite.' },
      { q: 'Will my AI headshot look natural?', a: 'Yes. JPT AI uses realistic AI enhancement rather than obvious filters. Results are designed to look like professional photography, not AI-generated images.' },
      { q: 'Can I use these on LinkedIn and professional profiles?', a: 'Absolutely. AI headshots from JPT AI are LinkedIn-ready — profiles with professional headshots get 21× more views and 9× more connection requests.' },
      { q: 'Can I use the result commercially?', a: 'Yes. All generated headshots are yours to use for personal, professional, and commercial purposes.' },
      { q: 'Is there a watermark?', a: 'No watermarks on any downloaded headshot — free or paid.' },
      { q: 'Do I need to install anything?', a: 'No. Everything runs in your browser. No app, no software, no setup.' },
    ],
  },
  'ai-editor': {
    page_id: 'ai-editor',
    title: 'AI Photo Editor Online Free — Edit Images with Text Prompts | JPT AI',
    meta_description:
      'Edit photos with simple text prompts using JPT AI. Change backgrounds, add effects, relight scenes, and more. No Photoshop skills needed.',
    og_title: 'AI Photo Editor | JPT AI',
    og_description: 'Edit photos with simple text prompts. No Photoshop skills needed.',
    og_image: '',
    keywords: 'ai photo editor, text to image edit, ai image editing, online photo editor',
    h1: 'AI Photo Editor',
    subtitle:
      'Describe your edit in plain English — our AI does the rest. Change backgrounds, add effects, relight scenes instantly.',
    cta_text: 'Start Editing Free',
    features: [
      { icon: '✍️', title: 'Text-to-Edit', desc: 'Just type what you want changed and AI handles the rest' },
      {
        icon: '🌅',
        title: 'Background Generation',
        desc: 'Replace backgrounds with any scene — studio, nature, urban and more',
      },
      {
        icon: '🎨',
        title: 'Style Transfer',
        desc: 'Apply cinematic, vintage, or artistic styles to any photo',
      },
      {
        icon: '↔️',
        title: 'Before/After Slider',
        desc: 'Compare original and edited versions with an interactive slider',
      },
    ],
    faq: [
      { q: 'What kinds of edits can I make with text prompts?', a: 'You can change backgrounds, apply cinematic or artistic styles, adjust lighting, remove objects, replace colours, and more. Just describe the edit in plain English — no Photoshop skills needed.' },
      { q: 'Do I need design skills to use JPT AI?', a: 'No. Just type what you want changed and the AI handles the technical work. If you can describe it, JPT AI can do it.' },
      { q: 'Is there a watermark on the edited image?', a: 'No watermarks, ever. Your edited image downloads clean and ready to use on both free and paid plans.' },
      { q: 'Is JPT AI free to use for photo editing?', a: 'Yes. Sign in with Google to get free daily credits. No credit card required to start editing.' },
      { q: 'Can I use edited images commercially?', a: 'Yes. All outputs are yours to use for personal, professional, or commercial purposes with no attribution required.' },
      { q: 'How fast are the AI edits?', a: 'Most edits complete in 5–15 seconds. Background generation and style transfers typically take 10–20 seconds.' },
      { q: 'Do I need to install anything?', a: 'No. JPT AI runs entirely in your browser — no downloads, no plugins, no desktop software required.' },
    ],
  },
}

export async function getPageConfig(pageId: string): Promise<PageSEO> {
  try {
    const supabase = createAdminSupabase()
    const { data, error } = await supabase.from('page_seo').select('*').eq('page_id', pageId).single()

    if (error || !data) {
      return DEFAULT_CONFIGS[pageId] ?? ({ page_id: pageId } as PageSEO)
    }

    return {
      ...DEFAULT_CONFIGS[pageId],
      ...data,
    } as PageSEO
  } catch {
    return DEFAULT_CONFIGS[pageId] ?? ({ page_id: pageId } as PageSEO)
  }
}

export async function savePageConfig(pageId: string, data: Partial<PageSEO>): Promise<void> {
  const supabase = createAdminSupabase()
  const { error } = await supabase.from('page_seo').upsert({
    ...data,
    page_id: pageId,
    updated_at: new Date().toISOString(),
  })
  if (error) throw new Error(error.message)
}

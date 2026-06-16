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
      {
        q: 'How does AI upscaling work?',
        a: 'Our AI uses super-resolution algorithms to predict and add detail when enlarging images, unlike traditional upscaling which just stretches pixels.',
      },
      {
        q: "What's the maximum size?",
        a: 'You can upscale images up to 4× their original dimensions. Starting images are capped at 1024px for processing.',
      },
      {
        q: 'Is it free?',
        a: 'Normal 2× upscale costs 1 credit. Pro AI upscale costs 2 credits. Free users get 10 credits daily.',
      },
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
      {
        q: 'Can it remove complex backgrounds?',
        a: 'Yes — our Gemini AI handles complex backgrounds including nature scenes, crowds, and busy environments.',
      },
      {
        q: 'Does it work on hair?',
        a: 'Yes, the AI handles fine hair strands and complex edges accurately.',
      },
      {
        q: 'What format does it output?',
        a: 'Always outputs as transparent PNG, ready to use on any background.',
      },
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
      {
        q: 'What photo should I upload?',
        a: 'Upload a clear photo of your face, ideally looking straight at the camera with good lighting.',
      },
      {
        q: 'How many styles can I generate?',
        a: 'You can generate headshots in multiple professional styles. Each generation costs 2 credits.',
      },
      {
        q: 'Can I use these for commercial purposes?',
        a: 'Yes, all generated headshots are yours to use for personal and professional purposes.',
      },
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
      {
        q: 'What kinds of edits can I make?',
        a: 'You can change backgrounds, apply styles, adjust lighting, remove objects, and more using simple text prompts.',
      },
      {
        q: 'Do I need design skills?',
        a: 'No — just describe what you want in plain English and the AI handles all the technical work.',
      },
      {
        q: 'How many credits does editing cost?',
        a: 'Each AI edit costs 1-3 credits depending on complexity. Free users get 10 credits daily.',
      },
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

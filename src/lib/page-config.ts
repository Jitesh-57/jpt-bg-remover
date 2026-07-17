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
    title: 'Free AI Image Upscaler — Enhance Photo Resolution to 4K Online | JPT AI',
    meta_description:
      'Free AI image upscaler online. Upscale photos to 4K without losing quality. Enhance resolution 2× or 4× instantly — no watermark, no software needed.',
    og_title: 'Free AI Image Upscaler — 4K Photo Enhancement | JPT AI',
    og_description: 'Upscale images to 4K for free. No watermark, no software. Powered by AI super-resolution.',
    og_image: '',
    keywords: 'free ai image upscaler, upscale image free, photo upscale online free, 4k image upscaler free, image resolution enhancer free',
    h1: 'Free AI Image Upscaler',
    subtitle:
      'Upscale any photo to 2× or 4× resolution — free online. Crystal-clear results with no watermark, powered by AI super-resolution.',
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
      { q: 'Can I upscale images to 4K online for free?', a: 'Yes. Basic upscale is completely free and unlimited for everyone, no sign-up limits. Pro AI upscale (4K, higher quality) gives you one free trial, then a paid plan to continue — no credit card required to start.' },
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
    title: 'Free Background Remover Online — Remove Image Background Instantly | JPT AI',
    meta_description:
      'Remove image backgrounds free online using AI. Get a transparent PNG in one click — no watermark, no software. Perfect for product photos, portraits, and e-commerce.',
    og_title: 'Free AI Background Remover — Transparent PNG Instantly | JPT AI',
    og_description: 'Remove image backgrounds free online. Transparent PNG in one click, no watermark.',
    og_image: '',
    keywords: 'remove background free, background remover free online, transparent background free, remove image background free, png background removal free',
    h1: 'Free AI Background Remover',
    subtitle:
      'Remove any background in one click — free online. Get a clean transparent PNG with no watermark, perfect for product photos and portraits.',
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
      { q: 'Is it free to remove backgrounds online?', a: 'Yes. Sign in with Google to get a free trial on this tool — no credit card required. You get 5 free trials total across any of our tools.' },
      { q: 'Can I use it for e-commerce product photos?', a: 'Absolutely. JPT AI is ideal for creating clean white-background product photos for Amazon, Shopify, Flipkart, and any marketplace. Process multiple images quickly.' },
      { q: 'Can I use the result commercially?', a: 'Yes. All outputs are yours to use for personal, professional, or commercial purposes — no attribution required.' },
      { q: 'Do I need to install anything?', a: 'No. The background remover works entirely in your browser — no downloads, no Photoshop, no plugins.' },
    ],
  },
  headshot: {
    page_id: 'headshot',
    title: 'Free AI Headshot Generator — Professional Photos Online | JPT AI',
    meta_description:
      'Generate professional AI headshots free from any photo. Perfect for LinkedIn, resumes, and corporate profiles. No photographer needed, no watermark.',
    og_title: 'Free AI Headshot Generator — LinkedIn Ready | JPT AI',
    og_description:
      'Generate professional AI headshots free online. LinkedIn-ready, no watermark.',
    og_image: '',
    keywords: 'free ai headshot generator, professional headshot free, linkedin photo free, ai headshot online free',
    h1: 'Free AI Headshot Generator',
    subtitle:
      'Turn any photo into a professional headshot — free online. LinkedIn-ready, corporate-quality results in seconds with no watermark.',
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
    title: 'Free AI Photo Editor Online — Edit Images with Text Prompts | JPT AI',
    meta_description:
      'Free AI photo editor online. Edit photos with simple text prompts — change backgrounds, add effects, relight scenes. No Photoshop skills needed, no watermark.',
    og_title: 'Free AI Photo Editor Online — Edit with Text Prompts | JPT AI',
    og_description: 'Edit photos free with text prompts. No Photoshop, no watermark. Powered by AI.',
    og_image: '',
    keywords: 'free ai photo editor online, ai photo editor free, edit photos free online, ai image editor free, text prompt photo editor free',
    h1: 'Free AI Photo Editor',
    subtitle:
      'Describe your edit in plain English — our AI does the rest for free. Change backgrounds, add effects, relight scenes instantly. No watermark.',
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
      { q: 'Is JPT AI free to use for photo editing?', a: 'Yes. Sign in with Google to get a free trial on this tool — no credit card required to start. You get 5 free trials total across any of our tools.' },
      { q: 'Can I use edited images commercially?', a: 'Yes. All outputs are yours to use for personal, professional, or commercial purposes with no attribution required.' },
      { q: 'How fast are the AI edits?', a: 'Most edits complete in 5–15 seconds. Background generation and style transfers typically take 10–20 seconds.' },
      { q: 'Do I need to install anything?', a: 'No. JPT AI runs entirely in your browser — no downloads, no plugins, no desktop software required.' },
    ],
  },
  'compress-image': {
    page_id: 'compress-image',
    title: 'Free Image Compressor Online — Reduce Photo Size Without Losing Quality | JPT AI',
    meta_description:
      'Compress JPG, PNG & WEBP images online for free. Reduce photo file size to KB for web, email, and uploads — no quality loss, no watermark, no sign-up.',
    og_title: 'Free Image Compressor — Reduce Photo Size Online | JPT AI',
    og_description: 'Compress images free online. Shrink JPG/PNG file size without losing quality. No watermark, no sign-up.',
    og_image: '',
    keywords: 'compress image free, image compressor online free, reduce image size free, compress jpg free, compress photo to kb free, reduce photo size online free',
    h1: 'Free Image Compressor',
    subtitle:
      'Shrink your image file size in seconds — free online. Compress JPG, PNG, and WEBP for faster websites, smaller emails, and easy uploads. No watermark, no sign-up.',
    cta_text: 'Compress Your Image Free',
    features: [
      { icon: '🗜️', title: 'Smart Compression', desc: 'Reduce file size dramatically while keeping your photo looking sharp' },
      { icon: '🎚️', title: 'Quality Control', desc: 'Drag one slider to balance file size against image quality' },
      { icon: '⚡', title: 'Instant & In-Browser', desc: 'Everything runs on your device — nothing is uploaded to a server' },
      { icon: '📥', title: 'Free Download', desc: 'Download the smaller image instantly — no watermark, no limits' },
    ],
    faq: [
      { q: 'How do I compress an image for free?', a: 'Upload your JPG, PNG, or WEBP, drag the quality slider to the size you want, and download. It is completely free, needs no sign-up, and adds no watermark.' },
      { q: 'Can I compress an image to a specific KB size?', a: 'Yes. Lower the quality slider and watch the estimated size drop. For a target like 100 KB or 200 KB, reduce quality until the read-out matches — most photos hit small sizes with barely visible quality loss.' },
      { q: 'Will compressing reduce image quality?', a: 'Only as much as you choose. At 70–80% quality the difference is almost invisible while the file gets much smaller. You are always in control with the slider.' },
      { q: 'Is my photo uploaded to a server?', a: 'No. Compression runs entirely in your browser, so your image never leaves your device — private and instant.' },
      { q: 'What formats can I compress?', a: 'JPG, JPEG, PNG, and WEBP. The compressed file downloads as an optimised JPG for the smallest possible size.' },
      { q: 'Is there a watermark or limit?', a: 'No watermark and no limits — compress as many images as you like, completely free.' },
      { q: 'Do I need to install any software?', a: 'No. JPT AI runs in your browser — no app, no plugin, no Photoshop needed.' },
    ],
  },
  'convert-image': {
    page_id: 'convert-image',
    title: 'Free Image Converter Online — JPG to PNG, PNG to JPG, WEBP | JPT AI',
    meta_description:
      'Convert images between JPG, PNG, and WEBP online for free. Fast, in-browser image format converter — no watermark, no sign-up, no upload to a server.',
    og_title: 'Free Image Converter — JPG · PNG · WEBP Online | JPT AI',
    og_description: 'Convert JPG to PNG, PNG to JPG, or WEBP free online. No watermark, no sign-up.',
    og_image: '',
    keywords: 'convert image free, jpg to png free, png to jpg free, webp to png free, image converter online free, change image format free',
    h1: 'Free Image Converter',
    subtitle:
      'Convert between JPG, PNG, and WEBP in one click — free online. Perfect for transparency, smaller files, or app requirements. No watermark, no sign-up.',
    cta_text: 'Convert Your Image Free',
    features: [
      { icon: '🔀', title: 'JPG · PNG · WEBP', desc: 'Switch between the three most common web formats instantly' },
      { icon: '🪟', title: 'Keeps Transparency', desc: 'PNG and WEBP output preserve transparent backgrounds' },
      { icon: '⚡', title: 'In-Browser & Private', desc: 'Conversion happens on your device — nothing is uploaded' },
      { icon: '📥', title: 'Free Download', desc: 'Download the converted file with no watermark and no limits' },
    ],
    faq: [
      { q: 'How do I convert JPG to PNG for free?', a: 'Upload your JPG, choose PNG as the output format, and click convert. Download instantly — free, no sign-up, no watermark.' },
      { q: 'Can I convert PNG to JPG?', a: 'Yes. Choose JPG as the output. Transparent areas are flattened onto a white background, which is standard for JPG since it does not support transparency.' },
      { q: 'What is WEBP good for?', a: 'WEBP gives smaller file sizes than JPG or PNG at similar quality and supports transparency — ideal for fast-loading websites.' },
      { q: 'Does converting lose quality?', a: 'Converting to PNG or WEBP is lossless or near-lossless. Converting to JPG uses high-quality compression that keeps photos looking crisp.' },
      { q: 'Is my image uploaded anywhere?', a: 'No. The converter runs entirely in your browser, so your file stays private on your device.' },
      { q: 'Is there a watermark or limit?', a: 'No watermark and no limits — convert as many images as you want for free.' },
      { q: 'Do I need to install anything?', a: 'No. It works in your browser — no app or software required.' },
    ],
  },
  'crop-image': {
    page_id: 'crop-image',
    title: 'Free Image Cropper Online — Crop Photos for Instagram, YouTube & More | JPT AI',
    meta_description:
      'Crop images online for free. Ready-made sizes for Instagram, Stories, YouTube, and profile pictures — plus a circle crop. No watermark, no sign-up.',
    og_title: 'Free Image Cropper — Crop for Social Media Online | JPT AI',
    og_description: 'Crop photos free online to Instagram, Story, YouTube, and circle sizes. No watermark.',
    og_image: '',
    keywords: 'crop image free, crop photo online free, image cropper free, crop picture for instagram free, circle crop free, crop image online free',
    h1: 'Free Image Cropper',
    subtitle:
      'Crop any photo to the perfect size — free online. One-tap ratios for Instagram, Stories, YouTube, and profile pictures, plus a circle crop. No watermark.',
    cta_text: 'Crop Your Image Free',
    features: [
      { icon: '✂️', title: 'One-Tap Ratios', desc: 'Square, portrait, story, wide, and classic photo ratios ready to go' },
      { icon: '⭕', title: 'Circle Crop', desc: 'Make round profile pictures for social media and avatars' },
      { icon: '📱', title: 'Social-Media Sizes', desc: 'Perfect crops for Instagram, Reels, YouTube, and more' },
      { icon: '📥', title: 'Free Download', desc: 'Download your cropped image instantly — no watermark' },
    ],
    faq: [
      { q: 'How do I crop an image for free?', a: 'Upload your photo, pick a ratio like Square or Story, and click apply. Download instantly — free, no sign-up, no watermark.' },
      { q: 'Can I crop a photo for Instagram?', a: 'Yes. Choose Square (1:1) for feed posts, Portrait (4:5) for tall posts, or Story (9:16) for Stories and Reels — all one tap.' },
      { q: 'Can I make a round/circle profile picture?', a: 'Yes. Pick the Circle option and the tool crops your photo into a round image with a transparent PNG background — perfect for avatars.' },
      { q: 'Does cropping reduce quality?', a: 'No. Cropping only trims the edges; the remaining pixels keep their full quality.' },
      { q: 'Is my image uploaded to a server?', a: 'No. Cropping runs in your browser, so your photo stays private on your device.' },
      { q: 'Is there a watermark or limit?', a: 'No watermark and no limits — crop as many images as you like for free.' },
      { q: 'Do I need to install anything?', a: 'No. It runs in your browser — no app or software needed.' },
    ],
  },
  'rotate-image': {
    page_id: 'rotate-image',
    title: 'Free Rotate & Flip Image Online — Straighten or Mirror Photos | JPT AI',
    meta_description:
      'Rotate and flip images online for free. Turn photos 90°, 180°, or mirror them horizontally and vertically — no watermark, no sign-up, instant download.',
    og_title: 'Free Rotate & Flip Image Tool Online | JPT AI',
    og_description: 'Rotate or flip photos free online. 90°, 180°, mirror horizontal/vertical. No watermark.',
    og_image: '',
    keywords: 'rotate image free, flip image free, rotate photo online free, mirror image free, turn image free, rotate picture online free',
    h1: 'Free Rotate & Flip Image',
    subtitle:
      'Rotate or mirror any photo in one tap — free online. Fix sideways pictures, flip for a mirror effect, or turn 180°. No watermark, no sign-up.',
    cta_text: 'Rotate Your Image Free',
    features: [
      { icon: '🔄', title: 'Rotate Any Angle', desc: 'Turn photos left, right, or a full 180° in one click' },
      { icon: '🪞', title: 'Flip & Mirror', desc: 'Mirror images horizontally or vertically instantly' },
      { icon: '⚡', title: 'In-Browser & Private', desc: 'Runs on your device — nothing is uploaded to a server' },
      { icon: '📥', title: 'Free Download', desc: 'Download the result instantly — no watermark, no limits' },
    ],
    faq: [
      { q: 'How do I rotate an image for free?', a: 'Upload your photo and tap Rotate Left, Rotate Right, or 180°. Download instantly — free, no sign-up, no watermark.' },
      { q: 'Can I flip or mirror a photo?', a: 'Yes. Use Flip H to mirror left-to-right or Flip V to mirror top-to-bottom — great for selfies and reflection effects.' },
      { q: 'Will rotating reduce quality?', a: 'No. Rotating and flipping are lossless — your image keeps its original quality.' },
      { q: 'Can I fix a sideways photo?', a: 'Yes. Rotate Left or Right by 90° to straighten photos that uploaded sideways.' },
      { q: 'Is my image uploaded anywhere?', a: 'No. Everything runs in your browser, so your photo stays private on your device.' },
      { q: 'Is there a watermark or limit?', a: 'No watermark and no limits — rotate and flip as many images as you want for free.' },
      { q: 'Do I need to install anything?', a: 'No. It works right in your browser — no app or software needed.' },
    ],
  },
  'image-to-pdf': {
    page_id: 'image-to-pdf',
    title: 'Free Image to PDF Converter Online — JPG & PNG to PDF | JPT AI',
    meta_description:
      'Convert images to PDF online for free. Turn JPG, PNG, or WEBP photos into a PDF in one click — no watermark, no sign-up, private in-browser conversion.',
    og_title: 'Free Image to PDF Converter Online | JPT AI',
    og_description: 'Convert JPG & PNG to PDF free online. One click, no watermark, no sign-up.',
    og_image: '',
    keywords: 'image to pdf free, jpg to pdf free, png to pdf free, photo to pdf online free, convert image to pdf free, picture to pdf free',
    h1: 'Free Image to PDF Converter',
    subtitle:
      'Turn any photo into a PDF in one click — free online. Great for documents, forms, and sharing. No watermark, no sign-up, private in-browser conversion.',
    cta_text: 'Convert Image to PDF Free',
    features: [
      { icon: '📄', title: 'One-Click PDF', desc: 'Turn any JPG, PNG, or WEBP into a clean PDF instantly' },
      { icon: '📐', title: 'Right-Sized Pages', desc: 'The PDF page matches your image dimensions automatically' },
      { icon: '⚡', title: 'In-Browser & Private', desc: 'Conversion happens on your device — nothing is uploaded' },
      { icon: '📥', title: 'Free Download', desc: 'Download your PDF instantly — no watermark, no limits' },
    ],
    faq: [
      { q: 'How do I convert an image to PDF for free?', a: 'Upload your JPG, PNG, or WEBP and click Download as PDF. It is free, needs no sign-up, and adds no watermark.' },
      { q: 'Can I convert JPG to PDF?', a: 'Yes. JPG, PNG, and WEBP are all supported. Your photo becomes a single-page PDF sized to the image.' },
      { q: 'Does the PDF have a watermark?', a: 'No watermark, ever. The PDF downloads clean and ready to share or print.' },
      { q: 'Is my image uploaded to a server?', a: 'No. The PDF is built entirely in your browser, so your file stays private on your device.' },
      { q: 'Will the image quality stay good in the PDF?', a: 'Yes. The image is embedded at high quality so it looks sharp on screen and in print.' },
      { q: 'Is there a limit on how many I can convert?', a: 'No limits — convert as many images to PDF as you like, completely free.' },
      { q: 'Do I need to install anything?', a: 'No. It works in your browser — no app, no Acrobat, no software required.' },
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

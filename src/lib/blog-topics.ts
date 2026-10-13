/**
 * blog-topics.ts — the topic hubs at /guides/{topic}.
 *
 * Every blog post belongs to exactly one topic, and each topic's hub links to
 * all of its posts. Before these existed, ~200 posts could only be reached
 * through /blog/page/2…15, which Google treats as a weak path, so they sat in
 * "Discovered – currently not indexed".
 *
 * A post's topic comes from the tool it links to, refined by its slug for
 * the tools that span topics (the upscaler covers enhancing, restoring and
 * portraits; the creative apps cover styles, headshots and restoration).
 */

export interface BlogTopic {
  slug: string;
  /** Short name, for links and the footer. */
  name: string;
  /** The hub's H1 and title. */
  title: string;
  description: string;
  /** A paragraph of the hub's own text, so it is a page and not just a list. */
  intro: string;
  tools: { href: string; label: string }[];
}

export const BLOG_TOPICS: BlogTopic[] = [
  {
    slug: "upscale-enhance",
    name: "Upscale & enhance",
    title: "Upscale & Enhance Photos: Guides",
    description: "Guides to upscaling images to 4K, fixing blurry photos and enhancing image quality for free, in your browser.",
    intro: "A small or soft image can usually be saved. These guides cover AI upscaling to 2×, 4× and true 4K, fixing blur from motion or focus, and getting print-ready resolution. Each one explains when an upscale helps, when it can't, and how to get the cleanest result from the source you have.",
    tools: [{ href: "/upscale", label: "Image Upscaler" }, { href: "/upscale/4k", label: "4K Upscaler" }],
  },
  {
    slug: "background-removal",
    name: "Background removal",
    title: "Remove & Change Photo Backgrounds: Guides",
    description: "Guides to removing backgrounds, making transparent PNGs and replacing photo backgrounds with AI.",
    intro: "Clean cutouts depend on the edges: hair, glass, logos and product shadows each need a slightly different approach. These guides walk through transparent PNGs, white backgrounds for marketplaces and passports, and replacing a background with a new scene.",
    tools: [{ href: "/remove-bg", label: "Background Remover" }, { href: "/ai-editor/change-background", label: "Change Background" }],
  },
  {
    slug: "headshots-portraits",
    name: "Headshots & portraits",
    title: "AI Headshots & Portrait Photos: Guides",
    description: "Guides to professional headshots, LinkedIn photos, profile pictures and passport photos made from a selfie.",
    intro: "A good profile photo is mostly framing, light and a recognisable face. These guides cover turning a selfie into a LinkedIn or corporate headshot, sharpening a profile picture, and meeting the exact rules for passport and visa photos.",
    tools: [{ href: "/ai-headshot", label: "AI Headshot Generator" }, { href: "/ai-headshot/linkedin", label: "LinkedIn Headshot" }],
  },
  {
    slug: "restore-old-photos",
    name: "Restore old photos",
    title: "Restore Old Photos with AI: Guides",
    description: "Guides to restoring, enhancing and upscaling old, faded and scanned family photos with AI.",
    intro: "Old prints fade, crack and lose detail, and a phone snapshot of a print loses more. These guides cover scanning properly, what AI restoration can and can't recover, and bringing black-and-white and damaged family photos back to a printable state.",
    tools: [{ href: "/upscale/old-photos", label: "Old Photo Upscaler" }, { href: "/creative/restore-old-photos", label: "Restore Old Photos" }],
  },
  {
    slug: "resize-compress",
    name: "Resize, crop & compress",
    title: "Resize, Crop & Compress Images: Guides",
    description: "Guides to resizing images to exact sizes, cropping for social media and compressing photos to a target KB.",
    intro: "Most upload errors come down to dimensions or file size. These guides cover exact pixel sizes for every major platform, cropping to square, circle and print ratios, and compressing JPG and PNG to 50 KB, 100 KB or 200 KB without visible loss.",
    tools: [{ href: "/resize-image", label: "Resize Image" }, { href: "/compress-image", label: "Compress Image" }, { href: "/crop-image", label: "Crop Image" }],
  },
  {
    slug: "tiktok-social",
    name: "TikTok & social",
    title: "TikTok, Memes & Social Media: Guides",
    description: "Guides to saving TikTok videos without a watermark, making memes and preparing images for social media.",
    intro: "Social platforms each have their own formats and quirks. These guides cover downloading TikTok videos and sounds without the watermark, making memes and captions, and getting images to look right on every feed.",
    tools: [{ href: "/tiktok-watermark-remover", label: "TikTok Downloader" }, { href: "/meme-generator", label: "Meme Generator" }],
  },
  {
    slug: "convert-pdf",
    name: "Convert & PDF",
    title: "Convert Images & Make PDFs: Guides",
    description: "Guides to converting between JPG, PNG, WebP and HEIC, and turning images into PDFs.",
    intro: "The right file format saves space and avoids broken uploads. These guides explain JPG, PNG, WebP and HEIC and when to use each, how to convert between them without losing quality, and how to combine photos and scans into a single PDF.",
    tools: [{ href: "/convert-image", label: "Convert Image" }, { href: "/image-to-pdf", label: "Image to PDF" }],
  },
  {
    slug: "editing-basics",
    name: "Photo editing basics",
    title: "Rotate, Blur, Watermark & More: Guides",
    description: "Guides to rotating and flipping photos, blurring faces and private details, watermarks and QR codes.",
    intro: "Small edits come up every day: a sideways photo, a face or number plate to hide, a watermark to add or remove, a QR code for a menu. These guides cover each one with free browser tools that work without uploading your files.",
    tools: [{ href: "/rotate-image", label: "Rotate Image" }, { href: "/blur-image", label: "Blur Image" }, { href: "/watermark-image", label: "Add Watermark" }],
  },
  {
    slug: "ai-photo-effects",
    name: "AI photo effects",
    title: "AI Photo Effects & Styles: Guides",
    description: "Guides to AI photo styles: anime, Pixar, Ghibli, Y2K, yearbook, figurines, polaroids and more, from one photo.",
    intro: "One photo can become a dozen different looks. These guides explain each AI style, what kind of source photo works best for it, and how to get a result that still looks like you.",
    tools: [{ href: "/creative", label: "All AI Photo Apps" }],
  },
];

export const TOPIC_BY_SLUG: Record<string, BlogTopic> = Object.fromEntries(BLOG_TOPICS.map((t) => [t.slug, t]));

export const topicHref = (t: BlogTopic | string) => `/guides/${typeof t === "string" ? t : t.slug}`;

const RESTORE = /(^|-)(old|restor\w*|vintage|scanned|black-and-white|family)(-|$)/;
const PORTRAIT = /(^|-)(headshot|linkedin|profile|portrait|passport|selfie|avatar|corporate|visa)(-|$)/;
const BACKGROUND = /(^|-)background(-|$)/;

/** The one topic a post belongs to. */
export function topicOf(post: { slug: string; toolHref: string }): string {
  const tool = post.toolHref.split("?")[0];
  const s = post.slug;
  if (tool.startsWith("/creative/")) {
    if (RESTORE.test(s)) return "restore-old-photos";
    if (PORTRAIT.test(s)) return "headshots-portraits";
    if (BACKGROUND.test(s)) return "background-removal";
    return "ai-photo-effects";
  }
  if (tool.startsWith("/upscale")) {
    if (RESTORE.test(s)) return "restore-old-photos";
    if (PORTRAIT.test(s)) return "headshots-portraits";
    return "upscale-enhance";
  }
  if (tool.startsWith("/remove-bg") || tool.startsWith("/ai-editor")) return "background-removal";
  if (tool.startsWith("/ai-headshot")) return "headshots-portraits";
  if (tool.startsWith("/tiktok") || tool.startsWith("/meme-generator")) return "tiktok-social";
  if (tool.startsWith("/convert-image") || tool.startsWith("/image-to-pdf")) return "convert-pdf";
  if (["/compress-image", "/resize-image", "/crop-image", "/batch-editor"].some((t) => tool.startsWith(t))) return "resize-compress";
  return "editing-basics";
}

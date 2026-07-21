// Data + content generator for the compress-to-size landing pages under
// /compress/<slug> (e.g. /compress/compress-image-to-100kb). Each deep-links
// into the editor's Compress tool with the target size preselected.

export interface CompressTarget { kb: number; slug: string; label: string; }

const SIZES: { kb: number; label: string }[] = [
  { kb: 20, label: "20KB" },
  { kb: 50, label: "50KB" },
  { kb: 100, label: "100KB" },
  { kb: 200, label: "200KB" },
  { kb: 500, label: "500KB" },
  { kb: 1024, label: "1MB" },
];

export const COMPRESSIONS: CompressTarget[] = SIZES.map((s) => ({
  kb: s.kb,
  label: s.label,
  slug: `compress-image-to-${s.label.toLowerCase()}`,
}));

export function getCompression(slug: string): CompressTarget | undefined {
  return COMPRESSIONS.find((c) => c.slug === slug);
}

export interface CompressContent {
  slug: string;
  label: string;
  kb: number;
  h1: string;
  title: string;
  metaDescription: string;
  keywords: string;
  intro: string;
  why: string;
  steps: { t: string; d: string }[];
  faqs: { q: string; a: string }[];
}

export function buildCompressContent(c: CompressTarget): CompressContent {
  const L = c.label;
  const useCase =
    c.kb <= 50 ? "strict upload limits like government forms, exam applications, and job portals"
    : c.kb <= 100 ? "web pages, email attachments, and forms that cap uploads at 100KB"
    : c.kb <= 200 ? "fast-loading websites, blog images, and email attachments"
    : "high-quality web images that still load quickly";

  return {
    slug: c.slug,
    label: L,
    kb: c.kb,
    h1: `Compress Image to ${L}`,
    title: `Compress Image to ${L} — Free Online Image Compressor | JPT AI`,
    metaDescription: `Compress an image to ${L} or less online free. Upload a JPG or PNG and reduce it to exactly ${L} in seconds — no watermark, no sign-up. Perfect for forms, uploads, and email.`,
    keywords: `compress image to ${L.toLowerCase()}, reduce image size to ${L.toLowerCase()}, image compressor ${L.toLowerCase()}, compress photo to ${L.toLowerCase()}, resize image to ${L.toLowerCase()}`,
    intro: `Need to compress an image to ${L}? This free online compressor reduces any JPG or PNG to ${L} or smaller in seconds — right in your browser, with no watermark, no sign-up, and no software. Just upload, and the tool automatically finds the right quality (and downscales if needed) to hit your target size while keeping the image as sharp as possible.`,
    why: `Many websites and forms enforce a maximum file size, and a photo straight from a phone or camera is usually far too big. Compressing to ${L} is ideal for ${useCase}. Instead of guessing at a quality slider, you set the target and the tool does the math — binary-searching the compression level and, for very small targets, gently reducing the dimensions until the file fits under ${L}. It's free and unlimited, so you can compress as many images as you need.`,
    steps: [
      { t: "Upload your image", d: "Open the compressor and drag in your JPG or PNG (or click to browse). Everything runs in your browser — your image never leaves your device." },
      { t: `Set the target to ${L}`, d: `The target size is preset to ${L}. You can fine-tune it or pick another size — the tool automatically compresses to hit it.` },
      { t: "Download the smaller file", d: `Save your compressed image at ${L} or under. No watermark, no quality-wrecking, and no limit on how many you compress.` },
    ],
    faqs: [
      { q: `How do I compress an image to ${L}?`, a: `Upload it to JPT AI's free compressor, set the target size to ${L}, and download the result. The tool automatically adjusts quality (and dimensions if needed) to fit under ${L}.` },
      { q: `Will compressing to ${L} ruin the quality?`, a: c.kb <= 50
          ? `Very small targets like ${L} require heavier compression, so some detail is lost — but the tool keeps the image as sharp as possible for that size, which is usually fine for forms and thumbnails.`
          : `${L} leaves enough room to keep the image looking clean for web and email use. The tool uses the highest quality that still fits under ${L}.` },
      { q: `Is it free to compress images to ${L}?`, a: `Yes — completely free, no sign-up, no watermark, and no limit on how many images you compress.` },
      { q: `Does it work on phone?`, a: `Yes. The compressor runs in any modern browser on iPhone, Android, Windows, and Mac. Nothing to install.` },
    ],
  };
}

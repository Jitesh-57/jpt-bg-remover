// Data + content generator for the crop-preset landing pages under
// /crop/<slug>. Each deep-links into the editor's Crop tool with the aspect
// ratio preselected (?tool=crop&ratio=...). Only ratios the crop tool supports
// are used: 1:1, 4:5, 9:16, 16:9, and circle.

export interface CropPreset {
  slug: string;
  ratio: string;      // "1:1" | "4:5" | "9:16" | "16:9" | "circle"
  h1: string;
  name: string;       // short label, e.g. "square"
  keyword: string;    // primary keyword phrase
  context: string;    // where it's used
}

export const CROPS: CropPreset[] = [
  {
    slug: "crop-image-to-square",
    ratio: "1:1",
    h1: "Crop Image to Square (1:1)",
    name: "square",
    keyword: "crop image to square",
    context: "Instagram posts, profile pictures, product thumbnails, and app icons",
  },
  {
    slug: "instagram-profile-picture",
    ratio: "circle",
    h1: "Instagram Profile Picture Crop (Circle)",
    name: "circle profile picture",
    keyword: "instagram profile picture crop",
    context: "Instagram, WhatsApp, and other profile photos that display as a circle",
  },
  {
    slug: "youtube-thumbnail-crop",
    ratio: "16:9",
    h1: "Crop Image for a YouTube Thumbnail (16:9)",
    name: "16:9 widescreen",
    keyword: "youtube thumbnail crop",
    context: "YouTube thumbnails, video covers, and widescreen banners",
  },
  {
    slug: "instagram-story-size",
    ratio: "9:16",
    h1: "Crop Image to Instagram Story Size (9:16)",
    name: "9:16 vertical",
    keyword: "instagram story size",
    context: "Instagram and Facebook Stories, Reels, TikTok, and phone wallpapers",
  },
  {
    slug: "instagram-post-size",
    ratio: "4:5",
    h1: "Crop Image to Instagram Post Size (4:5)",
    name: "4:5 portrait",
    keyword: "instagram post size",
    context: "Instagram portrait posts that take up the most space in the feed",
  },
  {
    slug: "circle-crop-image",
    ratio: "circle",
    h1: "Circle Crop Image Online",
    name: "circle",
    keyword: "circle crop",
    context: "profile pictures, logos, avatars, and round stickers",
  },
];

export function getCrop(slug: string): CropPreset | undefined {
  return CROPS.find((c) => c.slug === slug);
}

export interface CropContent {
  slug: string;
  ratio: string;
  h1: string;
  title: string;
  metaDescription: string;
  keywords: string;
  intro: string;
  steps: { t: string; d: string }[];
  faqs: { q: string; a: string }[];
}

export function buildCropContent(c: CropPreset): CropContent {
  const shape = c.ratio === "circle" ? "circle" : `${c.ratio} ratio`;
  return {
    slug: c.slug,
    ratio: c.ratio,
    h1: c.h1,
    title: `${c.h1} — Free Online Crop Tool | JPT AI`,
    metaDescription: `${c.h1} free online. Upload a photo and crop it to a ${shape} in one click — no watermark, no sign-up. Perfect for ${c.context}.`,
    keywords: `${c.keyword}, ${c.keyword} online, ${c.keyword} free, crop image ${shape}, crop photo ${c.ratio === "circle" ? "circle" : c.ratio}`,
    intro: `Need to ${c.keyword}? This free online crop tool trims your photo to a perfect ${shape} in one click — right in your browser, with no watermark and no sign-up. It center-crops your image so the important part stays in frame, ideal for ${c.context}.`,
    steps: [
      { t: "Upload your photo", d: "Open the crop tool and drag in your image, or click to browse. It's processed privately in your browser." },
      { t: `Crop to ${shape}`, d: `The ${shape} is preselected — just hit Crop and the tool center-crops your image to fit.` },
      { t: "Download", d: "Save your cropped image instantly. No watermark, no limits, completely free." },
    ],
    faqs: [
      { q: `How do I ${c.keyword} for free?`, a: `Upload your photo to JPT AI's free crop tool, and it's preset to a ${shape} — click Crop and download. No sign-up, no watermark.` },
      { q: c.ratio === "circle" ? "Will the corners be transparent?" : "Does it lose quality?", a: c.ratio === "circle"
          ? "Yes — a circle crop produces a PNG with transparent corners, so it drops cleanly onto any background as a round image."
          : "No. Cropping only trims the edges; the remaining area keeps its original quality." },
      { q: "Is it free?", a: "Yes — completely free with no sign-up, no watermark, and no limit on how many images you crop." },
      { q: "Does it work on my phone?", a: "Yes, on any modern browser on iPhone, Android, Windows, and Mac. Nothing to install." },
    ],
  };
}

// Data + content generator for the programmatic image-conversion landing pages
// under /convert/<slug> (e.g. /convert/png-to-jpg). Only conversions the free
// canvas-based tool can actually perform are listed here (input formats a
// browser can decode in an <img>, output ∈ jpg | png | webp).

export type Fmt = "jpg" | "png" | "webp" | "gif" | "bmp" | "svg" | "avif";

interface FmtInfo {
  label: string;      // display, e.g. "JPG"
  full: string;       // e.g. "JPEG"
  transparency: boolean;
  lossy: boolean;
  blurb: string;      // one-liner about the format
}

export const FORMATS: Record<Fmt, FmtInfo> = {
  jpg:  { label: "JPG",  full: "JPEG", transparency: false, lossy: true,  blurb: "the universal, small-file photo format supported everywhere" },
  png:  { label: "PNG",  full: "PNG",  transparency: true,  lossy: false, blurb: "a lossless format with transparency, ideal for graphics and screenshots" },
  webp: { label: "WebP", full: "WebP", transparency: true,  lossy: true,  blurb: "Google's modern web format that keeps quality at a much smaller size" },
  gif:  { label: "GIF",  full: "GIF",  transparency: true,  lossy: false, blurb: "an old 256-colour format mainly used for simple animations" },
  bmp:  { label: "BMP",  full: "BMP",  transparency: false, lossy: false, blurb: "an uncompressed legacy format that produces very large files" },
  svg:  { label: "SVG",  full: "SVG",  transparency: true,  lossy: false, blurb: "a vector format that scales infinitely, used for logos and icons" },
  avif: { label: "AVIF", full: "AVIF", transparency: true,  lossy: true,  blurb: "the newest, smallest image format with excellent compression" },
};

// Output format → the editor's convert `to` param value.
export const TO_PARAM: Record<"jpg" | "png" | "webp", string> = { jpg: "jpeg", png: "png", webp: "webp" };

export interface Conversion { from: Fmt; to: "jpg" | "png" | "webp"; slug: string; }

const PAIRS: [Fmt, "jpg" | "png" | "webp"][] = [
  ["png", "jpg"], ["jpg", "png"], ["png", "webp"], ["webp", "png"],
  ["webp", "jpg"], ["jpg", "webp"], ["gif", "png"], ["bmp", "jpg"],
  ["svg", "png"], ["avif", "jpg"], ["avif", "png"], ["heic" as Fmt, "jpg"],
].filter(([f]) => f in FORMATS) as [Fmt, "jpg" | "png" | "webp"][];

export const CONVERSIONS: Conversion[] = PAIRS.map(([from, to]) => ({ from, to, slug: `${from}-to-${to}` }));

export function getConversion(slug: string): Conversion | undefined {
  return CONVERSIONS.find((c) => c.slug === slug);
}

// ── Content generation ──────────────────────────────────────────────────────

export interface ConversionContent {
  slug: string;
  fromLabel: string;
  toLabel: string;
  toParam: string;
  h1: string;
  title: string;
  metaDescription: string;
  keywords: string;
  intro: string;
  whyHeading: string;
  why: string;
  steps: { t: string; d: string }[];
  transparencyNote: string;
  faqs: { q: string; a: string }[];
}

export function buildContent(c: Conversion): ConversionContent {
  const f = FORMATS[c.from];
  const t = FORMATS[c.to];
  const fl = f.label, tl = t.label;

  const transparencyNote = f.transparency && !t.transparency
    ? `Note: ${fl} can store transparency but ${tl} cannot — any transparent areas are filled with a white background when you convert. If you need to keep transparency, convert to PNG or WebP instead.`
    : !f.transparency && t.transparency
    ? `${tl} supports transparency, but a ${fl} file has none to begin with, so your converted image keeps its solid background.`
    : t.transparency
    ? `Both formats support transparency, so any transparent areas in your ${fl} are preserved in the ${tl} output.`
    : `${tl} does not use transparency, so your image is exported with a solid background.`;

  const sizeAngle = t.lossy && !f.lossy
    ? `The main reason to convert ${fl} to ${tl} is file size: ${tl} is ${t.lossy ? "compressed" : "lossless"}, so the result is dramatically smaller and faster to upload, email, or load on a website — with almost no visible difference in quality.`
    : !t.lossy && f.lossy
    ? `Converting ${fl} to ${tl} gives you a lossless copy that won't degrade further when edited or re-saved, and (for PNG) adds transparency support — handy for graphics, logos, and screenshots.`
    : c.to === "webp"
    ? `WebP typically produces files 25–35% smaller than ${fl} at the same visual quality, which makes it ideal for websites and faster page loads.`
    : `Converting to ${tl} gives you a widely-supported ${tl} file that opens on any device, in any app, and uploads to any website without compatibility errors.`;

  const h1 = `Convert ${fl} to ${tl}`;

  return {
    slug: c.slug,
    fromLabel: fl,
    toLabel: tl,
    toParam: TO_PARAM[c.to],
    h1,
    title: `${fl} to ${tl} Converter — Convert ${fl} to ${tl} Online Free | JPT AI`,
    metaDescription: `Convert ${fl} to ${tl} online free. Upload a ${fl} image and download a ${tl} file in seconds — no watermark, no sign-up, no software. Fast, private, unlimited.`,
    keywords: `${c.from} to ${c.to}, convert ${c.from} to ${c.to}, ${c.from} to ${c.to} converter, ${c.from} to ${c.to} online, change ${c.from} to ${c.to}, ${c.from} to ${c.to} free`,
    intro: `Need to convert ${fl} to ${tl}? This free online ${fl}-to-${tl} converter does it in seconds — right in your browser, with no watermark, no sign-up, and no software to install. ${fl} is ${f.blurb}; ${tl} is ${t.blurb}. ${sizeAngle}`,
    whyHeading: `Why convert ${fl} to ${tl}?`,
    why: `${sizeAngle} ${transparencyNote} Because everything happens instantly and the tool is completely free, you can convert as many ${fl} files to ${tl} as you like without limits or accounts.`,
    steps: [
      { t: `Upload your ${fl} image`, d: `Open the converter and drag in your ${fl} file, or click to browse. Your image is processed privately — nothing is uploaded to a server for the conversion.` },
      { t: `Convert to ${tl}`, d: `The tool re-encodes your image as ${tl} instantly. Pick ${tl} as the output format and hit convert.` },
      { t: `Download your ${tl} file`, d: `Save the converted ${tl} image to your device. No watermark, no quality loss beyond the format change, and no limit on how many you convert.` },
    ],
    transparencyNote,
    faqs: [
      { q: `How do I convert ${fl} to ${tl} for free?`, a: `Upload your ${fl} image to JPT AI's free converter, choose ${tl} as the output, and download the result. It's completely free with no sign-up and no watermark.` },
      { q: `Will converting ${fl} to ${tl} reduce quality?`, a: t.lossy
          ? `${tl} uses compression, so there's a tiny quality trade-off in exchange for a much smaller file — in practice it's not visible for photos. For maximum quality, choose PNG instead.`
          : `${tl} is lossless, so no quality is lost in the conversion itself — your image stays crisp.` },
      { q: `Is it safe to convert ${fl} images online?`, a: `Yes. The conversion runs in your browser, so your ${fl} image stays on your device. There's no account required and no watermark added.` },
      { q: `Can I convert ${fl} to ${tl} on my phone?`, a: `Yes. The converter works in any modern browser on iPhone, Android, Windows, and Mac — nothing to install.` },
    ],
  };
}

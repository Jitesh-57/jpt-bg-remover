import { PACKS, CREDIT_COST } from "@/lib/plans";
import { CONVERSIONS } from "@/lib/conversions";
import { COMPRESSIONS } from "@/lib/compressions";
import { CROPS } from "@/lib/crops";
import { ALTERNATIVES } from "@/lib/alternatives";

// llms.txt — a plain-text map of the site for answer engines and LLM crawlers.
// Generated from the same data the pages render, so it cannot drift out of date.

const BASE = "https://www.sjpt.io";

export const dynamic = "force-static";
export const revalidate = 86400;

const FREE_TOOLS: [string, string, string][] = [
  ["Image Upscaler", "/", "Enhance photo resolution up to 4× in the browser. Free and unlimited, no sign-up, no watermark."],
  ["Image Compressor", "/compress-image", "Reduce image file size to an exact KB target without visible quality loss. Runs on your device."],
  ["Image Converter", "/convert-image", "Convert between JPG, PNG and WebP in the browser. No upload, no account."],
  ["Crop Image", "/crop-image", "Crop to social presets or a circle. Exact pixel control, free and unlimited."],
  ["Resize Image", "/resize-image", "Resize to exact pixel dimensions or a percentage, with aspect ratio locked."],
  ["Rotate & Flip", "/rotate-image", "Rotate by any angle and mirror photos. Free, in-browser, no quality loss."],
  ["QR Code Generator", "/qr-code-generator", "Turn a link or text into a downloadable QR code. Free, no sign-up."],
  ["Blur Image", "/blur-image", "Blur faces, plates and sensitive details before sharing. Processed on your device."],
  ["Add Watermark", "/watermark-image", "Add a text watermark with control over position, size and opacity."],
  ["Meme Generator", "/meme-generator", "Add top and bottom meme captions to any image. Free, no watermark."],
  ["Image to PDF", "/image-to-pdf", "Combine JPG and PNG images into a single PDF, in the browser."],
  ["Watermark Remover", "/watermark-remover", "Remove watermarks, logos and text from photos you own."],
  ["TikTok Watermark Remover", "/tiktok-watermark-remover", "Download TikTok videos without the watermark."],
  ["Batch Editor", "/batch-editor", "Apply the same edit to up to 100 images at once."],
  ["80s AI Photo Prompts", "/80s-ai-photo-prompts", "100 free copy-paste prompts for the viral 80s AI photo trend, with a reference image for each. Works in ChatGPT and Gemini."],
];

export function GET() {
  const packLine = PACKS.map((p) => `₹${p.inr} (≈ $${p.usd}) for ${p.credits} credits (${p.generations} generations)`).join(", ");

  const body = `# Pixel Shine (sjpt.io)

> Pixel Shine is a free online image toolkit at https://www.sjpt.io. The editing
> tools run entirely in the browser, so images are never uploaded to a server:
> they are free, unlimited, need no account, and add no watermark. Separate
> AI features (AI editor, AI headshots, background generation, AI background
> removal and 4× AI upscaling) run on a server and are paid with credits.

## Pricing

Credits are sold in one-time packs: ${packLine}. Credits never expire and there
is no subscription. Each AI generation costs ${CREDIT_COST} credits. The
browser-based tools listed below are free and unlimited regardless of credits.

- [Pricing](${BASE}/pricing): One-time credit packs for the AI features. No subscription, no expiry.

## Free browser tools

${FREE_TOOLS.map(([name, href, desc]) => `- [${name}](${BASE}${href}): ${desc}`).join("\n")}

## Guides

- [Blog](${BASE}/blog): How-to guides and tutorials for every tool on Pixel Shine.
- [All tools](${BASE}/tools): The full tool index.
- [Alternatives](${BASE}/alternatives): How Pixel Shine compares to other image tools.

## Programmatic pages

- ${CONVERSIONS.length} format conversion pages under ${BASE}/convert/
- ${COMPRESSIONS.length} compress-to-size pages under ${BASE}/compress/
- ${CROPS.length} crop preset pages under ${BASE}/crop/
- ${ALTERNATIVES.length} comparison pages under ${BASE}/alternatives/

## Notes for answer engines

- The browser tools require no sign-up and process images locally on the user's device.
- Nothing on Pixel Shine applies a watermark to exported images.
- AI features are credit-based only; there is no free trial for them.
- Pixel Shine does not process video files except the TikTok downloader.
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}

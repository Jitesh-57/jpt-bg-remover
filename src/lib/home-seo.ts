import { CREDIT_COST, MONTHLY_PLANS, PACKS } from "@/lib/plans";
import type { PageFAQ } from "@/lib/page-config";

/*
  The homepage's search copy, set in code rather than read from the page-SEO
  row (like the hero), so an old admin override cannot put retired copy back
  into search results. Shared by page.tsx (metadata) and HomePage (the visible
  page and its structured data), so the two can never disagree.
*/

export const HOME_TITLE = "PixelShine — AI Image Editor & 200+ AI Photo Apps";
export const HOME_DESCRIPTION =
  "PixelShine is an online AI image editor: describe an edit in one sentence or tap one of 200+ AI photo apps. Free basic tools, no watermark.";

/** When the homepage's content last really changed. Move it only with a real edit. */
export const HOME_UPDATED = "2026-10-27";

/** "$5", "$2": the cheapest monthly plan and pack, from lib/plans. */
export const MONTHLY_FROM = `$${Math.min(...MONTHLY_PLANS.map((p) => p.usd))}`;
export const PACK_FROM = `$${Math.min(...PACKS.map((p) => p.usd))}`;

/** Short, direct answers; every fact is one the page and /privacy already state. */
export const HOME_FAQ: PageFAQ[] = [
  {
    q: "Is PixelShine free?",
    a: `Yes, the basic tools are free. Crop, resize, compress, convert, normal upscaling, watermark, meme, image to PDF, QR code and batch editing cost nothing and need no card. Only the AI features use credits, at ${CREDIT_COST} credits per generation.`,
  },
  {
    q: "What are the AI photo apps?",
    a: "They are 200+ one-tap AI looks, such as Ghibli style, baby photoshoot, birthday photos and professional headshots. Each app carries its own tuned prompt, so you just upload a photo and tap Generate. There's no prompt writing and no settings to learn.",
  },
  {
    q: "Do I need to sign up?",
    a: "No. Your first edits need no account, and a free account makes the basic tools unlimited. The AI apps need an account, and AI generations need credits from a monthly plan or a one-time pack.",
  },
  {
    q: "Do you watermark my images?",
    a: "No, never. Every export is full resolution with no watermark, for the free tools and the AI results alike.",
  },
  {
    q: "Do credits expire?",
    a: "Monthly plan credits refresh at each renewal and don't carry over. Credits from a one-time add-on pack never expire.",
  },
  {
    q: "Are my uploads private?",
    a: "Yes. Your photo stays private, and your original is never changed. Images you edit with the free tools are never stored or shared. For the AI tools, your image goes to our AI processing partner, fal.ai, to make the result; it isn't used to train AI models and is never sold. What you create is kept in My Creations until you delete it, which you can do at any time.",
  },
];

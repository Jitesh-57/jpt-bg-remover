// Per-page creative images stored in Supabase Storage, organised into one
// folder per page so creatives can be generated and swapped per page.
//
// Convention (bucket "landing"):
//   landing/creatives/<page>/<slot>.png
//
// e.g. landing/creatives/home/remove-bg-before.png
//      landing/creatives/home/remove-bg-after.png
//      landing/creatives/upscale/hero.png
//
// Uploading a file to that path makes it appear automatically; missing files
// fall back to a designed placeholder (see BeforeAfter), so pages look good
// before any creative is generated. See docs/creatives-folders.md for the full
// folder list to create in Supabase.

import { landingImg } from "./landing-images";

const SUPA =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://lwworujvfttxkrjfrgav.supabase.co";

/** Public URL for a creative in landing/creatives/<page>/<slot>.png */
export function creativeUrl(page: string, slot: string): string {
  return `${SUPA}/storage/v1/object/public/landing/creatives/${page}/${slot}.png`;
}

export interface Showcase {
  key: string;
  title: string;
  caption: string;
  emoji: string;
  /** gradient used for the placeholder before a real creative is uploaded */
  grad: string;
  before: string;
  after: string;
}

// Before/after showcases on the home page. Each reads two files from
// landing/creatives/home/<key>-before.png and <key>-after.png. The upscale pair
// is seeded with the existing real images so the section looks great today.
export const HOME_SHOWCASE: Showcase[] = [
  {
    key: "remove-bg",
    title: "Remove any background",
    caption: "One click to a clean, transparent cut-out — hair and edges included.",
    emoji: "🪄",
    grad: "linear-gradient(135deg,#EEF2FF,#E0E7FF)",
    before: creativeUrl("home", "remove-bg-before"),
    after: creativeUrl("home", "remove-bg-after"),
  },
  {
    key: "upscale",
    title: "Upscale to crisp 4K",
    caption: "AI rebuilds real detail as it enlarges — no blur, no pixelation.",
    emoji: "🔍",
    grad: "linear-gradient(135deg,#ECFEFF,#CFFAFE)",
    before: landingImg("upscale-before.jpg") || creativeUrl("home", "upscale-before"),
    after: landingImg("upscale-after.jpg") || creativeUrl("home", "upscale-after"),
  },
  {
    key: "restore",
    title: "Restore old photos",
    caption: "Bring faded, scratched family photos back to life in seconds.",
    emoji: "🖼️",
    grad: "linear-gradient(135deg,#FFF7ED,#FFEDD5)",
    before: creativeUrl("home", "restore-before"),
    after: creativeUrl("home", "restore-after"),
  },
];

// Pages that should have a creatives folder + the slots each expects. Used by
// docs and by any generation pipeline to know what to produce.
export const CREATIVE_MANIFEST: Record<string, string[]> = {
  home: [
    "hero",
    "remove-bg-before", "remove-bg-after",
    "upscale-before", "upscale-after",
    "restore-before", "restore-after",
  ],
  upscale: ["hero", "before", "after"],
  "remove-bg": ["hero", "before", "after"],
  "compress-image": ["before", "after"],
  "convert-image": ["before", "after"],
  "crop-image": ["before", "after"],
  "resize-image": ["before", "after"],
  "blur-image": ["before", "after"],
};

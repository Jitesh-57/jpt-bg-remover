// Master switch for the paid / AI features.
//
// TRUE: the Creative Apps, AI Editor, AI Headshot, Generate BG, Remove BG (AI)
// and Pro Upscale are visible and run on credits (see lib/plans.ts). The free
// on-device tools — Upscale (Normal), Resize, Adjust, Batch Editor and the
// browser-side tools — stay free and unlimited for everyone regardless.
//
// FALSE puts the app back into free-only mode; nothing is deleted either way.
export const PAID_FEATURES_ENABLED = true;

// Route prefixes that are hidden in free-only mode (middleware redirects them
// to "/"). Keep in sync with the nav/footer/landing conditionals.
export const PAID_ROUTE_PREFIXES = [
  "/creative",
  "/ai-editor",
  "/ai-headshot",
  "/headshot",
  "/remove-bg",
  // "/pricing" stays public — it now sells the single $3 Unlimited plan.
  "/generations",
];

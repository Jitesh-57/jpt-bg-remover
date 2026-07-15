// Master switch for the paid / AI features.
//
// While FALSE, the app runs in "free-only" mode: the Creative Apps, AI Editor,
// AI Headshot, Generate BG, Remove BG (AI), Pro Upscale, the blog, and pricing
// are all hidden from the UI, and their pages redirect home. Only the free,
// on-device tools stay: the Image Editor's Upscale (Normal) / Resize / Adjust
// and the Batch Editor.
//
// Set this to TRUE to bring every paid/AI feature back (e.g. once Gemini
// billing is active). Nothing is deleted — it's purely a visibility switch.
export const PAID_FEATURES_ENABLED = false;

// Route prefixes that are hidden in free-only mode (middleware redirects them
// to "/"). Keep in sync with the nav/footer/landing conditionals.
export const PAID_ROUTE_PREFIXES = [
  "/creative",
  "/ai-editor",
  "/ai-headshot",
  "/headshot",
  "/remove-bg",
  "/pricing",
  "/generations",
];

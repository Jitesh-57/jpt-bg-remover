/**
 * popups.ts — every pop-up on the site, and what /admin/popups changes about them.
 *
 * Two kinds:
 *
 *   built in  pop-ups the site's code shows (the sign-up popup, the free trial
 *             bar, the pricing popup, …). Each is listed in BUILTIN_POPUPS with
 *             every line of text it shows; the component reads its words through
 *             usePopup(id), so admin can rewrite any of them, and switch the
 *             pop-up off where that is safe.
 *   custom    pop-ups made in admin from scratch: a design, words, a button
 *             and a link, who sees it, on which pages, when and how often.
 *             CustomPopupHost shows them.
 *
 * ADDING A POP-UP TO THE CODE? Add it to BUILTIN_POPUPS with its texts as
 * fields, and read them with usePopup() (popups.client.ts). /admin/popups lists
 * this array, so a
 * pop-up registered here appears there with nothing else to do.
 *
 * Safe to import anywhere: no React, no secrets. The hooks are in popups.client.ts.
 *
 * The settings are one small JSON document in storage, like the page edits:
 *
 *   { version: 1, updatedAt,
 *     builtin: { "signup": { enabled: true, text: { trialTitle: "…" } }, … },
 *     custom:  [ { id, name, enabled, design, title, … }, … ] }
 *
 * Browsers read it straight from storage, so a change shows within a minute
 * without a deploy. Anything missing falls back to the defaults below.
 */

export const POPUPS_BUCKET = "landing";
export const POPUPS_PATH = "overrides/popups.json";
export const MAX_POPUP_TEXT = 2000;
export const MAX_CUSTOM_POPUPS = 50;

/** The four layouts a card-style pop-up can take (PopupView). */
export type PopupDesign = "split" | "card" | "center" | "corner";
export const POPUP_DESIGNS: [PopupDesign, string][] = [
  ["split", "Big split, in the middle"],
  ["card", "Photo card, in the middle"],
  ["center", "Small card, in the middle"],
  ["corner", "Small card, bottom corner"],
];

export type FieldKind = "text" | "long" | "list" | "url" | "image" | "number" | "select";

export interface PopupField {
  key: string;
  label: string;
  kind: FieldKind;
  default: string;
  /** Heading the field is listed under in admin. */
  group?: string;
  help?: string;
  options?: [string, string][];
}

export interface PopupDef {
  id: string;
  name: string;
  /** Where and when it shows, in a sentence, for admin. */
  where: string;
  /** False where switching it off would break something (buying, signing in). */
  canTurnOff: boolean;
  /** The {placeholders} its text may use, filled in on the page. */
  tokens?: Record<string, string>;
  /** A card-style pop-up admin can preview with PopupView. */
  previewable?: boolean;
  fields: PopupField[];
}

const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
/** An app's published before|after creative (before on the left, after on the right). */
export const creativeImage = (slug: string) => (SUPA ? `${SUPA}/storage/v1/object/public/landing/creatives/${slug}-main.webp` : "");

const TRIAL = "When the free trial is on";
const NO_TRIAL = "When there's no free trial";
const BUTTONS = "Buttons";
const PICTURE = "Picture";
const SHOWING = "When it shows";

export const BUILTIN_POPUPS: PopupDef[] = [
  {
    id: "signup",
    name: "Sign-up popup",
    where: "Signed-out visitors on every page, 5 seconds after it opens; if closed, it comes back once 20 s later. Not on the app, admin, sign-in, pricing or payment pages.",
    canTurnOff: true,
    previewable: true,
    tokens: { credits: "the free credits a new account gets", generations: "how many AI generations they cover" },
    fields: [
      { key: "design", label: "Design", kind: "select", default: "split", group: SHOWING, options: POPUP_DESIGNS },
      { key: "delay", label: "Show after (seconds)", kind: "number", default: "5", group: SHOWING },
      { key: "reshowSeconds", label: "After it's closed, show again after (seconds)", kind: "number", default: "20", group: SHOWING },
      { key: "reshowTimes", label: "Times it comes back on the same page", kind: "number", default: "1", group: SHOWING },
      { key: "image", label: "Picture", kind: "image", default: creativeImage("outfit-generator"), group: PICTURE, help: "A before|after side-by-side picture wipes between the two halves." },
      { key: "caption", label: "Picture caption", kind: "text", default: "One selfie → an evening look", group: PICTURE },
      { key: "trialBadge", label: "Badge", kind: "text", default: "🎁 Free trial", group: TRIAL },
      { key: "trialTitle", label: "Headline", kind: "text", default: "Your first AI generation is free", group: TRIAL },
      { key: "trialText", label: "Text", kind: "long", default: "Sign up free and we add {credits} credits to your account, so your first AI photo is on us. Turn any selfie into a studio shoot in seconds.", group: TRIAL },
      { key: "trialBullets", label: "Tick list (one per line)", kind: "list", default: "Your first generation is free\n200+ AI photo apps — headshots, Ghibli, saree, outfits\nEvery result saved to your library\nNo card needed", group: TRIAL },
      { key: "badge", label: "Badge", kind: "text", default: "🎁 Free account", group: NO_TRIAL },
      { key: "title", label: "Headline", kind: "text", default: "Make photos like this", group: NO_TRIAL },
      { key: "text", label: "Text", kind: "long", default: "Create a free account to use 200+ AI photo apps and keep every result in one place.", group: NO_TRIAL },
      { key: "bullets", label: "Tick list (one per line)", kind: "list", default: "200+ AI photo apps — headshots, Ghibli, saree, outfits\nEvery result saved to your library\nNo card needed", group: NO_TRIAL },
      { key: "googleButton", label: "Google button", kind: "text", default: "Continue with Google", group: BUTTONS },
      { key: "emailButton", label: "Email link", kind: "text", default: "Sign up with email", group: BUTTONS },
      { key: "laterButton", label: "Close link", kind: "text", default: "Maybe later", group: BUTTONS },
      { key: "foot", label: "Small print (photo card design)", kind: "text", default: "Free account · no card needed", group: BUTTONS },
    ],
  },
  {
    id: "trial-bar",
    name: "Free trial bar",
    where: "The strip above the menu on every page, while the free trial is on for the visitor's country.",
    canTurnOff: true,
    tokens: { credits: "the free credits a new account gets", generationsText: "e.g. \"1 AI generation\"", country: "the visitor's country" },
    fields: [
      { key: "title", label: "Bold text", kind: "text", default: "Your first AI generation is on us." },
      { key: "text", label: "Text after it (hidden on phones)", kind: "long", default: "Create a free account and get {credits} credits, enough for {generationsText}. New accounts in {country}." },
      { key: "button", label: "Button", kind: "text", default: "Claim it" },
    ],
  },
  {
    id: "welcome",
    name: "Welcome message",
    where: "The banner a new account sees straight after signing up, when free credits were added.",
    canTurnOff: true,
    tokens: { credits: "the free credits they got", resultsText: "e.g. \"your first AI result is on us\"" },
    fields: [
      { key: "text", label: "Message", kind: "long", default: "🎁 Free trial: you got {credits} free credits — {resultsText}. Hit Generate." },
    ],
  },
  {
    id: "share",
    name: "Share popup",
    where: "After someone downloads from the photo editor, once per visit.",
    canTurnOff: true,
    fields: [
      { key: "title", label: "Headline", kind: "text", default: "Download started!" },
      { key: "text", label: "Text", kind: "long", default: "Loved it? Help a friend find Pixel Shine — it's free, no watermark, no sign-up." },
      { key: "shareText", label: "Message people share", kind: "long", default: "I just edited my photo at Pixel Shine — remove backgrounds, upscale, convert & more. Free, no watermark. 🎨" },
      { key: "shareButton", label: "Share button", kind: "text", default: "Share ↗" },
      { key: "copyButton", label: "Copy link button", kind: "text", default: "🔗 Copy link" },
      { key: "copied", label: "After copying", kind: "text", default: "✓ Link copied!" },
      { key: "close", label: "Close link", kind: "text", default: "No thanks" },
    ],
  },
  {
    id: "pricing",
    name: "Pricing popup",
    where: "When someone needs credits, or taps Buy credits. Always on: it's how people buy.",
    canTurnOff: false,
    tokens: { reason: "what needs credits, e.g. \"4× upscaling\"", cost: "credits per AI generation" },
    fields: [
      { key: "title", label: "Headline", kind: "text", default: "Unlock every AI tool" },
      { key: "buyTitle", label: "Headline from the Buy credits button", kind: "text", default: "Buy more AI credits" },
      { key: "neededTitle", label: "Headline when something needs credits", kind: "text", default: "Credits needed for {reason}" },
      { key: "sub", label: "Text under the headline", kind: "long", default: "{cost} credits per AI generation · full resolution, no watermark · the free tools stay free." },
      { key: "caption", label: "Picture caption", kind: "text", default: "One selfie → a full styled shoot" },
      { key: "captionSub", label: "Picture small print", kind: "text", default: "Made with Pixel Shine AI · {cost} credits" },
    ],
  },
  {
    id: "sign-in",
    name: "Sign-in form",
    where: "When an action needs an account (editor, batch editor, \"Sign up with email\"). Always on: it's how people sign in.",
    canTurnOff: false,
    fields: [
      { key: "title", label: "Headline", kind: "text", default: "Sign in to continue" },
      { key: "text", label: "Text", kind: "long", default: "Create a free account to continue. It takes a second and keeps your work saved." },
      { key: "limitTitle", label: "Headline after the free edits are used", kind: "text", default: "Sign in to keep going" },
      { key: "limitText", label: "Text after the free edits are used", kind: "long", default: "You've used your 2 free edits. Create a free account to keep using every basic tool — unlimited, no card." },
      { key: "bullets", label: "Tick list (one per line)", kind: "list", default: "Free basic image tools\nYour edits saved to your account\nNo credit card required" },
    ],
  },
  {
    id: "one-tap",
    name: "Google One Tap",
    where: "Google's own \"Continue as …\" prompt for signed-out visitors on the home page, AI apps and prompt library. Google writes its text.",
    canTurnOff: true,
    fields: [],
  },
];

export const builtinPopup = (id: string) => BUILTIN_POPUPS.find((p) => p.id === id);

export interface BuiltinSettings {
  enabled?: boolean;
  text?: Record<string, string>;
}

export interface CustomPopup {
  id: string;
  name: string;
  enabled: boolean;
  design: PopupDesign;
  badge: string;
  title: string;
  text: string;
  /** One per line. */
  bullets: string;
  button: string;
  /** "link" opens `link`; "signup" starts Google sign-up. */
  action: "link" | "signup";
  link: string;
  secondary: string;
  secondaryLink: string;
  dismiss: string;
  image: string;
  caption: string;
  /** The picture is a before|after side by side: it wipes between the halves. */
  beforeAfter: boolean;
  audience: "everyone" | "signed-out" | "signed-in";
  /** One per line: "/pricing" is that page, "/blog*" every page under it. Blank: every page. */
  pages: string;
  /** Seconds after landing. */
  delay: number;
  /** After it's closed, show again after this many days; 0 = once per visit. */
  repeatDays: number;
}

export interface PopupsDoc {
  version: 1;
  updatedAt: string;
  builtin: Record<string, BuiltinSettings>;
  custom: CustomPopup[];
}

export const EMPTY_POPUPS: PopupsDoc = { version: 1, updatedAt: "", builtin: {}, custom: [] };

export function newCustomPopup(): CustomPopup {
  return {
    id: `p${Date.now().toString(36)}`,
    name: "New popup",
    enabled: false,
    design: "split",
    badge: "New",
    title: "Your headline here",
    text: "A line or two about the offer.",
    bullets: "",
    button: "Try it now",
    action: "link",
    link: "/creative",
    secondary: "",
    secondaryLink: "",
    dismiss: "Maybe later",
    image: creativeImage("ghibli-style"),
    caption: "",
    beforeAfter: true,
    audience: "everyone",
    pages: "",
    delay: 8,
    repeatDays: 3,
  };
}

/** Fills {placeholders}; an unknown one is left as written. */
export function fillTokens(s: string, vars: Record<string, string | number> = {}): string {
  return s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

/** A link a pop-up may point at: a page on the site or an http(s) address. */
export function safeLink(href: string): string {
  const h = href.trim();
  if (h.startsWith("/") && !h.startsWith("//")) return h;
  try { const u = new URL(h); return u.protocol === "https:" || u.protocol === "http:" ? u.href : ""; } catch { return ""; }
}

/** Does a "pages" list (one per line, "*" at the end for everything under it) include this path? */
export function matchesPages(pages: string, path: string): boolean {
  const rules = pages.split(/\n|,/).map((s) => s.trim()).filter(Boolean);
  if (!rules.length) return true;
  return rules.some((r) => (r.endsWith("*") ? path.startsWith(r.slice(0, -1)) : path === (r.replace(/\/+$/, "") || "/")));
}

/* ── Reading the settings in the browser ─────────────────────────────────── */

let pending: Promise<PopupsDoc> | null = null;

/** The settings document, fetched once per page load and shared by every pop-up on it. */
export function loadPopups(): Promise<PopupsDoc> {
  if (pending) return pending;
  if (!SUPA) return (pending = Promise.resolve(EMPTY_POPUPS));
  // A new address each minute, so a change in admin is picked up within one.
  const url = `${SUPA}/storage/v1/object/public/${POPUPS_BUCKET}/${POPUPS_PATH}?t=${Math.floor(Date.now() / 60_000)}`;
  pending = fetch(url)
    .then((r) => (r.ok ? r.json() : EMPTY_POPUPS))
    .then((d: PopupsDoc) => (d && typeof d === "object" && d.builtin && Array.isArray(d.custom) ? d : EMPTY_POPUPS))
    .catch(() => EMPTY_POPUPS);
  return pending;
}

/** Admin saved: the next read fetches again. */
export function forgetPopups() {
  pending = null;
}

export interface PopupText {
  /** False until the settings have loaded; show nothing switchable before then. */
  ready: boolean;
  enabled: boolean;
  /** The admin's text for a field, or its default, with {placeholders} filled. */
  t: (key: string, vars?: Record<string, string | number>) => string;
  /** A one-per-line field as its lines. */
  list: (key: string, vars?: Record<string, string | number>) => string[];
}

/** A built-in pop-up's words and on/off switch, from settings already loaded (or none). */
export function popupText(id: string, doc: PopupsDoc | null): PopupText {
  const def = builtinPopup(id);
  const own = doc?.builtin[id];
  const t = (key: string, vars?: Record<string, string | number>) => {
    const set = own?.text?.[key];
    const base = set != null && set.trim() !== "" ? set : def?.fields.find((f) => f.key === key)?.default ?? "";
    return fillTokens(base, vars);
  };
  return {
    ready: !!doc,
    enabled: !def?.canTurnOff || own?.enabled !== false,
    t,
    list: (key, vars) => t(key, vars).split("\n").map((s) => s.trim()).filter(Boolean),
  };
}

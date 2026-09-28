/**
 * page-edits.ts — copy and image changes made with the visual page editor.
 *
 * One small JSON document in storage holds every change, keyed by page path,
 * plus "*" for changes that apply on every page (header, footer, …):
 *
 *   { version: 1, updatedAt, pages: {
 *       "/pricing": { text: { "Old sentence": "New sentence" },
 *                     images: { "https://…/old.png": "https://…/new.webp" } },
 *       "*":        { text: { … }, images: { … } } } }
 *
 * Text is matched on the words a visitor sees (whitespace collapsed), images
 * on their source URL, so nothing in the page code has to know about it. See
 * SiteEdits for how the changes are applied and PageEditor for how they're made.
 *
 * Safe to import from the browser: no secrets, no server-only modules.
 */

export const GLOBAL_SCOPE = "*";
export const EDITS_BUCKET = "landing";
export const EDITS_PATH = "overrides/page-edits.json";
export const MAX_TEXT = 4000;

export interface PageRules {
  text?: Record<string, string>;
  images?: Record<string, string>;
}

export interface PageEdits {
  version: 1;
  updatedAt: string;
  pages: Record<string, PageRules>;
}

export const EMPTY_EDITS: PageEdits = { version: 1, updatedAt: "", pages: {} };

/** The words as a visitor reads them: whitespace runs collapsed, ends trimmed. */
export function normText(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/** "/Pricing/" → "/pricing". The key a page's changes are stored under. */
export function normPath(p: string): string {
  const path = (p.split(/[?#]/)[0] || "/").toLowerCase().replace(/\/+$/, "");
  return path || "/";
}

/**
 * The identity of an image: its absolute URL without the query string, and
 * unwrapped from Next's /_next/image optimiser so every size of the same
 * picture shares one key.
 */
export function normImageSrc(src: string, base: string): string {
  if (!src || src.startsWith("data:") || src.startsWith("blob:")) return "";
  try {
    let u = new URL(src, base);
    if (u.pathname === "/_next/image") {
      const inner = u.searchParams.get("url");
      if (inner) u = new URL(inner, base);
    }
    return `${u.origin}${u.pathname}`;
  } catch {
    return "";
  }
}

/** The rules for a path: everything global, with the page's own on top. */
export function rulesFor(edits: PageEdits | null | undefined, path: string): Required<PageRules> {
  const g = edits?.pages?.[GLOBAL_SCOPE] || {};
  const p = edits?.pages?.[normPath(path)] || {};
  return {
    text: { ...(g.text || {}), ...(p.text || {}) },
    images: { ...(g.images || {}), ...(p.images || {}) },
  };
}

export function editsPublicUrl(): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return base ? `${base}/storage/v1/object/public/${EDITS_BUCKET}/${EDITS_PATH}` : "";
}

/** Only images we host ourselves may be swapped in. */
export function isOurImage(url: string): boolean {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return !!base && url.startsWith(`${base}/storage/v1/object/public/${EDITS_BUCKET}/`);
}

/** Admin pages are never edited or rewritten. */
export function isEditablePath(path: string): boolean {
  const p = normPath(path);
  return !(p === "/admin" || p.startsWith("/admin/") || p.startsWith("/api/"));
}

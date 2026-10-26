/**
 * The apps with a page of their own in this folder. Kept apart from the copy
 * so the index policy, which the sitemaps read, can ask "is this app written?"
 * without loading every page's words. index.ts checks the two agree.
 */
export const APP_PAGE_SLUGS = [
  "ghibli-style",
  "3d-figurine",
  "saree-photoshoot",
  "professional-headshot",
  "outfit-generator",
  "baby-photoshoot",
  "restore-old-photos",
  "cartoon-generator",
  "anime-style",
  "90s-yearbook-photo",
  "old-hollywood-glamour",
  "polaroid-photo",
  "glow-up-filter",
  "couple-photoshoot",
  "hairstyle-changer",
] as const;

export type AppPageSlug = (typeof APP_PAGE_SLUGS)[number];

const SET = new Set<string>(APP_PAGE_SLUGS);

export function hasAppPage(slug: string): boolean {
  return SET.has(slug);
}

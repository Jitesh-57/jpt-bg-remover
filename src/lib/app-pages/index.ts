import type { CreativeApp } from "@/lib/creative-apps";
import type { AppPage } from "./types";
import { APP_PAGE_SLUGS, type AppPageSlug } from "./slugs";
import ghibliStyle from "./ghibli-style";
import app3dFigurine from "./3d-figurine";
import sareePhotoshoot from "./saree-photoshoot";
import professionalHeadshot from "./professional-headshot";
import outfitGenerator from "./outfit-generator";
import babyPhotoshoot from "./baby-photoshoot";
import restoreOldPhotos from "./restore-old-photos";
import cartoonGenerator from "./cartoon-generator";
import animeStyle from "./anime-style";
import app90sYearbookPhoto from "./90s-yearbook-photo";
import oldHollywoodGlamour from "./old-hollywood-glamour";
import polaroidPhoto from "./polaroid-photo";
import glowUpFilter from "./glow-up-filter";
import couplePhotoshoot from "./couple-photoshoot";
import hairstyleChanger from "./hairstyle-changer";

/**
 * The apps with a page of their own (one file each in this folder). A page
 * here replaces the category copy longContentFor() composes, and makes the app
 * indexable (lib/seo/index-policy). Server-only: these are long.
 */
export const APP_PAGES: Record<AppPageSlug, AppPage> = {
  "ghibli-style": ghibliStyle,
  "3d-figurine": app3dFigurine,
  "saree-photoshoot": sareePhotoshoot,
  "professional-headshot": professionalHeadshot,
  "outfit-generator": outfitGenerator,
  "baby-photoshoot": babyPhotoshoot,
  "restore-old-photos": restoreOldPhotos,
  "cartoon-generator": cartoonGenerator,
  "anime-style": animeStyle,
  "90s-yearbook-photo": app90sYearbookPhoto,
  "old-hollywood-glamour": oldHollywoodGlamour,
  "polaroid-photo": polaroidPhoto,
  "glow-up-filter": glowUpFilter,
  "couple-photoshoot": couplePhotoshoot,
  "hairstyle-changer": hairstyleChanger,
};

// slugs.ts is what the index policy reads; it must name exactly these pages.
for (const slug of APP_PAGE_SLUGS) if (!APP_PAGES[slug]) throw new Error(`app-pages: ${slug} is listed in slugs.ts but has no page`);
if (Object.keys(APP_PAGES).length !== APP_PAGE_SLUGS.length) throw new Error("app-pages: a page is missing from slugs.ts");

export function appPage(slug: string): AppPage | undefined {
  return (APP_PAGES as Record<string, AppPage>)[slug];
}

/** The app with its page's title, heading, description, line and FAQ in place of its own. */
export function withAppPage<T extends CreativeApp>(app: T, page: AppPage | undefined): T {
  if (!page) return app;
  return { ...app, title: page.title, h1: page.h1, metaDescription: page.metaDescription, tagline: page.tagline, keywords: page.keywords, faq: page.faq };
}

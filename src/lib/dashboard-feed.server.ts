import { byMedia, cardImage, promptHref, fillVariables } from "@/lib/prompts/data";
import { mediaResolver } from "@/lib/prompts/media";
import { CREATIVE_APPS, previewUrl, type CreativeApp } from "@/lib/creative-apps";
import { creativeSources, uploadedCreative } from "@/lib/app-creatives";
import { appsWithExamples } from "@/lib/creative-examples.server";
import { readOverrides } from "@/lib/overrides";
import { categoryOf } from "@/lib/creative-categories";
import { CAT_META, type AppCat } from "@/lib/app-catalog";

/** A community image: a prompt from the CC BY 4.0 library, credited to its author. */
export interface FeedItem {
  uid: string;
  title: string;
  /** Full prompt text, only included when short enough to run as-is. */
  prompt: string | null;
  image: string;
  author: string;
  authorUrl: string | null;
  href: string;
  model: string;
  useCase: string | null;
  needsPhoto: boolean;
}

const RUNNABLE_PROMPT = 3500;
const CJK = /[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/;

/** English-language prompts only: the dashboard audience can't read or edit the Chinese and Japanese ones. */
function isEnglish(r: { languages?: string[]; title: string; prompt: string }): boolean {
  if (r.languages?.some((l) => l === "zh" || l === "ja")) return false;
  return !CJK.test(r.title) && !CJK.test(r.prompt);
}

export async function communityFeed(limit: number, opts?: { textOnly?: boolean }): Promise<FeedItem[]> {
  const resolve = await mediaResolver();
  const out: FeedItem[] = [];
  for (const r of byMedia("image")) {
    if (out.length >= limit) break;
    if (!isEnglish(r)) continue;
    // Placeholders like {argument name="hair color" default="dark brown"} are
    // filled with their defaults: the prompt box shows ready-to-run text.
    const text = r.hasVariables ? fillVariables(r.prompt, {}) : r.prompt;
    if (opts?.textOnly && (r.needsPhoto || text.length > RUNNABLE_PROMPT)) continue;
    const image = resolve(cardImage(r));
    if (!image) continue;
    out.push({
      uid: r.uid,
      title: r.title,
      prompt: text.length <= RUNNABLE_PROMPT ? text : null,
      image,
      author: r.author.name,
      authorUrl: r.author.url,
      href: promptHref(r),
      model: r.model,
      useCase: r.useCase,
      needsPhoto: r.needsPhoto,
    });
  }
  return out;
}

/** An AI app card: whichever example image is best, plus what the card needs to say. */
export interface AppCardData {
  slug: string;
  name: string;
  blurb: string;
  emoji: string;
  gradient: [string, string];
  category: AppCat | null;
  href: string;
  /** Candidate image URLs for the "after" photo, best first — tried in turn by the client. */
  sources: string[];
  /**
   * The creative the live app page shows, when one is published: a single
   * image with the before on the left and the after on the right. Cards draw
   * only its after half.
   */
  main: { url: string; w: number; h: number } | null;
  hasExample: boolean;
}

function toAppCard(a: CreativeApp, main: { w: number; h: number } | undefined, hasExample: boolean): AppCardData {
  return {
    slug: a.slug,
    name: a.h1,
    blurb: a.intro,
    emoji: a.emoji,
    gradient: [a.gradient[0], a.gradient[1]],
    category: categoryOf(a) ?? null,
    href: `/creative/${a.slug}`,
    sources: creativeSources(a.slug, "after", previewUrl(a.slug)),
    main: main && main.w > 0 && main.h > 0 ? { url: uploadedCreative(a.slug, "main"), w: main.w, h: main.h } : null,
    hasExample: !!main || hasExample,
  };
}

/** Every AI app, those with a real example image first, in catalogue order within each half. */
export async function appCards(): Promise<AppCardData[]> {
  const [withExamples, overrides] = await Promise.all([
    appsWithExamples().catch(() => new Set<string>()),
    readOverrides().catch(() => ({ pages: {} as Record<string, { main?: { w: number; h: number } }> })),
  ]);
  const mains = new Map<string, { w: number; h: number }>();
  for (const [key, page] of Object.entries(overrides.pages)) {
    if (page.main && key.startsWith("creative/")) mains.set(key.slice("creative/".length), page.main);
  }
  const cards = CREATIVE_APPS.map((a) => toAppCard(a, mains.get(a.slug), withExamples.has(a.slug)));
  return [...cards.filter((c) => c.hasExample), ...cards.filter((c) => !c.hasExample)];
}

export const APP_CATEGORIES = (Object.keys(CAT_META) as AppCat[]).map((id) => ({ id, label: CAT_META[id].label, emoji: CAT_META[id].emoji }));

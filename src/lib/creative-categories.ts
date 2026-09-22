/**
 * creative-categories.ts — one category per app, reused for the hub and for
 * "related apps" everywhere else.
 *
 * The category itself already existed: every catalogue-generated app carries
 * `cat`, and the 42 hand-written ones are mapped in `CURATED_CAT` — both were
 * built to drive which preset controls an app shows, not for navigation. This
 * file is the second reader of that same fact, so the taxonomy on the hub
 * page and the taxonomy behind "related apps" cannot drift into two
 * different ideas of what an app is.
 *
 * That matters because "related" used to mean "the next six apps in array
 * order" — arbitrary, and exactly the kind of link a search engine treats as
 * noise rather than a signal. Same category is a claim a visitor can check by
 * looking at the two pages.
 */

import { CAT_META, type AppCat } from "@/lib/app-catalog";
import { curatedCategory } from "@/lib/app-options";
import { CREATIVE_APPS, type CreativeApp } from "@/lib/creative-apps";

export function categoryOf(app: Pick<CreativeApp, "slug" | "cat">): AppCat | undefined {
  return (app.cat as AppCat | undefined) ?? (curatedCategory(app.slug) as AppCat | undefined);
}

export interface CategoryGroup {
  id: AppCat;
  label: string;
  emoji: string;
  blurb: string;
  apps: CreativeApp[];
}

/**
 * Every category that has at least one app, in `CAT_META`'s declared order,
 * each carrying its apps in `CREATIVE_APPS`'s existing (stable, hash-based)
 * order.
 *
 * `sortWithin`, when given, reorders each group's own apps — used by the hub
 * to put apps with a real photograph before the ones still drawing
 * placeholder artwork, without changing which category anything is in.
 */
export function categorizedApps(sortWithin?: (a: CreativeApp, b: CreativeApp) => number): CategoryGroup[] {
  const buckets = new Map<AppCat, CreativeApp[]>();
  for (const a of CREATIVE_APPS) {
    const cat = categoryOf(a);
    if (!cat) continue;
    if (!buckets.has(cat)) buckets.set(cat, []);
    buckets.get(cat)!.push(a);
  }
  return (Object.keys(CAT_META) as AppCat[])
    .filter((id) => buckets.has(id))
    .map((id) => {
      const apps = buckets.get(id)!;
      if (sortWithin) apps.sort(sortWithin);
      return { id, ...CAT_META[id], apps };
    });
}

/**
 * Genuinely related apps for a detail page: same category first, so a link
 * is a claim "these do a similar job" rather than "these exist". Filled out
 * from the rest of the catalogue only if a category is too small to fill the
 * list on its own — a page never links to nothing because its category is
 * niche.
 */
export function relatedApps(app: CreativeApp, n = 6): CreativeApp[] {
  const cat = categoryOf(app);
  const sameCat = CREATIVE_APPS.filter((x) => x.slug !== app.slug && categoryOf(x) === cat);
  if (sameCat.length >= n) return sameCat.slice(0, n);
  const rest = CREATIVE_APPS.filter((x) => x.slug !== app.slug && categoryOf(x) !== cat);
  return [...sameCat, ...rest].slice(0, n);
}

/** The anchor a category's section on /creative lives at. */
export function categoryAnchor(id: AppCat): string {
  return `cat-${id}`;
}

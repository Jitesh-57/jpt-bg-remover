import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/admin-token";
import { ALL, cardImage, featured, getPrompt, hottest, newest, search } from "@/lib/prompts/data";
import type { PromptRecord } from "@/lib/prompts/types";
import { mediaResolver } from "@/lib/prompts/media";
import { appCards, communityFeed, exploreApps, popularApps, type AppCardData } from "@/lib/dashboard-feed.server";
import { CREATIVE_APPS } from "@/lib/creative-apps";
import { FEATURED_APPS, SHOWCASE_APPS } from "@/lib/home-apps";
import { CAT_META } from "@/lib/app-catalog";
import { PLACEMENTS, PLACEMENTS_TAG, PLACEMENT_BY_ID, type PlacementId, type PlacementsDoc } from "@/lib/placements";
import { curate, curateApps, fits, readPlacementsNow, writePlacements } from "@/lib/placements.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * /api/admin/placements — what each section shows, and changing it. ?token= on every call.
 *
 *   GET                              every placement with the items live in it now
 *   GET ?placement=…&q=…&offset=…    everything that fits that placement (search, or all of it), 60 at a time
 *   POST { placement, uids }         set its list, in order (uids null = back to automatic)
 */

type Item = { uid: string; title: string; image: string | null; media: string; model: string; author: string };

function itemsOf(rs: PromptRecord[], resolve: (u: string | null) => string | null): Item[] {
  return rs.map((r) => ({ uid: r.uid, title: r.title, image: resolve(cardImage(r)), media: r.media, model: r.model, author: r.author.name }));
}

function appItem(a: AppCardData): Item {
  return { uid: a.slug, title: a.name, image: a.main?.url ?? a.sources[0] ?? null, media: "app", model: a.category ? CAT_META[a.category].label : "AI app", author: a.hasExample || a.main ? "" : "no example yet" };
}

/** What an app placement shows right now, computed the way its page computes it. */
function liveApps(id: PlacementId, doc: PlacementsDoc, apps: AppCardData[]): Item[] {
  const bySlug = new Map(apps.map((a) => [a.slug, a]));
  const pick = (slugs: string[]) => slugs.map((s) => bySlug.get(s)).filter((a): a is AppCardData => !!a);
  switch (id) {
    case "home.showcase": return curateApps(id, doc, pick(SHOWCASE_APPS), apps).map(appItem);
    case "home.apps": return curateApps(id, doc, pick(FEATURED_APPS), apps).map(appItem);
    case "app.home.popular": return curateApps(id, doc, popularApps(apps), apps, 8).map(appItem);
    case "app.home.explore": return curateApps(id, doc, exploreApps(apps), apps, 120).map(appItem);
    default: return curateApps(id, doc, apps, apps, apps.length + 60).map(appItem);
  }
}

/** What each placement shows right now, computed the way its page computes it. */
async function live(id: PlacementId, doc: PlacementsDoc, resolve: (u: string | null) => string | null): Promise<Item[]> {
  switch (id) {
    case "prompts.weekly": return itemsOf(curate(id, doc, featured(1)), resolve);
    case "prompts.hottest": return itemsOf(curate(id, doc, hottest(8)), resolve);
    case "prompts.image.hottest": return itemsOf(curate(id, doc, hottest(8, "image")), resolve);
    case "prompts.image.new": return itemsOf(curate(id, doc, newest(8, "image")), resolve);
    case "prompts.video.hottest": return itemsOf(curate(id, doc, hottest(8, "video")), resolve);
    case "prompts.video.new": return itemsOf(curate(id, doc, newest(8, "video")), resolve);
    default: {
      // The community placements read through the feed, which applies the saved list itself.
      const p = PLACEMENT_BY_ID[id];
      const feed = await communityFeed(p.size, { textOnly: p.textOnly, placement: id });
      return feed.map((f) => {
        const r = getPrompt(f.uid);
        return { uid: f.uid, title: f.title, image: f.image, media: r?.media ?? "image", model: f.model, author: f.author };
      });
    }
  }
}

export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const resolve = await mediaResolver();
  const sp = req.nextUrl.searchParams;
  const pid = sp.get("placement") as PlacementId | null;

  if (pid) {
    const p = PLACEMENT_BY_ID[pid];
    if (!p) return NextResponse.json({ error: "Unknown section." }, { status: 404 });
    const q = (sp.get("q") || "").trim().toLowerCase().slice(0, 100);
    const offset = Math.max(0, Math.min(Number(sp.get("offset")) || 0, 100_000));
    const PAGE = 60;
    if (p.kind === "app") {
      const apps = await appCards();
      const all = q ? apps.filter((a) => `${a.name} ${a.slug} ${a.blurb}`.toLowerCase().includes(q)) : apps;
      return NextResponse.json({ total: all.length, results: all.slice(offset, offset + PAGE).map(appItem) });
    }
    const all = (q ? search(q) : ALL).filter((r) => fits(p, r) && cardImage(r));
    return NextResponse.json({ total: all.length, results: itemsOf(all.slice(offset, offset + PAGE), resolve) });
  }

  const [doc, apps] = await Promise.all([readPlacementsNow(), appCards()]);
  const placements = await Promise.all(PLACEMENTS.map(async (p) => {
    const items = p.kind === "app" ? liveApps(p.id, doc, apps) : await live(p.id, doc, resolve);
    // The all-apps gallery lists every app; the admin only needs to see the top of it.
    const custom = !!doc.lists[p.id]?.length;
    // For a pin section the chosen items lead the live list, so they are its head.
    const pinned = p.mode === "pin" && custom ? items.slice(0, Math.min(doc.lists[p.id]!.length, items.length)) : [];
    return { ...p, custom, pinned, live: p.id === "app.apps.top" ? items.slice(0, 48) : items };
  }));
  return NextResponse.json({ updatedAt: doc.updatedAt, placements });
}

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const body = (await req.json().catch(() => null)) as { placement?: string; uids?: unknown } | null;
  const p = body?.placement ? PLACEMENT_BY_ID[body.placement as PlacementId] : undefined;
  if (!p) return NextResponse.json({ error: "Unknown section." }, { status: 400 });

  const current = await readPlacementsNow();
  const next: PlacementsDoc = { version: 1, updatedAt: new Date().toISOString(), lists: { ...current.lists } };

  if (body!.uids === null) {
    delete next.lists[p.id];
  } else {
    if (!Array.isArray(body!.uids)) return NextResponse.json({ error: "Send a list of items." }, { status: 400 });
    const cap = p.mode === "pin" ? 60 : p.size;
    const seen = new Set<string>();
    const uids: string[] = [];
    const appSlugs = p.kind === "app" ? new Set(CREATIVE_APPS.map((a) => a.slug)) : null;
    for (const u of body!.uids) {
      if (typeof u !== "string" || seen.has(u)) continue;
      if (appSlugs) {
        if (!appSlugs.has(u)) return NextResponse.json({ error: `The app “${u}” no longer exists.` }, { status: 400 });
        seen.add(u);
        uids.push(u);
        continue;
      }
      const r = getPrompt(u);
      if (!r) return NextResponse.json({ error: `“${u}” is no longer in the library.` }, { status: 400 });
      if (!fits(p, r)) return NextResponse.json({ error: `“${r.title}” can't go in this section (${p.media === "video" ? "videos only" : p.textOnly ? "needs a prompt that runs without a photo" : "images only"}).` }, { status: 400 });
      seen.add(u);
      uids.push(u);
    }
    if (uids.length > cap) return NextResponse.json({ error: `This section holds ${cap}. Remove some first.` }, { status: 400 });
    if (uids.length) next.lists[p.id] = uids;
    else delete next.lists[p.id];
  }

  const saved = await writePlacements(next);
  if (!saved.ok) return NextResponse.json({ error: saved.error }, { status: 502 });
  revalidateTag(PLACEMENTS_TAG);
  for (const path of p.paths) revalidatePath(path);
  return NextResponse.json({ ok: true, custom: !!next.lists[p.id]?.length });
}

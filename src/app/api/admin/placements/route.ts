import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/admin-token";
import { ALL, cardImage, featured, getPrompt, hottest, newest, search } from "@/lib/prompts/data";
import type { PromptRecord } from "@/lib/prompts/types";
import { mediaResolver } from "@/lib/prompts/media";
import { communityFeed } from "@/lib/dashboard-feed.server";
import { PLACEMENTS, PLACEMENTS_TAG, PLACEMENT_BY_ID, type PlacementId, type PlacementsDoc } from "@/lib/placements";
import { curate, fits, readPlacementsNow, writePlacements } from "@/lib/placements.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * /api/admin/placements — what each section shows, and changing it. ?token= on every call.
 *
 *   GET                              every placement with the items live in it now
 *   GET ?placement=…&q=…             library items that fit that placement (search, or the hottest)
 *   POST { placement, uids }         set its list, in order (uids null = back to automatic)
 */

type Item = { uid: string; title: string; image: string | null; media: string; model: string; author: string };

function itemsOf(rs: PromptRecord[], resolve: (u: string | null) => string | null): Item[] {
  return rs.map((r) => ({ uid: r.uid, title: r.title, image: resolve(cardImage(r)), media: r.media, model: r.model, author: r.author.name }));
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
    const q = (sp.get("q") || "").trim().slice(0, 100);
    const pool = q ? search(q) : ALL;
    const results = pool.filter((r) => fits(p, r) && cardImage(r)).slice(0, 60);
    return NextResponse.json({ results: itemsOf(results, resolve) });
  }

  const doc = await readPlacementsNow();
  const placements = await Promise.all(PLACEMENTS.map(async (p) => ({
    ...p,
    custom: !!doc.lists[p.id]?.length,
    live: await live(p.id, doc, resolve),
  })));
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
    for (const u of body!.uids) {
      if (typeof u !== "string" || seen.has(u)) continue;
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

import { getPrompt } from "@/lib/prompts/data";
import type { PromptRecord } from "@/lib/prompts/types";
import {
  EMPTY_PLACEMENTS, PLACEMENTS_BUCKET, PLACEMENTS_PATH, PLACEMENTS_TAG, PLACEMENT_BY_ID,
  type Placement, type PlacementId, type PlacementsDoc,
} from "@/lib/placements";

function docUrl(): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return base ? `${base}/storage/v1/object/public/${PLACEMENTS_BUCKET}/${PLACEMENTS_PATH}` : "";
}

async function read(init: RequestInit, stamp: number): Promise<PlacementsDoc> {
  const url = docUrl();
  if (!url) return EMPTY_PLACEMENTS;
  try {
    const res = await fetch(`${url}?t=${stamp}`, init);
    if (!res.ok) return EMPTY_PLACEMENTS;
    const json = (await res.json()) as PlacementsDoc;
    return json && typeof json === "object" && json.lists && typeof json.lists === "object" ? json : EMPTY_PLACEMENTS;
  } catch {
    return EMPTY_PLACEMENTS;
  }
}

/** Cached and tagged: a save in /admin/placements revalidates the tag, so pages change at once. */
export function readPlacements(): Promise<PlacementsDoc> {
  return read({ next: { revalidate: 300, tags: [PLACEMENTS_TAG] } }, 0);
}

export function readPlacementsNow(): Promise<PlacementsDoc> {
  return read({ cache: "no-store" }, Date.now());
}

export async function writePlacements(next: PlacementsDoc): Promise<{ ok: true } | { ok: false; error: string }> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return { ok: false, error: "Storage is not configured on this deployment." };
  try {
    const res = await fetch(`${base}/storage/v1/object/${PLACEMENTS_BUCKET}/${PLACEMENTS_PATH}`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", "x-upsert": "true", "Cache-Control": "public, max-age=30" },
      body: JSON.stringify(next),
    });
    if (!res.ok) return { ok: false, error: `Storage refused the write (${res.status}).` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: `Storage could not be reached: ${(e as Error).message}` };
  }
}

/** Whether a prompt can sit in this placement at all. */
export function fits(p: Placement, r: PromptRecord): boolean {
  if (p.media !== "any" && r.media !== p.media) return false;
  if (p.textOnly && (r.needsPhoto || r.prompt.length > 3500)) return false;
  return true;
}

/**
 * The records a placement shows: the admin's list when there is one (exact, or
 * pinned ahead of the automatic pick), otherwise the automatic pick unchanged.
 * Items removed from the library since they were chosen are skipped quietly.
 */
export function curate(id: PlacementId, doc: PlacementsDoc, automatic: PromptRecord[], size?: number): PromptRecord[] {
  const p = PLACEMENT_BY_ID[id];
  const n = size ?? p.size;
  const list = doc.lists[id];
  if (!list?.length) return automatic.slice(0, n);
  const chosen = list.map((uid) => getPrompt(uid)).filter((r): r is PromptRecord => !!r && fits(p, r));
  if (p.mode === "exact") return chosen.slice(0, n);
  const seen = new Set(chosen.map((r) => r.uid));
  return [...chosen, ...automatic.filter((r) => !seen.has(r.uid))].slice(0, n);
}

export async function curated(id: PlacementId, automatic: PromptRecord[], size?: number): Promise<PromptRecord[]> {
  return curate(id, await readPlacements(), automatic, size);
}

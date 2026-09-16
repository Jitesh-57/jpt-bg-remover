import { listBucketImagesServer } from "@/lib/prompt-images.server";
import { createHash } from "crypto";

/**
 * media.ts — where a prompt's picture is actually served from.
 *
 * The dataset points at `cms-assets.youmind.com` and `pbs.twimg.com`. Those
 * URLs work today and are the right thing to fall back to, but hotlinking a
 * third party's CDN for every card on every page view is fragile in both
 * directions: they can move or rate-limit the files, and we are spending their
 * bandwidth. The spec says mirror them, so this resolves a mirrored copy when
 * one exists and uses the original when it does not.
 *
 * The mirror is filled by /api/admin/prompt-mirror. Nothing here fetches
 * anything: the bucket listing is the only lookup, and an unreachable bucket
 * degrades to the original URLs rather than to a broken page.
 */

export const MIRROR_BUCKET = "Prompt library mirror";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

/**
 * A mirrored file is named for the sha1 of its source URL.
 *
 * Not the original filename: the sources collide (several `1776658772018_*.jpg`
 * across repos) and carry no extension guarantee. A hash of the URL is unique,
 * stable across rebuilds, and reversible in the sense that any code holding
 * the URL can compute it without a manifest.
 */
export function mirrorName(originalUrl: string): string {
  const ext = /\.(png|jpe?g|webp|avif|gif)(\?|$)/i.exec(originalUrl)?.[1]?.toLowerCase() || "jpg";
  return `${createHash("sha1").update(originalUrl).digest("hex")}.${ext === "jpeg" ? "jpg" : ext}`;
}

export function mirrorUrl(name: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${encodeURIComponent(MIRROR_BUCKET)}/${encodeURIComponent(name)}`;
}

export type MediaResolver = (originalUrl: string | null) => string | null;

/**
 * Builds the resolver for one render pass.
 *
 * Listed once per page rather than per image, and cached by the fetch layer
 * for the ISR window, so a 24-card grid costs one listing, not 24 lookups.
 */
export async function mediaResolver(): Promise<MediaResolver> {
  let mirrored = new Set<string>();
  if (SUPABASE_URL) {
    try {
      mirrored = new Set(await listBucketImagesServer(MIRROR_BUCKET));
    } catch {
      /* no mirror yet — originals it is */
    }
  }
  return (originalUrl) => {
    if (!originalUrl) return null;
    const name = mirrorName(originalUrl);
    return mirrored.has(name) ? mirrorUrl(name) : originalUrl;
  };
}

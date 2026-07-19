import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

// Resolve a public Instagram reel/video link to a direct MP4. Two independent
// strategies are tried in order so a single failing service doesn't break the
// tool:
//   1. Instagram's own public media API (no key, no third party).
//   2. "cobalt" instances (open-source, no key) across a fallback list.
const IG_RE = /(instagram\.com|instagr\.am)\//i;
const IG_APP_ID = "936619743392459"; // public web app id used by instagram.com

// Cobalt fallback instances. Override/extend via COBALT_APIS (comma-separated)
// or COBALT_API. Live directory: https://instances.cobalt.best
const COBALT_INSTANCES = (
  process.env.COBALT_APIS ||
  process.env.COBALT_API ||
  ["https://cobalt-api.kwiatekmiki.com", "https://cobalt-backend.canine.tools", "https://capi.oary.dev"].join(",")
)
  .split(",")
  .map((s) => s.trim().replace(/\/+$/, ""))
  .filter(Boolean);

interface Media {
  title: string;
  author: string;
  cover: string;
  media: string;
  filename: string;
}

function extractShortcode(url: string): string {
  const m = url.match(/instagram\.com\/(?:reel|reels|p|tv)\/([A-Za-z0-9_-]+)/i);
  return m ? m[1] : "";
}

// Instagram shortcode (base64 variant) -> numeric media id.
function shortcodeToId(shortcode: string): string {
  const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  const SIXTY_FOUR = BigInt(64);
  let id = BigInt(0);
  for (const ch of shortcode) {
    const idx = A.indexOf(ch);
    if (idx < 0) return "";
    id = id * SIXTY_FOUR + BigInt(idx);
  }
  return id.toString();
}

async function fetchWithTimeout(url: string, init: RequestInit, ms: number): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */

// Strategy 1 — Instagram's public media info API (public content only).
async function viaInstagramApi(url: string): Promise<Media | null> {
  const shortcode = extractShortcode(url);
  const id = shortcode && shortcodeToId(shortcode);
  if (!id) return null;
  try {
    const r = await fetchWithTimeout(
      `https://www.instagram.com/api/v1/media/${id}/info/`,
      {
        headers: {
          "X-IG-App-ID": IG_APP_ID,
          "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
          Accept: "*/*",
        },
        cache: "no-store",
      },
      9000
    );
    if (!r.ok) return null;
    const j = (await r.json()) as any;
    const item = j?.items?.[0];
    if (!item) return null;
    const node = item.video_versions ? item : item.carousel_media?.find((c: any) => c.video_versions);
    const media = node?.video_versions?.[0]?.url;
    if (!media) return null;
    return {
      title: (item.caption?.text || "Instagram video").slice(0, 80),
      author: item.user?.username || "",
      cover: node?.image_versions2?.candidates?.[0]?.url || "",
      media,
      filename: `jpt-instagram-${shortcode}.mp4`,
    };
  } catch {
    return null;
  }
}

// Strategy 2 — cobalt instances (tries each until one resolves).
async function viaCobalt(url: string): Promise<Media | null> {
  for (const base of COBALT_INSTANCES) {
    try {
      const r = await fetchWithTimeout(
        `${base}/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json", "User-Agent": "Mozilla/5.0" },
          body: JSON.stringify({ url, videoQuality: "1080", downloadMode: "auto", filenameStyle: "basic" }),
          cache: "no-store",
        },
        9000
      );
      const j = (await r.json().catch(() => ({}))) as any;
      let media = "";
      if (["tunnel", "redirect", "stream", "success"].includes(j.status)) media = j.url || "";
      else if (j.status === "picker" && Array.isArray(j.picker)) media = (j.picker.find((p: any) => p.type === "video") || j.picker[0])?.url || "";
      if (media) {
        return {
          title: (j.filename || "Instagram video").replace(/\.[a-z0-9]+$/i, ""),
          author: "",
          cover: "",
          media,
          filename: j.filename || "jpt-instagram-video.mp4",
        };
      }
    } catch {
      /* try next instance */
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  let url = "";
  try {
    const body = (await req.json()) as { url?: string };
    url = (body.url || "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!url || !IG_RE.test(url)) {
    return NextResponse.json({ error: "Please paste a valid Instagram reel or video link." }, { status: 400 });
  }

  try {
    const result = (await viaInstagramApi(url)) || (await viaCobalt(url));
    if (!result) {
      return NextResponse.json(
        { error: "Couldn't fetch this video. Make sure the reel/post is public (not a private account), then try again." },
        { status: 422 }
      );
    }
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "The video service is unavailable right now. Please try again shortly." }, { status: 502 });
  }
}

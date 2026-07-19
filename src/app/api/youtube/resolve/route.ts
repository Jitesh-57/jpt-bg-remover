import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

// Resolve a YouTube link to a downloadable MP4 via "cobalt" (open-source, no
// API key). YouTube is cobalt's primary platform. Title/thumbnail come from
// YouTube's public oembed endpoint (no key). Free no-key resolution can be
// blocked from datacenter IPs, so this is best-effort.
const YT_RE = /(youtube\.com|youtu\.be)\//i;

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

/* eslint-disable @typescript-eslint/no-explicit-any */

async function fetchWithTimeout(url: string, init: RequestInit, ms: number): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

// YouTube oembed — public, no key. Best-effort title/author/thumbnail.
async function youtubeMeta(url: string): Promise<{ title: string; author: string; cover: string }> {
  try {
    const r = await fetchWithTimeout(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
      { headers: { "User-Agent": "Mozilla/5.0" }, cache: "no-store" },
      6000
    );
    if (!r.ok) return { title: "", author: "", cover: "" };
    const j = (await r.json()) as any;
    return { title: j.title || "", author: j.author_name || "", cover: j.thumbnail_url || "" };
  } catch {
    return { title: "", author: "", cover: "" };
  }
}

async function viaCobalt(url: string): Promise<{ media: string; filename: string } | null> {
  for (const base of COBALT_INSTANCES) {
    try {
      const r = await fetchWithTimeout(
        `${base}/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json", "User-Agent": "Mozilla/5.0" },
          body: JSON.stringify({
            url,
            videoQuality: "1080",
            downloadMode: "auto",
            youtubeVideoCodec: "h264",
            filenameStyle: "basic",
          }),
          cache: "no-store",
        },
        9000
      );
      const j = (await r.json().catch(() => ({}))) as any;
      let media = "";
      if (["tunnel", "redirect", "stream", "success"].includes(j.status)) media = j.url || "";
      else if (j.status === "picker" && Array.isArray(j.picker)) media = (j.picker.find((p: any) => p.type === "video") || j.picker[0])?.url || "";
      if (media) return { media, filename: j.filename || "jpt-youtube-video.mp4" };
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

  if (!url || !YT_RE.test(url)) {
    return NextResponse.json({ error: "Please paste a valid YouTube video link." }, { status: 400 });
  }

  try {
    const [meta, resolved] = await Promise.all([youtubeMeta(url), viaCobalt(url)]);
    if (!resolved) {
      return NextResponse.json(
        { error: "Couldn't fetch this video. It may be private, age-restricted, or the service is busy — please try again." },
        { status: 422 }
      );
    }
    return NextResponse.json({
      title: meta.title || resolved.filename.replace(/\.[a-z0-9]+$/i, "") || "YouTube video",
      author: meta.author || "",
      cover: meta.cover || "",
      media: resolved.media,
      filename: resolved.filename,
    });
  } catch {
    return NextResponse.json({ error: "The video service is unavailable right now. Please try again shortly." }, { status: 502 });
  }
}

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

// Resolve a YouTube link to a downloadable MP4 — free, no API key. Primary
// strategy is Piped (open-source YouTube frontend): its public instances proxy
// the media through THEIR servers, so this works even though YouTube blocks
// datacenter IPs directly. Falls back to cobalt if Piped is unavailable.
const YT_RE = /(youtube\.com|youtu\.be)\//i;

// Static fallback Piped API instances. The live list is fetched at runtime
// (below) so it self-heals as instances come and go; this is the backup.
const PIPED_FALLBACK = [
  "https://pipedapi.kavin.rocks",
  "https://pipedapi.leptons.xyz",
  "https://pipedapi.nosebs.ru",
  "https://piped-api.privacy.com.de",
  "https://pipedapi.adminforge.de",
  "https://pipedapi.reallyaweso.me",
  "https://api.piped.private.coffee",
  "https://pipedapi.ducks.party",
];

// Resolve the list of Piped API bases to try: env override → live directory →
// static fallback.
async function pipedInstances(): Promise<string[]> {
  if (process.env.PIPED_APIS) {
    return process.env.PIPED_APIS.split(",").map((s) => s.trim().replace(/\/+$/, "")).filter(Boolean);
  }
  try {
    const r = await fetchWithTimeout("https://piped-instances.kavin.rocks/", { headers: { Accept: "application/json" }, cache: "no-store" }, 6000);
    if (r.ok) {
      const list = (await r.json()) as any[];
      const urls = (Array.isArray(list) ? list : [])
        .map((i) => (i?.api_url as string) || "")
        .map((s) => s.trim().replace(/\/+$/, ""))
        .filter(Boolean);
      if (urls.length) return urls;
    }
  } catch {
    /* fall back to static list */
  }
  return PIPED_FALLBACK;
}

// Resolve with the first of many promises that yields a non-null result.
function firstNonNull<T>(promises: Promise<T | null>[]): Promise<T | null> {
  return new Promise((resolve) => {
    let remaining = promises.length;
    if (!remaining) return resolve(null);
    let settled = false;
    for (const p of promises) {
      p.then((v) => {
        if (v != null && !settled) { settled = true; resolve(v); }
        else if (--remaining === 0 && !settled) resolve(null);
      }).catch(() => { if (--remaining === 0 && !settled) resolve(null); });
    }
  });
}

// Cobalt fallback instances (no key). Override with COBALT_APIS / COBALT_API.
const COBALT_INSTANCES = (
  process.env.COBALT_APIS ||
  process.env.COBALT_API ||
  ["https://cobalt-api.kwiatekmiki.com", "https://cobalt-backend.canine.tools", "https://capi.oary.dev"].join(",")
)
  .split(",").map((s) => s.trim().replace(/\/+$/, "")).filter(Boolean);

/* eslint-disable @typescript-eslint/no-explicit-any */

interface Resolved { title: string; author: string; cover: string; media: string; filename: string; }

function videoId(url: string): string {
  const m = url.match(/(?:youtu\.be\/|[?&]v=|\/shorts\/|\/embed\/|\/live\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : "";
}

async function fetchWithTimeout(url: string, init: RequestInit, ms: number): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try { return await fetch(url, { ...init, signal: ctrl.signal }); }
  finally { clearTimeout(t); }
}

const qNum = (q?: string) => parseInt(String(q || "").replace(/[^0-9]/g, ""), 10) || 0;

// Query one Piped instance for a muxed (video+audio) MP4 stream.
async function tryPipedInstance(base: string, id: string): Promise<Resolved | null> {
  try {
    const r = await fetchWithTimeout(`${base}/streams/${id}`, {
      headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0" },
      cache: "no-store",
    }, 8000);
    if (!r.ok) return null;
    const j = (await r.json()) as any;
    const streams: any[] = Array.isArray(j.videoStreams) ? j.videoStreams : [];
    // Muxed progressive streams have audio (videoOnly === false).
    const muxed = streams
      .filter((s) => s && s.videoOnly === false && s.url && /mp4/i.test(`${s.mimeType || ""}${s.format || ""}`))
      .sort((a, b) => qNum(b.quality) - qNum(a.quality));
    const pick = muxed[0];
    if (!pick?.url) return null;
    return {
      title: j.title || "YouTube video",
      author: j.uploader || "",
      cover: j.thumbnailUrl || "",
      media: pick.url,
      filename: `jpt-youtube-${id}.mp4`,
    };
  } catch {
    return null;
  }
}

// Strategy 1 — Piped. Races many live instances; first muxed MP4 wins.
async function viaPiped(url: string): Promise<Resolved | null> {
  const id = videoId(url);
  if (!id) return null;
  const instances = (await pipedInstances()).slice(0, 14);
  return firstNonNull(instances.map((base) => tryPipedInstance(base, id)));
}

// YouTube oembed — public, no key. Best-effort metadata for the cobalt path.
async function youtubeMeta(url: string): Promise<{ title: string; author: string; cover: string }> {
  try {
    const r = await fetchWithTimeout(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
      { headers: { "User-Agent": "Mozilla/5.0" }, cache: "no-store" }, 6000
    );
    if (!r.ok) return { title: "", author: "", cover: "" };
    const j = (await r.json()) as any;
    return { title: j.title || "", author: j.author_name || "", cover: j.thumbnail_url || "" };
  } catch { return { title: "", author: "", cover: "" }; }
}

// Strategy 2 — cobalt (tries each instance).
async function viaCobalt(url: string): Promise<{ media: string; filename: string } | null> {
  for (const base of COBALT_INSTANCES) {
    try {
      const r = await fetchWithTimeout(`${base}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", "User-Agent": "Mozilla/5.0" },
        body: JSON.stringify({ url, videoQuality: "1080", downloadMode: "auto", youtubeVideoCodec: "h264", filenameStyle: "basic" }),
        cache: "no-store",
      }, 9000);
      const j = (await r.json().catch(() => ({}))) as any;
      let media = "";
      if (["tunnel", "redirect", "stream", "success"].includes(j.status)) media = j.url || "";
      else if (j.status === "picker" && Array.isArray(j.picker)) media = (j.picker.find((p: any) => p.type === "video") || j.picker[0])?.url || "";
      if (media) return { media, filename: j.filename || "jpt-youtube-video.mp4" };
    } catch { /* try next */ }
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
    const piped = await viaPiped(url);
    if (piped) return NextResponse.json(piped);

    const [meta, cob] = await Promise.all([youtubeMeta(url), viaCobalt(url)]);
    if (cob) {
      return NextResponse.json({
        title: meta.title || cob.filename.replace(/\.[a-z0-9]+$/i, "") || "YouTube video",
        author: meta.author || "",
        cover: meta.cover || "",
        media: cob.media,
        filename: cob.filename,
      });
    }
    return NextResponse.json(
      { error: "Couldn't fetch this video. It may be private, age-restricted, or the service is busy — please try again." },
      { status: 422 }
    );
  } catch {
    return NextResponse.json({ error: "The video service is unavailable right now. Please try again shortly." }, { status: 502 });
  }
}

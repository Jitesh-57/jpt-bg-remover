import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

// Resolve a TikTok share link to a no-watermark video via a public downloader
// API. Returns normalized metadata + direct media URLs (proxied for download
// through /api/video/download).
export async function POST(req: NextRequest) {
  let url = "";
  try {
    const body = (await req.json()) as { url?: string };
    url = (body.url || "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!url || !/(tiktok\.com|douyin\.com|vm\.tiktok\.com|vt\.tiktok\.com)/i.test(url)) {
    return NextResponse.json({ error: "Please paste a valid TikTok video link." }, { status: 400 });
  }

  try {
    const api = `https://www.tikwm.com/api/?hd=1&url=${encodeURIComponent(url)}`;
    const r = await fetch(api, {
      headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
      cache: "no-store",
    });
    if (!r.ok) throw new Error("upstream");
    const j = (await r.json()) as { code?: number; msg?: string; data?: Record<string, unknown> };
    if (j?.code !== 0 || !j?.data) {
      return NextResponse.json({ error: "Couldn't fetch this video. Double-check the link and try again." }, { status: 422 });
    }
    const d = j.data as {
      title?: string; cover?: string; origin_cover?: string; duration?: number;
      play?: string; hdplay?: string; music?: string;
      author?: { nickname?: string; unique_id?: string };
    };
    const abs = (u?: string) => (!u ? "" : u.startsWith("http") ? u : `https://www.tikwm.com${u}`);

    return NextResponse.json({
      title: d.title || "TikTok video",
      author: d.author?.nickname || d.author?.unique_id || "",
      cover: abs(d.cover || d.origin_cover),
      duration: d.duration || 0,
      noWatermark: abs(d.play),
      hd: abs(d.hdplay || d.play),
      music: abs(d.music),
    });
  } catch {
    return NextResponse.json({ error: "The video service is busy right now. Please try again in a moment." }, { status: 502 });
  }
}

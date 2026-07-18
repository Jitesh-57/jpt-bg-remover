import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

// Resolve a public Instagram reel/video link to a direct MP4 via a "cobalt"
// instance (open-source, no API key). Community instances come and go, so the
// endpoint is configurable with COBALT_API — swap it if the default stops
// resolving. See https://instances.cobalt.best for a live list.
const COBALT_API = (process.env.COBALT_API || "https://cobalt-api.kwiatekmiki.com").replace(/\/+$/, "");

const IG_RE = /(instagram\.com|instagr\.am)\//i;

interface CobaltResp {
  status?: "tunnel" | "redirect" | "stream" | "picker" | "error" | "success";
  url?: string;
  filename?: string;
  picker?: { type?: string; url?: string; thumb?: string }[];
  error?: { code?: string };
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
    const r = await fetch(`${COBALT_API}/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0",
      },
      body: JSON.stringify({
        url,
        videoQuality: "1080",
        downloadMode: "auto",
        filenameStyle: "basic",
      }),
      cache: "no-store",
    });

    const j = (await r.json().catch(() => ({}))) as CobaltResp;

    // Pull the video URL out of whichever response shape cobalt returned.
    let media = "";
    if (j.status === "tunnel" || j.status === "redirect" || j.status === "stream" || j.status === "success") {
      media = j.url || "";
    } else if (j.status === "picker" && Array.isArray(j.picker)) {
      media = (j.picker.find((p) => p.type === "video") || j.picker[0])?.url || "";
    }

    if (!media) {
      const code = j.error?.code || "";
      const friendly = /rate|limit|throttle/i.test(code)
        ? "The download service is busy right now. Please try again in a moment."
        : "Couldn't fetch this video. Make sure the reel/post is public and the link is correct.";
      return NextResponse.json({ error: friendly }, { status: 422 });
    }

    return NextResponse.json({
      title: j.filename?.replace(/\.[a-z0-9]+$/i, "") || "Instagram video",
      media,
      filename: j.filename || "jpt-instagram-video.mp4",
    });
  } catch {
    return NextResponse.json({ error: "The video service is unavailable right now. Please try again shortly." }, { status: 502 });
  }
}

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

// Stream a resolved media URL back to the browser with an attachment header so
// the user gets a real file download (cross-origin <a download> won't force it).
// Restricted to known downloader media hosts (TikTok, Instagram, cobalt) to
// avoid an open proxy.
const ALLOWED = /(^|\.)tikwm\.com$|tiktok|byteoversea|muscdn|akamaized|ibyteimg|bytecdn|douyin|tiktokcdn|instagram|cdninstagram|fbcdn|cobalt|googlevideo|youtube|ytimg|piped/i;
// The configured cobalt instance may serve tunnel URLs from its own host.
let COBALT_HOST = "";
try { COBALT_HOST = new URL(process.env.COBALT_API || "https://cobalt-api.kwiatekmiki.com").host.toLowerCase(); } catch { /* ignore */ }

export async function GET(req: NextRequest) {
  const src = req.nextUrl.searchParams.get("url") || "";
  const type = req.nextUrl.searchParams.get("type") === "audio" ? "audio" : "video";
  const rawName = req.nextUrl.searchParams.get("name") || "jpt-tiktok-no-watermark";
  const name = rawName.replace(/[^a-z0-9-_]+/gi, "-").replace(/-+/g, "-").slice(0, 60) || "jpt-video";
  const ext = type === "audio" ? "mp3" : "mp4";

  let host = "";
  try { host = new URL(src).host; } catch { return new NextResponse("Bad url", { status: 400 }); }
  const hostOk = ALLOWED.test(host) || (COBALT_HOST && host.toLowerCase() === COBALT_HOST);
  if (!/^https?:$/.test(new URL(src).protocol) || !hostOk) {
    return new NextResponse("Host not allowed", { status: 400 });
  }

  try {
    const isTikTok = /tikwm|tiktok|douyin|byteoversea|muscdn|bytecdn|tiktokcdn/i.test(host);
    const upstream = await fetch(src, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        // TikTok CDNs need the tikwm referer; Instagram/cobalt do not.
        ...(isTikTok ? { Referer: "https://www.tikwm.com/" } : {}),
      },
      cache: "no-store",
    });
    if (!upstream.ok || !upstream.body) return new NextResponse("Fetch failed", { status: 502 });
    return new NextResponse(upstream.body, {
      headers: {
        "Content-Type": upstream.headers.get("content-type") || (type === "audio" ? "audio/mpeg" : "video/mp4"),
        "Content-Disposition": `attachment; filename="${name}.${ext}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return new NextResponse("Download failed", { status: 502 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-token";

export const runtime = "nodejs";
export const maxDuration = 45;

/**
 * Pulls the image URLs out of a pasted link.
 *
 *   POST /api/admin/find-images?token=…   { url }
 *
 * Two shapes are handled, because the honest version of "paste a ChatGPT
 * share link" has to admit what it cannot do.
 *
 * A direct image URL is trivial: it is returned as-is.
 *
 * A share link is not. The page is rendered by JavaScript, so the HTML that
 * arrives here often has no <img> in it at all, and the image URLs it does
 * carry are short-lived signed links that expire. This reads the server-sent
 * HTML and the embedded JSON payload Next.js ships with it, which is where
 * the URLs live when they are there — and when they are not, it says exactly
 * that rather than returning nothing and letting it look like an empty
 * conversation. Downloading happens immediately afterwards, while the
 * signatures are still valid.
 */

const IMAGE_HOST = /(oaiusercontent\.com|openai\.com|cdn\.oaistatic\.com)/i;
const IMAGE_EXT = /\.(png|jpe?g|webp|gif)(\?|$)/i;
const MAX_FOUND = 24;

function uniq(urls: string[]): string[] {
  return Array.from(new Set(urls)).slice(0, MAX_FOUND);
}

/** Every http(s) URL in the blob that looks like an image we could fetch. */
function harvest(text: string): string[] {
  const out: string[] = [];
  // Escaped slashes are how these arrive inside an embedded JSON payload.
  const normalised = text.replace(/\\u0026/g, "&").replace(/\\\//g, "/");
  const re = /https?:\/\/[^\s"'<>\\)]+/g;
  for (const m of Array.from(normalised.matchAll(re))) {
    const u = m[0].replace(/[.,;]+$/, "");
    if (IMAGE_HOST.test(u) || IMAGE_EXT.test(u)) out.push(u);
  }
  return uniq(out);
}

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  let url: string;
  try {
    ({ url } = (await req.json()) as { url: string });
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }
  url = (url || "").trim();
  if (!/^https?:\/\//i.test(url)) {
    return NextResponse.json({ error: "Paste a link starting with http:// or https://" }, { status: 400 });
  }

  // A direct image needs no scraping.
  if (IMAGE_EXT.test(url) || IMAGE_HOST.test(url)) {
    return NextResponse.json({ images: [url], source: "direct link" });
  }

  let html: string;
  try {
    const res = await fetch(url, {
      headers: {
        // Without a browser-shaped request these pages often answer with a
        // consent shell instead of the conversation.
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(25_000),
    });
    if (!res.ok) {
      return NextResponse.json({
        error: `That link answered ${res.status}.`,
        hint: res.status === 404 ? "Check the share link is still public." : "It may need a sign-in, which this cannot do.",
      }, { status: 502 });
    }
    html = await res.text();
  } catch (e) {
    return NextResponse.json({
      error: `Could not open that link: ${(e as Error).message}`,
    }, { status: 502 });
  }

  const images = harvest(html);
  if (!images.length) {
    return NextResponse.json({
      error: "No images in what that page sent back.",
      why:
        "A ChatGPT share page is drawn by JavaScript, so the HTML a server receives frequently contains no images at all — " +
        "and the image URLs are signed links that expire. This is a known limit of scraping share links, not a bug in the paste.",
      fix: "Right-click an image in ChatGPT, copy its address, and paste that instead — or download and drop the files in.",
      bytesRead: html.length,
    }, { status: 422 });
  }

  return NextResponse.json({ images, source: "share link", bytesRead: html.length });
}

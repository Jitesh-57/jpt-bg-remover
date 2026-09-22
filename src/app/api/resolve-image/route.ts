import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth";
import { safeFetch, SafeFetchError } from "@/lib/safe-fetch.server";
import { storeImage } from "@/lib/store-image";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_IMAGE = 15 * 1024 * 1024;

/** Identifies an image by its bytes — servers mislabel content types often enough to matter. */
function sniff(buf: Buffer): "image/png" | "image/jpeg" | "image/webp" | null {
  if (buf.length > 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.length > 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  return null;
}

function decodeEntities(s: string): string {
  return s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x2F;/gi, "/").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

/** The page's main image, as declared for link previews — what Pinterest, Instagram and most sites set. */
function pageImage(html: string, base: string): string | null {
  const metas = html.match(/<meta\b[^>]*>/gi) || [];
  const wanted = ["og:image:secure_url", "og:image", "twitter:image", "twitter:image:src"];
  for (const key of wanted) {
    for (const tag of metas) {
      const name = tag.match(/\b(?:property|name)\s*=\s*["']([^"']+)["']/i)?.[1]?.toLowerCase();
      if (name !== key) continue;
      const content = tag.match(/\bcontent\s*=\s*["']([^"']+)["']/i)?.[1];
      if (content) {
        try { return new URL(decodeEntities(content.trim()), base).toString(); } catch { /* next */ }
      }
    }
  }
  const link = html.match(/<link\b[^>]*rel\s*=\s*["']image_src["'][^>]*>/i)?.[0]?.match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1];
  if (link) {
    try { return new URL(decodeEntities(link), base).toString(); } catch { /* none */ }
  }
  return null;
}

const INLINE_LIMIT = 3 * 1024 * 1024;

/**
 * Stored and returned as a URL: a function response is capped at a few MB, and
 * the generation route takes a URL anyway. Inline only as a fallback, and only
 * when small enough to fit.
 */
async function deliver(buf: Buffer, type: string, userId: string, source: string) {
  const dataUrl = `data:${type};base64,${buf.toString("base64")}`;
  const stored = await storeImage(dataUrl, "recreate-reference", userId);
  if (stored) return NextResponse.json({ imageUrl: stored, source });
  if (buf.length <= INLINE_LIMIT) return NextResponse.json({ dataUrl, source });
  return NextResponse.json({ error: "That image is too large to use from a link. Save it and upload it instead." }, { status: 422 });
}

/**
 * Turns a pasted link into an image the Recreate tool can use.
 *
 * A direct image link is fetched as-is. A page link (a Pinterest pin, an
 * Instagram post, a blog) is fetched as HTML and its preview image followed.
 * Signed-in only, so this is not an open proxy.
 */
export async function POST(req: NextRequest) {
  const { session, error } = await checkAuth(req);
  if (error) return error;

  let url = "";
  try { url = String(((await req.json()) as { url?: unknown }).url || "").trim(); } catch { /* handled below */ }
  if (!url) return NextResponse.json({ error: "Paste a link first." }, { status: 400 });
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;

  try {
    const first = await safeFetch(url, MAX_IMAGE);
    if (first.status < 200 || first.status >= 300) {
      return NextResponse.json({ error: `That link returned an error (${first.status}). Try copying the image address instead.` }, { status: 422 });
    }

    const direct = sniff(first.body);
    if (direct) return deliver(first.body, direct, session!.userId, first.url);

    if (!first.contentType.includes("html")) {
      return NextResponse.json({ error: "That link isn't a JPG, PNG or WebP image or a page with one." }, { status: 422 });
    }

    const imageUrl = pageImage(first.body.toString("utf8"), first.url);
    if (!imageUrl) {
      return NextResponse.json({ error: "Couldn't find an image on that page. Right-click the image and copy its address instead." }, { status: 422 });
    }

    const img = await safeFetch(imageUrl, MAX_IMAGE);
    const type = img.status >= 200 && img.status < 300 ? sniff(img.body) : null;
    if (!type) return NextResponse.json({ error: "The image on that page couldn't be loaded. Try saving it and uploading instead." }, { status: 422 });
    return deliver(img.body, type, session!.userId, img.url);
  } catch (e) {
    if (e instanceof SafeFetchError) return NextResponse.json({ error: e.message }, { status: 422 });
    console.error("[resolve-image]", e);
    return NextResponse.json({ error: "Couldn't open that link. Check it and try again, or upload the image instead." }, { status: 422 });
  }
}

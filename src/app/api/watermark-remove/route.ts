import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

// Our own watermark remover: forwards to /watermark/remove on the self-hosted
// GPU server (gpu-image-server/watermark — trained detector + LaMa). Same
// two env vars as /api/studio:
//   GPU_SERVER_URL   = https://your-tunnel-host   (no trailing slash)
//   GPU_SERVER_TOKEN = the API_TOKEN from the GPU server's .env
const GPU_URL = process.env.GPU_SERVER_URL || "";
const GPU_TOKEN = process.env.GPU_SERVER_TOKEN || "";

// Vercel caps a function's request body at 4.5 MB; the browser already
// shrinks photos to 2048px JPEG before sending, which lands well under it.
const MAX_IMAGE_CHARS = 4_200_000;

/*
  A light per-visitor brake. The tool is free because it runs on our own GPU,
  but that GPU is one 6 GB card doing one image at a time — a single script
  looping on this route would queue out everyone else. In-memory, so it is
  per server instance rather than global; that is enough to stop a loop
  without needing a database round-trip on every request.
*/
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 30;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > MAX_PER_WINDOW;
}

type Body = {
  image?: unknown;
  mask?: unknown;
  removeText?: unknown;
  removeLogo?: unknown;
  threshold?: unknown;
};

const isImageDataUrl = (v: unknown): v is string =>
  typeof v === "string" && /^data:image\/(png|jpeg|webp);base64,/.test(v);

export async function POST(req: NextRequest) {
  if (!GPU_URL) {
    return NextResponse.json(
      { error: "The watermark remover is offline right now. Please try again later." },
      { status: 503 }
    );
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: "You've removed a lot of watermarks in a short time. Please wait a few minutes and try again." },
      { status: 429 }
    );
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!isImageDataUrl(body.image)) {
    return NextResponse.json({ error: "No image was received. Please pick a JPG, PNG or WebP." }, { status: 400 });
  }
  if (body.image.length > MAX_IMAGE_CHARS) {
    return NextResponse.json({ error: "That image is too large. Please use one under about 3 MB." }, { status: 413 });
  }
  if (body.mask !== undefined && body.mask !== null && !isImageDataUrl(body.mask)) {
    return NextResponse.json({ error: "Invalid brush mask." }, { status: 400 });
  }

  const payload = {
    image: body.image,
    mask: body.mask ?? null,
    remove_text: body.removeText !== false,
    remove_logo: body.removeLogo !== false,
    threshold: typeof body.threshold === "number" ? body.threshold : 0.5,
    output_format: "jpeg",
  };

  try {
    const res = await fetch(`${GPU_URL}/watermark/remove`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(GPU_TOKEN ? { Authorization: `Bearer ${GPU_TOKEN}` } : {}),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(110_000),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      const detail = typeof data.detail === "string" ? data.detail : null;
      return NextResponse.json(
        { error: detail || "The watermark remover hit a problem. Please try again.", needsManual: res.status === 503 },
        { status: res.status === 401 ? 502 : res.status }
      );
    }
    return NextResponse.json({
      dataUrl: data.dataUrl,
      maskDataUrl: data.maskDataUrl,
      found: data.found,
      coverage: data.coverage,
      seconds: data.seconds,
    });
  } catch (e) {
    console.error("[watermark-remove]", e);
    return NextResponse.json(
      { error: "Couldn't reach the watermark remover. Please try again in a moment." },
      { status: 502 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

// Proxies image generation / editing to your self-hosted GPU server
// (gpu-image-server). Configure two env vars in Vercel once the GPU box is
// reachable (e.g. via a Cloudflare tunnel):
//   GPU_SERVER_URL   = https://your-tunnel-host        (no trailing slash)
//   GPU_SERVER_TOKEN = the API_TOKEN from the GPU server's .env
const GPU_URL = process.env.GPU_SERVER_URL || "";
const GPU_TOKEN = process.env.GPU_SERVER_TOKEN || "";

const ACTIONS: Record<string, string> = {
  generate: "/generate",
  edit: "/edit",
  inpaint: "/inpaint",
};

export async function POST(req: NextRequest) {
  if (!GPU_URL) {
    return NextResponse.json(
      { error: "Image studio is not configured yet (GPU_SERVER_URL not set)." },
      { status: 503 }
    );
  }

  let body: { action?: string } & Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const path = ACTIONS[body.action || "generate"];
  if (!path) return NextResponse.json({ error: "Unknown action" }, { status: 400 });

  const { action, ...payload } = body;
  void action;

  try {
    const res = await fetch(`${GPU_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(GPU_TOKEN ? { Authorization: `Bearer ${GPU_TOKEN}` } : {}),
      },
      body: JSON.stringify(payload),
      // The GPU box can be slow on 6 GB; give it room.
      signal: AbortSignal.timeout(110_000),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: (data as { detail?: string; error?: string }).detail || "Image server error" },
        { status: res.status }
      );
    }
    return NextResponse.json(data);
  } catch (e) {
    console.error("[studio]", e);
    return NextResponse.json(
      { error: "Couldn't reach the image server. Is your GPU machine and tunnel running?" },
      { status: 502 }
    );
  }
}

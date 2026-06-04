import { NextRequest, NextResponse } from "next/server";
import { readToken } from "@/lib/auth";

export const runtime = "nodejs";

const EC_ID    = process.env.EDGE_CONFIG_ID;
const EC_TOKEN = process.env.VERCEL_WRITE_TOKEN;
const EC_TEAM  = process.env.VERCEL_TEAM_ID;
const EC_READ  = process.env.EDGE_CONFIG;

function ecKey(raw: string): string {
  return "u_" + Buffer.from(raw).toString("base64url");
}

async function ecGet<T>(key: string): Promise<T | null> {
  if (!EC_ID || !EC_READ) return null;
  const token = EC_READ.split("token=")[1];
  try {
    const r = await fetch(
      `https://edge-config.vercel.com/${EC_ID}/item/${key}?token=${token}`,
      { cache: "no-store" }
    );
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch { return null; }
}

async function ecSet(key: string, value: unknown): Promise<boolean> {
  if (!EC_ID || !EC_TOKEN) return false;
  const url = EC_TEAM
    ? `https://api.vercel.com/v1/edge-config/${EC_ID}/items?teamId=${EC_TEAM}`
    : `https://api.vercel.com/v1/edge-config/${EC_ID}/items`;
  try {
    const r = await fetch(url, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${EC_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ items: [{ operation: "upsert", key, value }] }),
    });
    return r.ok;
  } catch { return false; }
}

export interface GenItem {
  id: string;
  tool: string;
  category: "generation" | "edit";
  label: string;
  thumb: string;       // 150px base64 fallback thumbnail (AI editor) OR empty (URL-based)
  imageUrl?: string;   // hosted image URL — full quality, no localStorage needed
  timestamp: number;
  originalName?: string;
}

export async function POST(req: NextRequest) {
  const session = readToken(req);
  if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { tool, category, label, thumb, imageUrl, originalName } = await req.json() as {
    tool: string;
    category?: "generation" | "edit";
    label: string;
    thumb?: string;
    imageUrl?: string;
    originalName?: string;
  };

  if (!tool) return NextResponse.json({ error: "tool required" }, { status: 400 });
  // Must have at least one of: thumb or imageUrl
  if (!thumb && !imageUrl) return NextResponse.json({ error: "thumb or imageUrl required" }, { status: 400 });

  // Guard: 150px JPEG @ 0.65 is ~10KB base64 — reject anything over 25KB
  if (thumb && thumb.length > 25_000) {
    return NextResponse.json({ error: "thumb too large" }, { status: 400 });
  }

  const histKey = ecKey(`hist:${session.email}`);
  const existing = await ecGet<GenItem[]>(histKey) ?? [];

  const resolvedCategory: "generation" | "edit" =
    category ?? ((tool === "generate-bg" || tool === "ai-background") ? "generation" : "edit");

  const newItem: GenItem = {
    id: `gen_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    tool,
    category: resolvedCategory,
    label: label || "Image",
    thumb: thumb || "",
    ...(imageUrl ? { imageUrl } : {}),
    timestamp: Date.now(),
    ...(originalName ? { originalName } : {}),
  };

  // Keep max 40 items per user (safe for Edge Config 512KB limit), newest first
  const updated = [newItem, ...existing].slice(0, 40);
  const ok = await ecSet(histKey, updated);

  if (!ok) return NextResponse.json({ error: "Storage write failed" }, { status: 500 });
  return NextResponse.json({ ok: true, id: newItem.id });
}

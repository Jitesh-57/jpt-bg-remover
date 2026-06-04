import { NextRequest, NextResponse } from "next/server";
import { readToken } from "@/lib/auth";
import type { GenItem } from "../save/route";

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

export async function POST(req: NextRequest) {
  const session = readToken(req);
  if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { id } = await req.json() as { id?: string };
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const histKey = ecKey(`hist:${session.email}`);
  const existing = await ecGet<GenItem[]>(histKey) ?? [];
  const updated = existing.filter(item => item.id !== id);

  if (updated.length === existing.length) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  await ecSet(histKey, updated);
  return NextResponse.json({ ok: true });
}

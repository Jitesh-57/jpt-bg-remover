import { NextRequest, NextResponse } from "next/server";
import { readToken } from "@/lib/auth";
import type { GenItem } from "../save/route";

export const runtime = "nodejs";

const EC_ID   = process.env.EDGE_CONFIG_ID;
const EC_READ = process.env.EDGE_CONFIG;

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

export async function GET(req: NextRequest) {
  const session = readToken(req);
  if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const histKey = ecKey(`hist:${session.email}`);
  const items = await ecGet<GenItem[]>(histKey) ?? [];

  return NextResponse.json({ items });
}

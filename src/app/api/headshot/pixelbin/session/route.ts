import { NextRequest, NextResponse } from "next/server";
import {
  PIXELBIN_TOKEN_COOKIE,
  encodePixelbinToken,
  getPixelbinAccountSession,
  getPixelbinToken,
  normalizePixelbinToken,
  pixelbinCookieOptions,
} from "@/lib/headshot-pixelbin-auth";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const apiToken = getPixelbinToken(req);
  if (!apiToken) return NextResponse.json({ connected: false });

  try {
    return NextResponse.json(await getPixelbinAccountSession(apiToken));
  } catch {
    const res = NextResponse.json({ connected: false, error: "PixelBin session expired. Please reconnect." });
    res.cookies.set(PIXELBIN_TOKEN_COOKIE, "", {
      ...pixelbinCookieOptions(),
      maxAge: 0,
    });
    return res;
  }
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { apiToken?: string };
  const apiToken = normalizePixelbinToken(body.apiToken || "");

  if (!apiToken) {
    return NextResponse.json({ error: "PixelBin API token is required" }, { status: 400 });
  }

  let session;
  try {
    session = await getPixelbinAccountSession(apiToken);
  } catch {
    return NextResponse.json({ error: "Could not connect PixelBin. Check the API token and try again." }, { status: 401 });
  }

  const res = NextResponse.json(session);
  res.cookies.set(PIXELBIN_TOKEN_COOKIE, encodePixelbinToken(apiToken), pixelbinCookieOptions());
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ connected: false });
  res.cookies.set(PIXELBIN_TOKEN_COOKIE, "", {
    ...pixelbinCookieOptions(),
    maxAge: 0,
  });
  return res;
}

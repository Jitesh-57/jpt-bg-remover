import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createAdminSupabase } from "@/lib/auth";
import { VISITOR_COOKIE, parseUserAgent, readCookie } from "@/lib/acquisition.server";

export const runtime = "nodejs";

/**
 * POST /api/track — the first-party copy of the site's analytics events.
 *
 * lib/analytics.ts sends every trackEvent() (and every page view) here in small
 * batches with navigator.sendBeacon, so what people do lands in
 * public.user_events next to their account, not only in Google Analytics.
 *
 * Body: { s: sessionId, e: [{ n: name, p: path, d: props, a: msAgo }] }
 *
 * Deliberately forgiving: it never fails loudly, because nothing on the page
 * waits for it. Anything malformed or oversized is dropped or trimmed.
 */

const MAX_EVENTS = 20;
const MAX_BODY = 64 * 1024;
const MAX_PROPS = 2048;
const NAME_OK = /^[A-Za-z0-9_.:\- ]{1,64}$/;
// Never stored, whatever a caller puts in props.
const PII_KEYS = /^(email|e-mail|name|full_?name|phone|mobile|password|token|card)$/i;

interface IncomingEvent { n?: unknown; p?: unknown; d?: unknown; a?: unknown }

function cleanProps(d: unknown): Record<string, unknown> {
  if (!d || typeof d !== "object" || Array.isArray(d)) return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(d as Record<string, unknown>)) {
    if (PII_KEYS.test(k) || k.length > 64) continue;
    if (v === null || ["string", "number", "boolean"].includes(typeof v)) {
      out[k] = typeof v === "string" ? v.slice(0, 300) : v;
    }
  }
  return JSON.stringify(out).length > MAX_PROPS ? { truncated: true } : out;
}

async function currentUserId(req: NextRequest): Promise<string | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null;
  try {
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      cookies: { getAll() { return req.cookies.getAll(); }, setAll() {} },
    });
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const done = () => new NextResponse(null, { status: 204 });

  const raw = await req.text().catch(() => "");
  if (!raw || raw.length > MAX_BODY) return done();
  let body: { s?: unknown; e?: unknown };
  try { body = JSON.parse(raw); } catch { return done(); }
  if (!Array.isArray(body.e) || body.e.length === 0) return done();

  const now = Date.now();
  const userId = await currentUserId(req);
  const visitorId = readCookie(req, VISITOR_COOKIE)?.slice(0, 64) || null;
  const sessionId = typeof body.s === "string" ? body.s.slice(0, 64) : null;
  const country = (req.headers.get("x-vercel-ip-country") || "").slice(0, 2) || null;
  const { device } = parseUserAgent(req.headers.get("user-agent") || "");

  const rows = (body.e as IncomingEvent[]).slice(0, MAX_EVENTS).flatMap((ev) => {
    const name = typeof ev?.n === "string" ? ev.n.trim() : "";
    if (!NAME_OK.test(name)) return [];
    const ago = typeof ev.a === "number" && ev.a > 0 ? Math.min(ev.a, 86_400_000) : 0;
    return [{
      created_at: new Date(now - ago).toISOString(),
      user_id: userId,
      visitor_id: visitorId,
      session_id: sessionId,
      name,
      path: typeof ev.p === "string" ? ev.p.slice(0, 300) : null,
      props: cleanProps(ev.d),
      country,
      device,
    }];
  });
  if (!rows.length) return done();

  const { error } = await createAdminSupabase().from("user_events").insert(rows);
  if (error && !/does not exist|schema cache/i.test(error.message)) {
    console.warn("[track] events not stored:", error.message);
  }
  return done();
}

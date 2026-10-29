import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { PAID_FEATURES_ENABLED, PAID_ROUTE_PREFIXES } from "@/lib/features";
import { FIRST_TOUCH_COOKIE, LAST_TOUCH_COOKIE, TOUCH_KEYS, VISITOR_COOKIE, encodeTouch, type Touch } from "@/lib/touch";

// In-memory rate limiter (per serverless instance — good enough for burst protection)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const AI_ROUTES = ["/api/remove-bg", "/api/ai-edit", "/api/generate-bg", "/api/upscale", "/api/object-remover"];
const AI_LIMIT = 10;       // max 10 AI requests per window per IP
const GLOBAL_LIMIT = 60;   // max 60 any-API requests per window per IP
const WINDOW_MS = 60_000;  // 1 minute window

function checkRate(key: string, limit: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

// Cleanup old entries every ~1000 requests to prevent memory leak
let cleanupCounter = 0;
function maybeCleanup() {
  if (++cleanupCounter % 1000 !== 0) return;
  const now = Date.now();
  rateLimitMap.forEach((val, key) => {
    if (now > val.resetAt) rateLimitMap.delete(key);
  });
}

// The single canonical host. The non-www .io apex 301-redirects here so Google
// consolidates ranking signals onto one URL instead of splitting them across
// duplicates. The old sjpt.in domain is redirected path by path in
// next.config.mjs, which runs first; it is listed here too so that nothing on
// it can ever be served as a duplicate page.
const CANONICAL_HOST = "www.sjpt.io";
const REDIRECT_HOSTS = new Set(["sjpt.io", "sjpt.in", "www.sjpt.in"]);

/*
  Served on whichever host asks for it, never redirected.

  Everything else on the apex 301s to www, which is right for pages. It is
  wrong for ads.txt: ad-verification crawlers follow at most one redirect, and
  the apex hop can already be the second one (http → https → www). AdSense
  registered this site as "sjpt.io" and reported "no ads.txt file was found"
  for a month while the file sat correctly at www.sjpt.io/ads.txt.

  Safe to exempt, because it is a machine-read manifest rather than an
  indexable page — there is no ranking signal here to consolidate.
*/
const HOST_NEUTRAL = new Set(["/ads.txt"]);

/*
  Tools that were removed for good (free resolvers couldn't download videos
  reliably). 410 tells Google to drop them; they used to 301 to the home page,
  which doesn't do the job either, so Google read it as a soft 404.
*/
const GONE = new Set(["/instagram-video-downloader", "/youtube-video-downloader"]);
const GONE_HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta name="viewport" content="width=device-width,initial-scale=1"><title>This tool has been removed | PixelShine</title></head><body style="font-family:system-ui,sans-serif;max-width:560px;margin:80px auto;padding:0 20px;line-height:1.6"><h1>This tool has been removed</h1><p>The video downloader is no longer available.</p><p><a href="/tools">See the free photo tools</a> or <a href="/">go to the home page</a>.</p></body></html>`;

// ── Visitor and source cookies ──────────────────────────────────────────────
// Where a visitor came from is only knowable on the first page they open: the
// referrer and the UTM tags are on that request and gone by the next one. So
// the first page view is stamped here, on the server, before any script runs
// (lib/touch.ts; read at signup by lib/acquisition.server.ts).
const YEAR_S = 60 * 60 * 24 * 365;

/** A real page load: a document request, not an API call, asset or prefetch. */
function isPageLoad(request: NextRequest): boolean {
  if (request.method !== "GET") return false;
  const path = request.nextUrl.pathname;
  if (path.startsWith("/api/") || path.startsWith("/_next/")) return false;
  if (request.headers.get("rsc") || request.headers.get("next-router-prefetch")) return false;
  const purpose = request.headers.get("sec-purpose") || request.headers.get("purpose") || "";
  if (/prefetch/i.test(purpose)) return false;
  return (request.headers.get("accept") || "").includes("text/html");
}

function stampVisitor(request: NextRequest, res: NextResponse): void {
  if (!isPageLoad(request)) return;
  const url = request.nextUrl;
  const cookie = { path: "/", maxAge: YEAR_S, sameSite: "lax" as const, httpOnly: true, secure: url.protocol === "https:" };

  if (!request.cookies.get(VISITOR_COOKIE)) res.cookies.set(VISITOR_COOKIE, crypto.randomUUID(), cookie);

  const touch: Touch = {};
  for (const k of TOUCH_KEYS) {
    const v = url.searchParams.get(k);
    if (v) touch[k] = v.slice(0, 150);
  }
  const tagged = Object.keys(touch).length > 0;

  if (!request.cookies.get(FIRST_TOUCH_COOKIE)) {
    const ref = request.headers.get("referer") || "";
    let external = "";
    try { if (ref && new URL(ref).host !== url.host) external = ref.slice(0, 300); } catch { /* not a URL */ }
    res.cookies.set(FIRST_TOUCH_COOKIE, encodeTouch({ ...touch, r: external, l: url.pathname.slice(0, 200), t: Date.now() }), cookie);
  }
  if (tagged) {
    res.cookies.set(LAST_TOUCH_COOKIE, encodeTouch({ ...touch, l: url.pathname.slice(0, 200), t: Date.now() }), cookie);
  }
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Canonical-host redirect — consolidate duplicate domains onto www.sjpt.io.
  const host = request.headers.get("host")?.toLowerCase() ?? "";
  if (REDIRECT_HOSTS.has(host) && !HOST_NEUTRAL.has(path)) {
    const url = new URL(request.url);
    url.host = CANONICAL_HOST;
    url.protocol = "https:";
    url.port = "";
    return NextResponse.redirect(url, 301);
  }

  if (GONE.has(path)) {
    return new NextResponse(GONE_HTML, { status: 410, headers: { "content-type": "text/html; charset=utf-8", "x-robots-tag": "noindex" } });
  }

  // Free-only mode: redirect the hidden paid/AI pages back to the home page.
  if (!PAID_FEATURES_ENABLED && PAID_ROUTE_PREFIXES.some(p => path === p || path.startsWith(p + "/"))) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  // Vercel injects this at the edge — accurate, no extra geo-IP lookup needed.
  const country = request.headers.get("x-vercel-ip-country") || "";

  // Rate limiting for API routes
  // Razorpay's webhook deliveries come from a few shared IPs and are signed;
  // rate-limiting them would only make Razorpay retry, so they are let through.
  if (path.startsWith("/api/") && !path.startsWith("/api/razorpay/webhook")) {
    maybeCleanup();
    const isAiRoute = AI_ROUTES.some(r => path.startsWith(r));

    if (isAiRoute && !checkRate(`ai:${ip}`, AI_LIMIT)) {
      return NextResponse.json({ error: "Too many requests. Please wait a minute." }, { status: 429 });
    }
    if (!checkRate(`global:${ip}`, GLOBAL_LIMIT)) {
      return NextResponse.json({ error: "Too many requests. Please wait a minute." }, { status: 429 });
    }
  }

  // Supabase session refresh
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const res = NextResponse.next({ request });
    if (country) res.cookies.set("jpt_country", country, { path: "/", maxAge: 86400, httpOnly: false });
    stampVisitor(request, res);
    return res;
  }

  let supabaseResponse = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  await supabase.auth.getUser();
  if (country) supabaseResponse.cookies.set("jpt_country", country, { path: "/", maxAge: 86400, httpOnly: false });
  stampVisitor(request, supabaseResponse);
  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};

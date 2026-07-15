import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { PAID_FEATURES_ENABLED, PAID_ROUTE_PREFIXES } from "@/lib/features";

// In-memory rate limiter (per serverless instance — good enough for burst protection)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const AI_ROUTES = ["/api/remove-bg", "/api/ai-edit", "/api/generate-bg", "/api/upscale"];
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

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Free-only mode: redirect the hidden paid/AI pages back to the home page.
  if (!PAID_FEATURES_ENABLED && PAID_ROUTE_PREFIXES.some(p => path === p || path.startsWith(p + "/"))) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  // Vercel injects this at the edge — accurate, no extra geo-IP lookup needed.
  const country = request.headers.get("x-vercel-ip-country") || "";

  // Rate limiting for API routes
  if (path.startsWith("/api/")) {
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
  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};

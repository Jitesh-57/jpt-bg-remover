import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { finishSignIn } from "@/lib/auth-finish.server";

export const runtime = "nodejs";

/**
 * POST /api/auth/onetap — finishes a Google One Tap sign-in.
 *
 * Body: { credential, nonce }. The credential is the ID token Google handed
 * the page; Supabase checks it against Google (and against the client ids
 * allowed in its Google provider settings) and opens a session, whose cookies
 * go back on this response. Then the same steps as the OAuth callback: the
 * profile, the signup trial, the signup cookie.
 */
export async function POST(req: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: "Sign-in is not configured." }, { status: 503 });
  }
  const { credential, nonce } = await req.json().catch(() => ({})) as { credential?: unknown; nonce?: unknown };
  if (typeof credential !== "string" || credential.length > 8192 || typeof nonce !== "string" || nonce.length > 256) {
    return NextResponse.json({ error: "That sign-in didn't come through. Please try again." }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data, error } = await supabase.auth.signInWithIdToken({ provider: "google", token: credential, nonce });
  if (error || !data.user) {
    console.error("[auth/onetap]", error?.message || "no user");
    return NextResponse.json({ error: "Google sign-in didn't complete. Please use the Sign in button." }, { status: 401 });
  }

  await finishSignIn(supabase, data.user, req, response);
  return response;
}

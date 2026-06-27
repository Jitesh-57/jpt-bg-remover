import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { checkAuth, withCredits, createAdminSupabase } from "@/lib/auth";
import { runPixelBinPredictionAsDataUrl } from "@/lib/pixelbin";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Creative Apps generation endpoint.
 *
 * Flow:
 *   - Not signed in            → 401 (widget prompts Google sign-in)
 *   - Paid plan                → normal credit deduction (withCredits "ai")
 *   - Free plan, no trial yet  → ONE free generation, then mark trial used
 *   - Free plan, trial used    → 403 upgradeRequired (widget opens payment popup)
 *
 * The one-free-trial flag is stored in Supabase auth user_metadata
 * (creative_trial_used) so it needs no DB schema change.
 */
export async function POST(req: NextRequest) {
  const { session, error } = await checkAuth(req);
  if (error) return error; // 401 when not signed in

  const { dataUrl, imageUrl, prompt } = (await req.json()) as {
    dataUrl?: string;
    imageUrl?: string;
    prompt?: string;
  };
  const src = imageUrl || dataUrl;
  if (!src || !prompt) {
    return NextResponse.json({ error: "image and prompt required" }, { status: 400 });
  }

  // Paid users: standard credit flow.
  if (session!.plan !== "free") {
    try {
      const result = await runPixelBinPredictionAsDataUrl(src, "nanoBananaPro", "generate", { prompt });
      return withCredits({ dataUrl: result }, session!, "ai", req);
    } catch (e) {
      console.error("[creative-edit]", e);
      return NextResponse.json({ error: String(e) }, { status: 500 });
    }
  }

  // Free users: read the one-time trial flag from auth user metadata.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return req.cookies.getAll(); }, setAll() {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  const trialUsed = user?.user_metadata?.creative_trial_used === true;

  if (trialUsed) {
    return NextResponse.json(
      {
        error: "You've used your free trial. Upgrade to a paid plan to keep creating.",
        upgradeRequired: true,
        trialUsed: true,
        credits: session!.credits,
      },
      { status: 403 }
    );
  }

  // First (free) generation for this user.
  try {
    const result = await runPixelBinPredictionAsDataUrl(src, "nanoBananaPro", "generate", { prompt });
    // Mark the trial as used (best-effort — never block the result on this).
    try {
      const admin = createAdminSupabase();
      await admin.auth.admin.updateUserById(session!.userId, {
        user_metadata: { ...(user?.user_metadata || {}), creative_trial_used: true },
      });
    } catch (e) {
      console.warn("[creative-edit] could not mark trial used:", e);
    }
    return NextResponse.json({ dataUrl: result, trial: true, credits: session!.credits });
  } catch (e) {
    console.error("[creative-edit]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

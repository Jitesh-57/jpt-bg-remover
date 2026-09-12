import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/auth";
import { generateFromText } from "@/lib/ai-image";
import { falConfigured } from "@/lib/fal";
import { IMAGE_JOBS, type ImageJob } from "@/lib/image-jobs";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Fills the site's image slots without anyone having to click anything.
 *
 * The work is described in src/lib/image-jobs.ts — 339 slots across the
 * homepage, the tool pages, the 200 app cards, the preset thumbnails, the
 * samples and the programmatic pages. Blog images are deliberately not in that
 * list and are not generated here.
 *
 * Each invocation generates until its time budget is nearly spent, then starts
 * the next invocation itself and returns. A single trigger therefore walks the
 * whole set, which matters because the daily cron only fires once and a
 * 339-image run cannot fit in one function lifetime.
 *
 * Triggered by the Vercel cron in vercel.json, or manually with ?token=…
 * Idempotent: a slot that already has a file is skipped, so re-running is free
 * and interrupting it loses nothing.
 */
const TOKEN = process.env.ADMIN_IMAGE_TOKEN || "jptblog2026";

/** Stop starting new generations once this much of the budget is gone. */
const BUDGET_MS = 230_000;
/** Hard ceiling per invocation, so a misconfiguration cannot run away. */
const MAX_PER_RUN = 18;
/** Hard ceiling on chained invocations, for the same reason. */
const MAX_HOPS = 40;

const keyOf = (bucket: string, path: string) => `${bucket}|${path}`;

async function missingJobs(
  supabase: ReturnType<typeof createAdminSupabase>
): Promise<ImageJob[]> {
  const folders = new Set(
    IMAGE_JOBS.map((j) =>
      keyOf(j.bucket, j.path.includes("/") ? j.path.split("/").slice(0, -1).join("/") : "")
    )
  );
  const have = new Set<string>();
  for (const entry of Array.from(folders)) {
    const idx = entry.indexOf("|");
    const bucket = entry.slice(0, idx);
    const folder = entry.slice(idx + 1);
    const { data } = await supabase.storage.from(bucket).list(folder || undefined, { limit: 1000 });
    for (const f of data || []) have.add(keyOf(bucket, folder ? `${folder}/${f.name}` : f.name));
  }
  return IMAGE_JOBS.filter((j) => !have.has(keyOf(j.bucket, j.path)));
}

/**
 * Starts the next invocation and returns as soon as it has been accepted.
 *
 * Awaiting the response headers — rather than firing and forgetting — is what
 * makes this dependable: the platform can freeze this instance the moment the
 * response is sent, and a request that had not yet left would be lost with it.
 * The next instance runs independently, so its body is of no interest here.
 */
async function startNextHop(req: NextRequest, hop: number): Promise<string> {
  const url = `${req.nextUrl.origin}${req.nextUrl.pathname}?token=${TOKEN}&hop=${hop + 1}`;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    await fetch(url, { signal: ctrl.signal, headers: { "x-chained-from": String(hop) } });
    clearTimeout(timer);
    return "next run started";
  } catch {
    // An abort here means the next instance has the request and we stopped
    // waiting for its body, which is the intended outcome.
    return "next run dispatched";
  }
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const authed =
    req.headers.get("x-vercel-cron") !== null ||
    (q.get("token") || "").trim() === TOKEN;
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hop = Math.max(Number(q.get("hop") || 0), 0);
  if (hop > MAX_HOPS) {
    return NextResponse.json({ stopped: "hop limit reached", hop });
  }

  if (!falConfigured()) {
    return NextResponse.json({
      skipped: "FAL_KEY is not set on this deployment",
      hint: "Add FAL_KEY in the Vercel project's environment variables and redeploy.",
    }, { status: 412 });
  }

  const started = Date.now();
  const supabase = createAdminSupabase();
  const todo = await missingJobs(supabase);

  if (!todo.length) {
    return NextResponse.json({ done: true, hop, remaining: 0, note: "every slot already has a file" });
  }

  const results: Record<string, string> = {};
  let made = 0;

  for (const job of todo) {
    if (made >= MAX_PER_RUN || Date.now() - started > BUDGET_MS) break;
    const key = `${job.bucket}/${job.path}`;
    try {
      const dataUrl = await generateFromText(job.prompt, { aspect_ratio: job.aspect });
      const b64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
      const bytes = Buffer.from(b64, "base64");
      const contentType = job.path.endsWith(".jpg") ? "image/jpeg" : "image/png";
      const { error } = await supabase.storage
        .from(job.bucket)
        .upload(job.path, bytes, { contentType, upsert: true });
      if (error) throw new Error(error.message);
      results[key] = `ok (${Math.round(bytes.length / 1024)} KB)`;
      made += 1;
    } catch (e) {
      const msg = (e as Error).message;
      results[key] = `FAILED: ${msg}`;
      // A credentials or billing failure will fail every remaining job in the
      // same way, so stop rather than burning the rest of the budget on it.
      if (/credential|unauthor|out of credit|payment|quota/i.test(msg)) {
        return NextResponse.json({ stopped: "fal rejected the request", hop, results }, { status: 502 });
      }
    }
  }

  const remaining = Math.max(todo.length - made, 0);
  const chained = remaining > 0 ? await startNextHop(req, hop) : null;

  return NextResponse.json({
    hop,
    generatedThisRun: made,
    remaining,
    done: remaining === 0,
    chained,
    elapsedMs: Date.now() - started,
    results,
  });
}

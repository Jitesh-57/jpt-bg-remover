import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/auth";
import { editImage, generateFromText } from "@/lib/ai-image";
import { geminiGenerateFromText } from "@/lib/gemini";
import { falConfigured, FalError } from "@/lib/fal";
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
const MAX_HOPS = 90;
/** Attempts per image, including the first. */
const RETRIES = 3;
/** Base backoff between attempts; multiplied by the attempt number. */
const BACKOFF_MS = 4_000;
/** Pause between images, to stay under fal's rate limit rather than hit it. */
const GAP_MS = 1_500;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const keyOf = (bucket: string, path: string) => `${bucket}|${path}`;

/** Public URL for a file in a public bucket, for handing to fal as an input. */
function publicUrl(bucket: string, path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return `${base}/storage/v1/object/public/${encodeURIComponent(bucket)}/${path
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}


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
  let failed = 0;

  const present = new Set(
    IMAGE_JOBS.filter((j) => !todo.includes(j)).map((j) => keyOf(j.bucket, j.path))
  );

  // Rotated by hop: a job that cannot currently be generated sits at the head
  // of this list every time, and run 7 burned its whole budget on thirteen
  // such jobs while 240 workable ones went untouched. Starting each hop at a
  // different offset guarantees the run reaches them.
  const offset = todo.length ? (hop * MAX_PER_RUN) % todo.length : 0;
  const ordered = [...todo.slice(offset), ...todo.slice(0, offset)];

  for (const job of ordered) {
    if (made >= MAX_PER_RUN || Date.now() - started > BUDGET_MS) break;
    const key = `${job.bucket}/${job.path}`;

    // Sources are generated first and the list is ordered to match, but a
    // partial run can still reach an app before its source exists.
    let source = job.editOf;
    if (source && !present.has(keyOf(job.bucket, source))) {
      const alt = job.editOfFallback;
      if (alt && present.has(keyOf(job.bucket, alt))) {
        source = alt;
      } else {
        results[key] = `waiting for ${job.editOf}`;
        continue;
      }
    }

    // fal rate-limits, and the first production run lost 14 of 17 images to a
    // single 429 each. One retry with a pause recovers almost all of those.
    let lastError = "";
    for (let attempt = 0; attempt < RETRIES; attempt++) {
      if (Date.now() - started > BUDGET_MS) break;
      try {
        // An edit job runs the app's own prompt over a stored source photo, so
        // the result is what the tool actually produces. A generate job makes
        // an image from the prompt alone.
        const dataUrl = source
          ? await editImage(publicUrl(job.bucket, source), job.prompt, undefined, job.aspect, {
              // raw: the app's prompt is already a complete instruction and
              // must not be wrapped in the interactive editor's preamble.
              strict: true, raw: true, budgetMs: 120_000,
            })
          : await generateFromText(job.prompt, {
              // job.aspect, not the default: dropping this sent every generate
              // job at 16:9 whatever slot it was for.
              aspect_ratio: job.aspect,
              // No Gemini fallback here: a masked fal error reports the wrong
              // provider and hides whether a retry is worth attempting.
              strict: true,
              budgetMs: 120_000,
            });
        const b64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
        const bytes = Buffer.from(b64, "base64");
        const contentType = job.path.endsWith(".jpg") ? "image/jpeg" : "image/png";
        const { error } = await supabase.storage
          .from(job.bucket)
          .upload(job.path, bytes, { contentType, upsert: true });
        if (error) throw new Error(`upload failed: ${error.message}`);
        results[key] = `ok (${Math.round(bytes.length / 1024)} KB)`;
        made += 1;
        lastError = "";
        break;
      } catch (e) {
        const fal = e instanceof FalError ? e : null;
        lastError = fal ? `fal ${fal.status}: ${fal.detail || fal.message}` : (e as Error).message;

        // fal's content checker turns down a handful of these prompts —
        // deterministically, as run 6 established by failing the same six on
        // all three attempts. The subjects are entirely benign (a gold ring on
        // a worktop, a living room), so the checker is over-triggering rather
        // than catching anything, and rewording it blind was costing a
        // production run per guess.
        //
        // So a rejected prompt goes to Gemini instead. This is not the blanket
        // fallback that hid the original 422: that one substituted Gemini's
        // error for fal's on *every* failure, so a misconfiguration looked
        // like a rate limit. Here fal's real error is already known, reported
        // and acted on — the fallback is the action, not a way of avoiding
        // knowing.
        const policyRejected = !!fal && /content_policy|content checker/i.test(fal.detail || fal.message);
        if (policyRejected) {
          try {
            const viaGemini = await geminiGenerateFromText(job.prompt, { aspect_ratio: job.aspect });
            const res = await fetch(viaGemini);
            if (!res.ok) throw new Error(`fetch ${res.status}`);
            const bytes = Buffer.from(await res.arrayBuffer());
            const { error } = await supabase.storage
              .from(job.bucket)
              .upload(job.path, bytes, { contentType: job.path.endsWith(".jpg") ? "image/jpeg" : "image/png", upsert: true });
            if (error) throw new Error(`upload failed: ${error.message}`);
            results[key] = `ok via Gemini (${Math.round(bytes.length / 1024)} KB) — fal's checker refused this prompt`;
            made += 1;
            lastError = "";
          } catch (g) {
            results[key] = `SKIPPED: fal's checker refused it and Gemini failed too (${(g as Error).message})`;
          }
          break;
        }

        // A rejected key, an empty balance or a malformed request will fail
        // every remaining job identically. Stop rather than spend the budget
        // discovering that 300 more times.
        if (fal && !fal.transient && !policyRejected) {
          results[key] = `FAILED: ${lastError}`;
          return NextResponse.json(
            { stopped: "fal rejected the request and will keep rejecting it", hop, falStatus: fal.status, detail: fal.detail, results },
            { status: 502 }
          );
        }
        if (attempt < RETRIES - 1) await sleep(BACKOFF_MS * (attempt + 1));
      }
    }

    if (lastError && !results[key]?.startsWith("SKIPPED")) {
      results[key] = `FAILED: ${lastError}`;
      failed += 1;
    }
    // A short gap between jobs, which is what stops the rate limiting rather
    // than just recovering from it.
    if (Date.now() - started < BUDGET_MS) await sleep(GAP_MS);
  }

  const remaining = Math.max(todo.length - made, 0);
  const chained = remaining > 0 ? await startNextHop(req, hop) : null;

  return NextResponse.json({
    hop,
    generatedThisRun: made,
    failedThisRun: failed,
    remaining,
    done: remaining === 0,
    chained,
    elapsedMs: Date.now() - started,
    results,
  });
}

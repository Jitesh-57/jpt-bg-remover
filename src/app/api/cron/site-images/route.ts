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
 * The work is described in src/lib/image-jobs.ts — every slot across the
 * homepage, the tool pages, the 200 app cards, the preset thumbnails, the
 * samples and the programmatic pages. Blog images are deliberately not in that
 * list and are not generated here.
 *
 * Each invocation generates until its time budget is nearly spent, then starts
 * the next invocation itself and returns. A single trigger therefore walks the
 * whole set, which matters because the daily cron only fires once and a
 * few-hundred-image run cannot fit in one function lifetime.
 *
 * Triggered by the Vercel cron in vercel.json, or manually with ?token=…
 * Idempotent: a slot that already has a file is skipped, so re-running is free
 * and interrupting it loses nothing.
 */
const TOKEN = process.env.ADMIN_IMAGE_TOKEN || "jptblog2026";

/** Stop starting new generations once this much of the budget is gone. */
const BUDGET_MS = 230_000;
/** Hard ceiling per invocation, so a misconfiguration cannot run away. */
const MAX_PER_RUN = 90;
/** Hard ceiling on chained invocations, for the same reason. */
const MAX_HOPS = 30;
/** Attempts per image, including the first. */
const RETRIES = 3;
/** Base backoff between attempts; multiplied by the attempt number. */
const BACKOFF_MS = 4_000;
/**
 * Images generated at once.
 *
 * This was the real reason the whole thing was slow. Generating one at a time
 * at roughly fifteen seconds each puts 351 images at ninety minutes of wall
 * clock even with nothing going wrong — and every invocation could only fit
 * about fifteen before its budget ran out, so it took a couple of dozen
 * chained hops.
 *
 * Six workers pulling from a shared queue brings a full run to around eighty
 * images, so the set finishes in three or four hops instead. The pool size is
 * also what paces the requests now, which is why the fixed gap between images
 * is gone: six in flight is well inside fal's limits, and the retry path
 * handles a 429 if it is not.
 */
const CONCURRENCY = 6;

const keyOf = (bucket: string, path: string) => `${bucket}|${path}`;

/** The bucket the skip-list markers live in. */
const LANDING_BUCKET = "landing";

/**
 * Where a permanently-refused job is recorded.
 *
 * Rotating the queue was not enough. The workflow always calls with hop=0, so
 * the offset is always zero and that first invocation spends its entire budget
 * on the stuck cluster before the chain gets a chance to rotate past it. Runs
 * 7 and 8 both produced nothing for exactly this reason.
 *
 * So a job that fal's checker refuses *and* Gemini cannot produce is marked
 * here, and later runs drop it from the queue entirely. The marker is a real
 * file in the bucket, which means it is inspectable and, more importantly,
 * deletable: removing it puts the job back in the queue, so this is a skip
 * list rather than a permanent verdict.
 */
const REFUSED_PREFIX = "refused";
const refusedMarker = (bucket: string, path: string) =>
  `${REFUSED_PREFIX}/${bucket}__${path.replace(/\//g, "__")}.txt`;

/** Public URL for a file in a public bucket, for handing to fal as an input. */
function publicUrl(bucket: string, path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return `${base}/storage/v1/object/public/${encodeURIComponent(bucket)}/${path
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}


/**
 * Creates any bucket a job writes to that does not exist yet.
 *
 * Run 10 lost all 83 preset thumbnails and all 3 sample photos to
 * "upload failed: Bucket not found": the code has always read them from a
 * bucket named "App preset images", and that bucket had never been created.
 * The service-role key can create it, so the generator does — public, because
 * the pages link to these files directly.
 */
async function ensureBuckets(
  supabase: ReturnType<typeof createAdminSupabase>
): Promise<string[]> {
  const needed = Array.from(new Set(IMAGE_JOBS.map((j) => j.bucket)));
  const { data: existing } = await supabase.storage.listBuckets();
  const have = new Set((existing || []).map((b) => b.name));
  const created: string[] = [];
  for (const name of needed) {
    if (have.has(name)) continue;
    const { error } = await supabase.storage.createBucket(name, { public: true });
    if (!error) created.push(name);
    else console.warn(`[site-images] could not create bucket "${name}": ${error.message}`);
  }
  return created;
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

  // Kill switch, default off.
  //
  // Bulk generation spends real money at fal, and each invocation starts the
  // next one itself — so once a run is walking the queue there is no way to
  // stop it from outside except to take the endpoint away. It is off unless
  // SITE_IMAGES_ENABLED is set to "on" in the environment, which means a
  // deploy stops an in-flight chain at its next hop, and neither the nightly
  // cron nor a stray call can restart it.
  if (process.env.SITE_IMAGES_ENABLED !== "on") {
    return NextResponse.json({
      stopped: "image generation is switched off",
      hint: 'Set SITE_IMAGES_ENABLED="on" in the Vercel environment to allow a run, and unset it again afterwards.',
    }, { status: 423 });
  }

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
  const createdBuckets = await ensureBuckets(supabase);
  const all = await missingJobs(supabase);

  // Drop anything previously established as unproducible by either provider.
  const { data: refusedFiles } = await supabase.storage
    .from(LANDING_BUCKET)
    .list(REFUSED_PREFIX, { limit: 1000 });
  const refused = new Set((refusedFiles || []).map((f) => f.name));
  const todo = all.filter((j) => !refused.has(refusedMarker(j.bucket, j.path).split("/").pop()!));
  const skippedPermanently = all.length - todo.length;

  if (!todo.length) {
    return NextResponse.json({
      done: true, hop, remaining: 0, skippedPermanently, createdBuckets,
      note: skippedPermanently
        ? `every remaining slot has a file; ${skippedPermanently} are on the skip list (delete landing/${REFUSED_PREFIX}/ to retry them)`
        : "every slot already has a file",
    });
  }

  const results: Record<string, string> = {};
  let made = 0;
  let failed = 0;
  // Once Gemini reports its quota is gone it will report the same for every
  // subsequent job, so stop asking. Without this, marking the thirteen stuck
  // jobs costs a pointless Gemini round-trip each and eats the whole budget
  // again — which is what happened on runs 7 and 8.
  let geminiExhausted = false;
  /** Set when a fal error will repeat for every job, to end the run. */
  type Fatal = { status: number; detail: string };
  const fatalRef: { current: Fatal | null } = { current: null };
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const present = new Set(
    IMAGE_JOBS.filter((j) => !todo.includes(j)).map((j) => keyOf(j.bucket, j.path))
  );

  // Rotated by hop as a secondary safeguard; the skip list above is what
  // actually stops an unbuildable cluster from being retried forever.
  const offset = todo.length ? (hop * MAX_PER_RUN) % todo.length : 0;
  const ordered = [...todo.slice(offset), ...todo.slice(0, offset)];

  // A shared cursor the workers pull from, so a slow job does not hold up the
  // others and the budget check applies per pick rather than per batch.
  let cursor = 0;
  const outOfTime = () => Date.now() - started > BUDGET_MS;

  async function worker(): Promise<void> {
    for (;;) {
      if (outOfTime() || made >= MAX_PER_RUN) return;
      const job = ordered[cursor++];
      if (!job) return;
      await runJob(job);
    }
  }

  async function runJob(job: ImageJob): Promise<void> {
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
        return;
      }
    }

    const contentType = job.path.endsWith(".jpg") ? "image/jpeg" : "image/png";

    /** Writes bytes to the slot and records the win. Throws on upload failure. */
    async function store(bytes: Buffer, note: string): Promise<void> {
      const { error } = await supabase.storage
        .from(job.bucket)
        .upload(job.path, bytes, { contentType, upsert: true });
      if (error) throw new Error(`upload failed: ${error.message}`);
      results[key] = `${note} (${Math.round(bytes.length / 1024)} KB)`;
      made += 1;
      // A source that has just landed unblocks the apps that edit from it,
      // within this same run.
      present.add(keyOf(job.bucket, job.path));
    }

    const bytesOfDataUrl = (dataUrl: string) =>
      Buffer.from(dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl, "base64");

    /**
     * What to do when fal refuses this particular prompt.
     *
     * Three things are tried before giving up, because a blank card is the
     * worst outcome and the middle rung recovers most of them:
     *
     *  1. If this was an *edit*, generate the same idea from the prompt alone.
     *     Roughly sixty app cards failed on run 10 with "Could not generate
     *     images with the given prompts and images" — the prompt/photo pair is
     *     what the model objected to, and the prompt on its own is fine. The
     *     card then shows an imagined result rather than a real edit of the
     *     stored source, which is a fair trade for having artwork at all.
     *  2. Gemini, which has a different checker.
     *  3. The skip list, so later runs spend no time on it.
     */
    async function onPromptRejected(why: string): Promise<void> {
      if (source) {
        try {
          const dataUrl = await generateFromText(job.prompt, {
            aspect_ratio: job.aspect,
            strict: true,
            budgetMs: 120_000,
          });
          await store(bytesOfDataUrl(dataUrl), "ok as a fresh generation — fal refused the edit");
          return;
        } catch {
          // Fall through to Gemini.
        }
      }
      try {
        if (geminiExhausted) throw new Error("Gemini quota already exhausted this run");
        const viaGemini = await geminiGenerateFromText(job.prompt, { aspect_ratio: job.aspect });
        const res = await fetch(viaGemini);
        if (!res.ok) throw new Error(`fetch ${res.status}`);
        await store(Buffer.from(await res.arrayBuffer()), "ok via Gemini — fal refused this prompt");
        return;
      } catch (g) {
        const gm = (g as Error).message;
        if (/high demand|quota|exhausted/i.test(gm)) geminiExhausted = true;
        results[key] = `SKIPPED: fal refused it (${why}) and Gemini failed too (${gm})`;
        await supabase.storage
          .from(LANDING_BUCKET)
          .upload(
            refusedMarker(job.bucket, job.path),
            Buffer.from(`${new Date().toISOString()} fal: ${why} | gemini: ${gm}`),
            { contentType: "text/plain", upsert: true }
          )
          .catch(() => {});
      }
    }

    let lastError = "";
    for (let attempt = 0; attempt < RETRIES; attempt++) {
      if (outOfTime()) break;
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
              aspect_ratio: job.aspect,
              strict: true,
              budgetMs: 120_000,
            });
        await store(bytesOfDataUrl(dataUrl), "ok");
        lastError = "";
        return;
      } catch (e) {
        const fal = e instanceof FalError ? e : null;
        lastError = fal ? `fal ${fal.status}: ${fal.detail || fal.message}` : (e as Error).message;

        // Only a rejected key or an empty balance fails every remaining job
        // identically. Stopping the whole run is handled by the caller via
        // fatal, so the other workers wind down too.
        if (fal?.fatal) {
          fatalRef.current = { status: fal.status, detail: fal.detail };
          results[key] = `FAILED: ${lastError}`;
          return;
        }

        if (fal?.promptRejected) {
          await onPromptRejected(fal.detail || fal.message);
          if (!results[key]?.startsWith("SKIPPED")) lastError = "";
          return;
        }

        if (attempt < RETRIES - 1) await sleep(BACKOFF_MS * (attempt + 1));
      }
    }

    if (lastError && !results[key]?.startsWith("SKIPPED")) {
      results[key] = `FAILED: ${lastError}`;
      failed += 1;
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  const fatal = fatalRef.current;
  if (fatal) {
    return NextResponse.json(
      { stopped: "fal rejected the request and will keep rejecting it", hop, falStatus: fatal.status, detail: fatal.detail, generatedThisRun: made, results },
      { status: 502 }
    );
  }

  const remaining = Math.max(todo.length - made, 0);
  const chained = remaining > 0 ? await startNextHop(req, hop) : null;

  return NextResponse.json({
    hop,
    generatedThisRun: made,
    failedThisRun: failed,
    createdBuckets,
    skippedPermanently,
    remaining,
    done: remaining === 0,
    chained,
    elapsedMs: Date.now() - started,
    results,
  });
}

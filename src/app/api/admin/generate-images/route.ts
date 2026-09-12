import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/auth";
import { generateFromText } from "@/lib/ai-image";
import { falConfigured } from "@/lib/fal";
import { jobsFor, jobCounts, type ImageJob } from "@/lib/image-jobs";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Generates the site's creatives and uploads them to Supabase Storage.
 *
 * Every slot the pages look for is described in src/lib/image-jobs.ts, and the
 * paths there are the paths the pages request — so a file landing here appears
 * on the site with no code change and no redeploy.
 *
 * Runs in batches, because generation takes 10-30 seconds an image and the
 * function has a hard ceiling. Each response carries `next`, the URL for the
 * following batch, so this can be walked through by clicking one link at a
 * time. Files that already exist are skipped unless force=1.
 *
 *   /api/admin/generate-images?token=...                    what would run
 *   /api/admin/generate-images?token=...&set=home&run=1     the 4 homepage images
 *   /api/admin/generate-images?token=...&set=apps&run=1&limit=6
 *   ...&force=1    regenerate files that already exist
 *   ...&model=gpt-image    use GPT Image instead of Nano Banana
 *   ...&path=creative/ghibli-style.png    one specific slot
 */
const TOKEN = process.env.ADMIN_IMAGE_TOKEN || "jptblog2026";

/** bucket + path, joined for set membership. Buckets cannot contain "|". */
const keyOf = (bucket: string, path: string) => `${bucket}|${path}`;

function baseUrl(req: NextRequest): string {
  return `${req.nextUrl.origin}${req.nextUrl.pathname}`;
}

/** Which of these jobs already have a file in the bucket. */
async function existing(
  supabase: ReturnType<typeof createAdminSupabase>,
  jobs: ImageJob[]
): Promise<Set<string>> {
  // One listing per bucket and folder, rather than a request per file.
  const folders = new Set(
    jobs.map((j) => keyOf(j.bucket, j.path.includes("/") ? j.path.split("/").slice(0, -1).join("/") : ""))
  );
  const have = new Set<string>();
  for (const entry of Array.from(folders)) {
    const idx = entry.indexOf("|");
    const bucket = entry.slice(0, idx);
    const folder = entry.slice(idx + 1);
    const { data } = await supabase.storage.from(bucket).list(folder || undefined, { limit: 1000 });
    for (const f of data || []) have.add(keyOf(bucket, folder ? `${folder}/${f.name}` : f.name));
  }
  return have;
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  if ((q.get("token") || "").trim() !== TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const set = q.get("set");
  const onePath = q.get("path");
  const force = q.get("force") === "1";
  const model = q.get("model") || undefined;
  const limit = Math.min(Math.max(Number(q.get("limit") || 6), 1), 24);

  let jobs = jobsFor(set);
  if (onePath) jobs = jobs.filter((j) => j.path === onePath);
  if (!jobs.length) {
    return NextResponse.json({ error: "No jobs match", sets: jobCounts() }, { status: 400 });
  }

  const supabase = createAdminSupabase();
  const have = force ? new Set<string>() : await existing(supabase, jobs);
  const todo = jobs.filter((j) => !have.has(keyOf(j.bucket, j.path)));

  // Without run=1 this is a dry run: it reports what is missing and stops, so
  // checking how much is left costs nothing.
  if (q.get("run") !== "1") {
    return NextResponse.json({
      dryRun: true,
      falConfigured: falConfigured(),
      sets: jobCounts(),
      matched: jobs.length,
      alreadyPresent: jobs.length - todo.length,
      missing: todo.length,
      missingPaths: todo.slice(0, 40).map((j) => `${j.bucket}/${j.path}`),
      // show=1 prints the prompts too, so what is about to be made can be read
      // before any of it is paid for.
      ...(q.get("show") === "1"
        ? { prompts: todo.slice(0, Number(q.get("showLimit") || limit)).map((j) => ({ path: `${j.bucket}/${j.path}`, aspect: j.aspect, prompt: j.prompt })) }
        : {}),
      runNext: `${baseUrl(req)}?token=${TOKEN}&set=${set || "all"}&run=1&limit=${limit}`,
    });
  }

  if (!falConfigured() && q.get("allowFallback") !== "1") {
    return NextResponse.json({
      error: "FAL_KEY is not set on this deployment, so generation would fall back to Gemini.",
      hint: "Add FAL_KEY in Vercel, Settings, Environment Variables, then redeploy. Pass allowFallback=1 to run on Gemini anyway.",
    }, { status: 412 });
  }

  const batch = todo.slice(0, limit);
  const results: Record<string, string> = {};

  for (const job of batch) {
    const key = `${job.bucket}/${job.path}`;
    try {
      // strict: report fal's own error rather than Gemini's rate-limit message,
      // which is what the fallback substitutes and which names the wrong
      // provider, the wrong cause and the wrong remedy.
      const dataUrl = await generateFromText(job.prompt, {
        aspect_ratio: job.aspect,
        model,
        strict: q.get("allowFallback") !== "1",
        budgetMs: 120_000,
      });
      const b64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
      const bytes = Buffer.from(b64, "base64");
      const contentType = job.path.endsWith(".jpg") ? "image/jpeg" : "image/png";
      const { error } = await supabase.storage.from(job.bucket).upload(job.path, bytes, { contentType, upsert: true });
      if (error) throw new Error(error.message);
      results[key] = `ok (${Math.round(bytes.length / 1024)} KB)`;
    } catch (e) {
      results[key] = `FAILED: ${(e as Error).message}`;
    }
  }

  const remaining = Math.max(todo.length - batch.length, 0);
  return NextResponse.json({
    set: set || "all",
    generated: batch.length,
    remaining,
    results,
    // No offset needed: the files just written are no longer missing, so the
    // recomputed list on the next call starts where this batch finished.
    next: remaining > 0
      ? `${baseUrl(req)}?token=${TOKEN}&set=${set || "all"}&run=1&limit=${limit}`
      : null,
  });
}

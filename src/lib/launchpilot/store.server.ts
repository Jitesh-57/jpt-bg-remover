/**
 * store.server.ts — each LaunchPilot user's data, as one JSON file per user in
 * a private Supabase Storage bucket.
 *
 * Storage rather than a table: the bucket is created on first use with the
 * service role key the site already has, so LaunchPilot works on a fresh
 * deploy without a migration. The bucket is private and only this server
 * (service role) reads or writes it; files are keyed by the auth user id.
 */
import { createAdminSupabase } from "@/lib/auth";

const BUCKET = "launchpilot";
let bucketReady: Promise<void> | null = null;

function ensureBucket(): Promise<void> {
  bucketReady ??= (async () => {
    const admin = createAdminSupabase();
    const { data } = await admin.storage.getBucket(BUCKET);
    if (data) return;
    const { error } = await admin.storage.createBucket(BUCKET, { public: false, fileSizeLimit: 5 * 1024 * 1024 });
    if (error && !/already exists/i.test(error.message)) {
      bucketReady = null;
      throw new Error(`Could not create the LaunchPilot storage bucket: ${error.message}`);
    }
  })();
  return bucketReady;
}

async function readJson<T>(path: string, fallback: T): Promise<T> {
  await ensureBucket();
  const { data, error } = await createAdminSupabase().storage.from(BUCKET).download(path);
  if (error || !data) return fallback;
  try {
    return JSON.parse(await data.text()) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await ensureBucket();
  const body = new Blob([JSON.stringify(value)], { type: "application/json" });
  const { error } = await createAdminSupabase().storage.from(BUCKET).upload(path, body, { upsert: true, contentType: "application/json", cacheControl: "0" });
  if (error) throw new Error(`Could not save: ${error.message}`);
}

export type Docs = Record<string, Record<string, unknown>>;

export const readDocs = (userId: string) => readJson<{ docs: Docs; savedAt?: string }>(`${userId}/state.json`, { docs: {} });
export const writeDocs = (userId: string, docs: Docs) => writeJson(`${userId}/state.json`, { docs, savedAt: new Date().toISOString() });

/** Counts AI requests per user per day; returns false once the day's limit is reached. */
export async function takeAiQuota(userId: string): Promise<{ ok: boolean; used: number; limit: number }> {
  const limit = Number(process.env.LAUNCHPILOT_DAILY_AI_LIMIT || 60);
  const today = new Date().toISOString().slice(0, 10);
  const path = `${userId}/usage.json`;
  const usage = await readJson<{ day: string; count: number }>(path, { day: today, count: 0 });
  const count = usage.day === today ? usage.count : 0;
  if (count >= limit) return { ok: false, used: count, limit };
  await writeJson(path, { day: today, count: count + 1 });
  return { ok: true, used: count + 1, limit };
}

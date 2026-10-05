// Key-value storage for the hosted version: one JSON document per key.
//
// On Vercel this is Upstash Redis (add it from the Vercel Marketplace; it sets
// KV_REST_API_URL and KV_REST_API_TOKEN). It's private: only this server can
// read it. For local testing of the hosted mode, LAUNCHPILOT_STORE_DIR keeps
// the same documents as files.
import fs from 'node:fs';
import path from 'node:path';

const url = () => process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = () => process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

export function storeConfigured() {
  return Boolean((url() && token()) || process.env.LAUNCHPILOT_STORE_DIR);
}

async function redis(command) {
  const res = await fetch(url(), {
    method: 'POST',
    headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) throw new Error(`Storage error: ${data.error || res.status}`);
  return data.result;
}

function fileFor(key) {
  const dir = path.resolve(process.env.LAUNCHPILOT_STORE_DIR);
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, `${key.replace(/[^a-z0-9_.-]/gi, '_')}.json`);
}

export async function getJson(key) {
  if (process.env.LAUNCHPILOT_STORE_DIR && !url()) {
    const f = fileFor(key);
    return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null;
  }
  const raw = await redis(['GET', key]);
  return raw ? JSON.parse(raw) : null;
}

export async function setJson(key, value) {
  if (process.env.LAUNCHPILOT_STORE_DIR && !url()) {
    fs.writeFileSync(fileFor(key), JSON.stringify(value));
    return;
  }
  await redis(['SET', key, JSON.stringify(value)]);
}

// Atomic counter with expiry, for daily limits.
export async function incrWithTtl(key, ttlSeconds) {
  if (process.env.LAUNCHPILOT_STORE_DIR && !url()) {
    const cur = (await getJson(key)) || { n: 0, exp: Date.now() + ttlSeconds * 1000 };
    const next = cur.exp < Date.now() ? { n: 1, exp: Date.now() + ttlSeconds * 1000 } : { ...cur, n: cur.n + 1 };
    await setJson(key, next);
    return next.n;
  }
  const n = await redis(['INCR', key]);
  if (n === 1) await redis(['EXPIRE', key, ttlSeconds]);
  return n;
}

// Data store.
//
// Desktop: one JSON file (data/db.json), atomic writes, no native dependencies.
// Hosted: one JSON document per user in the key-value store (store.js). Each
// request runs inside withUser(), which loads that user's data and writes back
// only the records the request changed, so two requests from the same person
// at once don't overwrite each other's edits.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { AsyncLocalStorage } from 'node:async_hooks';
import { CATALOG } from './catalog.js';
import { getJson, setJson } from './store.js';

export const DATA_DIR = path.resolve(process.env.LAUNCHPILOT_DATA_DIR || (process.env.VERCEL ? '/tmp/launchpilot' : 'data'));
const FILE = path.join(DATA_DIR, 'db.json');
const COLLECTIONS = ['products', 'directories', 'credentials', 'submissions', 'jobs', 'activity'];

let localState;
const als = new AsyncLocalStorage();

// The data of whoever this request is for (hosted), or the local file's data.
function cur() {
  return als.getStore()?.state ?? localState;
}

export function currentUserId() {
  return als.getStore()?.userId || null;
}

/** Per-request scratch space (hosted), e.g. the browser sessions this request opened. */
export function requestBag() {
  return als.getStore() || null;
}

export function newId() {
  return crypto.randomUUID();
}

function normalize(state) {
  for (const c of COLLECTIONS) state[c] ??= [];
  state.settings ??= {};
  syncCatalog(state);
  return state;
}

export function load() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  localState = normalize(fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : {});
  save();
}

// Built-in catalog entries are added on first run and refreshed on upgrade,
// without touching directories the user added or edited.
function syncCatalog(state) {
  const bySlug = new Map(state.directories.map((d) => [d.slug, d]));
  for (const entry of CATALOG) {
    const existing = bySlug.get(entry.slug);
    if (!existing) {
      state.directories.push({ id: newId(), source: 'catalog', status: 'unchecked', createdAt: now(), ...entry });
    } else if (existing.source === 'catalog' && !existing.userEdited) {
      Object.assign(existing, entry);
    }
  }
}

const userKey = (userId) => `lp:data:${userId}`;

/** Runs fn with this user's data loaded; saves what fn changed before resolving. */
export async function withUser(userId, fn) {
  const state = normalize((await getJson(userKey(userId))) || {});
  const ctx = { userId, state, touched: new Set(), settingsTouched: false, newActivity: [] };
  const result = await als.run(ctx, fn);
  await persist(ctx);
  return result;
}

/** Saves now (used before a long step, so a crash doesn't lose earlier work). */
export async function flush() {
  const ctx = als.getStore();
  if (ctx) await persist(ctx);
}

async function persist(ctx) {
  if (!ctx.touched.size && !ctx.settingsTouched && !ctx.newActivity.length) return;
  // Re-read and apply only this request's changes on top of the latest data.
  const fresh = normalize((await getJson(userKey(ctx.userId))) || {});
  for (const key of ctx.touched) {
    const [coll, id] = key.split(':');
    const mine = ctx.state[coll].find((r) => r.id === id);
    const i = fresh[coll].findIndex((r) => r.id === id);
    if (mine && i >= 0) fresh[coll][i] = mine;
    else if (mine) fresh[coll].push(mine);
    else if (i >= 0) fresh[coll].splice(i, 1);
  }
  if (ctx.settingsTouched) Object.assign(fresh.settings, ctx.state.settings);
  if (ctx.newActivity.length) fresh.activity = [...ctx.newActivity, ...fresh.activity].slice(0, 300);
  await setJson(userKey(ctx.userId), fresh);
  ctx.touched.clear();
  ctx.settingsTouched = false;
  ctx.newActivity = [];
}

function touch(coll, id) {
  als.getStore()?.touched.add(`${coll}:${id}`);
}

export function save() {
  if (als.getStore()) return; // hosted: written when the request ends
  const tmp = `${FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(localState, null, 2));
  fs.renameSync(tmp, FILE);
}

export function now() {
  return new Date().toISOString();
}

export function all(coll) {
  return cur()[coll];
}

export function get(coll, id) {
  return cur()[coll].find((r) => r.id === id) || null;
}

export function find(coll, pred) {
  return cur()[coll].find(pred) || null;
}

export function insert(coll, record) {
  const row = { id: newId(), createdAt: now(), updatedAt: now(), ...record };
  cur()[coll].push(row);
  touch(coll, row.id);
  save();
  return row;
}

export function update(coll, id, patch) {
  const row = get(coll, id);
  if (!row) return null;
  Object.assign(row, patch, { updatedAt: now() });
  touch(coll, id);
  save();
  return row;
}

export function remove(coll, id) {
  const state = cur();
  const before = state[coll].length;
  state[coll] = state[coll].filter((r) => r.id !== id);
  touch(coll, id);
  save();
  return state[coll].length !== before;
}

export function settings() {
  return cur().settings;
}

export function setSettings(patch) {
  Object.assign(cur().settings, patch);
  const ctx = als.getStore();
  if (ctx) ctx.settingsTouched = true;
  save();
  return cur().settings;
}

export function logActivity(message, ref = {}) {
  const entry = { id: newId(), at: now(), message, ...ref };
  const state = cur();
  state.activity.unshift(entry);
  state.activity = state.activity.slice(0, 300);
  als.getStore()?.newActivity.push(entry);
  save();
}

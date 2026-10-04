// Tiny JSON-file store. One file, atomic writes, no native dependencies, so the
// app installs anywhere `npm install` works. Good for thousands of records.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { CATALOG } from './catalog.js';

export const DATA_DIR = path.resolve(process.env.LAUNCHPILOT_DATA_DIR || 'data');
const FILE = path.join(DATA_DIR, 'db.json');
const COLLECTIONS = ['products', 'directories', 'credentials', 'submissions', 'jobs', 'activity'];

let state;

export function newId() {
  return crypto.randomUUID();
}

export function load() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  state = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : {};
  for (const c of COLLECTIONS) state[c] ??= [];
  state.settings ??= {};
  syncCatalog();
  save();
}

// Built-in catalog entries are added on first run and refreshed on upgrade,
// without touching directories the user added or edited.
function syncCatalog() {
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

export function save() {
  const tmp = `${FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
  fs.renameSync(tmp, FILE);
}

export function now() {
  return new Date().toISOString();
}

export function all(coll) {
  return state[coll];
}

export function get(coll, id) {
  return state[coll].find((r) => r.id === id) || null;
}

export function find(coll, pred) {
  return state[coll].find(pred) || null;
}

export function insert(coll, record) {
  const row = { id: newId(), createdAt: now(), updatedAt: now(), ...record };
  state[coll].push(row);
  save();
  return row;
}

export function update(coll, id, patch) {
  const row = get(coll, id);
  if (!row) return null;
  Object.assign(row, patch, { updatedAt: now() });
  save();
  return row;
}

export function remove(coll, id) {
  const before = state[coll].length;
  state[coll] = state[coll].filter((r) => r.id !== id);
  save();
  return state[coll].length !== before;
}

export function settings() {
  return state.settings;
}

export function setSettings(patch) {
  Object.assign(state.settings, patch);
  save();
  return state.settings;
}

export function logActivity(message, ref = {}) {
  state.activity.unshift({ id: newId(), at: now(), message, ...ref });
  state.activity = state.activity.slice(0, 500);
  save();
}

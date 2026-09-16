/**
 * pending-image.ts — keeps the user's in-progress image across a sign-in.
 *
 * Signing in leaves the page (OAuth redirect), so anything held only in React
 * state is gone when they come back. This stashes the image and the active tool
 * so the editor can reopen exactly where they left off.
 *
 * Storage: IndexedDB first. A full-resolution data URL is routinely several MB
 * and sessionStorage's ~5MB quota throws QuotaExceededError, which previously
 * meant a large photo was silently dropped — the bigger the upload, the more
 * likely it vanished. IndexedDB has no practical limit here. sessionStorage
 * stays as a fallback for the small-image case if IndexedDB is unavailable
 * (private browsing, blocked site data).
 */

const DB_NAME = "jpt-pending";
const STORE = "ctx";
const KEY = "pending";
const SS_IMAGE = "jpt_pending_image";
const SS_TOOL = "jpt_pending_tool";
const SS_PROMPT = "jpt_pending_prompt";
const SS_AUTORUN = "jpt_pending_autorun";

export type PendingContext = {
  image?: string;
  tool?: string;
  prompt?: string;
  /**
   * Start the generation as soon as the editor knows who the user is.
   *
   * Set by the prompt library's Generate button. The editor owns what happens
   * next — signed out shows the sign-in modal, no credits opens the packs,
   * credits runs it — so this is a request, not an instruction.
   */
  autoRun?: boolean;
  ts: number;
};

function openDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      if (typeof indexedDB === "undefined") return resolve(null);
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      // Never let a blocked/hanging open() stall a sign-in click.
      setTimeout(() => resolve(null), 1500);
    } catch {
      resolve(null);
    }
  });
}

function idbPut(ctx: PendingContext): Promise<boolean> {
  return new Promise(async (resolve) => {
    const db = await openDb();
    if (!db) return resolve(false);
    try {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(ctx, KEY);
      tx.oncomplete = () => { db.close(); resolve(true); };
      tx.onerror = () => { db.close(); resolve(false); };
    } catch {
      resolve(false);
    }
  });
}

function idbGet(): Promise<PendingContext | null> {
  return new Promise(async (resolve) => {
    const db = await openDb();
    if (!db) return resolve(null);
    try {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(KEY);
      req.onsuccess = () => { db.close(); resolve((req.result as PendingContext) || null); };
      req.onerror = () => { db.close(); resolve(null); };
    } catch {
      resolve(null);
    }
  });
}

function idbDelete(): Promise<void> {
  return new Promise(async (resolve) => {
    const db = await openDb();
    if (!db) return resolve();
    try {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(KEY);
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); resolve(); };
    } catch {
      resolve();
    }
  });
}

/** Saves the in-progress context. Awaited by callers that are about to navigate. */
export async function savePendingContext(ctx: Omit<PendingContext, "ts">): Promise<void> {
  const full: PendingContext = { ...ctx, ts: Date.now() };
  const stored = await idbPut(full);
  // Mirror to sessionStorage only when IndexedDB failed, and only if it fits —
  // a quota error here must not throw and block the sign-in navigation.
  if (!stored) {
    try {
      if (full.image) sessionStorage.setItem(SS_IMAGE, full.image);
      if (full.tool) sessionStorage.setItem(SS_TOOL, full.tool);
      // The prompt and the flag are a few hundred bytes and always fit, so
      // they are written even when the image did not — a prompt that survives
      // without its photo is still most of the handover.
      if (full.prompt) sessionStorage.setItem(SS_PROMPT, full.prompt);
      if (full.autoRun) sessionStorage.setItem(SS_AUTORUN, "1");
    } catch {
      /* too large for sessionStorage and IndexedDB unavailable — nothing to do */
    }
  }
}

/** Reads whatever was stashed, from either store. */
export async function loadPendingContext(): Promise<PendingContext | null> {
  const fromIdb = await idbGet();
  if (fromIdb?.image || fromIdb?.tool || fromIdb?.prompt) return fromIdb;
  try {
    const image = sessionStorage.getItem(SS_IMAGE) || undefined;
    const tool = sessionStorage.getItem(SS_TOOL) || undefined;
    const prompt = sessionStorage.getItem(SS_PROMPT) || undefined;
    const autoRun = sessionStorage.getItem(SS_AUTORUN) === "1";
    if (image || tool || prompt) return { image, tool, prompt, autoRun, ts: Date.now() };
  } catch {}
  return null;
}

export async function clearPendingContext(): Promise<void> {
  await idbDelete();
  try {
    sessionStorage.removeItem(SS_IMAGE);
    sessionStorage.removeItem(SS_TOOL);
    sessionStorage.removeItem(SS_PROMPT);
    sessionStorage.removeItem(SS_AUTORUN);
  } catch {}
}

/**
 * Call immediately before any navigation that signs the user in. Reads the
 * editor's live context via the hook it registers, so every sign-in entry
 * point preserves the upload — not just the navbar's.
 */
export async function persistAuthContext(): Promise<void> {
  try {
    const hook = (window as unknown as { __jptPersistContext?: () => void | Promise<void> }).__jptPersistContext;
    if (hook) await hook();
  } catch {}
}

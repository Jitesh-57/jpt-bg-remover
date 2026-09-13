"use client";

/**
 * auth-return.ts — getting the user back to the page they signed in from.
 *
 * The intended destination was carried only in `jpt_auth_next`, an httpOnly
 * cookie set when the OAuth round-trip starts and read when it ends. That works
 * when everything goes to plan and loses the destination whenever anything does
 * not:
 *
 *   · the cookie is set on the host the user was on, and the callback runs on
 *     NEXT_PUBLIC_APP_URL — a www/apex mismatch means it is never sent back;
 *   · if Supabase will not accept the redirect it falls back to the project's
 *     Site URL, so the browser lands on the home page and the callback route,
 *     where the cookie is read, never runs at all;
 *   · every failure path in the callback redirects to "/", dropping it.
 *
 * All three end with the user on the home page, which is what they reported. So
 * the destination is also kept in the browser, where it survives a changed host
 * and a callback that never ran, and AuthReturn puts them back once the session
 * exists. The cookie stays as the fast path — this only has to do anything when
 * the cookie did not.
 */

const KEY = "jpt_auth_return";
/** Long enough for a slow account-chooser, short enough not to hijack a later visit. */
const TTL_MS = 15 * 60 * 1000;

type Marker = { path: string; ts: number };

function currentPath(): string {
  const { pathname, search } = window.location;
  return (pathname + search) || "/";
}

/** Remembers where to come back to. Safe to call when storage is unavailable. */
export function rememberAuthReturn(path?: string): void {
  try {
    const target = path || currentPath();
    // Never send the user back into the auth plumbing itself.
    if (/^\/(auth\/callback|api\/auth)/.test(target)) return;
    localStorage.setItem(KEY, JSON.stringify({ path: target, ts: Date.now() } satisfies Marker));
  } catch {
    /* private mode, blocked storage — the cookie path still works */
  }
}

/** The remembered path, or null if there is none or it has gone stale. */
export function readAuthReturn(): string | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const m = JSON.parse(raw) as Marker;
    if (!m?.path || typeof m.ts !== "number" || Date.now() - m.ts > TTL_MS) {
      localStorage.removeItem(KEY);
      return null;
    }
    return m.path;
  } catch {
    return null;
  }
}

export function clearAuthReturn(): void {
  try { localStorage.removeItem(KEY); } catch {}
}

/**
 * The one way into Google sign-in.
 *
 * Every entry point went through the same three lines — stash the in-progress
 * upload, build `next`, navigate — and each had to remember to do all three.
 * Having it in one place is also what guarantees the return path is recorded no
 * matter which button was pressed.
 */
export async function beginGoogleSignIn(next?: string): Promise<void> {
  const target = next || currentPath();
  rememberAuthReturn(target);
  // Awaited: the upload may be going to IndexedDB and we navigate immediately.
  const { persistAuthContext } = await import("@/lib/pending-image");
  await persistAuthContext();
  window.location.href = `/api/auth/google?next=${encodeURIComponent(target)}`;
}

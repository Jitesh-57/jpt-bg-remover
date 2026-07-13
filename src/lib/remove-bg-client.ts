"use client";

// Client-side background removal helpers.
//
// Primary path is the server route (/api/remove-bg → Google Gemini), which
// spends credits and enforces the plan/trial gates. If Gemini itself fails
// (quota/billing 429 → HTTP 500, or a network error), we transparently fall
// back to a FREE in-browser removal via @imgly/background-removal, which runs
// entirely on the user's device — no API key, no Google quota, no cost.
//
// We deliberately do NOT fall back on the auth/paywall statuses (401/402/403):
// those must keep gating so the credit system stays intact. Only genuine
// processing failures degrade to the free local engine.

export class AuthRequiredError extends Error {
  constructor() {
    super("auth-required");
    this.name = "AuthRequiredError";
  }
}

// Statuses the server uses to gate access — never bypass these with the free engine.
const GATED_STATUSES = new Set([401, 402, 403, 503]);

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/** Free, in-browser background removal. Returns a transparent-PNG data URL. */
export async function removeBackgroundLocal(src: string | Blob): Promise<string> {
  const { removeBackground } = await import("@imgly/background-removal");
  const blob = await removeBackground(src, { output: { format: "image/png" } });
  return blobToDataUrl(blob);
}

export interface SmartRemoveResult {
  dataUrl: string;
  /** "server" = Gemini result (credits spent); "local" = free in-browser fallback. */
  source: "server" | "local";
}

/**
 * Remove the background, preferring the server (Gemini) and falling back to the
 * free in-browser engine on processing failures.
 *
 * @throws AuthRequiredError when the user must sign in (HTTP 401).
 * @throws Error with the server message on the paywall gates (402/403), so the
 *   caller can show its normal upgrade/credits UI.
 */
export async function removeBackgroundSmart(
  dataUrl: string,
  opts?: { onFallback?: () => void }
): Promise<SmartRemoveResult> {
  try {
    const res = await fetch("/api/remove-bg", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataUrl }),
    });

    if (res.status === 401) throw new AuthRequiredError();

    let data: { dataUrl?: string; error?: string } = {};
    try {
      data = await res.json();
    } catch {
      /* non-JSON body — treat as processing failure below */
    }

    if (res.ok && data.dataUrl) {
      return { dataUrl: data.dataUrl, source: "server" };
    }

    // Preserve the paywall/config gates — surface them, don't hand out free work.
    if (GATED_STATUSES.has(res.status)) {
      throw new Error(data.error || "This tool requires an upgrade.");
    }
    // Otherwise (500 / quota / unexpected) fall through to the free local engine.
  } catch (e) {
    if (e instanceof AuthRequiredError) throw e;
    // A thrown gated Error carries a message we set above — re-throw it as-is.
    if (e instanceof Error && e.message === "This tool requires an upgrade.") throw e;
    // Network/parse errors fall through to the local engine.
  }

  opts?.onFallback?.();
  const local = await removeBackgroundLocal(dataUrl);
  return { dataUrl: local, source: "local" };
}

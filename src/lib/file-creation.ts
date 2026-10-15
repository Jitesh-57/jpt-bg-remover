import { storeImage } from "@/lib/store-image";
import { recordGeneration } from "@/lib/ledger";

/**
 * file-creation.ts — puts a finished AI result in the user's My Creations,
 * with the photo that went in, the tool, the prompt and the model, so every
 * generation can be looked at whole (analytics.generations).
 *
 * For the routes that used to leave saving to the page: /batch-editor and
 * /bg-remover never saved at all, so their results were lost. Done on the
 * server, before the response, so a result is filed whichever page asked for
 * it. Never throws; returns true when the row was written, which the route
 * passes back as `saved` so a page that also saves can skip its own copy.
 */

/**
 * Starts keeping the uploaded photo, as a link. Call it before the AI call and
 * pass the promise on, so the upload is stored while the model works instead
 * of after.
 *
 * Only image data sent in the request is stored. A source that is already a
 * link is recorded as that link and never fetched: the URL comes from the
 * browser, and fetching whatever it names from the server would let anyone
 * point it at internal addresses.
 */
export function keepSource(src: string | null | undefined, tool: string, userId: string): Promise<string | null> {
  if (!src) return Promise.resolve(null);
  if (/^https?:\/\//i.test(src)) return Promise.resolve(src.slice(0, 1000));
  if (!src.startsWith("data:image/")) return Promise.resolve(null);
  return storeImage(src, `${tool}-source`, userId).catch(() => null);
}

type Source = string | null | undefined | Promise<string | null>;

async function sourceUrl(source: Source): Promise<string | null> {
  try { return (await source) ?? null; } catch { return null; }
}

export async function fileCreation(opts: {
  userId: string;
  tool: string;
  label: string;
  result: string;
  /** The uploaded photo: a link, or the promise from keepSource(). */
  source?: Source;
  prompt?: string | null;
  appSlug?: string | null;
  model?: string | null;
  provider?: string | null;
  preset?: string | null;
  aspectRatio?: string | null;
  durationMs?: number | null;
  creditsSpent?: number;
}): Promise<boolean> {
  try {
    const [resultUrl, src] = await Promise.all([
      storeImage(opts.result, `${opts.tool}-result`, opts.userId),
      sourceUrl(opts.source),
    ]);
    if (!resultUrl) return false;
    const id = await recordGeneration({
      userId: opts.userId,
      tool: opts.tool,
      appSlug: opts.appSlug ?? null,
      label: opts.label,
      sourceUrl: src,
      resultUrl,
      prompt: opts.prompt ?? null,
      model: opts.model ?? null,
      provider: opts.provider ?? null,
      preset: opts.preset ?? null,
      aspectRatio: opts.aspectRatio ?? null,
      durationMs: opts.durationMs ?? null,
      creditsSpent: opts.creditsSpent ?? 0,
      status: "succeeded",
    });
    return id !== null;
  } catch {
    return false;
  }
}

/**
 * Records an attempt that failed, with what was asked and why it failed: the
 * row that shows what people tried that did not work. No credits were spent.
 * Never throws.
 */
export async function fileFailure(opts: {
  userId: string;
  tool: string;
  label?: string;
  source?: Source;
  prompt?: string | null;
  appSlug?: string | null;
  model?: string | null;
  preset?: string | null;
  error: unknown;
  durationMs?: number | null;
}): Promise<void> {
  try {
    const message = opts.error instanceof Error ? opts.error.message : String(opts.error ?? "unknown error");
    await recordGeneration({
      userId: opts.userId,
      tool: opts.tool,
      appSlug: opts.appSlug ?? null,
      label: opts.label || opts.tool,
      sourceUrl: await sourceUrl(opts.source),
      prompt: opts.prompt ?? null,
      model: opts.model ?? null,
      preset: opts.preset ?? null,
      creditsSpent: 0,
      status: "failed",
      error: message,
      durationMs: opts.durationMs ?? null,
    });
  } catch { /* a failed note about a failure is not worth a second failure */ }
}

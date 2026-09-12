/**
 * ai-image.ts — the single entry point every AI route uses for image work.
 *
 * Routing: fal.ai is the primary backend (it is where the account's credit
 * sits). Gemini's direct API stays as an automatic fallback so a fal outage or
 * a missing FAL_KEY degrades instead of failing outright.
 *
 * Routes should import from here, never from fal.ts or gemini.ts directly, so
 * the provider can be switched in one place.
 */

import { falConfigured, falEditImage, falGenerateImage, type FalModel } from "@/lib/fal";
import {
  geminiEditImage,
  geminiGenerateBg,
  geminiRemoveBg,
  geminiUpscale,
  geminiGenerateFromText,
} from "@/lib/gemini";

export type { FalModel };

/** Which model a request asked for; anything unrecognised falls to the default. */
export function resolveModel(requested?: string): FalModel {
  return requested === "gpt-image" ? "gpt-image" : "nano-banana";
}

/** Runs the fal path, falling back to Gemini if fal is unavailable. */
async function viaFal(
  run: () => Promise<string>,
  fallback: () => Promise<string>,
  label: string
): Promise<string> {
  if (!falConfigured()) return fallback();
  try {
    return await run();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // A credentials or billing problem is a real misconfiguration worth
    // surfacing, not something to paper over with a silent provider switch.
    if (/credentials|out of credit/i.test(msg)) throw e;
    console.warn(`[ai-image] fal ${label} failed, falling back to Gemini:`, msg);
    return fallback();
  }
}

export function editImage(src: string, prompt: string, model?: string, aspectRatio?: string): Promise<string> {
  const m = resolveModel(model);
  return viaFal(
    () => falEditImage(src, `You are a professional photo editor. Edit this image: ${prompt}. Return only the edited image.`, m, aspectRatio),
    () => geminiEditImage(src, prompt),
    "edit"
  );
}

export function generateBackground(src: string, prompt: string, model?: string): Promise<string> {
  const m = resolveModel(model);
  return viaFal(
    () => falEditImage(src, `Replace the background of this image with: ${prompt}. Keep the subject exactly as-is — same pose, clothing, appearance. Only change the background.`, m),
    () => geminiGenerateBg(src, prompt),
    "generate-bg"
  );
}

export function removeBackground(src: string, model?: string): Promise<string> {
  const m = resolveModel(model);
  return viaFal(
    () => falEditImage(src, "Remove the background from this image completely. Make it transparent. Keep the subject with clean edges. Return only the resulting PNG image.", m),
    () => geminiRemoveBg(src),
    "remove-bg"
  );
}

export function upscaleImage(src: string, scale: "2x" | "4x", model?: string): Promise<string> {
  const m = resolveModel(model);
  return viaFal(
    () => falEditImage(src, `Enhance this image to ${scale} resolution. Increase sharpness, detail, and clarity. Improve hair strands, skin texture, fabric detail. Remove noise and artifacts. Keep the subject identical.`, m),
    () => geminiUpscale(src, scale),
    "upscale"
  );
}

export function generateFromText(
  prompt: string,
  opts?: {
    aspect_ratio?: string;
    model?: string;
    /**
     * Skip the Gemini fallback and let fal's own error through.
     *
     * The fallback is right for a user-facing route — a visitor would rather
     * have an image from the other provider than an error. It is wrong for the
     * bulk generator: masking a fal 429 behind Gemini's rate-limit message
     * reports the wrong provider, the wrong cause and the wrong remedy, and
     * hides the one thing needed to decide whether to retry.
     */
    strict?: boolean;
    /** Queue poll budget. The default suits a 60s route, not a 300s job. */
    budgetMs?: number;
  }
): Promise<string> {
  const m = resolveModel(opts?.model);
  const aspect = opts?.aspect_ratio || "16:9";
  const run = () =>
    falGenerateImage(
      `High-quality, photorealistic image (${aspect} aspect ratio): ${prompt}`,
      m,
      aspect,
      opts?.budgetMs
    );
  if (opts?.strict) {
    if (!falConfigured()) throw new Error("FAL_KEY is not configured.");
    return run();
  }
  return viaFal(run, () => geminiGenerateFromText(prompt, opts), "text-to-image");
}

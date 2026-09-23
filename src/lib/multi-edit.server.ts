import { gptCascade, resolveModel, ProviderUnavailableError } from "@/lib/ai-image";
import { falConfigured, falEditImages, FalError, type FalModel } from "@/lib/fal";

/**
 * One generation from several input images (e.g. a reference plus the user's
 * own photo). The chosen model goes first, then the GPT cascade, then Nano
 * Banana, so an unavailable endpoint moves on instead of failing the request.
 * An exhausted provider balance stops the loop, since every rung bills the
 * same account.
 */
export async function editWithImages(srcs: string[], prompt: string, preferred?: string): Promise<{ dataUrl: string; engine: FalModel }> {
  if (!falConfigured()) throw new Error("FAL_KEY is not configured.");
  const order = Array.from(new Set<FalModel>([resolveModel(preferred), ...gptCascade(), "nano-banana"]));
  const errors: string[] = [];
  for (const model of order) {
    try {
      return { dataUrl: await falEditImages(srcs, prompt, model, 240_000), engine: model };
    } catch (e) {
      if (e instanceof FalError && e.billingBlocked) throw new ProviderUnavailableError(e.message);
      errors.push(`${model}: ${e instanceof Error ? e.message : String(e)}`);
      console.error(`[multi-edit] ${model} failed`, e);
    }
  }
  throw new Error(errors.join(" | ") || "No image model could take this request.");
}

import { storeImage } from "@/lib/store-image";
import { recordGeneration } from "@/lib/ledger";

/**
 * file-creation.ts — puts a finished AI result in the user's My Creations.
 *
 * For the routes that used to leave saving to the page: /batch-editor and
 * /bg-remover never saved at all, so their results were lost. Done on the
 * server, before the response, so a result is filed whichever page asked for
 * it. Never throws; returns true when the row was written, which the route
 * passes back as `saved` so a page that also saves can skip its own copy.
 */
export async function fileCreation(opts: {
  userId: string;
  tool: string;
  label: string;
  result: string;
  prompt?: string | null;
  creditsSpent?: number;
}): Promise<boolean> {
  try {
    const resultUrl = await storeImage(opts.result, `${opts.tool}-result`, opts.userId);
    if (!resultUrl) return false;
    const id = await recordGeneration({
      userId: opts.userId,
      tool: opts.tool,
      label: opts.label,
      resultUrl,
      prompt: opts.prompt ?? null,
      creditsSpent: opts.creditsSpent ?? 0,
      status: "succeeded",
    });
    return id !== null;
  } catch {
    return false;
  }
}

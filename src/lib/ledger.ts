import { createAdminSupabase } from "@/lib/auth";

/**
 * ledger.ts — writing down what happened.
 *
 * Nothing here may fail a request. A generation that succeeded and a payment
 * that went through are facts; refusing the response because the note about
 * them could not be filed would turn a bookkeeping problem into the user's
 * problem. Every function logs loudly and returns.
 *
 * Server-only: it writes with the service role, which is what keeps these
 * tables un-writable by the people they describe.
 */

export type CreditReason = "purchase" | "generation" | "signup_grant" | "admin_adjust" | "refund";

/**
 * Records a movement of credits and the balance it left behind.
 *
 * The balance is passed in rather than re-read: the caller has just written it,
 * and a second read could pick up a concurrent change and record a number that
 * was never the result of this movement.
 */
export async function recordCredits(opts: {
  userId: string;
  delta: number;
  balanceAfter: number;
  reason: CreditReason;
  tool?: string | null;
  purchaseId?: number | null;
  generationId?: number | null;
  note?: string | null;
}): Promise<void> {
  if (!opts.delta) return; // A movement of nothing is not a movement.
  try {
    const { error } = await createAdminSupabase().from("credit_ledger").insert({
      user_id: opts.userId,
      delta: opts.delta,
      balance_after: opts.balanceAfter,
      reason: opts.reason,
      tool: opts.tool ?? null,
      purchase_id: opts.purchaseId ?? null,
      generation_id: opts.generationId ?? null,
      note: opts.note ?? null,
    });
    if (error) throw new Error(error.message);
  } catch (e) {
    console.error(
      `[ledger] credit movement NOT recorded for ${opts.userId} ` +
      `(${opts.delta >= 0 ? "+" : ""}${opts.delta}, ${opts.reason}): ${(e as Error).message}`
    );
  }
}

export interface GenerationRecord {
  userId: string;
  tool: string;
  appSlug?: string | null;
  /** The photo that went in, as a URL. Null when the user sent bytes we did not store. */
  sourceUrl?: string | null;
  /** The image that came out, as a URL. */
  resultUrl?: string | null;
  model?: string | null;
  provider?: string | null;
  prompt?: string | null;
  preset?: string | null;
  aspectRatio?: string | null;
  creditsSpent?: number;
  status?: "succeeded" | "failed";
  error?: string | null;
  durationMs?: number | null;
  label?: string | null;
}

/**
 * Records one generation. Returns its id so a credit movement can point at it,
 * or null if the row could not be written.
 *
 * Failures are recorded too, and deliberately: a generation that failed after
 * the provider had already been paid is exactly the row worth having, and it is
 * the one the old client-side saver could never capture because nothing came
 * back to save.
 */
export async function recordGeneration(g: GenerationRecord): Promise<number | null> {
  try {
    const { data, error } = await createAdminSupabase()
      .from("generations")
      .insert({
        user_id: g.userId,
        tool: g.tool,
        app_slug: g.appSlug ?? null,
        category: "generation",
        label: g.label || g.appSlug || g.tool,
        source_url: g.sourceUrl ?? null,
        result_url: g.resultUrl ?? null,
        image_url: g.resultUrl ?? null, // what /generations already reads
        model: g.model ?? null,
        provider: g.provider ?? null,
        // Prompts can be long and are not worth unbounded storage.
        prompt: g.prompt ? g.prompt.slice(0, 2000) : null,
        preset: g.preset ?? null,
        aspect_ratio: g.aspectRatio ?? null,
        credits_spent: g.creditsSpent ?? 0,
        status: g.status ?? "succeeded",
        error: g.error ? g.error.slice(0, 500) : null,
        duration_ms: g.durationMs ?? null,
      })
      .select("id")
      .single() as { data: { id: number } | null; error: { message: string } | null };

    if (error) throw new Error(error.message);
    return data?.id ?? null;
  } catch (e) {
    console.error(`[ledger] generation NOT recorded for ${g.userId} (${g.tool}): ${(e as Error).message}`);
    return null;
  }
}

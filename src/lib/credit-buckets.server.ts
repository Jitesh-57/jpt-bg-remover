import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * credit-buckets.server.ts — where a balance lives, and which credits go first.
 *
 * A balance has two parts:
 *
 *   profiles.credits          add-on packs, trial and legacy credits. Never expire.
 *   subscriptions rows        one per monthly plan: `credits_remaining`, usable
 *                             until `credits_expire_at`, reset at each renewal.
 *
 * Spending takes monthly credits first, soonest-to-expire first, because those
 * are the ones that would otherwise be lost; add-on credits are kept for last.
 *
 * Takes the database client as an argument rather than importing it, so
 * lib/auth.ts can use this without an import cycle.
 */

export interface MonthlyBucket {
  id: number;
  credits_remaining: number;
  credits_expire_at: string;
}

/**
 * The monthly credits a user can spend right now, soonest-to-expire first.
 *
 * Returns [] when the subscriptions table does not exist yet (the migration
 * has not been run): no monthly plans can have been sold, so there is nothing
 * to count, and a missing table must not break every signed-in request.
 */
export async function monthlyBuckets(db: SupabaseClient, userId: string): Promise<MonthlyBucket[]> {
  const { data, error } = await db
    .from("subscriptions")
    .select("id, credits_remaining, credits_expire_at")
    .eq("user_id", userId)
    .gt("credits_remaining", 0)
    .gt("credits_expire_at", new Date().toISOString())
    .order("credits_expire_at", { ascending: true }) as { data: MonthlyBucket[] | null; error: { message: string } | null };
  if (error) return [];
  return data ?? [];
}

export const sumBuckets = (buckets: MonthlyBucket[]): number =>
  buckets.reduce((n, b) => n + b.credits_remaining, 0);

/**
 * Takes up to `cost` credits from the monthly buckets, in order, and returns
 * how many it took. The caller takes the rest from profiles.credits.
 *
 * Each row is written only if it still holds the number that was read, so two
 * requests racing for the same credit cannot both spend it. The loser re-reads
 * the row and tries again with what is left, so a race costs a retry, not a
 * charge to the wrong balance.
 */
export async function takeFromMonthly(db: SupabaseClient, buckets: MonthlyBucket[], cost: number): Promise<number> {
  let left = cost;
  for (const b of buckets) {
    let have = b.credits_remaining;
    for (let attempt = 0; attempt < 4 && left > 0 && have > 0; attempt++) {
      const take = Math.min(left, have);
      const { data, error } = await db
        .from("subscriptions")
        .update({ credits_remaining: have - take, updated_at: new Date().toISOString() })
        .eq("id", b.id)
        .eq("credits_remaining", have)
        .select("id") as { data: { id: number }[] | null; error: { message: string } | null };
      if (error) {
        console.error(`[credits] monthly bucket ${b.id} not charged:`, error.message);
        break;
      }
      if (data && data.length) { left -= take; break; }
      // Someone else spent from this plan first: read what it holds now.
      const { data: fresh } = await db.from("subscriptions").select("credits_remaining, credits_expire_at")
        .eq("id", b.id).maybeSingle() as { data: { credits_remaining: number; credits_expire_at: string | null } | null };
      const live = fresh?.credits_expire_at && new Date(fresh.credits_expire_at).getTime() > Date.now();
      have = live ? fresh!.credits_remaining : 0;
    }
    if (left <= 0) break;
  }
  return cost - left;
}

/**
 * Takes `cost` credits from profiles.credits, written only if the balance is
 * still the one read — re-reading and retrying on a race — so two generations
 * finishing together cannot both spend the same add-on credit. Returns the new
 * balance, or null if the database refused the write (the caller falls back).
 */
export async function takeFromBase(db: SupabaseClient, userId: string, known: number, cost: number): Promise<number | null> {
  let have = known;
  for (let attempt = 0; attempt < 4; attempt++) {
    const next = Math.max(0, have - cost);
    const { data, error } = await db.from("profiles").update({ credits: next })
      .eq("id", userId).eq("credits", have).select("id") as { data: { id: string }[] | null; error: { message: string } | null };
    if (error) return null;
    if (data && data.length) return next;
    const { data: fresh } = await db.from("profiles").select("credits").eq("id", userId).maybeSingle() as
      { data: { credits: number } | null };
    if (!fresh) return null;
    have = fresh.credits ?? 0;
  }
  return null;
}

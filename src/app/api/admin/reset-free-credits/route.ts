import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/auth";
import { purchasedByUser } from "@/lib/purchases.server";
import { requireAdmin, adminToken } from "@/lib/admin-token";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Brings every balance back to what was actually paid for.
 *
 * Closing the signup grant stopped new accounts getting free AI generations,
 * but it could not touch the balances already handed out — and to every gate in
 * the app, an account holding those is indistinguishable from a paying
 * customer. That is why AI generation still worked on an account that had never
 * bought anything, and why an account that bought the 5-credit pack showed 11:
 * a leftover grant of 10, four of it spent, plus the 5 it paid for.
 *
 * The rule is `min(current, purchased)`:
 *
 *   · it never takes away a credit someone paid for — a buyer who has spent
 *     down to 3 of a 20-pack keeps 3, not 20;
 *   · it never leaves a granted credit behind — someone granted 10 who never
 *     bought goes to 0;
 *   · and where the two are mixed, the purchase survives whole and the grant
 *     does not, which is the reading that cannot overcharge anyone.
 *
 * "Purchased" comes from Razorpay, not from the `purchases` table: the money
 * moved at the gateway, its order notes carry the buyer's id and the credits,
 * and it is there whether or not the table has been created.
 *
 *   GET /api/admin/reset-free-credits?token=…          what would change
 *   GET /api/admin/reset-free-credits?token=…&apply=1  change it
 *
 * Dry by default, because this cannot be undone: the previous balances are only
 * in the response, so read it before applying.
 */
interface ProfileRow { id: string; email?: string | null; credits: number | null; plan?: string | null }

export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const apply = req.nextUrl.searchParams.get("apply") === "1";

  const admin = createAdminSupabase();

  const { data: holders, error: profErr } = await admin
    .from("profiles")
    .select("id, email, credits, plan")
    .gt("credits", 0) as { data: ProfileRow[] | null; error: { message: string } | null };

  if (profErr) {
    return NextResponse.json({ error: `Could not read profiles: ${profErr.message}` }, { status: 500 });
  }
  if (!holders?.length) {
    return NextResponse.json({ applied: false, holders: 0, note: "No account is holding credits." });
  }

  /*
    A null here means Razorpay could not be asked, not that nobody has paid.
    Carrying on would read every balance as granted and clear real customers'
    credits, so it refuses instead.
  */
  const purchased = await purchasedByUser();
  if (!purchased) {
    return NextResponse.json({
      error: "Razorpay could not be reached, so paid and granted credits cannot be told apart.",
      fix: "Check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are set in the environment, then try again. Running without them would clear credits people bought.",
    }, { status: 412 });
  }

  /*
    An account whose purchases cannot be quantified is left completely alone,
    and reported separately. It bought something the gateway does not describe
    in credits — a legacy pack, most likely — and treating "cannot tell" as
    "bought nothing" would take credits from someone who paid.
  */
  const skipped: { id: string; email: string | null; credits: number; why: string }[] = [];
  const changes: {
    id: string; email: string | null; was: number; bought: number;
    becomes: number; wasPlan: string; plan: string; flag?: string;
  }[] = [];

  for (const h of holders) {
    const paid = purchased.get(h.id);
    const was = h.credits ?? 0;
    const wasPlan = h.plan ?? "free";

    if (paid?.unknown) {
      skipped.push({
        id: h.id,
        email: h.email ?? null,
        credits: was,
        why: "A paid Razorpay order for this account has no credit count, so how much was bought cannot be established. Left untouched.",
      });
      continue;
    }

    const bought = paid?.credits ?? 0;
    const change = {
      id: h.id,
      email: h.email ?? null,
      was,
      bought,
      // `bought` is the cap, not the floor: spending already happened and must
      // not be refunded, so a buyer down to 3 of a 20-pack stays at 3.
      becomes: Math.min(was, bought),
      wasPlan,
      // A buyer's plan must not read "free" — the header hides the balance on a
      // free plan, which is what makes a paid account look unpaid.
      plan: bought > 0 ? (paid?.plan || wasPlan) : "free",
      // Worth a second look before applying: the profile claims a paid plan but
      // the gateway has no record of a payment, so this balance was granted by
      // hand or carried over from an older system.
      ...(wasPlan !== "free" && !paid
        ? { flag: `plan says "${wasPlan}" but Razorpay has no paid order for this account` }
        : {}),
    };
    if (change.becomes !== change.was || change.plan !== change.wasPlan) changes.push(change);
  }

  const rule = "becomes = min(current, purchased) — purchases are kept whole, grants are removed, spending is never refunded";

  if (!apply) {
    return NextResponse.json({
      applied: false,
      rule,
      holders: holders.length,
      wouldChange: changes.length,
      accounts: changes,
      ...(skipped.length ? { skipped } : {}),
      note: "Nothing changed. Re-run with &apply=1 to write these.",
    });
  }

  let changed = 0;
  const failures: string[] = [];
  for (const c of changes) {
    const { error } = await admin
      .from("profiles")
      .update({ credits: c.becomes, plan: c.plan })
      .eq("id", c.id);
    if (error) failures.push(`${c.id}: ${error.message}`);
    else changed += 1;
  }

  return NextResponse.json({
    applied: true,
    rule,
    holders: holders.length,
    changed,
    failures,
    accounts: changes,
    ...(skipped.length ? { skipped } : {}),
    note: "Balances are now min(previous, purchased). Nobody lost a credit they bought.",
  });
}

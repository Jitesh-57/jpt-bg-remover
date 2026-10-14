# Monthly plans (Razorpay Subscriptions)

Pixel Shine sells two kinds of thing, both defined in `src/lib/plans.ts`:

| Kind | Ids | Charged | Credits |
|---|---|---|---|
| Add-on packs | `addon5`, `addon15`, `addon25`, `addon35` | once, through a Razorpay order | added to `profiles.credits`, never expire |
| Monthly plans | `monthly20`, `monthly40`, `monthly100`, `monthly150` | every month, through a Razorpay subscription | granted per paid month on the `subscriptions` row, reset at each renewal |

Someone can hold several monthly plans at once; each is its own subscription.
AI generations spend monthly credits first (soonest to expire first), then
add-on credits (`src/lib/credit-buckets.server.ts`).

## Setup

1. **Turn on Subscriptions** in the Razorpay dashboard (Subscriptions → get
   started). Razorpay may ask for a short activation review.
2. **Add a webhook**: Razorpay → Account & Settings → Webhooks → Add.
   - URL: `https://www.sjpt.io/api/razorpay/webhook`
   - Secret: any long random string.
   - Events: every `subscription.*` event (at least `subscription.charged`,
     `activated`, `pending`, `halted`, `cancelled`, `completed`, `paused`,
     `resumed`).
3. **Put the same secret in Vercel** as `RAZORPAY_WEBHOOK_SECRET` (Production,
   and Preview if you test there), then redeploy.
4. **Update the database**: run the migrations (admin → Update database, or
   `GET /api/admin/migrate?token=…&apply=1`). This applies
   `supabase/migrations/20261014_subscriptions.sql`, which adds:
   - `subscriptions` — one row per Razorpay subscription;
   - `razorpay_plans` — the Razorpay plan made for each monthly price;
   - `purchases.razorpay_subscription_id`, and makes `razorpay_order_id` optional.

There is nothing to create by hand in Razorpay's Plans page: the first time a
monthly price is sold, the app creates the Razorpay plan and remembers it in
`razorpay_plans`. Changing a price in `plans.ts` creates a new Razorpay plan;
existing subscribers keep the price they signed up at.

Until steps 1–4 are done, choosing a monthly plan shows "Monthly plans aren't
available just yet" and nothing is charged. Add-on packs keep working.

### Testing without real money

Put Razorpay **test** keys (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`,
`NEXT_PUBLIC_RAZORPAY_KEY_ID`) and a test-mode webhook secret in Vercel's
**Preview** environment. Subscriptions in test mode can be charged with
Razorpay's test cards, and renewals can be triggered from the test dashboard.

## How a plan runs

| Step | What happens | Code |
|---|---|---|
| Subscribe | Creates the Razorpay subscription and a `created` row | `POST /api/subscriptions/create` |
| First month | Checkout charges it; the signature is checked and the month's credits granted | `POST /api/subscriptions/verify` → `applyCharge()` |
| Renewal | Razorpay charges the saved card/UPI mandate and sends `subscription.charged` | `POST /api/razorpay/webhook` → `applyCharge()` |
| Missed webhook | Listing the plans checks Razorpay for paid invoices we never saw | `GET /api/subscriptions` → `syncFromRazorpay()` |
| Cancel | Razorpay cancels at the end of the paid month; no further charge | `POST /api/subscriptions/cancel` |

`applyCharge()` inserts a `purchases` row keyed by the unique
`razorpay_payment_id` before it moves any credits, so the checkout handler and
the webhook (which both see the first payment), and any webhook retry, credit a
payment exactly once. Each charge gets an invoice like any pack.

On renewal the plan's `credits_remaining` is reset to the plan's credits, and
what was left from the month before is written to the ledger as `expired`.
A cancelled plan's credits stay usable until `credits_expire_at`, the end of
the month that was paid for.

## Where customers manage plans

- **Settings → Your plans**: each plan, credits left this month, next renewal,
  and **Cancel plan** (confirmed in place).
- **Credits** (`/app/credits`): the same list, the balance split into monthly
  and add-on credits, and the history.

## Not covered

- The Play Store app sells add-on packs only. Monthly plans there would have to
  be Google Play subscriptions (`docs/play-billing.md`).
- Refunds are made in the Razorpay dashboard; take back the credits with the
  admin credit adjustment if needed.

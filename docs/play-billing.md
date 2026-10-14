# In-app purchases (Google Play Billing)

The mobile apps (`/m/*`, one per tool) ship to the Play Store as **Trusted Web
Activities**: the same web page, running in Chrome, inside an app installed
from Google Play. Inside that app, credits are bought through **Google Play's
own purchase sheet**, not Razorpay. Play policy requires its billing for
digital goods, and the sheet opens over the app and closes by itself once the
payment is done, so the buyer never leaves the app.

The website, and the `/m/*` pages opened in any ordinary browser, keep selling
through Razorpay. The two never mix: inside the Play app, Razorpay is not
offered even if Play Billing fails to load. The screen says so instead.

## How a purchase works

```
Paywall (src/app/m/_components/Paywall.tsx)
  └─ buyOnPlay()                        src/lib/play-billing.client.ts
       PaymentRequest("https://play.google.com/billing", { sku: "credits_20" })
       → Google Play sheet → purchaseToken
  └─ POST /api/play/verify              src/app/api/play/verify/route.ts
       1. token checked with Google      src/lib/google-play.server.ts
       2. token claimed (unique row)     public.play_purchases
       3. credits added + ledger entry
       4. purchase consumed (so the pack can be bought again)
```

A purchase is credited **exactly once**. The unique token row is claimed before
any credits move, and a repeat request for the same token adds nothing. If the
app closes mid-way, the network drops, or a pending payment (cash, some UPI)
clears later, the purchase stays unconsumed. On the next launch the app lists
it (`recoverPlayPurchases`) and the server credits it. Google refunds a
purchase that isn't consumed within three days, so this retry matters.

## One-time setup

### 1. Products in Play Console

In each app: **Monetize → Products → In-app products → Create product**. Make
three products. They are consumable; there is no subscription.

| Product ID   | Gives      | Suggested price (India) |
|--------------|------------|-------------------------|
| `credits_5`  | 5 credits  | ₹179                    |
| `credits_20` | 20 credits | ₹449                    |
| `credits_50` | 50 credits | ₹899                    |

Play sets the price the buyer sees, in their own currency. The app reads it
from Play and never hard-codes it. Google keeps 15% of the first $1M a year,
which is why the suggested prices are a little above the website's. The credit
amounts come from `src/lib/plans.ts`. Product IDs follow `credits_<n>`, so a
new pack there needs a matching product here.

### 2. A service account, so the server can check purchases

1. Google Cloud Console (the project linked to Play Console): create a
   **service account** and a **JSON key** for it.
2. Play Console → **Users and permissions → Invite new users**. Add the service
   account's email with **View financial data** and **Manage orders and
   subscriptions**, for the apps that sell credits.
3. Vercel → Settings → Environment Variables. Add **`GOOGLE_PLAY_SERVICE_ACCOUNT`**
   with the whole JSON file as the value (or base64 of it). Never commit it.

New permissions can take up to 24 hours to reach the purchase API.

### 3. The database table

Run the migrations from `/admin` ("Update database"). They create
`public.play_purchases` (`supabase/migrations/20261011_play_purchases.sql`).

### 4. The Android app

Built with Bubblewrap (`@bubblewrap/cli`), one per tool:

- **package ID**: the value in `PLAY_APPS` (`src/lib/play-billing.ts`). For
  Age Progression that is `io.sjpt.ageprogression`. It is permanent once
  published.
- **start URL**: `/m/age-progression?src=play`. The `src=play` tells the page
  it runs in the Play app, so Razorpay is never shown there.
- **Play Billing**: enabled (`"features": { "playBilling": { "enabled": true } }`
  in `twa-manifest.json`).
- **Digital Asset Links**: `/.well-known/assetlinks.json` on www.sjpt.io must
  list the app's package and its Play App Signing SHA-256. Without it the app
  shows a browser bar.

Google sign-in works in a Trusted Web Activity: it runs in Chrome and returns to
the app. It does not work in a plain WebView, which is one reason the apps are
not WebView wrappers.

## Testing without real money

Play Console → **Settings → License testing**. Add the Google accounts that
will test. Their purchases on an internal-testing build are free, and are
recorded with `test_purchase = true` and noted "test" in the credit ledger.
Play Billing only works in a build installed from Play (internal testing is
enough), never in a sideloaded APK.

## Not yet handled

Refunds and chargebacks made in Play are not taken back automatically. A
refunded purchase keeps its credits until removed by hand in `/admin`.
Automating this needs Play's Real-time Developer Notifications (Pub/Sub) or
the Voided Purchases API.

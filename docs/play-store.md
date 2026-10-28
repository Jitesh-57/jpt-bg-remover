# AI Age Progression on Google Play

The Android app is a **Trusted Web Activity**: a small Android app that opens
`https://www.sjpt.io/m/age-progression?src=play` full screen in Chrome. Every
screen is the web app in `src/app/m/age-progression/`, so changes to it reach
the installed app straight away, with no new release. A new app version is
only needed when something in `android/age-progression/twa-manifest.json`
changes (name, icon, colours, start page).

| | |
|---|---|
| Package name | `io.sjpt.ageprogression` (permanent) |
| Play title | AI Age Progression: PixelShine |
| Name under the icon | Age AI |
| Version | 1.0.0 (version code 1) |
| Target SDK | 36 (Android 16), the level Play requires from 31 Aug 2026 |
| Min SDK | 24 (Android 7.0) |
| Billing | Google Play Billing 8.3, through the Digital Goods API (`docs/play-billing.md`) |

How to build it: `android/age-progression/README.md`.

## What the website does for the app

- **`/.well-known/assetlinks.json`** (`src/app/api/android/assetlinks/route.ts`)
  tells Android the app belongs to www.sjpt.io. Without it, the app shows
  Chrome's address bar at the top. It lists the upload key, plus Play's app
  signing key from the env var `PLAY_APP_SIGNING_SHA256` (step 6 below).
- **Report this image** on every result: Play's policy for AI-generated
  content requires a way to flag a result without leaving the app. Reports go
  to `/api/report`.
- **Delete account** in the Account tab, and the page
  **https://www.sjpt.io/delete-account**: Play requires both for apps that
  create accounts. Requests go to `/api/account/delete-request`.
- **Privacy policy, Terms and Delete account** links at the bottom of the
  Account tab. Play requires the privacy policy inside the app as well as in
  the listing.

## Reports and deletion requests

Both are stored in `public.user_events`. Run this in Supabase → SQL editor:

```sql
select e.created_at, u.email, e.name, e.props
from public.user_events e
left join auth.users u on u.id = e.user_id
where e.name in ('ai_content_report', 'account_delete_request')
order by e.created_at desc;
```

- **A report**: look at the image (`props.image`). Remove it if it breaks the
  rules, and fix the prompt if it is a pattern.
- **A deletion request**: within 30 days, delete the user in Supabase →
  Authentication → Users. Their profile, credits, creations list and purchase
  copies are deleted with them (every table cascades). Then email them to
  confirm. Razorpay and Google Play keep their own payment records.

## Publishing, step by step

### 1. Test the APK on your phone

Install `age-ai-1.0.0.apk`; allow "Install unknown apps" for your file app
when Android asks. Check:

- the welcome slides;
- sign-in with Google;
- making an age photo;
- Save, Share and Report;
- Account → Delete account (tap Cancel unless you mean it).

Two things are different in this test copy:

- **The address bar** at the top disappears only once the assetlinks change is
  live on www.sjpt.io.
- **Buying credits** works only in a copy installed from Google Play. This
  copy says so on the credits screen.

### 2. Create the app in Play Console

Go to **Create app**, then:

- **App name:** AI Age Progression: PixelShine
- **Default language:** English
- **App or game:** App
- **Free or paid:** Free (credits are sold in the app)
- Accept the declarations.

### 3. App content (Policy → App content)

| Section | Answer |
|---|---|
| Privacy policy | https://www.sjpt.io/privacy |
| App access | **All or some functionality is restricted.** Tell reviewers to sign in with any Google account. A new Gmail account gets its first age photo free while the signup trial is on; otherwise give reviewers a test Google account with credits added. |
| Ads | **No**, after you exclude `www.sjpt.io/m/*` in AdSense (step 9). Say **Yes** if you keep ads on the app pages. |
| Content rating | Fill in the questionnaire (category: Utility/Productivity/Communication/Other). There's no violence, sexual content or gambling, and users can't talk to each other or see other users' content. |
| Target audience | **18 and over**. It keeps the app clear of the Families policy, which is strict for apps that edit faces. |
| News app | No |
| Data safety | See below |
| Government app, financial features, health | No |

**Data safety**

- **Does the app collect or share data?** Yes, it collects data.
  - Shared with third parties: **No**. fal.ai, Supabase, Vercel and Google Analytics process data for us as service providers, which Play doesn't count as sharing.
- **Encrypted in transit:** Yes.
- **Users can ask for their data to be deleted:** Yes, at https://www.sjpt.io/delete-account.
- **Data collected:**
  - Personal info: name and email address (for account management; required);
  - User IDs (for account management);
  - Photos (for app functionality; required to use the app; not processed ephemerally, because results are saved to the account);
  - Financial info: purchase history (for app functionality);
  - App activity: app interactions (for analytics);
  - Location: approximate location (for analytics, from the country of the connection);
  - Device or other IDs (for analytics).

### 4. Store listing (Grow → Store presence → Main store listing)

- **App name:** AI Age Progression: PixelShine
- **Short description (78 of 80 characters):**
  See yourself at any age, 1 to 100. Upload a selfie and AI ages you in seconds.
- **Full description:**

  > Ever wondered what you'll look like at 70, or what you looked like as a child? Upload one selfie, pick an age from 1 to 100, and AI Age Progression shows you, in seconds.
  >
  > HOW IT WORKS
  > • Take a selfie or pick a photo from your gallery
  > • Choose any age with the slider, or tap Child, Teen, 30, 50, 70 or 90
  > • Drag across the result to compare it with your photo today
  > • Save it to your phone or share it with friends
  >
  > WHAT YOU GET
  > • Sharp 2K images with no watermark
  > • Your face kept recognisable: same features, older or younger
  > • Every result saved in My Photos and in your PixelShine account, so you never lose one
  > • Credits that never expire: buy a pack when you need it, no subscription
  >
  > GOOD TO KNOW
  > • Each age photo uses 2 credits.
  > • AI age progression is a fun, illustrative guess, not a prediction.
  > • Your photos are used only to make your images. They are not used to train AI models and are never sold. You can delete your account and photos at any time.
  > • See something that looks wrong or offensive? Tap "Report this image" under any result.
  >
  > AI Age Progression is made by PixelShine (www.sjpt.io), the AI creative studio with 200+ photo apps.
  > Questions or feedback: support@sjpt.io

- **App icon:** `app-icon-512.png`
- **Feature graphic:** `feature-graphic-1024x500.png`
- **Phone screenshots:** the five `screenshot-*.png` files, in order.
- **Category:** Photography.
- **Contact details:** support@sjpt.io; website https://www.sjpt.io

### 5. Upload the first build (Test and release → Testing → Internal testing)

1. Create a release.
2. When asked about app signing, choose **Use Google-generated key**. That's Play App Signing: Google keeps the key that signs what users install, and your upload key only proves an upload came from you.
3. Upload `age-ai-1.0.0.aab`, and add release notes ("First release").
4. Under Testers, add your own Gmail and anyone else's, save, and open the opt-in link on your phone. Install from Play.

### 6. Let the Play copy open full screen

Go to Test and release → App integrity → **App signing**, and copy the
**App signing key certificate, SHA-256 fingerprint**. In Vercel → Settings →
Environment Variables, add:

```
PLAY_APP_SIGNING_SHA256 = <that fingerprint, e.g. 12:AB:…>
```

Redeploy. Then https://www.sjpt.io/.well-known/assetlinks.json lists two
fingerprints. Android re-checks on install, so reinstall the app if it still
shows an address bar.

### 7. In-app products and purchase checks

Follow `docs/play-billing.md`:

- In-app products `credits_5`, `credits_15`, `credits_25` and `credits_35` (consumable). This needs a payments profile on the developer account.
- The service account and the `GOOGLE_PLAY_SERVICE_ACCOUNT` env var.
- The `play_purchases` table (/admin → Update database).
- **License testing** (Settings → License testing): add your Gmail, so test purchases aren't charged.

### 8. Closed test, then production

Personal developer accounts created after 13 Nov 2023 must run a **closed
test with at least 12 testers, opted in for 14 days in a row**, before
applying for production access. Organisation accounts don't need to.

1. Promote the internal release to Closed testing.
2. Share the opt-in link.
3. After 14 days, apply for production in the Dashboard.

### 9. AdSense on the app pages

The site's AdSense auto ads load on every page, the app's included. Ads inside
a paid app look out of place, and Play would need "Contains ads". In
**AdSense → Ads → By site → www.sjpt.io → Page exclusions**, exclude
`www.sjpt.io/m/*`.

## Signing key

`age-ai-upload-key.jks` (alias `upload`) is the **upload key**. Its password
was sent with it, not stored here.

- Keep two copies, e.g. a password manager and a private cloud drive. Every
  future update must be signed with it.
- If it's lost, Play Console can reset it (App integrity → Request upload key
  reset). Users aren't affected, because Play holds the real signing key.
- Never commit it to git. `android/age-progression/.gitignore` blocks it.

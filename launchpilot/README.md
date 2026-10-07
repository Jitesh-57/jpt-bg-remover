# LaunchPilot: AI launch agent

LaunchPilot gets a product listed on launch platforms and directories (Product Hunt, BetaList,
AlternativeTo, G2, AI tool directories and more) without doing every form by hand.

1. **Website crawl and fact sheet.** Paste your website URL. The agent reads your sitemap and up to 80
   pages (pricing, features, tools and FAQ first), then writes a fact sheet with your real tool names,
   prices and limits, plus a draft profile. Every listing is written from the fact sheet, and you can edit it.
2. **Listing sites.** Start from 70 built-in platforms, filtered by type, price and authority tier.
   - **Add any site by URL.** The agent opens it, follows "Submit" links if needed, and works out what
     each form field is for.
   - **Find new sites with AI.** Searches the web for active directories you don't have yet,
     optionally for a niche ("AI image tools").
   - **Check links.** Flags directories that have gone offline.
3. **Per-site workflow** (Launches → click a site):
   - **Analyze form.** Maps every field to a role (tagline, description, category…) and reads its character limit.
   - **Write listing.** Writes copy in that platform's voice (maker-led on launch sites, factual on review
     sites) using only facts from the fact sheet. A style check then flags filler words ("unlock",
     "seamless"…), dashes, exclamation marks, long sentences, repeated openings and over-limit fields, and
     the draft goes back for a revision. Each field has a Copy button.
   - **Fill in browser.** Opens a real Chromium window, logs in (or signs up) with your saved login,
     fills every field and uploads your logo and screenshots.
   - **Schedule.** Pick a date and time. At that time the agent fills the form, or reminds you to.
   - **Track.** Not started → Needs you → Submitted → Live, with the live URL. Export everything to CSV.
   - **Find live listing.** Searches the directory's own site with Claude for your product's page, opens
     it, and checks it really shows your product. If it does, the launch moves to **Live** with that URL.
     "Find live listings" on the Launches page checks every submitted site at once.
4. **AI launch plan.** A week-by-week order for your sites: long queues first, then the big launch day,
   then the long tail.
5. **Logins vault.** Email and password per platform (or one default), encrypted with AES-256-GCM.
   Passwords are only decrypted inside the browser automation and are never sent to the AI.
6. **Multiple products.** Switch products from the sidebar. Every product has its own profile, launches
   and schedule.

## Autopilot

Save one email and password as your **launch account** on the Dashboard. Then press **Launch on N sites** on
the Launches page, or **Run autopilot on this site** inside any site. For each site, Autopilot:

1. Opens the submit page. If the saved link is dead, it finds the real one from the site's homepage.
2. Signs in with your launch account. If there's no account for your email, it signs up with the same
   email and password. If an account exists with a different password, it stops and asks you for that
   site's password once (saved encrypted for that site).
3. Reads the live form, writes the listing for exactly those fields with Claude from your fact sheet, fills
   every field and submits.
4. Saves the listing link, the site's confirmation message and a screenshot. Many directories review
   submissions first, so the link may go live later.

When a site needs you (CAPTCHA, email verification link, Google-only sign-in), it's moved to **Needs you**
and the run continues with the next site. Press **Continue** on it when you're done.

## What stays with a human

LaunchPilot does **not** solve CAPTCHAs or get around email or phone verification. When a site shows
one, the browser window stays open, the launch moves to **Needs you**, and you press **Continue**
after solving it.

Platforms with strict anti-automation rules (Product Hunt, Hacker News, Reddit, Indie Hackers…) are
marked **You post**. LaunchPilot writes the copy and fills the form there, but it never clicks the final
button and never creates accounts on them by itself. That keeps your accounts safe. Elsewhere,
auto-submit is off by default and you turn it on per run.

## Hosted version on Vercel (anyone can use it)

The same app runs as a website: people sign up with an email and password, and each account gets its own
products, launches, vault and site sign-ins. Autopilot runs in a browser on the server.

**One click:** [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FJitesh-57%2Fjpt-bg-remover%2Ftree%2Fmain%2Flaunchpilot&project-name=launchpilot&repository-name=launchpilot&env=ANTHROPIC_API_KEY,LAUNCHPILOT_SECRET,CRON_SECRET&envDescription=Claude%20API%20key%3B%20any%20long%20random%20string%20for%20LAUNCHPILOT_SECRET%20%28never%20change%20it%20later%29%3B%20any%20random%20string%20for%20CRON_SECRET&envLink=https%3A%2F%2Fgithub.com%2FJitesh-57%2Fjpt-bg-remover%2Ftree%2Fmain%2Flaunchpilot%23hosted-version-on-vercel-anyone-can-use-it&stores=%5B%7B%22type%22%3A%22integration%22%2C%22integrationSlug%22%3A%22upstash%22%2C%22productSlug%22%3A%22upstash-kv%22%7D%5D)
This creates a separate `launchpilot` repo and Vercel project, adds Upstash Redis, and asks for the three
required variables. Add the optional ones below afterwards.

**Or by hand (about 5 minutes):**

1. In Vercel: **Add New → Project**, import this repository, set **Root Directory** to `launchpilot`,
   Framework Preset **Other**. Deploy it as its own project (not the sjpt.io project).
2. In the new project: **Storage → Marketplace → Upstash (Redis)** → create and connect. This adds
   `KV_REST_API_URL` and `KV_REST_API_TOKEN`.
3. **Settings → Environment Variables:**

   | Variable | Value |
   |---|---|
   | `ANTHROPIC_API_KEY` | Your Claude API key. |
   | `LAUNCHPILOT_SECRET` | A long random string (signs sessions and derives each user's vault key). Never change it after launch, or saved passwords can't be decrypted. |
   | `CRON_SECRET` | Any random string; lets Vercel Cron run scheduled launches. |
   | `LAUNCHPILOT_INVITE_CODE` | Optional. If set, sign-up needs this code. |
   | `LAUNCHPILOT_DAILY_AI_LIMIT` | Optional. AI and browser actions per account per day (default 150). |
   | `BROWSERBASE_API_KEY`, `BROWSERBASE_PROJECT_ID` | Optional but recommended. Cloud browsers with a **live view**: when a site shows a CAPTCHA or needs a click, the launch shows "Open live browser" so the person can finish it from their own browser. |

4. Redeploy. Open `https://<project>.vercel.app` and create the first account.

**How it differs from the desktop app:**

- **Crawl** uses HTTP (sitemaps plus up to 100 pages) instead of a browser, so it fits in one request.
- **Autopilot** runs one site per request (up to 5 minutes each). "Launch on N sites" steps through the
  list from the open tab.
- **Sign-ins to listing sites** are saved per account: Browserbase contexts, or the browser's cookies in
  storage without Browserbase.
- **CAPTCHAs and email links.** Without Browserbase there is no window to hand over, so those sites stop at
  **Needs you**; finish them on the site yourself and mark the launch submitted.
- **Scheduled launches** run from Vercel Cron (`vercel.json`, daily at 06:00 UTC on the Hobby plan; on Pro
  change it to hourly, `0 * * * *`).
- **Safety.** The server refuses private and internal addresses, every account has a daily action limit,
  and site passwords are encrypted with a key unique to each account.

Test the hosted mode locally without Vercel:

```bash
LAUNCHPILOT_CLOUD=1 LAUNCHPILOT_STORE_DIR=./data/store LAUNCHPILOT_SECRET=dev-secret npm start
```

## Claude artifact version

`web/launchpilot-web.html` is a lighter single-page version published at
https://claude.ai/artifact/2SaXPccNZq5Gqyja46w3SZ. It has the site catalog, AI listing writer,
launch tracker, launch calendar (.ics export) and CSV export, but no autopilot.

## Desktop setup

**Windows:** install Node.js and Git, clone the repo, then double-click `Start LaunchPilot.bat`. It
installs everything the first time, asks for your API key, and opens the dashboard.

Other systems (Node.js 20+):

```bash
cd launchpilot
npm install
npm run browser:install      # downloads Chromium for the browser automation (one time)
cp .env.example .env         # then add your ANTHROPIC_API_KEY
npm start                    # → http://127.0.0.1:4310
```

| Setting | What it does |
|---|---|
| `ANTHROPIC_API_KEY` | Turns on the AI features: auto-fill, form analysis, copywriting, discovery and launch plans. Without it, the app still works: fields are mapped by keyword and filled from your profile. |
| `LAUNCHPILOT_MODEL` | Default `claude-opus-5-5`. |
| `LAUNCHPILOT_MASTER_KEY` | Encryption key for saved passwords. If you don't set it, one is generated in `data/.master.key`. **Back it up.** |
| `LAUNCHPILOT_APP_PASSWORD` | Puts the dashboard behind a password. Required if `HOST` isn't localhost. |
| `LAUNCHPILOT_HEADLESS` | `false` (default) shows the browser window so you can take over. `true` is for servers. |
| `CHROMIUM_PATH` | Use an existing Chrome/Chromium instead of the bundled one. |

Run it on the computer where you want the browser windows to open. Scheduled jobs run while the app is
running. Anything that came due while it was off runs on the next start.

## Data

Everything lives in `launchpilot/data/` (git-ignored):

- `db.json`: products, directories, launches, jobs and activity
- `uploads/`: logos and screenshots
- `browser-profiles/<site>/`: one browser profile per platform, so you stay logged in
- `.master.key`, `.vault.salt`: the vault key material

## Project layout

```
src/app.js         Express API + static UI (desktop and hosted)
src/server.js      Desktop entry point (listens locally, runs the scheduler)
api/index.js       Vercel entry point
vercel.json        Vercel routing, function limits and cron
src/auth.js        Hosted accounts: sign-up, login, signed session cookie
src/store.js       Hosted storage (Upstash Redis)
src/browser.js     Where the browser runs: local, serverless Chromium or Browserbase; private-address guard
src/crawl-fetch.js Hosted crawler (HTTP, no browser)
src/crawl.js       Website crawler: sitemap + links, ranks pages, extracts headings, prices, FAQs
src/style.js       House writing rules and the style checker
src/ai.js          Claude calls: fact sheet, form analysis, listing copy, launch plan, web discovery
src/inspect.js     Reads pages: visible text, form fields with labels/limits/selectors, login walls, CAPTCHAs
src/automation.js  Playwright: persistent per-site profiles, login/sign-up, form filling, submit
src/scheduler.js   Runs scheduled fills and reminders
src/vault.js       AES-256-GCM password encryption
src/catalog.js     Built-in directory catalog (edit to add your own defaults)
src/db.js          JSON-file store (desktop) or one document per account (hosted)
public/            Dashboard (vanilla JS, no build step)
```

## Selling it

The app is self-contained and white-label friendly. To package it for customers:

- **Hosted (SaaS).** Deploy to Vercel as above and give people the link. Use `LAUNCHPILOT_INVITE_CODE`
  while testing, and `LAUNCHPILOT_DAILY_AI_LIMIT` to cap Claude spend per account. Add billing in front of
  sign-up when you start charging.
- **Self-hosted or desktop.** Each customer runs their own copy. Their logins, browser sessions and API
  key stay on their machine. This is the simplest model to sell and the safest for credentials. Wrap it
  in Electron or Tauri for a one-click desktop app.
- **Bring-your-own key.** Customers add their own `ANTHROPIC_API_KEY`, so AI usage is billed to them.
- **Branding.** The name, logo and colors are in `public/index.html` and the `:root` tokens in
  `public/styles.css`.
- **Catalog updates.** Ship new `src/catalog.js` entries in updates. Existing installs merge them on start
  without overwriting sites the user edited.
- **Not included yet:** license-key checks, multi-user accounts, and a hosted (SaaS) version. A hosted
  version would need per-user isolation and remote browsers, and storing customers' passwords on your
  servers brings extra security and legal obligations.

Tell your customers to follow each platform's terms: one account per platform, no vote solicitation, and
honest listings.

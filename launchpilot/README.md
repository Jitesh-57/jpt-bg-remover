# LaunchPilot: AI launch agent

LaunchPilot gets a product listed on launch platforms and directories (Product Hunt, BetaList,
AlternativeTo, G2, AI tool directories and more) without doing every form by hand.

1. **Product profile.** Paste your website URL. The agent reads the site and drafts the name, tagline,
   descriptions, categories, tags and competitors.
2. **Listing sites.** Start from 70 built-in platforms, filtered by type, price and authority tier.
   - **Add any site by URL.** The agent opens it, follows "Submit" links if needed, and works out what
     each form field is for.
   - **Find new sites with AI.** Searches the web for active directories you don't have yet,
     optionally for a niche ("AI image tools").
   - **Check links.** Flags directories that have gone offline.
3. **Per-site workflow** (Launches → click a site):
   - **Analyze form.** Maps every field to a role (tagline, description, category…) and reads its character limit.
   - **Write listing.** Writes copy for that platform's audience and limits, worded differently on each
     site so the listings don't duplicate each other. You can edit it, and each field has a Copy button.
   - **Fill in browser.** Opens a real Chromium window, logs in (or signs up) with your saved login,
     fills every field and uploads your logo and screenshots.
   - **Schedule.** Pick a date and time. At that time the agent fills the form, or reminds you to.
   - **Track.** Not started → Needs you → Submitted → Live, with the live URL. Export everything to CSV.
4. **AI launch plan.** A week-by-week order for your sites: long queues first, then the big launch day,
   then the long tail.
5. **Logins vault.** Email and password per platform (or one default), encrypted with AES-256-GCM.
   Passwords are only decrypted inside the browser automation and are never sent to the AI.
6. **Multiple products.** Switch products from the sidebar. Every product has its own profile, launches
   and schedule.

## What stays with a human

LaunchPilot does **not** solve CAPTCHAs or get around email or phone verification. When a site shows
one, the browser window stays open, the launch moves to **Needs you**, and you press **Continue**
after solving it.

Platforms with strict anti-automation rules (Product Hunt, Hacker News, Reddit, Indie Hackers…) are
marked **You post**. LaunchPilot writes the copy and fills the form there, but it never clicks the final
button and never creates accounts on them by itself. That keeps your accounts safe. Elsewhere,
auto-submit is off by default and you turn it on per run.

## Setup

Requires Node.js 20+.

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
src/server.js      Express API + static UI
src/ai.js          Claude calls: site → profile, form analysis, listing copy, launch plan, web discovery
src/inspect.js     Reads pages: visible text, form fields with labels/limits/selectors, login walls, CAPTCHAs
src/automation.js  Playwright: persistent per-site profiles, login/sign-up, form filling, submit
src/scheduler.js   Runs scheduled fills and reminders
src/vault.js       AES-256-GCM password encryption
src/catalog.js     Built-in directory catalog (edit to add your own defaults)
src/db.js          JSON-file store
public/            Dashboard (vanilla JS, no build step)
```

## Selling it

The app is self-contained and white-label friendly. To package it for customers:

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

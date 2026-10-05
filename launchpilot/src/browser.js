// Where the browser runs.
//
// Desktop: Playwright's Chromium on your computer, one persistent profile per
//   site, visible window unless LAUNCHPILOT_HEADLESS=true.
// Hosted without Browserbase: Chromium inside the serverless function
//   (@sparticuz/chromium); each site's cookies are saved in your account
//   between runs so you stay signed in.
// Hosted with Browserbase (BROWSERBASE_API_KEY + BROWSERBASE_PROJECT_ID): cloud
//   browsers with persistent contexts, plus a live view link so you can solve a
//   CAPTCHA or click an email link from your own browser.
import dns from 'node:dns/promises';
import net from 'node:net';
import { chromium } from 'playwright';
import * as db from './db.js';

export const isHosted = () => process.env.LAUNCHPILOT_CLOUD === '1' || Boolean(process.env.VERCEL);
export const hasBrowserbase = () => Boolean(process.env.BROWSERBASE_API_KEY && process.env.BROWSERBASE_PROJECT_ID);

// ---- Private-address guard (hosted only) -------------------------------------
function isPrivateIp(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
  }
  const v = ip.toLowerCase();
  return v === '::1' || v === '::' || v.startsWith('fc') || v.startsWith('fd') || v.startsWith('fe80') || v.startsWith('::ffff:') && isPrivateIp(v.slice(7));
}

const hostVerdicts = new Map();

/** Throws if a hosted user tries to reach a private or internal address. */
export async function assertPublicUrl(raw) {
  if (!isHosted() || process.env.LAUNCHPILOT_ALLOW_PRIVATE === '1') return;
  const u = new URL(raw);
  if (!/^https?:$/.test(u.protocol)) throw Object.assign(new Error('Only http and https links are supported.'), { status: 400 });
  const host = u.hostname.replace(/^\[|\]$/g, '');
  if (!hostVerdicts.has(host)) {
    let ok = true;
    if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.internal')) ok = false;
    else if (net.isIP(host)) ok = !isPrivateIp(host);
    else {
      const addrs = await dns.lookup(host, { all: true }).catch(() => []);
      ok = addrs.length > 0 && addrs.every((a) => !isPrivateIp(a.address));
    }
    hostVerdicts.set(host, ok);
  }
  if (!hostVerdicts.get(host)) throw Object.assign(new Error("That address can't be opened."), { status: 400 });
}

// Blocks a hosted browser from loading private addresses (including via redirects).
export async function guardContext(ctx) {
  if (!isHosted() || process.env.LAUNCHPILOT_ALLOW_PRIVATE === '1') return;
  await ctx.route('**/*', async (route) => {
    try {
      await assertPublicUrl(route.request().url());
      await route.continue();
    } catch {
      await route.abort('blockedbyclient');
    }
  });
}

// ---- Launching ---------------------------------------------------------------
async function serverlessLaunch() {
  const sparticuz = (await import('@sparticuz/chromium')).default;
  return chromium.launch({ executablePath: await sparticuz.executablePath(), args: sparticuz.args, headless: true });
}

export function localLaunchOptions(headless = true) {
  const opts = { headless };
  if (process.env.CHROMIUM_PATH) opts.executablePath = process.env.CHROMIUM_PATH;
  return opts;
}

/** A plain browser for reading pages. */
export async function launchBrowser() {
  if (process.env.VERCEL) return serverlessLaunch();
  return chromium.launch(localLaunchOptions(true));
}

// ---- Browserbase -------------------------------------------------------------
async function bb(path, body, method = body ? 'POST' : 'GET') {
  const res = await fetch(`https://api.browserbase.com/v1${path}`, {
    method,
    headers: { 'X-BB-API-Key': process.env.BROWSERBASE_API_KEY, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Browserbase: ${data.message || data.error || res.status}`);
  return data;
}

export async function releaseBrowserbaseSession(sessionId) {
  if (!sessionId || !hasBrowserbase()) return;
  await bb(`/sessions/${sessionId}`, { projectId: process.env.BROWSERBASE_PROJECT_ID, status: 'REQUEST_RELEASE' }).catch(() => {});
}

/**
 * A signed-in browser session for one listing site (hosted mode).
 * Returns { context, sessionId, liveViewUrl(), close({ keepAlive }) }.
 */
export async function openHostedSiteSession(slug) {
  const settings = db.settings();
  if (hasBrowserbase()) {
    const contexts = { ...(settings.bbContexts || {}) };
    if (!contexts[slug]) {
      contexts[slug] = (await bb('/contexts', { projectId: process.env.BROWSERBASE_PROJECT_ID })).id;
      db.setSettings({ bbContexts: contexts });
    }
    const session = await bb('/sessions', {
      projectId: process.env.BROWSERBASE_PROJECT_ID,
      keepAlive: true,
      timeout: 1800,
      browserSettings: { context: { id: contexts[slug], persist: true } },
    });
    const browser = await chromium.connectOverCDP(session.connectUrl);
    const context = browser.contexts()[0] || (await browser.newContext());
    await guardContext(context);
    return {
      context,
      sessionId: session.id,
      liveViewUrl: async () => (await bb(`/sessions/${session.id}/debug`)).debuggerFullscreenUrl || null,
      close: async ({ keepAlive = false } = {}) => {
        await browser.close().catch(() => {});
        if (!keepAlive) await releaseBrowserbaseSession(session.id);
      },
    };
  }
  // Serverless Chromium: restore and save this site's cookies with the user's data.
  const browser = await serverlessOrLocal();
  const stored = settings.siteStates?.[slug];
  const context = await browser.newContext({ storageState: stored || undefined, viewport: { width: 1280, height: 900 } });
  await guardContext(context);
  return {
    context,
    sessionId: null,
    liveViewUrl: async () => null,
    close: async () => {
      const st = await context.storageState().catch(() => null);
      if (st) {
        // Keep it small: cookies, plus local storage for the site itself.
        const trimmed = { cookies: st.cookies, origins: st.origins.filter((o) => JSON.stringify(o).length < 100000) };
        db.setSettings({ siteStates: { ...(db.settings().siteStates || {}), [slug]: trimmed } });
      }
      await browser.close().catch(() => {});
    },
  };
}

async function serverlessOrLocal() {
  return process.env.VERCEL ? serverlessLaunch() : chromium.launch(localLaunchOptions(true));
}

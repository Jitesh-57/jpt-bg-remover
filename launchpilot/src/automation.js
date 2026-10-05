// Drives a real Chromium window to log in / sign up and fill submission forms.
//
// Each platform gets its own persistent browser profile (data/browser-profiles/<slug>),
// so once you're logged in you stay logged in, like a normal browser.
//
// Design rule: the agent prepares and fills everything, but hands control to you
// for CAPTCHAs, email verification and (unless you opt in) the final Submit
// click. That keeps accounts safe and respects each platform's rules.
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { chromium } from 'playwright';
import * as db from './db.js';
import { decrypt } from './vault.js';
import { launchOptions, readPage, inspectPage, guessRoles } from './inspect.js';
import { isHosted, openHostedSiteSession, releaseBrowserbaseSession } from './browser.js';
import { getJson, setJson } from './store.js';
import { aiConfigured, analyzeSubmitPage, writeListing } from './ai.js';

const contexts = new Map(); // slug -> BrowserContext (desktop)
// Hosted: slug -> browser session, kept per request (one server may serve several people at once).
const hostedSessionsMap = () => {
  const bag = db.requestBag();
  if (!bag) return new Map();
  bag.sessions ??= new Map();
  return bag.sessions;
};
const headless = () => String(process.env.LAUNCHPILOT_HEADLESS || 'false') === 'true';

async function contextFor(slug) {
  if (isHosted()) {
    const sessions = hostedSessionsMap();
    if (!sessions.has(slug)) sessions.set(slug, await openHostedSiteSession(slug));
    return sessions.get(slug).context;
  }
  const existing = contexts.get(slug);
  if (existing) {
    try {
      existing.pages();
      return existing;
    } catch {
      contexts.delete(slug);
    }
  }
  const dir = path.join(db.DATA_DIR, 'browser-profiles', slug);
  fs.mkdirSync(dir, { recursive: true });
  const ctx = await chromium.launchPersistentContext(dir, { ...launchOptions(headless()), viewport: null });
  ctx.on('close', () => contexts.delete(slug));
  contexts.set(slug, ctx);
  return ctx;
}

export async function closeAll() {
  if (isHosted()) {
    const sessions = hostedSessionsMap();
    await Promise.all([...sessions.values()].map((s) => s.close().catch(() => {})));
    sessions.clear();
    return;
  }
  await Promise.all([...contexts.values()].map((c) => c.close().catch(() => {})));
}

// Hosted: end a site's browser session after a request. When autopilot is
// waiting for the person (CAPTCHA, email link), a Browserbase session stays
// open and its live view link is saved on the launch.
async function finishHostedSession(slug, submissionId) {
  const sessions = hostedSessionsMap();
  const session = sessions.get(slug);
  if (!session) return;
  sessions.delete(slug);
  const sub = db.get('submissions', submissionId);
  if (sub?.status === 'needs_human' && session.sessionId) {
    const liveViewUrl = await session.liveViewUrl().catch(() => null);
    db.update('submissions', submissionId, { liveViewUrl, bbSessionId: session.sessionId });
    await session.close({ keepAlive: true });
  } else {
    db.update('submissions', submissionId, { liveViewUrl: null, bbSessionId: null });
    await session.close();
  }
}

function log(submission, message, status) {
  const entry = { at: db.now(), message };
  const patch = { log: [...(submission.log || []), entry] };
  if (status) patch.status = status;
  Object.assign(submission, db.update('submissions', submission.id, patch));
  db.logActivity(message, { submissionId: submission.id });
}

async function newPage(ctx) {
  const pages = ctx.pages();
  const blank = pages.find((p) => p.url() === 'about:blank');
  return blank || ctx.newPage();
}

async function goto(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
}

function credentialFor(directory) {
  const host = new URL(directory.url).hostname.replace(/^www\./, '');
  return db.find('credentials', (c) => c.directoryId === directory.id) ||
    db.find('credentials', (c) => c.domain && host.endsWith(c.domain.replace(/^www\./, ''))) ||
    db.find('credentials', (c) => c.isDefault);
}

const EMAIL_SELECTORS = ['input[type="email"]', 'input[name*="email" i]', 'input[autocomplete="username"]', 'input[name*="user" i]', 'input[id*="email" i]'];

async function firstVisible(page, selectors) {
  for (const sel of selectors) {
    const loc = page.locator(sel).first();
    if (await loc.count() && await loc.isVisible().catch(() => false)) return loc;
  }
  return null;
}

async function clickPrimary(page, words) {
  const re = new RegExp(words.join('|'), 'i');
  const btn = page.locator('button, input[type="submit"], [role="button"]').filter({ hasText: re }).first();
  if (await btn.count()) return btn.click({ timeout: 5000 }).then(() => true, () => false);
  const submit = page.locator('button[type="submit"], input[type="submit"]').first();
  if (await submit.count()) return submit.click({ timeout: 5000 }).then(() => true, () => false);
  return false;
}

async function pageState(page) {
  return page.evaluate(readPage);
}

// Email + password form fill. Returns 'ok' | 'captcha' | 'no-form'.
async function fillCredentials(page, cred, { signup, product }) {
  // Fill even when there's a CAPTCHA, so the human only has to solve the challenge.
  const email = await firstVisible(page, EMAIL_SELECTORS);
  const password = page.locator('input[type="password"]');
  if (!email && !(await password.count())) return 'no-form';
  if (email) await email.fill(cred.email);
  // Some sites ask for email first, then password on the next step.
  if (!(await password.count())) {
    await clickPrimary(page, ['continue', 'next', 'sign in', 'log in']);
    await page.waitForTimeout(2500);
  }
  const pw = decrypt(cred.passwordEnc);
  const pwCount = await page.locator('input[type="password"]').count();
  for (let i = 0; i < pwCount; i++) {
    const loc = page.locator('input[type="password"]').nth(i);
    if (await loc.isVisible().catch(() => false)) await loc.fill(pw);
  }
  if (signup && product?.makerName) {
    const name = await firstVisible(page, ['input[name*="name" i]:not([name*="user" i]):not([name*="company" i])', 'input[autocomplete="name"]']);
    if (name) await name.fill(product.makerName).catch(() => {});
  }
  if ((await pageState(page)).captcha) return 'captcha';
  await clickPrimary(page, signup ? ['sign up', 'create account', 'register', 'join', 'get started', 'continue'] : ['log in', 'login', 'sign in', 'continue']);
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  return (await pageState(page)).captcha ? 'captcha' : 'ok';
}

// Hosted uploads live in the store as "kv:<productId>/<name>"; copy to /tmp for the file input.
async function localFile(ref) {
  if (!ref || !String(ref).startsWith('kv:')) return ref;
  const [productId, name] = ref.slice(3).split('/');
  const data = await getJson(`lp:upload:${db.currentUserId()}:${productId}:${name}`);
  if (!data) return null;
  const file = path.join(os.tmpdir(), 'launchpilot-uploads', `${productId}-${name}`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, Buffer.from(data, 'base64'));
  return file;
}

async function fillField(page, field, value, product) {
  const loc = page.locator(field.selector).first();
  if (!(await loc.count())) return false;
  if (field.type === 'file') {
    const file = await localFile(field.role === 'logo' ? product.logoPath : (product.screenshotPaths || [])[0]);
    if (!file || !fs.existsSync(file)) return false;
    await loc.setInputFiles(file);
    return true;
  }
  if (value === undefined || value === null || value === '') return false;
  if (field.tag === 'select') {
    // Exact option first, then the option that shares the most words with the value.
    const options = await loc.locator('option').evaluateAll((os) => os.map((o) => ({ label: o.textContent.trim(), value: o.value })));
    const want = String(value).toLowerCase();
    let pickOpt = options.find((o) => o.label.toLowerCase() === want || o.value.toLowerCase() === want);
    if (!pickOpt) {
      const words = want.split(/\W+/).filter((w) => w.length > 2);
      const scored = options.filter((o) => o.value).map((o) => ({ o, n: words.filter((w) => o.label.toLowerCase().includes(w)).length })).sort((a, b) => b.n - a.n);
      if (scored[0]?.n) pickOpt = scored[0].o;
    }
    if (!pickOpt) return false;
    await loc.selectOption({ value: pickOpt.value });
    return true;
  }
  if (field.type === 'checkbox' || field.type === 'radio') {
    if (/^(true|yes|on|1)$/i.test(String(value))) await loc.check().catch(() => {});
    return true;
  }
  if (field.tag !== 'input' && field.tag !== 'textarea') {
    await loc.click();
    await page.keyboard.insertText(String(value));
    return true;
  }
  await loc.fill(String(value));
  return true;
}

// Value for a form field: the AI-written copy if present, otherwise a direct
// mapping from the product profile.
// Facts that must be exact (links, email, names) always come from the profile;
// written copy comes from the AI listing when there is one.
const EXACT_ROLES = new Set(['product_name', 'website_url', 'email', 'maker_name', 'company_name', 'twitter', 'linkedin', 'github', 'video_url']);

function valueFor(field, submission, product, cred) {
  if (!EXACT_ROLES.has(field.role) && submission.values && submission.values[field.fid] !== undefined) return submission.values[field.fid];
  switch (field.role) {
    case 'product_name': return product.name;
    case 'website_url': return product.url;
    case 'tagline': return product.tagline;
    case 'short_description': return product.shortDescription;
    case 'long_description': return product.longDescription;
    case 'email': return product.makerEmail || cred?.email;
    case 'maker_name': return product.makerName;
    case 'company_name': return product.companyName || product.name;
    case 'twitter': return product.twitter;
    case 'linkedin': return product.linkedin;
    case 'github': return product.github;
    case 'video_url': return product.videoUrl;
    case 'tags': return (product.tags || []).join(', ');
    default: return undefined;
  }
}

/**
 * Runs the whole flow for one submission.
 * opts.createAccount: try the platform's signup page with the saved credential.
 * opts.autoSubmit:    click the final Submit button (ignored for manualOnly platforms).
 */
export async function runSubmission(submissionId, opts = {}) {
  const submission = db.get('submissions', submissionId);
  if (!submission) throw new Error('Submission not found');
  const directory = db.get('directories', submission.directoryId);
  const product = db.get('products', submission.productId);
  const cred = credentialFor(directory);
  const ctx = await contextFor(directory.slug);
  const page = opts.page || await newPage(ctx);
  await page.bringToFront().catch(() => {});

  if (!opts.page) log(submission, `Opening ${directory.name}`, 'running');
  const submitUrl = submission.submitUrl || directory.submitUrl;

  if (opts.createAccount) {
    if (!cred) {
      log(submission, 'No saved login for this platform. Add one in Vault, or sign up in the open window.', 'needs_human');
      return submission;
    }
    await goto(page, directory.signupUrl || submitUrl);
    const result = await fillCredentials(page, cred, { signup: true, product });
    if (result === 'captcha') {
      log(submission, 'Sign-up form filled. Solve the CAPTCHA, finish any email verification, then press "Continue" in LaunchPilot.', 'needs_human');
      return submission;
    }
    if (result === 'no-form') log(submission, 'Could not find a sign-up form; the site may use Google/GitHub sign-in. Finish sign-up in the window.');
    else log(submission, 'Sign-up submitted. Check your inbox if the platform asks you to verify your email.');
  }

  if (!opts.page) await goto(page, submitUrl);
  let state = await pageState(page);

  if (state.loginWall || /login|signin|sign-in|auth/i.test(new URL(page.url()).pathname)) {
    if (!cred) {
      log(submission, 'This platform needs you to log in. Log in in the open window (or save a login in Vault) and press "Continue".', 'needs_human');
      return submission;
    }
    log(submission, `Logging in as ${cred.email}`);
    if (directory.loginUrl && !state.loginWall) await goto(page, directory.loginUrl);
    const result = await fillCredentials(page, cred, { signup: false, product });
    if (result === 'captcha') {
      log(submission, 'Login form filled. Solve the CAPTCHA in the window, then press "Continue".', 'needs_human');
      return submission;
    }
    await goto(page, submitUrl);
    state = await pageState(page);
    if (state.loginWall) {
      log(submission, 'Still on a login page (2FA, Google sign-in, or wrong password?). Finish logging in in the window, then press "Continue".', 'needs_human');
      return submission;
    }
  }

  // Match the stored field analysis against what's on the page now. If it was
  // captured on a login wall or the form changed, map the live form instead.
  let fields = submission.fields?.length ? submission.fields : [];
  const present = await Promise.all(fields.map((f) => page.locator(f.selector).count().catch(() => 0)));
  const loginOnly = fields.length && fields.every((f) => ['email', 'password', 'other'].includes(f.role));
  if (state.fields.length && (!fields.length || loginOnly || present.filter(Boolean).length < fields.length / 2)) {
    fields = guessRoles(state.fields);
    if (aiConfigured()) {
      const analysis = await analyzeSubmitPage(page.url(), { ...state, finalUrl: page.url() });
      const roles = new Map(analysis.fields.map((f) => [f.fid, f]));
      fields = fields.map((f) => (roles.has(f.fid) ? { ...f, role: roles.get(f.fid).role, maxChars: roles.get(f.fid).maxChars || f.maxLength || 0, guidance: roles.get(f.fid).guidance } : f));
    }
    // AI copy was keyed to the old field ids, so it no longer applies.
    Object.assign(submission, db.update('submissions', submission.id, { fields, values: {}, analyzedAt: db.now() }));
    log(submission, `Mapped the live submission form (${fields.length} fields).${submission.kit?.length ? ' Press "Rewrite" to fit your AI copy to it.' : ''}`);
  }
  let filled = 0;
  for (const field of fields) {
    if (['ignore', 'search', 'password'].includes(field.role)) continue;
    const ok = await fillField(page, field, valueFor(field, submission, product, cred), product).catch(() => false);
    if (ok) filled++;
  }
  if (!fields.length) {
    log(submission, 'No analyzed form fields yet. Press "Analyze form" first so the agent knows what goes where; the page is open so you can fill it by hand.', 'needs_human');
    return submission;
  }
  log(submission, `Filled ${filled} of ${fields.length} fields.`);

  state = await pageState(page);
  if (state.captcha) {
    log(submission, 'Form filled. Solve the CAPTCHA, review the form and click Submit in the window, then mark this as Submitted.', 'needs_human');
    return submission;
  }

  if (opts.autoSubmit && !directory.manualOnly) {
    // The browser refuses to send a form with invalid fields (a bad URL, an
    // empty required field), so check before claiming it was submitted.
    const invalid = await page.evaluate(() => [...document.querySelectorAll('input:invalid, textarea:invalid, select:invalid')]
      .map((el) => (el.labels?.[0]?.innerText || el.getAttribute('aria-label') || el.name || el.placeholder || el.type).trim()).slice(0, 8));
    if (invalid.length) {
      log(submission, `Not submitted: these fields need fixing first: ${invalid.join(', ')}. Fix them in the window, then click Submit.`, 'needs_human');
      return submission;
    }
    const before = page.url();
    const clicked = await clickPrimary(page, ['submit', 'publish', 'launch', 'add (tool|product|startup)', 'list (it|my)', 'send', 'save']);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    const stillInvalid = clicked && page.url() === before && await page.evaluate(() => document.querySelectorAll('input:invalid, textarea:invalid, select:invalid').length).catch(() => 0);
    if (stillInvalid) {
      log(submission, 'The site rejected some fields after clicking Submit. Check the window, fix them and submit.', 'needs_human');
      return submission;
    }
    if (clicked) {
      log(submission, 'Clicked Submit. Check the window for a confirmation, then add the live URL when it\'s approved.', 'submitted');
      db.update('submissions', submission.id, { submittedAt: db.now() });
    } else {
      log(submission, 'Couldn\'t find the Submit button. Review the form and click it yourself.', 'needs_human');
    }
    return submission;
  }

  log(submission, directory.manualOnly
    ? `${directory.name} requires a human to post. Everything is filled in: review it and click Submit/Post yourself, then mark this as Submitted.`
    : 'Form filled. Review it in the window and click Submit, then mark this as Submitted.', 'ready_for_review');
  return submission;
}

// Opens the platform's window without doing anything, e.g. to log in by hand.
export async function openWindow(directory, url) {
  if (isHosted()) {
    // Hosted: a live browser view (Browserbase) is the only way to "open" a site.
    const session = await openHostedSiteSession(directory.slug);
    const page = await newPage(session.context);
    await goto(page, url || directory.url);
    const liveViewUrl = await session.liveViewUrl().catch(() => null);
    await session.close({ keepAlive: Boolean(liveViewUrl) });
    if (!liveViewUrl) throw Object.assign(new Error('Opening a live browser needs a Browserbase key on the server. Open the site in your own browser instead.'), { status: 400 });
    return { liveViewUrl };
  }
  const ctx = await contextFor(directory.slug);
  const page = await newPage(ctx);
  await goto(page, url || directory.url);
  await page.bringToFront().catch(() => {});
  return {};
}

// Reads a page using the platform's logged-in browser profile, for submit
// forms that only appear after login.
export async function inspectLoggedIn(directory, url) {
  return inspectPage(url, { context: await contextFor(directory.slug) });
}

export function hasProfile(directory) {
  return contexts.has(directory.slug) || fs.existsSync(path.join(db.DATA_DIR, 'browser-profiles', directory.slug));
}

// ---------------------------------------------------------------------------
// Autopilot: account, listing and link for one site, start to finish.
//
// 1. Opens the submit page; if the saved link is dead, finds the real one from
//    the homepage.
// 2. Makes sure you're signed in: logs in with your launch account, signs up
//    with the same email and password when there's no account yet, and stops to
//    ask for the site's own password when the account exists with another one.
// 3. Maps the live form, writes the listing with Claude, fills and submits it.
// 4. Records the listing link and a screenshot of the confirmation page.
// It stops for CAPTCHAs, email verification and sites that only offer Google or
// GitHub sign-in; pressing Continue picks up where it stopped.

const SIGNUP_RE = /sign ?up|register|create (an |your )?account|join( now| free)?|get started/i;
const LOGIN_RE = /log ?in|sign ?in/i;

async function visibleText(page) {
  return page.evaluate(() => (document.body?.innerText || '').slice(0, 20000)).catch(() => '');
}

async function hasVisiblePassword(page) {
  const pw = page.locator('input[type="password"]');
  const n = await pw.count();
  for (let i = 0; i < n; i++) if (await pw.nth(i).isVisible().catch(() => false)) return true;
  return false;
}

async function clickLink(page, re) {
  const link = page.locator('a, button, [role="button"]').filter({ hasText: re }).first();
  if (!(await link.count())) return false;
  await link.click({ timeout: 5000 }).catch(() => {});
  await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {});
  await page.waitForLoadState('networkidle', { timeout: 6000 }).catch(() => {});
  return true;
}

function looksDead(status, text) {
  return (status && status >= 400) || /\b(404|page not found|this page (doesn.t|does not) exist|we can.t find this page)\b/i.test(text.slice(0, 2000));
}

// Finds a working submit page, starting from the saved link.
async function openSubmitPage(page, submission, directory) {
  const saved = submission.submitUrl || directory.submitUrl || directory.url;
  const res = await page.goto(saved, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => null);
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
  if (!looksDead(res?.status(), await visibleText(page))) return saved;

  log(submission, `The saved submit link is broken (${saved}). Looking for the real one on ${directory.name}'s homepage.`);
  await goto(page, directory.url);
  const state = await pageState(page);
  let next = state.submitLinks.find((l) => new URL(l.href).origin === new URL(directory.url).origin)?.href;
  if (!next && aiConfigured()) {
    const analysis = await analyzeSubmitPage(page.url(), { ...state, finalUrl: page.url() }).catch(() => null);
    next = analysis?.betterSubmitUrl || '';
  }
  if (next) {
    await goto(page, next);
    if (!looksDead(null, await visibleText(page))) {
      db.update('submissions', submission.id, { submitUrl: next });
      if (!directory.userEdited) db.update('directories', directory.id, { submitUrl: next });
      log(submission, `Found the submit page: ${next}`);
      return next;
    }
  }
  // Stay on the homepage; logging in often reveals the submit option.
  await goto(page, directory.url);
  return directory.url;
}

async function needsLogin(page) {
  const path = new URL(page.url()).pathname;
  if (/login|signin|sign-in|auth|account\/new|register|signup/i.test(path)) return true;
  if (await hasVisiblePassword(page)) return true;
  const text = (await visibleText(page)).slice(0, 4000);
  return /(sign|log) ?in to (submit|continue|add|post|list)|you (must|need to) (be )?(log|sign)/i.test(text);
}

// Returns 'ok' | 'captcha' | 'no_account' | 'wrong_password' | 'exists' | 'verify_email' | 'no_form' | 'unclear'
async function authOutcome(page, mode) {
  const state = await pageState(page);
  if (state.captcha) return 'captcha';
  const text = (await visibleText(page)).toLowerCase();
  if (/verify your email|check your (email|inbox)|confirmation (email|link)|we.ve sent|activate your account|confirm your email/.test(text)) return 'verify_email';
  if (/already (exists|registered|in use|taken|have an account)|email (is )?(already )?(taken|in use|registered)|account with this email/.test(text)) return 'exists';
  if (mode === 'login' && /no account|not found|doesn.t exist|does not exist|not registered|no user|couldn.t find (your|an) account|sign up first/.test(text)) return 'no_account';
  if (mode === 'login' && /incorrect|invalid (email|password|credentials|login)|wrong password|password (is )?(incorrect|wrong)|try again/.test(text)) return 'wrong_password';
  if (await hasVisiblePassword(page)) return 'unclear';
  return 'ok';
}

async function signUp(page, cred, directory, product) {
  if (directory.signupUrl) await goto(page, directory.signupUrl);
  else if (!(await clickLink(page, SIGNUP_RE))) return 'no_form';
  const result = await fillCredentials(page, cred, { signup: true, product });
  if (result === 'no-form') return 'no_form';
  await page.waitForTimeout(2000);
  return authOutcome(page, 'signup');
}

// Makes sure the browser profile is signed in. Returns true when it is.
async function ensureAccount(page, submission, directory, product) {
  if (!(await needsLogin(page))) return true;
  const cred = credentialFor(directory);
  if (!cred) {
    log(submission, `${directory.name} needs an account. Save your launch email and password on the Dashboard, then press Continue.`, 'needs_human');
    return false;
  }
  const backTo = page.url();
  log(submission, `Signing in to ${directory.name} as ${cred.email}`);
  if (!(await hasVisiblePassword(page)) && !(await firstVisible(page, EMAIL_SELECTORS))) {
    if (directory.loginUrl) await goto(page, directory.loginUrl);
    else await clickLink(page, LOGIN_RE);
  }
  const filled = await fillCredentials(page, cred, { signup: false, product });
  let outcome = filled === 'no-form' ? 'no_form' : filled === 'captcha' ? 'captcha' : await authOutcome(page, 'login');

  if (outcome === 'no_account' || (outcome === 'unclear' && !cred.directoryId)) {
    log(submission, `No ${directory.name} account for ${cred.email} yet. Creating one with your launch email and password.`);
    outcome = await signUp(page, cred, directory, product);
    if (outcome === 'ok') {
      db.update('submissions', submission.id, { accountStatus: 'created', accountEmail: cred.email });
      log(submission, `Created your ${directory.name} account.`);
    }
  }

  const stop = (message, extra = {}) => {
    db.update('submissions', submission.id, extra);
    log(submission, message, 'needs_human');
    return false;
  };
  switch (outcome) {
    case 'ok':
      db.update('submissions', submission.id, { accountEmail: cred.email, accountStatus: submission.accountStatus === 'created' ? 'created' : 'signed_in', needsPassword: false });
      if (page.url() !== backTo) await goto(page, backTo);
      return true;
    case 'captcha':
      return stop(`${directory.name} shows a CAPTCHA. Solve it in the window, then press Continue.`);
    case 'verify_email':
      return stop(`${directory.name} sent a verification email to ${cred.email}. Click the link in that email, then press Continue.`, { accountStatus: 'verify_email', accountEmail: cred.email });
    case 'exists':
    case 'wrong_password':
      return stop(`You already have an account on ${directory.name} for ${cred.email}, with a different password. Enter that password below and press Continue.`, { needsPassword: true, accountEmail: cred.email });
    case 'no_form':
      return stop(`${directory.name} only offers Google/GitHub sign-in or an unusual login page. Sign in once in the window (it stays signed in), then press Continue.`);
    default:
      return stop(`Couldn't confirm the sign-in on ${directory.name}. Check the window, sign in if needed, then press Continue.`);
  }
}

function productSlug(product) {
  return String(product.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// After submitting: the listing's own link if the site shows one, and a screenshot.
async function captureResult(page, submission, product, submitUrl) {
  await page.waitForTimeout(3000);
  let file = `${submission.id}-${Date.now()}.png`;
  if (isHosted()) {
    file = `${submission.id}-${Date.now()}.jpg`;
    const buf = await page.screenshot({ type: 'jpeg', quality: 55, fullPage: false }).catch(() => null);
    if (buf) await setJson(`lp:screen:${db.currentUserId()}:${file}`, buf.toString('base64')).catch(() => {});
  } else {
    const dir = path.join(db.DATA_DIR, 'screens');
    fs.mkdirSync(dir, { recursive: true });
    await page.screenshot({ path: path.join(dir, file), fullPage: false }).catch(() => {});
  }
  const slug = productSlug(product);
  const name = String(product.name || '').toLowerCase();
  const found = await page.evaluate(({ slug, name }) => {
    const links = [...document.querySelectorAll('a[href]')].map((a) => ({ href: a.href, text: (a.innerText || '').trim().toLowerCase() }));
    const same = links.filter((l) => l.href.startsWith(location.origin));
    const hit = same.find((l) => slug && l.href.toLowerCase().includes(slug)) || same.find((l) => name && l.text.includes(name) && !/edit|delete/.test(l.text));
    // Read the main content line by line so menus don't end up in the message.
    const root = document.querySelector('main, [role="main"], article') || document.body;
    const lines = (root?.innerText || '').split(/\n+|(?<=[.!?])\s+/).map((l) => l.trim()).filter(Boolean);
    const confirm = lines.filter((l) => /thank|submitted|received|under review|pending|approved|live|published|success/i.test(l)).slice(0, 2).join(' ');
    return { link: hit?.href || '', confirm: confirm.slice(0, 240) };
  }, { slug, name }).catch(() => ({ link: '', confirm: '' }));
  const current = page.url();
  const moved = current !== submitUrl && !/submit|new|add|create|login|signin/i.test(new URL(current).pathname);
  const listingUrl = found.link || (moved ? current : '');
  db.update('submissions', submission.id, { listingUrl, confirmation: found.confirm, screenshot: file, submittedAt: db.now() });
  return { listingUrl, confirm: found.confirm };
}

export async function autopilot(submissionId, opts = {}) {
  const first = db.get('submissions', submissionId);
  if (!first) throw new Error('Submission not found');
  const slug = db.get('directories', first.directoryId).slug;
  if (isHosted() && first.bbSessionId) {
    // The person finished in the live view: release that session so the
    // sign-in is saved to the site's context, then carry on in a fresh one.
    await releaseBrowserbaseSession(first.bbSessionId);
    db.update('submissions', submissionId, { bbSessionId: null, liveViewUrl: null });
    await new Promise((r) => setTimeout(r, 4000));
  }
  try {
    return await runAutopilot(submissionId, opts);
  } finally {
    if (isHosted()) await finishHostedSession(slug, submissionId).catch(() => {});
  }
}

async function runAutopilot(submissionId, { autoSubmit = true } = {}) {
  let submission = db.get('submissions', submissionId);
  const directory = db.get('directories', submission.directoryId);
  const product = db.get('products', submission.productId);
  const ctx = await contextFor(directory.slug);
  const page = await newPage(ctx);
  await page.bringToFront().catch(() => {});
  log(submission, `Autopilot started on ${directory.name}`, 'running');

  let submitUrl = await openSubmitPage(page, submission, directory);
  if (!(await ensureAccount(page, submission, directory, product))) return db.get('submissions', submissionId);

  // Signed in: the submit page may only appear now.
  submission = db.get('submissions', submissionId);
  if (submitUrl === directory.url || submission.submitUrl !== submitUrl) {
    submitUrl = await openSubmitPage(page, submission, directory);
  } else if (!page.url().startsWith(submitUrl)) {
    await goto(page, submitUrl);
  }
  if (await needsLogin(page)) {
    if (!(await ensureAccount(page, submission, directory, product))) return db.get('submissions', submissionId);
    await goto(page, submitUrl);
  }

  let state = await pageState(page);
  if (!state.fields.length) {
    log(submission, `Couldn't find a submission form on ${page.url()}. Open the right page in the window (or set the submit URL), then press Continue.`, 'needs_human');
    return db.get('submissions', submissionId);
  }

  // Map the live form and write the listing for exactly these fields.
  let fields = guessRoles(state.fields);
  if (aiConfigured()) {
    const analysis = await analyzeSubmitPage(page.url(), { ...state, finalUrl: page.url() });
    const roles = new Map(analysis.fields.map((f) => [f.fid, f]));
    fields = fields.map((f) => (roles.has(f.fid) ? { ...f, role: roles.get(f.fid).role, maxChars: roles.get(f.fid).maxChars || f.maxLength || 0, guidance: roles.get(f.fid).guidance } : f));
  }
  const sameForm = submission.fields?.length === fields.length && submission.fields.every((f, i) => f.selector === fields[i].selector);
  let values = sameForm ? submission.values || {} : {};
  if (aiConfigured() && (!sameForm || !Object.keys(values).length)) {
    log(submission, 'Writing the listing for this form with Claude…');
    const result = await writeListing(product, directory, fields);
    const byFid = new Map(fields.map((f) => [f.fid, f]));
    const kit = [...new Map(result.fields.map((f) => [f.key, f])).values()].map((f) => ({ ...f, label: byFid.get(f.key)?.label || byFid.get(f.key)?.placeholder || f.label }));
    values = Object.fromEntries(kit.filter((f) => byFid.has(f.key)).map((f) => [f.key, f.value]));
    db.update('submissions', submission.id, { kit, checklist: result.checklist, notes: result.notes, styleIssues: result.styleIssues, writtenAt: db.now() });
  }
  submission = db.update('submissions', submission.id, { fields, values, analyzedAt: db.now(), submitUrl: page.url() });

  const result = await runSubmission(submissionId, { autoSubmit, page });
  if (result.status === 'submitted') {
    const out = await captureResult(page, result, product, submitUrl);
    const fresh = db.get('submissions', submissionId);
    log(fresh, out.listingUrl
      ? `Submitted. Listing link: ${out.listingUrl}${out.confirm ? ` (the site says: "${out.confirm}")` : ''}`
      : `Submitted.${out.confirm ? ` The site says: "${out.confirm}".` : ''} No listing link yet; most directories publish it after review. A screenshot of the confirmation is saved.`);
  }
  return db.get('submissions', submissionId);
}

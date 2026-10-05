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
import { chromium } from 'playwright';
import * as db from './db.js';
import { decrypt } from './vault.js';
import { launchOptions, readPage, inspectPage, guessRoles } from './inspect.js';
import { aiConfigured, analyzeSubmitPage } from './ai.js';

const contexts = new Map(); // slug -> BrowserContext
const headless = () => String(process.env.LAUNCHPILOT_HEADLESS || 'false') === 'true';

async function contextFor(slug) {
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
  await Promise.all([...contexts.values()].map((c) => c.close().catch(() => {})));
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

async function fillField(page, field, value, product) {
  const loc = page.locator(field.selector).first();
  if (!(await loc.count())) return false;
  if (field.type === 'file') {
    const file = field.role === 'logo' ? product.logoPath : (product.screenshotPaths || [])[0];
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
  const page = await newPage(ctx);
  await page.bringToFront().catch(() => {});

  log(submission, `Opening ${directory.name}`, 'running');
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

  await goto(page, submitUrl);
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
  const ctx = await contextFor(directory.slug);
  const page = await newPage(ctx);
  await goto(page, url || directory.url);
  await page.bringToFront().catch(() => {});
}

// Reads a page using the platform's logged-in browser profile, for submit
// forms that only appear after login.
export async function inspectLoggedIn(directory, url) {
  return inspectPage(url, { context: await contextFor(directory.slug) });
}

export function hasProfile(directory) {
  return contexts.has(directory.slug) || fs.existsSync(path.join(db.DATA_DIR, 'browser-profiles', directory.slug));
}

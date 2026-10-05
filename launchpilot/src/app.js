// The LaunchPilot web app (Express). Runs two ways:
//   Desktop: src/server.js listens on your computer; data in data/db.json.
//   Hosted:  api/index.js on Vercel; every visitor signs up, and each account's
//            data lives in its own document in the key-value store.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import express from 'express';
import * as db from './db.js';
import * as vault from './vault.js';
import * as ai from './ai.js';
import * as auth from './auth.js';
import { inspectPage, checkUrl, guessRoles } from './inspect.js';
import * as automation from './automation.js';
import { crawlSite, crawlToText } from './crawl.js';
import { crawlSiteFetch } from './crawl-fetch.js';
import { isHosted, hasBrowserbase, assertPublicUrl } from './browser.js';
import { getJson, setJson, incrWithTtl, storeConfigured } from './store.js';
import { runDueJobs } from './scheduler.js';
import { CATEGORIES } from './catalog.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const HOSTED = isHosted();
const APP_PASSWORD = process.env.LAUNCHPILOT_APP_PASSWORD || '';
const DAILY_AI_LIMIT = Number(process.env.LAUNCHPILOT_DAILY_AI_LIMIT || 150);

export const app = express();
app.use(express.json({ limit: '15mb' }));

const wrap = (fn) => (req, res) => Promise.resolve(fn(req, res)).catch((e) => {
  if (!e.status || e.status >= 500) console.error(e);
  if (!res.headersSent) res.status(e.status || 500).json({ error: e.message });
});

// --- Auth ---------------------------------------------------------------------
if (HOSTED) {
  // Accounts for anyone who signs up. Each request then runs with that
  // person's own data loaded, and saves what it changed before replying.
  app.get('/api/auth/me', wrap(async (req, res) => {
    const userId = auth.readSession(req);
    res.json(userId ? { email: await auth.emailFor(userId), hosted: true, inviteOnly: Boolean(process.env.LAUNCHPILOT_INVITE_CODE) } : { email: null, hosted: true, inviteOnly: Boolean(process.env.LAUNCHPILOT_INVITE_CODE) });
  }));
  app.post('/api/auth/signup', wrap(async (req, res) => {
    const out = await auth.signup(req, res);
    res.json(out);
  }));
  app.post('/api/auth/login', wrap(async (req, res) => res.json(await auth.login(req, res))));
  app.post('/api/auth/logout', (req, res) => { auth.logout(res); res.json({ ok: true }); });

  // Vercel Cron: runs scheduled launches for every account that has one due.
  app.get('/api/cron/run', wrap(async (req, res) => {
    if (!process.env.CRON_SECRET || req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) return res.status(401).json({ error: 'auth' });
    const users = (await getJson('lp:scheduled-users')) || [];
    const still = [];
    for (const userId of users) {
      const left = await db.withUser(userId, async () => {
        await runDueJobs();
        await automation.closeAll();
        return db.all('jobs').some((j) => j.status === 'scheduled');
      });
      if (left) still.push(userId);
    }
    await setJson('lp:scheduled-users', still);
    res.json({ users: users.length });
  }));

  app.use('/api', (req, res, next) => {
    if (!storeConfigured()) return res.status(500).json({ error: 'Storage is not set up on the server. Add Upstash Redis to this Vercel project.' });
    const userId = auth.readSession(req);
    if (!userId) return res.status(401).json({ error: 'auth' });
    req.userId = userId;
    db.withUser(userId, () => new Promise((resolve) => {
      // Hold the reply until browser sessions are closed (which saves site
      // sign-ins) and this request's changes are written.
      const end = res.end.bind(res);
      res.end = (...args) => {
        res.end = end;
        automation.closeAll().catch(() => {}).finally(() => resolve(args));
      };
      next();
    })).then((args) => res.end(...args)).catch((e) => {
      console.error(e);
      if (!res.headersSent) res.status(500).json({ error: e.message });
      else res.end();
    });
  });

  // A daily cap on Claude and browser work per account, so one person can't run up the bill.
  const metered = /^\/(products\/autofill|products\/[^/]+\/plan|directories\/(from-url|discover)|submissions\/[^/]+\/(analyze|write|autopilot|run|find-listing))$/;
  app.use('/api', (req, res, next) => {
    if (req.method !== 'POST' || !metered.test(req.path)) return next();
    incrWithTtl(`lp:quota:${req.userId}:${new Date().toISOString().slice(0, 10)}`, 86400).then((n) => {
      if (n > DAILY_AI_LIMIT) return res.status(429).json({ error: `Daily limit reached (${DAILY_AI_LIMIT} AI and browser actions). It resets at midnight UTC.` });
      next();
    }, next);
  });
} else {
  // Desktop: optional single password (only needed when exposed on a network).
  const sessions = new Set();
  const cookieToken = (req) => (req.headers.cookie || '').split(/;\s*/).find((c) => c.startsWith('lp_session='))?.slice(11);

  app.post('/api/login', (req, res) => {
    const given = Buffer.from(String(req.body.password || ''));
    const expected = Buffer.from(APP_PASSWORD);
    if (!APP_PASSWORD || (given.length === expected.length && crypto.timingSafeEqual(given, expected))) {
      const token = crypto.randomBytes(24).toString('hex');
      sessions.add(token);
      res.setHeader('Set-Cookie', `lp_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=2592000`);
      return res.json({ ok: true });
    }
    res.status(401).json({ error: 'Wrong password' });
  });

  app.use('/api', (req, res, next) => {
    if (!APP_PASSWORD || sessions.has(cookieToken(req))) return next();
    res.status(401).json({ error: 'auth' });
  });
}

function notFound(what) {
  const e = new Error(`${what} not found`);
  e.status = 404;
  return e;
}

function normalizeUrl(u) {
  const s = String(u || '').trim();
  if (!s) throw Object.assign(new Error('URL is required'), { status: 400 });
  const url = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
  return url.toString();
}

// A user-supplied link, checked so the hosted server never opens internal addresses.
async function publicUrl(u) {
  const url = normalizeUrl(u);
  await assertPublicUrl(url);
  return url;
}

function slugify(s) {
  return String(s).toLowerCase().replace(/^https?:\/\/(www\.)?/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
}

// --- Status -------------------------------------------------------------------
app.get('/api/status', (req, res) => {
  res.json({
    aiConfigured: ai.aiConfigured(),
    hosted: HOSTED,
    liveBrowser: HOSTED ? hasBrowserbase() : true,
    dailyLimit: HOSTED ? DAILY_AI_LIMIT : null,
    model: process.env.LAUNCHPILOT_MODEL || 'claude-opus-5-5',
    headless: String(process.env.LAUNCHPILOT_HEADLESS || 'false') === 'true',
    categories: CATEGORIES,
    counts: {
      products: db.all('products').length,
      directories: db.all('directories').length,
      submissions: db.all('submissions').length,
      live: db.all('submissions').filter((s) => s.status === 'live').length,
    },
  });
});

app.get('/api/activity', (req, res) => res.json(db.all('activity').slice(0, 100)));

// --- Products -----------------------------------------------------------------
const PRODUCT_FIELDS = ['name', 'url', 'tagline', 'shortDescription', 'longDescription', 'categories', 'tags', 'pricing', 'pricingDetails',
  'features', 'useCases', 'audience', 'competitors', 'makerName', 'makerEmail', 'companyName', 'twitter', 'linkedin', 'github', 'videoUrl',
  'logoPath', 'screenshotPaths', 'country', 'foundedYear', 'factSheet', 'crawledPages', 'crawledAt'];
const pick = (obj, keys) => Object.fromEntries(keys.filter((k) => obj[k] !== undefined).map((k) => [k, obj[k]]));

app.get('/api/products', (req, res) => res.json(db.all('products')));
app.post('/api/products', (req, res) => res.json(db.insert('products', pick(req.body, PRODUCT_FIELDS))));
app.patch('/api/products/:id', wrap((req, res) => {
  const row = db.update('products', req.params.id, pick(req.body, PRODUCT_FIELDS));
  if (!row) throw notFound('Product');
  res.json(row);
}));
app.delete('/api/products/:id', (req, res) => {
  db.all('submissions').filter((s) => s.productId === req.params.id).forEach((s) => db.remove('submissions', s.id));
  res.json({ ok: db.remove('products', req.params.id) });
});

// Crawls the product's whole website, then writes a fact sheet and a draft
// profile. Runs in the background; the UI polls /api/crawls/:id for progress.
const crawls = new Map();

app.post('/api/products/autofill', wrap(async (req, res) => {
  const url = await publicUrl(req.body.url);
  if (!ai.aiConfigured()) throw Object.assign(new Error('Crawling and fact sheets need ANTHROPIC_API_KEY in .env.'), { status: 400 });
  if (HOSTED) {
    // Hosted: one request does the whole job (HTTP crawl, then the fact sheet).
    const crawl = await crawlSiteFetch(url, { maxPages: Math.min(Math.max(Number(req.body.maxPages) || 60, 5), 100), budgetMs: 110000 });
    if (!crawl.pages.length) throw Object.assign(new Error('No readable pages found. Check the URL, or the site may block crawlers.'), { status: 400 });
    const profile = await ai.buildFactSheet(url, crawlToText(crawl), crawl.pages.length);
    db.logActivity(`Crawled ${crawl.pages.length} pages of ${url} and wrote a fact sheet`);
    return res.json({
      id: null, status: 'done', done: crawl.pages.length, total: crawl.pages.length,
      result: { ...profile, url, crawledPages: crawl.pages.map((p) => ({ url: p.url, title: p.title })), sitemapUrls: crawl.siteMap?.total || 0, crawledAt: db.now() },
    });
  }
  const maxPages = Math.min(Math.max(Number(req.body.maxPages) || 60, 5), 150);
  const id = db.newId();
  const job = { id, url, status: 'crawling', done: 0, total: maxPages, current: '', startedAt: db.now() };
  crawls.set(id, job);
  (async () => {
    try {
      const crawl = await crawlSite(url, { maxPages, onProgress: (p) => { if (p.phase === 'page') Object.assign(job, { done: p.done, current: p.url }); } });
      if (!crawl.pages.length) throw new Error('No readable pages found. Check the URL, or the site may block crawlers.');
      Object.assign(job, { status: 'writing', done: crawl.pages.length, current: '', sitemapUrls: crawl.siteMap?.total || 0 });
      const profile = await ai.buildFactSheet(url, crawlToText(crawl), crawl.pages.length);
      Object.assign(job, {
        status: 'done',
        result: { ...profile, url, crawledPages: crawl.pages.map((p) => ({ url: p.url, title: p.title })), sitemapUrls: crawl.siteMap?.total || 0, crawledAt: db.now() },
      });
      db.logActivity(`Crawled ${crawl.pages.length} pages of ${url} and wrote a fact sheet`);
    } catch (e) {
      Object.assign(job, { status: 'failed', error: e.message });
    }
  })();
  res.json({ id });
}));

app.get('/api/crawls/:id', (req, res) => {
  const job = crawls.get(req.params.id);
  if (!job) return res.status(404).json({ error: 'Crawl not found' });
  res.json(job);
});

// Uploads: { productId, kind: 'logo'|'screenshot', filename, dataBase64 }
app.post('/api/uploads', wrap(async (req, res) => {
  const product = db.get('products', req.body.productId);
  if (!product) throw notFound('Product');
  const ext = path.extname(String(req.body.filename || '')).toLowerCase();
  if (!['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'].includes(ext)) throw Object.assign(new Error('Images only'), { status: 400 });
  if (HOSTED) {
    // Hosted: images are kept in the store ("kv:" paths); automation copies them to disk when a form needs them.
    const data = String(req.body.dataBase64).replace(/^data:[^,]+,/, '');
    if (data.length > 4_000_000) throw Object.assign(new Error('Use an image under 3 MB.'), { status: 400 });
    const name = `${req.body.kind === 'logo' ? 'logo' : 'screenshot'}-${Date.now()}${ext}`;
    await setJson(`lp:upload:${req.userId}:${product.id}:${name}`, data);
    const ref = `kv:${product.id}/${name}`;
    const patch = req.body.kind === 'logo' ? { logoPath: ref } : { screenshotPaths: [...(product.screenshotPaths || []), ref] };
    return res.json(db.update('products', product.id, patch));
  }
  const dir = path.join(db.DATA_DIR, 'uploads', product.id);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${req.body.kind}-${Date.now()}${ext}`);
  fs.writeFileSync(file, Buffer.from(String(req.body.dataBase64).replace(/^data:[^,]+,/, ''), 'base64'));
  const patch = req.body.kind === 'logo' ? { logoPath: file } : { screenshotPaths: [...(product.screenshotPaths || []), file] };
  res.json(db.update('products', product.id, patch));
}));

app.get('/api/uploads/:productId/:file', wrap(async (req, res) => {
  if (HOSTED) {
    const data = await getJson(`lp:upload:${req.userId}:${path.basename(req.params.productId)}:${path.basename(req.params.file)}`);
    if (!data) return res.status(404).end();
    res.type(path.extname(req.params.file)).send(Buffer.from(data, 'base64'));
    return;
  }
  const file = path.join(db.DATA_DIR, 'uploads', path.basename(req.params.productId), path.basename(req.params.file));
  if (!fs.existsSync(file)) return res.status(404).end();
  res.sendFile(file);
}));

// --- Directories --------------------------------------------------------------
const DIRECTORY_FIELDS = ['name', 'url', 'submitUrl', 'signupUrl', 'loginUrl', 'category', 'pricing', 'tier', 'launch', 'manualOnly', 'launchTips', 'notes', 'hidden'];

app.get('/api/directories', (req, res) => res.json(db.all('directories')));

app.patch('/api/directories/:id', wrap((req, res) => {
  const row = db.update('directories', req.params.id, { ...pick(req.body, DIRECTORY_FIELDS), userEdited: true });
  if (!row) throw notFound('Directory');
  res.json(row);
}));

app.delete('/api/directories/:id', (req, res) => res.json({ ok: db.remove('directories', req.params.id) }));

// Add any listing site by URL: the agent opens it, finds the submit form and
// works out what each field means.
app.post('/api/directories/from-url', wrap(async (req, res) => {
  let url = await publicUrl(req.body.url);
  let page = await inspectPage(url);
  let analysis = ai.aiConfigured() ? await ai.analyzeSubmitPage(url, page) : null;
  if (analysis && !analysis.isSubmissionForm && analysis.betterSubmitUrl) {
    url = await publicUrl(analysis.betterSubmitUrl);
    page = await inspectPage(url);
    analysis = await ai.analyzeSubmitPage(url, page);
  }
  const home = new URL(url).origin;
  const slug = slugify(new URL(url).hostname);
  const existing = db.find('directories', (d) => d.slug === slug);
  const record = {
    slug,
    name: analysis?.name || page.title || new URL(url).hostname,
    url: home,
    submitUrl: url,
    category: analysis?.category || 'startup',
    pricing: analysis?.pricing || 'unknown',
    tier: 2,
    launch: analysis?.category === 'launch',
    manualOnly: false,
    launchTips: analysis?.launchTips || analysis?.summary || '',
    requiresAccount: analysis?.requiresAccount ?? page.loginWall,
    captcha: page.captcha,
    status: 'ok',
    lastCheckedAt: db.now(),
  };
  const row = existing ? db.update('directories', existing.id, { ...record, userEdited: true }) : db.insert('directories', { ...record, source: 'user' });
  db.logActivity(`Added listing site ${row.name}`);
  res.json(row);
}));

// Checks every (or selected) directory link and records whether it's alive.
app.post('/api/directories/check', wrap(async (req, res) => {
  const ids = req.body.ids;
  const targets = db.all('directories').filter((d) => !ids || ids.includes(d.id));
  const queue = [...targets];
  const workers = Array.from({ length: HOSTED ? 12 : 8 }, async () => {
    for (let d = queue.shift(); d; d = queue.shift()) {
      const r = await checkUrl(d.submitUrl || d.url);
      db.update('directories', d.id, { status: r.ok ? 'ok' : 'dead', httpStatus: r.status, lastCheckedAt: db.now() });
    }
  });
  await Promise.all(workers);
  db.logActivity(`Checked ${targets.length} listing sites`);
  res.json(db.all('directories'));
}));

// Searches the web for new directories and adds them (marked "AI found").
app.post('/api/directories/discover', wrap(async (req, res) => {
  const existing = db.all('directories').map((d) => new URL(d.url).hostname.replace(/^www\./, ''));
  const found = await ai.discoverDirectories({ existing, focus: req.body.focus });
  const added = [];
  for (const item of found) {
    try {
      const url = normalizeUrl(item.url);
      const host = new URL(url).hostname.replace(/^www\./, '');
      if (existing.includes(host)) continue;
      existing.push(host);
      added.push(db.insert('directories', {
        slug: slugify(host),
        name: String(item.name || host).slice(0, 80),
        url,
        submitUrl: item.submitUrl ? normalizeUrl(item.submitUrl) : url,
        category: CATEGORIES[item.category] ? item.category : 'startup',
        pricing: ['free', 'freemium', 'paid'].includes(item.pricing) ? item.pricing : 'unknown',
        tier: [1, 2, 3].includes(Number(item.tier)) ? Number(item.tier) : 3,
        launch: item.category === 'launch',
        manualOnly: false,
        launchTips: String(item.launchTips || '').slice(0, 300),
        source: 'ai',
        status: 'unchecked',
      }));
    } catch {
      // Skip malformed entries.
    }
  }
  db.setSettings({ lastDiscoveryAt: db.now() });
  db.logActivity(`AI discovery added ${added.length} new listing sites`);
  res.json({ added });
}));

// --- Credentials vault --------------------------------------------------------
const publicCred = (c) => ({ id: c.id, label: c.label, email: c.email, emailMasked: vault.mask(c.email), domain: c.domain, directoryId: c.directoryId, isDefault: !!c.isDefault, createdAt: c.createdAt });

app.get('/api/credentials', (req, res) => res.json(db.all('credentials').map(publicCred)));
app.post('/api/credentials', wrap((req, res) => {
  const { email, password, directoryId, domain, label, isDefault } = req.body;
  if (!email || !password) throw Object.assign(new Error('Email and password are required'), { status: 400 });
  if (isDefault) db.all('credentials').forEach((c) => c.isDefault && db.update('credentials', c.id, { isDefault: false }));
  const row = db.insert('credentials', {
    email: String(email).trim(),
    passwordEnc: vault.encrypt(password),
    directoryId: directoryId || null,
    domain: domain ? String(domain).replace(/^https?:\/\//, '').replace(/\/.*$/, '') : null,
    label: label || '',
    isDefault: !!isDefault,
  });
  res.json(publicCred(row));
}));
app.delete('/api/credentials/:id', (req, res) => res.json({ ok: db.remove('credentials', req.params.id) }));

// --- Submissions --------------------------------------------------------------
const STATUSES = ['draft', 'written', 'running', 'needs_human', 'ready_for_review', 'scheduled', 'submitted', 'live', 'rejected', 'skipped'];

app.get('/api/submissions', (req, res) => {
  res.json(db.all('submissions').filter((s) => !req.query.productId || s.productId === req.query.productId));
});

app.post('/api/submissions', wrap((req, res) => {
  const { productId, directoryIds } = req.body;
  if (!db.get('products', productId)) throw notFound('Product');
  const created = [];
  for (const directoryId of directoryIds || []) {
    if (!db.get('directories', directoryId)) continue;
    const dup = db.find('submissions', (s) => s.productId === productId && s.directoryId === directoryId);
    created.push(dup || db.insert('submissions', { productId, directoryId, status: 'draft', values: {}, kit: [], fields: [], log: [] }));
  }
  res.json(created);
}));

function loadSubmission(id) {
  const s = db.get('submissions', id);
  if (!s) throw notFound('Submission');
  return { s, product: db.get('products', s.productId), directory: db.get('directories', s.directoryId) };
}

// Opens the submit page and maps its form fields to roles.
app.post('/api/submissions/:id/analyze', wrap(async (req, res) => {
  const { s, directory } = loadSubmission(req.params.id);
  const url = s.submitUrl || directory.submitUrl;
  // Use the logged-in browser profile once the user has opened this platform,
  // so forms behind a login are visible.
  const page = HOSTED || automation.hasProfile(directory) ? await automation.inspectLoggedIn(directory, url) : await inspectPage(url);
  let fields = guessRoles(page.fields);
  let analysis = { isSubmissionForm: true, requiresAccount: false, betterSubmitUrl: '', launchTips: '' };
  if (ai.aiConfigured()) {
    analysis = await ai.analyzeSubmitPage(url, page);
    const roles = new Map(analysis.fields.map((f) => [f.fid, f]));
    fields = fields.map((f) => (roles.has(f.fid) ? { ...f, role: roles.get(f.fid).role, maxChars: roles.get(f.fid).maxChars || f.maxLength || 0, guidance: roles.get(f.fid).guidance } : f));
  }
  const patch = { fields, analyzedAt: db.now(), requiresAccount: analysis.requiresAccount || page.loginWall, captcha: page.captcha };
  if (!analysis.isSubmissionForm && analysis.betterSubmitUrl) patch.suggestedSubmitUrl = analysis.betterSubmitUrl;
  if (analysis.launchTips && !directory.launchTips) db.update('directories', directory.id, { launchTips: analysis.launchTips });
  const note = page.loginWall
    ? 'The submit page is behind a login, so only the login form is visible. Save a login in Vault and press "Fill in browser"; after logging in, re-analyze to capture the real form.'
    : `Found ${fields.length} form fields.`;
  db.logActivity(`Analyzed ${directory.name}: ${note}`, { submissionId: s.id });
  res.json({ ...db.update('submissions', s.id, patch), note });
}));

// Writes the listing copy for this platform.
app.post('/api/submissions/:id/write', wrap(async (req, res) => {
  const { s, product, directory } = loadSubmission(req.params.id);
  if (!ai.aiConfigured()) throw Object.assign(new Error('AI writing needs ANTHROPIC_API_KEY. Without it, "Fill in browser" still fills fields straight from your product profile.'), { status: 400 });
  const result = await ai.writeListing(product, directory, s.fields || []);
  // One entry per field: if a key comes back twice, keep the last version.
  result.fields = [...new Map(result.fields.map((f) => [f.key, f])).values()];
  const byFid = new Map((s.fields || []).map((f) => [f.fid, f]));
  const values = { ...s.values };
  for (const f of result.fields) {
    const field = byFid.get(f.key);
    if (!field) continue;
    values[f.key] = f.value;
    // Show the form's own label ("Tool name"), never the internal field id.
    f.label = field.label || field.placeholder || field.name || f.label;
  }
  const row = db.update('submissions', s.id, {
    kit: result.fields, values, checklist: result.checklist, notes: result.notes, styleIssues: result.styleIssues,
    status: ['draft', 'written'].includes(s.status) ? 'written' : s.status, writtenAt: db.now(),
  });
  db.logActivity(`Wrote listing for ${directory.name}`, { submissionId: s.id });
  res.json(row);
}));

app.patch('/api/submissions/:id', wrap((req, res) => {
  const { s } = loadSubmission(req.params.id);
  const patch = pick(req.body, ['values', 'kit', 'liveUrl', 'listingUrl', 'notes', 'submitUrl', 'launchAt']);
  if (req.body.status) {
    if (!STATUSES.includes(req.body.status)) throw Object.assign(new Error('Bad status'), { status: 400 });
    patch.status = req.body.status;
    if (req.body.status === 'submitted' && !s.submittedAt) patch.submittedAt = db.now();
    if (req.body.status === 'live' && !s.liveAt) patch.liveAt = db.now();
  }
  res.json(db.update('submissions', s.id, patch));
}));

app.delete('/api/submissions/:id', (req, res) => {
  db.all('jobs').filter((j) => j.submissionId === req.params.id).forEach((j) => db.remove('jobs', j.id));
  res.json({ ok: db.remove('submissions', req.params.id) });
});

// Opens the browser and fills everything in (login/signup if needed).
app.post('/api/submissions/:id/run', wrap(async (req, res) => {
  const { s } = loadSubmission(req.params.id);
  const row = await automation.runSubmission(s.id, { autoSubmit: !!req.body.autoSubmit, createAccount: !!req.body.createAccount });
  res.json(row);
}));

// Autopilot for one site: account, listing, submit, link.
app.post('/api/submissions/:id/autopilot', wrap(async (req, res) => {
  const { s } = loadSubmission(req.params.id);
  res.json(await automation.autopilot(s.id, { autoSubmit: req.body.autoSubmit !== false }));
}));

// The site's own password, when your launch password doesn't work there.
app.post('/api/submissions/:id/password', wrap((req, res) => {
  const { s, directory } = loadSubmission(req.params.id);
  const def = db.find('credentials', (c) => c.isDefault);
  const email = String(req.body.email || s.accountEmail || def?.email || '').trim();
  if (!email || !req.body.password) throw Object.assign(new Error('Enter the password'), { status: 400 });
  db.all('credentials').filter((c) => c.directoryId === directory.id).forEach((c) => db.remove('credentials', c.id));
  db.insert('credentials', { email, passwordEnc: vault.encrypt(req.body.password), directoryId: directory.id, domain: null, label: `${directory.name} password`, isDefault: false });
  res.json(db.update('submissions', s.id, { needsPassword: false }));
}));

// Runs autopilot on many sites, one after another, in the background.
const autopilotRun = { running: false, queue: [], current: null, done: [], startedAt: null };
app.get('/api/autopilot/status', (req, res) => res.json(autopilotRun));
app.post('/api/autopilot/run', wrap((req, res) => {
  // Hosted runs one site per request; the page steps through the list.
  if (HOSTED) throw Object.assign(new Error('Run sites one at a time with /api/submissions/:id/autopilot.'), { status: 400 });
  if (autopilotRun.running) throw Object.assign(new Error('Autopilot is already running'), { status: 409 });
  const ids = (req.body.ids || []).filter((id) => db.get('submissions', id));
  if (!ids.length) throw Object.assign(new Error('Pick at least one site'), { status: 400 });
  Object.assign(autopilotRun, { running: true, queue: [...ids], current: null, done: [], startedAt: db.now() });
  (async () => {
    while (autopilotRun.queue.length) {
      const id = autopilotRun.queue.shift();
      autopilotRun.current = id;
      try {
        const r = await automation.autopilot(id, { autoSubmit: req.body.autoSubmit !== false });
        autopilotRun.done.push({ id, status: r.status, listingUrl: r.listingUrl || '', message: (r.log || []).slice(-1)[0]?.message || '' });
      } catch (e) {
        db.update('submissions', id, { status: 'needs_human' });
        autopilotRun.done.push({ id, status: 'error', message: e.message });
      }
    }
    Object.assign(autopilotRun, { running: false, current: null });
    db.logActivity(`Autopilot finished ${autopilotRun.done.length} sites`);
  })();
  res.json(autopilotRun);
}));
app.post('/api/autopilot/stop', (req, res) => { autopilotRun.queue = []; res.json(autopilotRun); });

app.get('/api/screens/:file', wrap(async (req, res) => {
  if (HOSTED) {
    const data = await getJson(`lp:screen:${req.userId}:${path.basename(req.params.file)}`);
    if (!data) return res.status(404).end();
    res.type('jpeg').send(Buffer.from(data, 'base64'));
    return;
  }
  const file = path.join(db.DATA_DIR, 'screens', path.basename(req.params.file));
  if (!fs.existsSync(file)) return res.status(404).end();
  res.sendFile(file);
}));

// Your launch account: one email and password used on every site.
app.get('/api/account', (req, res) => {
  const c = db.find('credentials', (x) => x.isDefault);
  res.json(c ? { email: c.email, emailMasked: vault.mask(c.email), id: c.id } : null);
});
app.post('/api/account', wrap((req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw Object.assign(new Error('Enter your email and password'), { status: 400 });
  db.all('credentials').filter((c) => c.isDefault).forEach((c) => db.remove('credentials', c.id));
  db.insert('credentials', { email: String(email).trim(), passwordEnc: vault.encrypt(password), directoryId: null, domain: null, label: 'Launch account', isDefault: true });
  res.json({ ok: true });
}));

app.post('/api/submissions/:id/open', wrap(async (req, res) => {
  const { s, directory } = loadSubmission(req.params.id);
  const out = await automation.openWindow(directory, req.body.url || s.submitUrl || directory.submitUrl);
  if (out?.liveViewUrl) db.update('submissions', s.id, { liveViewUrl: out.liveViewUrl });
  res.json({ ok: true, ...out });
}));

// Finds the live listing page for a submission: searches the directory's site
// with Claude, then opens the page and checks it really mentions the product.
app.post('/api/submissions/:id/find-listing', wrap(async (req, res) => {
  const { s, product, directory } = loadSubmission(req.params.id);
  if (!ai.aiConfigured()) throw Object.assign(new Error('Finding listings needs ANTHROPIC_API_KEY on the server.'), { status: 400 });
  const candidates = [s.listingUrl, s.liveUrl].filter(Boolean);
  const found = await ai.findListing(product, directory);
  if (found.url) candidates.unshift(found.url);
  const checks = new Map();
  for (const url of [...new Set(candidates)]) {
    checks.set(url, await listingMentions(url, product));
    if (checks.get(url) === 'yes') {
      const row = db.update('submissions', s.id, { listingUrl: url, liveUrl: url, status: 'live', liveAt: s.liveAt || db.now(), listingCheckedAt: db.now() });
      db.logActivity(`Found the live listing on ${directory.name}: ${url}`, { submissionId: s.id });
      return res.json({ ...row, found: true, note: `Live: ${url}` });
    }
  }
  // Couldn't read the page (some sites block bots), but the link is clearly this product's page: keep it for you to check.
  const slug = slugify(product.name);
  const likely = found.url && checks.get(found.url) === 'unknown' && slug && new URL(found.url).pathname.toLowerCase().includes(slug);
  const row = db.update('submissions', s.id, { listingCheckedAt: db.now(), ...(likely ? { listingUrl: found.url } : {}) });
  if (likely) return res.json({ ...row, found: true, note: `Probably live: ${found.url} (the site didn't let us read the page, so check it).` });
  const note = found.url
    ? `Found ${found.url}, but the page doesn't mention ${product.name} yet. It may still be in review.`
    : `No live listing for ${product.name} on ${directory.name} yet. ${found.note || 'Most directories publish after review; check again in a few days.'}`;
  res.json({ ...row, found: false, note });
}));

// 'yes' (page is up and names the product), 'no' (missing or about something
// else), or 'unknown' (the site blocked us or timed out).
async function listingMentions(url, product) {
  try {
    await assertPublicUrl(url);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    const r = await fetch(url, { signal: ctrl.signal, headers: { 'user-agent': 'Mozilla/5.0 (compatible; LaunchPilotBot/1.0)' } }).finally(() => clearTimeout(timer));
    if ([401, 403, 429, 503].includes(r.status)) return 'unknown';
    if (!r.ok) return 'no';
    const html = (await r.text()).toLowerCase();
    const host = new URL(product.url).hostname.replace(/^www\./, '');
    return html.includes(String(product.name).toLowerCase()) || html.includes(host) ? 'yes' : 'no';
  } catch {
    return 'unknown';
  }
}

// --- Scheduling ---------------------------------------------------------------
app.get('/api/jobs', (req, res) => res.json(db.all('jobs')));

app.post('/api/submissions/:id/schedule', wrap(async (req, res) => {
  const { s, directory } = loadSubmission(req.params.id);
  const runAt = new Date(req.body.runAt);
  if (Number.isNaN(runAt.getTime())) throw Object.assign(new Error('Pick a valid date and time'), { status: 400 });
  db.all('jobs').filter((j) => j.submissionId === s.id && j.status === 'scheduled').forEach((j) => db.remove('jobs', j.id));
  const type = req.body.type === 'reminder' ? 'reminder' : 'submit';
  const job = db.insert('jobs', {
    type,
    submissionId: s.id,
    runAt: runAt.toISOString(),
    autoSubmit: !!req.body.autoSubmit,
    createAccount: !!req.body.createAccount,
    title: `${type === 'submit' ? 'Submit to' : 'Launch on'} ${directory.name}`,
    status: 'scheduled',
  });
  db.update('submissions', s.id, { launchAt: req.body.launchAt || runAt.toISOString(), status: 'scheduled' });
  if (HOSTED) {
    const users = (await getJson('lp:scheduled-users')) || [];
    if (!users.includes(req.userId)) await setJson('lp:scheduled-users', [...users, req.userId]);
  }
  db.logActivity(`Scheduled ${job.title} for ${runAt.toLocaleString()}`, { submissionId: s.id });
  res.json(job);
}));

app.delete('/api/jobs/:id', (req, res) => res.json({ ok: db.remove('jobs', req.params.id) }));
app.post('/api/jobs/:id/dismiss', (req, res) => res.json(db.update('jobs', req.params.id, { status: 'done' })));

// --- Launch plan & export -----------------------------------------------------
app.post('/api/products/:id/plan', wrap(async (req, res) => {
  const product = db.get('products', req.params.id);
  if (!product) throw notFound('Product');
  const ids = req.body.directoryIds;
  const dirs = db.all('directories').filter((d) => (ids?.length ? ids.includes(d.id) : d.tier <= 2 && d.status !== 'dead' && !d.hidden));
  const plan = await ai.launchPlan(product, dirs, req.body.launchDate);
  res.json(db.update('products', product.id, { plan: { ...plan, launchDate: req.body.launchDate || null, createdAt: db.now() } }));
}));

app.get('/api/export.csv', (req, res) => {
  const rows = [['Product', 'Directory', 'Submit URL', 'Status', 'Submitted', 'Live URL', 'Launch at']];
  for (const s of db.all('submissions')) {
    const p = db.get('products', s.productId);
    const d = db.get('directories', s.directoryId);
    rows.push([p?.name, d?.name, s.submitUrl || d?.submitUrl, s.status, s.submittedAt, s.liveUrl, s.launchAt]);
  }
  const csv = rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="launchpilot-submissions.csv"');
  res.send(csv);
});

// --- Static UI ----------------------------------------------------------------
app.use(express.static(path.join(here, '..', 'public')));

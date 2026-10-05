import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

try {
  process.loadEnvFile('.env');
} catch {
  // No .env file; rely on the real environment.
}

const express = (await import('express')).default;
const db = await import('./db.js');
const vault = await import('./vault.js');
const ai = await import('./ai.js');
const { inspectPage, checkUrl, closeInspector, guessRoles } = await import('./inspect.js');
const automation = await import('./automation.js');
const { crawlSite, crawlToText } = await import('./crawl.js');
const { startScheduler, stopScheduler } = await import('./scheduler.js');
const { CATEGORIES } = await import('./catalog.js');

db.load();

const here = path.dirname(fileURLToPath(import.meta.url));
const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.PORT || 4310);
const APP_PASSWORD = process.env.LAUNCHPILOT_APP_PASSWORD || '';
const isLocal = ['127.0.0.1', 'localhost', '::1'].includes(HOST);

if (!isLocal && !APP_PASSWORD) {
  console.error('Refusing to listen on a public interface without LAUNCHPILOT_APP_PASSWORD. Set it in .env.');
  process.exit(1);
}

const app = express();
app.use(express.json({ limit: '15mb' }));

// --- Auth (only when a password is configured) -------------------------------
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

const wrap = (fn) => (req, res) => Promise.resolve(fn(req, res)).catch((e) => {
  console.error(e);
  res.status(e.status || 500).json({ error: e.message });
});

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

function slugify(s) {
  return String(s).toLowerCase().replace(/^https?:\/\/(www\.)?/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
}

// --- Status -------------------------------------------------------------------
app.get('/api/status', (req, res) => {
  res.json({
    aiConfigured: ai.aiConfigured(),
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
  const url = normalizeUrl(req.body.url);
  if (!ai.aiConfigured()) throw Object.assign(new Error('Crawling and fact sheets need ANTHROPIC_API_KEY in .env.'), { status: 400 });
  const maxPages = Math.min(Math.max(Number(req.body.maxPages) || 40, 5), 80);
  const id = db.newId();
  const job = { id, url, status: 'crawling', done: 0, total: maxPages, current: '', startedAt: db.now() };
  crawls.set(id, job);
  (async () => {
    try {
      const crawl = await crawlSite(url, { maxPages, onProgress: (p) => { if (p.phase === 'page') Object.assign(job, { done: p.done, current: p.url }); } });
      if (!crawl.pages.length) throw new Error('No readable pages found. Check the URL, or the site may block crawlers.');
      Object.assign(job, { status: 'writing', done: crawl.pages.length, current: '' });
      const profile = await ai.buildFactSheet(url, crawlToText(crawl), crawl.pages.length);
      Object.assign(job, {
        status: 'done',
        result: { ...profile, url, crawledPages: crawl.pages.map((p) => ({ url: p.url, title: p.title })), crawledAt: db.now() },
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
  const dir = path.join(db.DATA_DIR, 'uploads', product.id);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${req.body.kind}-${Date.now()}${ext}`);
  fs.writeFileSync(file, Buffer.from(String(req.body.dataBase64).replace(/^data:[^,]+,/, ''), 'base64'));
  const patch = req.body.kind === 'logo' ? { logoPath: file } : { screenshotPaths: [...(product.screenshotPaths || []), file] };
  res.json(db.update('products', product.id, patch));
}));

app.get('/api/uploads/:productId/:file', (req, res) => {
  const file = path.join(db.DATA_DIR, 'uploads', path.basename(req.params.productId), path.basename(req.params.file));
  if (!fs.existsSync(file)) return res.status(404).end();
  res.sendFile(file);
});

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
  let url = normalizeUrl(req.body.url);
  let page = await inspectPage(url);
  let analysis = ai.aiConfigured() ? await ai.analyzeSubmitPage(url, page) : null;
  if (analysis && !analysis.isSubmissionForm && analysis.betterSubmitUrl) {
    url = normalizeUrl(analysis.betterSubmitUrl);
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
  const workers = Array.from({ length: 8 }, async () => {
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
  const page = automation.hasProfile(directory) ? await automation.inspectLoggedIn(directory, url) : await inspectPage(url);
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
  const patch = pick(req.body, ['values', 'kit', 'liveUrl', 'notes', 'submitUrl', 'launchAt']);
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

app.post('/api/submissions/:id/open', wrap(async (req, res) => {
  const { s, directory } = loadSubmission(req.params.id);
  await automation.openWindow(directory, req.body.url || s.submitUrl || directory.submitUrl);
  res.json({ ok: true });
}));

// --- Scheduling ---------------------------------------------------------------
app.get('/api/jobs', (req, res) => res.json(db.all('jobs')));

app.post('/api/submissions/:id/schedule', wrap((req, res) => {
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

const server = app.listen(PORT, HOST, () => {
  console.log(`LaunchPilot running at http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  if (!ai.aiConfigured()) console.log('AI features are off until ANTHROPIC_API_KEY is set in .env');
});
startScheduler();

async function shutdown() {
  stopScheduler();
  server.close();
  await Promise.all([automation.closeAll(), closeInspector()]);
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

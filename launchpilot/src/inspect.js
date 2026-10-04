// Opens a page in Chromium and reads what an agent needs: visible text, the
// form fields (with labels, limits and a stable selector), whether it's behind
// a login, and whether there's a CAPTCHA.
import { chromium } from 'playwright';

let browser;

export function launchOptions(headless = true) {
  const opts = { headless };
  if (process.env.CHROMIUM_PATH) opts.executablePath = process.env.CHROMIUM_PATH;
  return opts;
}

async function getBrowser() {
  if (!browser || !browser.isConnected()) browser = await chromium.launch(launchOptions(true));
  return browser;
}

export async function closeInspector() {
  if (browser) await browser.close().catch(() => {});
}

// Runs inside the page. Kept self-contained because Playwright serialises it.
function readPage() {
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
  };
  const cssEscape = (v) => (window.CSS && CSS.escape ? CSS.escape(v) : v.replace(/["\\]/g, '\\$&'));
  const selectorFor = (el) => {
    if (el.id && document.querySelectorAll(`#${cssEscape(el.id)}`).length === 1) return `#${cssEscape(el.id)}`;
    const tag = el.tagName.toLowerCase();
    if (el.name) {
      const sel = `${tag}[name="${el.name.replace(/"/g, '\\"')}"]`;
      if (document.querySelectorAll(sel).length === 1) return sel;
    }
    const parts = [];
    let node = el;
    while (node && node.nodeType === 1 && node !== document.body) {
      const parent = node.parentElement;
      const same = parent ? [...parent.children].filter((c) => c.tagName === node.tagName) : [];
      parts.unshift(same.length > 1 ? `${node.tagName.toLowerCase()}:nth-of-type(${same.indexOf(node) + 1})` : node.tagName.toLowerCase());
      node = parent;
    }
    return `body > ${parts.join(' > ')}`;
  };
  const labelFor = (el) => {
    if (el.labels && el.labels.length) return el.labels[0].innerText.trim();
    const aria = el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') && document.getElementById(el.getAttribute('aria-labelledby'))?.innerText;
    if (aria) return aria.trim();
    let prev = el.closest('div, p, li, fieldset');
    for (let i = 0; prev && i < 3; i++, prev = prev.parentElement) {
      const lbl = prev.querySelector('label, legend, .label, h3, h4, span');
      if (lbl && lbl.innerText && lbl.innerText.length < 120) return lbl.innerText.trim();
    }
    return '';
  };

  const fields = [];
  const els = document.querySelectorAll('input, textarea, select, [contenteditable="true"]');
  els.forEach((el, i) => {
    const type = (el.getAttribute('type') || el.tagName).toLowerCase();
    if (['hidden', 'submit', 'button', 'reset', 'image'].includes(type)) return;
    if (type !== 'file' && !visible(el)) return;
    fields.push({
      fid: `f${i}`,
      tag: el.tagName.toLowerCase(),
      type,
      name: el.name || '',
      label: labelFor(el).slice(0, 160),
      placeholder: (el.getAttribute('placeholder') || '').slice(0, 160),
      required: el.required || el.getAttribute('aria-required') === 'true',
      maxLength: el.maxLength > 0 ? el.maxLength : null,
      options: el.tagName === 'SELECT' ? [...el.options].map((o) => o.text.trim()).filter(Boolean).slice(0, 80) : undefined,
      selector: selectorFor(el),
    });
  });

  const html = document.documentElement.innerHTML;
  const captcha = /recaptcha|hcaptcha|turnstile|cf-chl|captcha/i.test(html) &&
    !!document.querySelector('iframe[src*="recaptcha"], iframe[src*="hcaptcha"], iframe[src*="challenges.cloudflare"], .g-recaptcha, .h-captcha, .cf-turnstile, [data-sitekey]');
  const hasPassword = !!document.querySelector('input[type="password"]');
  const submitLinks = [...document.querySelectorAll('a[href]')]
    .filter((a) => /submit|add (a |your )?(tool|product|startup|listing|app)|list your|get listed|launch/i.test(a.innerText + ' ' + a.getAttribute('href')))
    .slice(0, 10)
    .map((a) => ({ text: a.innerText.trim().slice(0, 80), href: a.href }));
  const metaDesc = document.querySelector('meta[name="description"], meta[property="og:description"]')?.content || '';
  const ogImage = document.querySelector('meta[property="og:image"]')?.content || '';
  const icon = document.querySelector('link[rel~="icon"], link[rel="apple-touch-icon"]')?.href || '';

  return {
    title: document.title,
    metaDescription: metaDesc,
    ogImage,
    icon,
    text: document.body ? document.body.innerText.replace(/\n{3,}/g, '\n\n').slice(0, 20000) : '',
    fields,
    captcha,
    loginWall: hasPassword && fields.length <= 4,
    submitLinks,
  };
}

export async function inspectPage(url, { context } = {}) {
  const ctx = context || (await (await getBrowser()).newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36',
  }));
  const page = await ctx.newPage();
  try {
    const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
    const data = await page.evaluate(readPage);
    return { ...data, finalUrl: page.url(), httpStatus: res ? res.status() : null };
  } finally {
    await page.close().catch(() => {});
    if (!context) await ctx.close().catch(() => {});
  }
}

export { readPage };

// Fast liveness check without a browser.
export async function checkUrl(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(url, { method: 'GET', redirect: 'follow', signal: ctrl.signal, headers: { 'user-agent': 'Mozilla/5.0 LaunchPilot link-check' } });
    return { ok: res.status < 400 || [401, 403, 429].includes(res.status), status: res.status, finalUrl: res.url };
  } catch (e) {
    return { ok: false, status: null, error: e.name === 'AbortError' ? 'timeout' : e.message };
  } finally {
    clearTimeout(t);
  }
}

// Keyword-based field mapping, used when AI is off (and as a sanity net).
const ROLE_PATTERNS = [
  ['password', /pass(word)?/],
  ['email', /e-?mail/],
  ['website_url', /\b(url|website|link|homepage|domain|site)\b/],
  ['tagline', /tag ?line|slogan|one[- ]liner|headline|pitch/],
  ['short_description', /short|summary|excerpt|subtitle/],
  ['long_description', /descri|about|details|overview|tell us/],
  ['maker_name', /your name|full name|founder|maker/],
  ['product_name', /(product|tool|app|startup|project|company)?[ _-]?name|title/],
  ['category', /categor|industry|type/],
  ['tags', /tags?|keywords?/],
  ['pricing', /pric|plan|cost/],
  ['twitter', /twitter|\bx\b/],
  ['linkedin', /linkedin/],
  ['github', /github/],
  ['video_url', /video|youtube|demo/],
  ['logo', /logo|icon|avatar/],
  ['screenshot', /screenshot|image|gallery|cover/],
  ['search', /search/],
  ['terms_checkbox', /terms|agree|policy/],
];

export function guessRoles(fields) {
  return fields.map((f) => {
    const hay = `${f.label} ${f.name} ${f.placeholder} ${f.type}`.toLowerCase();
    let role = f.type === 'password' ? 'password' : f.type === 'email' ? 'email' : f.type === 'url' ? 'website_url' : null;
    if (!role) role = ROLE_PATTERNS.find(([, re]) => re.test(hay))?.[0] || 'other';
    if (f.type === 'file' && !['logo', 'screenshot'].includes(role)) role = 'screenshot';
    return { ...f, role, maxChars: f.maxLength || 0, guidance: '' };
  });
}

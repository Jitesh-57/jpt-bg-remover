// LaunchPilot dashboard. Plain ES modules, no build step.
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const STATUS_LABEL = {
  draft: 'Not started', written: 'Copy written', running: 'Agent working', needs_human: 'Needs you', ready_for_review: 'Ready to submit',
  scheduled: 'Scheduled', submitted: 'Submitted', live: 'Live', rejected: 'Rejected', skipped: 'Skipped',
};
const PRODUCT_TEXT = [
  ['name', 'Product name', 0], ['url', 'Website URL', 0], ['tagline', 'Tagline', 60], ['shortDescription', 'Short description', 160],
  ['longDescription', 'Long description', 1000], ['pricingDetails', 'Pricing details', 0], ['audience', 'Who it\'s for', 0],
  ['makerName', 'Maker name', 0], ['makerEmail', 'Contact email', 0], ['companyName', 'Company', 0], ['twitter', 'X / Twitter URL', 0],
  ['linkedin', 'LinkedIn URL', 0], ['github', 'GitHub URL', 0], ['videoUrl', 'Demo video URL', 0], ['country', 'Country', 0], ['foundedYear', 'Founded year', 0],
];
const PRODUCT_LISTS = [['categories', 'Categories'], ['tags', 'Tags'], ['features', 'Key features'], ['useCases', 'Use cases'], ['competitors', 'Alternative to (competitors)']];

const state = {
  view: localStorage.getItem('lp.view') || 'dashboard',
  productId: localStorage.getItem('lp.product') || null,
  status: null, products: [], directories: [], submissions: [], jobs: [], credentials: [], activity: [],
  filters: { q: '', category: '', pricing: '', tier: '', show: 'active' },
  selected: new Set(),
  hosted: false, me: null, signup: false,
};

// ---------------------------------------------------------------- API helpers
async function api(path, opts = {}) {
  const res = await fetch(`/api${path}`, {
    method: opts.method || (opts.body ? 'POST' : 'GET'),
    headers: opts.body ? { 'content-type': 'application/json' } : {},
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (res.status === 401 && !/^\/(auth\/|login)/.test(path)) {
    showLogin();
    throw new Error('Please sign in');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

function toast(msg, ms = 3500) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.add('hidden'), ms);
}

// Runs an async action with a busy button and error toast.
async function busy(btn, label, fn) {
  const original = btn?.innerHTML;
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span>${esc(label)}`;
  }
  try {
    return await fn();
  } catch (e) {
    toast(e.message, 6000);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = original;
    }
  }
}

async function refresh(...keys) {
  const all = { products: '/products', directories: '/directories', submissions: '/submissions', jobs: '/jobs', credentials: '/credentials', activity: '/activity', status: '/status', account: '/account', autopilot: '/autopilot/status' };
  // Hosted: autopilot runs are driven from this page (one site per request), so their status lives here.
  if (state.hosted) delete all.autopilot;
  await Promise.all((keys.length ? keys : Object.keys(all)).filter((k) => all[k]).map(async (k) => { state[k] = await api(all[k]); }));
  if (!state.products.find((p) => p.id === state.productId)) state.productId = state.products[0]?.id || null;
}

const product = () => state.products.find((p) => p.id === state.productId);
const dirById = (id) => state.directories.find((d) => d.id === id);
const subsForProduct = () => state.submissions.filter((s) => s.productId === state.productId);
const badge = (status) => `<span class="badge ${esc(status)}">${esc(STATUS_LABEL[status] || status)}</span>`;
const fmt = (iso) => (iso ? new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '');
const uploadUrl = (p) => (p ? `/api/uploads/${encodeURIComponent(p.split(/[\\/]/).slice(-2)[0])}/${encodeURIComponent(p.split(/[\\/]/).pop())}` : '');

// --------------------------------------------------------------------- Layout
function showLogin() {
  $('#app').classList.add('hidden');
  $('#login').classList.remove('hidden');
  $$('.cloud-only').forEach((x) => x.classList.toggle('hidden', !state.hosted));
  $$('.signup-only').forEach((x) => x.classList.toggle('hidden', !(state.hosted && state.signup && state.me?.inviteOnly)));
  const form = $('#login-form');
  if (state.hosted) {
    form.email.required = true;
    form.password.autocomplete = state.signup ? 'new-password' : 'current-password';
    $('#login-submit').textContent = state.signup ? 'Create account' : 'Sign in';
    $('#login-switch').textContent = state.signup ? 'Have an account? Sign in' : 'New here? Create an account';
  }
}

function renderChrome() {
  const sel = $('#product-select');
  sel.innerHTML = state.products.length
    ? state.products.map((p) => `<option value="${p.id}" ${p.id === state.productId ? 'selected' : ''}>${esc(p.name || 'Untitled')}</option>`).join('') + '<option value="__new">+ New product</option>'
    : '<option value="__new">+ Add your first product</option>';
  $$('#nav a').forEach((a) => a.classList.toggle('active', a.dataset.view === state.view));
  const s = state.status;
  $('#ai-status').innerHTML = !s ? '' : state.hosted
    ? `${s.aiConfigured ? `AI: <b>${esc(s.model)}</b>` : '<span class="badge bad">AI is off on this server</span>'}<br>Browser: cloud${s.liveBrowser ? ' (with live view)' : ''}<br>${esc(state.me?.email || '')} · <a href="#" id="sign-out">Sign out</a>`
    : `${s.aiConfigured ? `AI: <b>${esc(s.model)}</b>` : '<span class="badge bad">AI off: set ANTHROPIC_API_KEY</span>'}<br>Browser: ${s.headless ? 'hidden (headless)' : 'visible window'}`;
}

function go(view) {
  state.view = view;
  localStorage.setItem('lp.view', view);
  render();
}

function render() {
  renderChrome();
  const views = { dashboard: viewDashboard, products: viewProduct, directories: viewDirectories, launches: viewLaunches, schedule: viewSchedule, vault: viewVault, help: viewHelp };
  (views[state.view] || viewDashboard)($('#view'));
}

// ------------------------------------------------------------------ Dashboard
// One email and password for every listing site.
function accountCard() {
  const a = state.account;
  return `<form class="card stack" id="account-form" style="margin-bottom:16px">
    <div class="row"><h2 style="margin:0">Your launch account</h2>${a ? `<span class="badge ok">Saved: ${esc(a.emailMasked)}</span>` : '<span class="badge warn">Not set</span>'}</div>
    <p class="muted small">Autopilot uses this email and password on every listing site: it signs in, or creates the account if you don't have one there yet. If a site already has an account for this email with a different password, it asks you for that one. Stored encrypted${state.hosted ? ' with a key unique to your LaunchPilot account' : ' on this computer'}.</p>
    <div class="row"><input id="acct-email" type="email" placeholder="you@example.com" value="${esc(a?.email || '')}" style="flex:1;min-width:200px" autocomplete="off" />
      <input id="acct-password" type="password" placeholder="${a ? 'New password (leave blank to keep)' : 'Password for listing sites'}" style="flex:1;min-width:200px" autocomplete="new-password" />
      <button class="btn primary" type="submit">${a ? 'Update' : 'Save'}</button></div>
  </form>`;
}

function bindAccountForm() {
  $('#account-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = $('#acct-email').value.trim();
    const password = $('#acct-password').value;
    if (!password && state.account?.email === email) return toast('Nothing changed');
    busy(e.submitter, 'Saving', async () => {
      await api('/account', { body: { email, password } });
      await refresh('account', 'credentials');
      toast('Launch account saved (encrypted)');
      render();
    });
  });
}

function viewDashboard(el) {
  const p = product();
  const subs = subsForProduct();
  const count = (st) => subs.filter((s) => st.includes(s.status)).length;
  const needs = subs.filter((s) => ['needs_human', 'ready_for_review'].includes(s.status));
  const due = state.jobs.filter((j) => j.status === 'due');
  const upcoming = state.jobs.filter((j) => j.status === 'scheduled').sort((a, b) => a.runAt.localeCompare(b.runAt)).slice(0, 6);

  el.innerHTML = `
    <div class="page-head"><div><h1>${p ? esc(p.name) : 'Welcome to LaunchPilot'}</h1>
      <p class="muted">${p ? esc(p.tagline || p.url || '') : 'Your AI launch agent: find listing sites, write the copy, fill the forms and schedule launches.'}</p></div>
      <div class="row">${p ? '<button class="btn" data-go="directories">Add listing sites</button><button class="btn primary" data-go="launches">Open launches</button>' : '<button class="btn primary" data-go="products">Add your product</button>'}</div>
    </div>
    ${!state.status.aiConfigured ? '<div class="callout" style="margin-bottom:16px">AI is off. Add <code>ANTHROPIC_API_KEY</code> to <code>.env</code> and restart to enable auto-fill, form analysis, copywriting and site discovery.</div>' : ''}
    ${accountCard()}
    ${!p ? `<div class="card stack"><h2>Get started in 4 steps</h2><ol class="muted">
        <li>Add your product: paste its URL and the agent drafts your profile.</li>
        <li>Pick listing sites from ${state.directories.length}+ built-in platforms, or paste any site's URL.</li>
        <li>Save your logins in the encrypted vault (optional).</li>
        <li>For each site: the agent reads the form, writes tailored copy, fills it in a real browser and you click Submit, or schedule it.</li></ol></div>` : `
    <div class="grid cols-4" style="margin-bottom:16px">
      <div class="card stat"><div class="muted small">Listing sites picked</div><div class="num">${subs.length}</div></div>
      <div class="card stat"><div class="muted small">Needs you</div><div class="num">${needs.length}</div></div>
      <div class="card stat"><div class="muted small">Submitted</div><div class="num">${count(['submitted'])}</div></div>
      <div class="card stat"><div class="muted small">Live listings</div><div class="num">${count(['live'])}</div></div>
    </div>
    <div class="grid cols-2">
      <div class="card"><h2>Needs you</h2>${needs.length || due.length ? `<div class="list">
        ${due.map((j) => `<div class="list-item"><span class="badge warn">Due</span><span>${esc(j.title)}</span><span class="spacer"></span><button class="btn sm" data-open-sub="${j.submissionId}">Open</button><button class="btn sm" data-dismiss="${j.id}">Done</button></div>`).join('')}
        ${needs.map((s) => `<div class="list-item clickable" data-open-sub="${s.id}">${badge(s.status)}<span>${esc(dirById(s.directoryId)?.name)}</span><span class="spacer"></span><span class="muted small">${esc((s.log || []).slice(-1)[0]?.message || '').slice(0, 70)}</span></div>`).join('')}
      </div>` : '<p class="muted">Nothing waiting on you.</p>'}</div>
      <div class="card"><h2>Coming up</h2>${upcoming.length ? `<div class="list">${upcoming.map((j) => `<div class="list-item clickable" data-open-sub="${j.submissionId}"><span class="badge scheduled">${fmt(j.runAt)}</span><span>${esc(j.title)}</span></div>`).join('')}</div>` : '<p class="muted">No scheduled launches. Open a launch and pick a date.</p>'}</div>
    </div>`}
    <div class="card" style="margin-top:16px"><h2>Recent activity</h2>${state.activity.length ? `<div class="log">${state.activity.slice(0, 30).map((a) => `<div><span class="muted">${fmt(a.at)}</span> ${esc(a.message)}</div>`).join('')}</div>` : '<p class="muted">No activity yet.</p>'}</div>`;
  bindAccountForm();
}

// -------------------------------------------------------------------- Product
function viewProduct(el) {
  const p = state.productId === '__new' ? null : product();
  const v = p || {};
  el.innerHTML = `
    <div class="page-head"><div><h1>${p ? 'Product profile' : 'New product'}</h1><p class="muted">Every listing is written from this profile. The more complete it is, the better the copy.</p></div>
      ${p ? '<button class="btn danger" id="del-product">Delete product</button>' : ''}</div>
    <div class="card stack" style="margin-bottom:16px">
      <h2>Crawl your whole website</h2>
      <div class="row"><input id="autofill-url" placeholder="https://yourproduct.com" value="${esc(v.url || '')}" style="flex:1;min-width:220px" />
        <select id="crawl-pages" style="width:auto">${[30, 60, 100, 150].map((n) => `<option value="${n}" ${n === 60 ? 'selected' : ''}>${n} pages</option>`).join('')}</select>
        <button class="btn primary" id="autofill">${v.factSheet ? 'Crawl again' : 'Crawl my site'}</button></div>
      <p class="muted small" id="crawl-status">The agent maps every URL in your sitemaps, reads the most important pages in full (pricing, features, tools, FAQ first), then writes a fact sheet with your real tool names, counts, prices and limits. Every listing is written from it. Takes 2-5 minutes.</p>
    </div>
    <form class="card" id="product-form">
      <div class="form-grid">
        ${PRODUCT_TEXT.map(([k, label, max]) => {
          const long = k === 'longDescription' || k === 'shortDescription';
          const input = long ? `<textarea name="${k}" ${k === 'longDescription' ? 'style="min-height:160px"' : ''}>${esc(v[k])}</textarea>` : `<input name="${k}" value="${esc(v[k])}" />`;
          return `<label class="${long ? 'full' : ''}">${label}${max ? `<span class="counter" data-max="${max}"></span>` : ''}${input}</label>`;
        }).join('')}
        <label>Pricing<select name="pricing">${['free', 'freemium', 'paid', 'free-trial', 'open-source', 'unknown'].map((o) => `<option ${v.pricing === o ? 'selected' : ''}>${o}</option>`).join('')}</select></label>
        <span></span>
        ${PRODUCT_LISTS.map(([k, label]) => `<label class="full">${label} <span class="muted small">(one per line)</span><textarea name="${k}" style="min-height:70px">${esc((v[k] || []).join('\n'))}</textarea></label>`).join('')}
        <label class="full">Fact sheet <span class="muted small">(every listing is written from this; correct anything that's wrong)</span><textarea name="factSheet" style="min-height:${v.factSheet ? 360 : 90}px;font-family:ui-monospace,Consolas,monospace;font-size:12.5px" placeholder="Crawl your site to build this, or write the key facts yourself: tools, prices, limits, who it's for.">${esc(v.factSheet)}</textarea></label>
        ${v.crawledPages?.length ? `<details class="full"><summary class="small">${v.crawledPages.length} pages read${v.crawledAt ? ` · ${new Date(v.crawledAt).toLocaleString()}` : ''}</summary><div class="small">${v.crawledPages.map((c) => `<div><a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.title || c.url)}</a></div>`).join('')}</div></details>` : ''}
      </div>
      <div class="row" style="margin-top:16px"><span class="spacer"></span><button class="btn primary" type="submit">${p ? 'Save profile' : 'Create product'}</button></div>
    </form>
    ${p ? `<div class="card stack" style="margin-top:16px"><h2>Images</h2>
      <div class="row">
        ${v.logoPath ? `<img class="thumb" src="${uploadUrl(v.logoPath)}" alt="Logo" />` : '<div class="thumb"></div>'}
        <label class="btn">Upload logo<input type="file" accept="image/*" data-upload="logo" hidden /></label>
        ${(v.screenshotPaths || []).map((s) => `<img class="thumb" src="${uploadUrl(s)}" alt="Screenshot" />`).join('')}
        <label class="btn">Add screenshot<input type="file" accept="image/*" data-upload="screenshot" hidden /></label>
      </div><p class="muted small">Used for logo/screenshot upload fields. Square logo (240×240+) and 1270×760 screenshots fit most sites.</p></div>
    <div class="card stack" style="margin-top:16px"><h2>AI launch plan</h2>
      <div class="row"><label style="flex:1;min-width:200px">Main launch date<input type="date" id="plan-date" value="${esc(v.plan?.launchDate || '')}" /></label><button class="btn primary" id="make-plan" style="align-self:flex-end">${v.plan ? 'Rebuild plan' : 'Build my launch plan'}</button></div>
      ${v.plan ? renderPlan(v.plan) : '<p class="muted small">Get a week-by-week order for your listing sites: long queues first, the big launch day, then the long tail.</p>'}
    </div>` : ''}`;

  const form = $('#product-form');
  let pendingCrawl = null;
  const updateCounters = () => $$('.counter', form).forEach((c) => {
    const input = c.parentElement.querySelector('input, textarea');
    c.textContent = `${input.value.length}/${c.dataset.max}`;
    c.classList.toggle('over', input.value.length > Number(c.dataset.max));
  });
  form.addEventListener('input', updateCounters);
  updateCounters();

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    for (const [k] of PRODUCT_LISTS) data[k] = data[k].split('\n').map((s) => s.trim()).filter(Boolean);
    if (pendingCrawl) Object.assign(data, pendingCrawl);
    busy(form.querySelector('[type="submit"]'), 'Saving', async () => {
      const row = p ? await api(`/products/${p.id}`, { method: 'PATCH', body: data }) : await api('/products', { body: data });
      state.productId = row.id;
      localStorage.setItem('lp.product', row.id);
      await refresh('products', 'status');
      toast('Profile saved');
      render();
    });
  });

  $('#autofill').addEventListener('click', (e) => busy(e.currentTarget, 'Crawling…', async () => {
    const status = $('#crawl-status');
    if (state.hosted) status.textContent = 'Reading your site and every sitemap, then writing the fact sheet. This takes a minute or two…';
    const first = await api('/products/autofill', { body: { url: $('#autofill-url').value, maxPages: $('#crawl-pages').value } });
    const { id } = first;
    // Hosted replies with the finished result; desktop runs in the background and is polled.
    let job = first.status ? first : null;
    while (!job || !['done', 'failed'].includes(job.status)) {
      await new Promise((r) => setTimeout(r, 2000));
      job = await api(`/crawls/${id}`);
      status.textContent = job.status === 'crawling'
        ? `Reading page ${job.done} of up to ${job.total}${job.current ? `: ${job.current}` : ''}`
        : job.status === 'writing' ? `Read ${job.done} pages${job.sitemapUrls ? ` and mapped all ${job.sitemapUrls} sitemap URLs` : ''}. Writing the fact sheet…` : '';
      if (job.status === 'done' || job.status === 'failed') break;
    }
    if (job.status === 'failed') throw new Error(job.error);
    const draft = job.result;
    for (const [k] of PRODUCT_TEXT) if (draft[k] && form.elements[k]) form.elements[k].value = draft[k];
    for (const [k] of PRODUCT_LISTS) if (draft[k]?.length) form.elements[k].value = draft[k].join('\n');
    if (draft.pricing) form.elements.pricing.value = draft.pricing;
    form.elements.factSheet.value = draft.factSheet || '';
    form.elements.factSheet.style.minHeight = '360px';
    pendingCrawl = { crawledPages: draft.crawledPages, crawledAt: draft.crawledAt };
    status.textContent = `Read ${draft.crawledPages.length} pages${draft.sitemapUrls ? ` and mapped all ${draft.sitemapUrls} sitemap URLs` : ''}. Review the profile and fact sheet below, then save.`;
    updateCounters();
    toast('Fact sheet ready. Review it and save.');
  }));

  $('#del-product')?.addEventListener('click', async () => {
    if (!confirm(`Delete ${p.name} and all its launches?`)) return;
    await api(`/products/${p.id}`, { method: 'DELETE' });
    await refresh();
    render();
  });

  $$('[data-upload]', el).forEach((input) => input.addEventListener('change', async () => {
    const file = input.files[0];
    if (!file) return;
    const dataBase64 = await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(file); });
    await busy(null, '', async () => {
      await api('/uploads', { body: { productId: p.id, kind: input.dataset.upload, filename: file.name, dataBase64 } });
      await refresh('products');
      render();
    });
  }));

  $('#make-plan')?.addEventListener('click', (e) => busy(e.currentTarget, 'Planning…', async () => {
    const picked = subsForProduct().map((s) => s.directoryId);
    await api(`/products/${p.id}/plan`, { body: { launchDate: $('#plan-date').value, directoryIds: picked } });
    await refresh('products');
    render();
  }));
}

function renderPlan(plan) {
  const bySlug = Object.fromEntries(state.directories.map((d) => [d.slug, d]));
  return `<p>${esc(plan.summary)}</p><div class="table-wrap"><table><thead><tr><th>When</th><th>Where</th><th>What</th></tr></thead><tbody>
    ${plan.steps.map((s) => `<tr><td>${s.week === 0 ? 'Launch week' : s.week < 0 ? `${-s.week} wk before` : `${s.week} wk after`}<div class="muted small">${esc(s.day)}</div></td><td>${esc(bySlug[s.directorySlug]?.name || s.directorySlug)}</td><td>${esc(s.action)}<div class="muted small">${esc(s.why)}</div></td></tr>`).join('')}
  </tbody></table></div>`;
}

// ---------------------------------------------------------------- Directories
function filteredDirectories() {
  const f = state.filters;
  const q = f.q.toLowerCase();
  return state.directories
    .filter((d) => (f.show === 'hidden' ? d.hidden : !d.hidden))
    .filter((d) => f.show !== 'launch' || d.launch)
    .filter((d) => f.show !== 'new' || d.source === 'ai' || d.source === 'user')
    .filter((d) => !f.category || d.category === f.category)
    .filter((d) => !f.pricing || d.pricing === f.pricing)
    .filter((d) => !f.tier || String(d.tier) === f.tier)
    .filter((d) => !q || `${d.name} ${d.url} ${d.launchTips || ''}`.toLowerCase().includes(q))
    .sort((a, b) => a.tier - b.tier || a.name.localeCompare(b.name));
}

function viewDirectories(el) {
  const cats = state.status.categories;
  const picked = new Set(subsForProduct().map((s) => s.directoryId));
  const list = filteredDirectories();
  const f = state.filters;
  el.innerHTML = `
    <div class="page-head"><div><h1>Listing sites</h1><p class="muted">${state.directories.length} platforms. Select the ones you want and add them to ${esc(product()?.name || 'your product')}'s launches.</p></div>
      <div class="row"><button class="btn" id="check-links">Check links</button><button class="btn primary" id="discover">Find new sites with AI</button></div></div>
    <div class="card stack" style="margin-bottom:16px">
      <h2>Add any listing site by URL</h2>
      <div class="row"><input id="new-site" placeholder="Paste a directory's homepage or submit page URL" style="flex:1;min-width:220px" /><button class="btn primary" id="add-site">Add site</button></div>
      <p class="muted small">The agent opens the page, finds the submission form (following "Submit" links if needed), and learns what each field means.</p>
    </div>
    <div class="card">
      <div class="filters">
        <input id="f-q" placeholder="Search…" value="${esc(f.q)}" />
        <select id="f-category"><option value="">All types</option>${Object.entries(cats).map(([k, v]) => `<option value="${k}" ${f.category === k ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select>
        <select id="f-pricing"><option value="">Any price</option>${['free', 'freemium', 'paid', 'unknown'].map((o) => `<option ${f.pricing === o ? 'selected' : ''}>${o}</option>`).join('')}</select>
        <select id="f-tier"><option value="">Any tier</option>${[1, 2, 3].map((t) => `<option value="${t}" ${f.tier === String(t) ? 'selected' : ''}>Tier ${t}</option>`).join('')}</select>
        <select id="f-show">${[['active', 'All sites'], ['launch', 'Launch-day platforms'], ['new', 'AI found / custom'], ['hidden', 'Hidden']].map(([k, v]) => `<option value="${k}" ${f.show === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
      </div>
      <div class="row" style="margin-bottom:8px"><label class="check"><input type="checkbox" id="sel-all" /> Select all shown (${list.length})</label><span class="spacer"></span>
        <span class="muted small">${state.selected.size} selected</span><button class="btn primary sm" id="add-selected" ${state.selected.size && product() ? '' : 'disabled'}>Add to launches</button></div>
      <div class="table-wrap"><table><thead><tr><th></th><th>Site</th><th>Type</th><th>Price</th><th>Tier</th><th>Status</th><th></th></tr></thead><tbody>
        ${list.map((d) => `<tr>
          <td><input type="checkbox" data-sel="${d.id}" ${state.selected.has(d.id) ? 'checked' : ''} /></td>
          <td><a href="${esc(d.url)}" target="_blank" rel="noopener"><b>${esc(d.name)}</b></a>
            ${d.source === 'ai' ? '<span class="badge accent">AI found</span>' : d.source === 'user' ? '<span class="badge accent">Custom</span>' : ''}
            ${d.launch ? '<span class="badge warn">Launch day</span>' : ''}${d.manualOnly ? '<span class="badge">You post</span>' : ''}
            ${d.launchTips ? `<div class="muted small">${esc(d.launchTips)}</div>` : ''}</td>
          <td class="small">${esc(cats[d.category] || d.category)}</td>
          <td><span class="badge">${esc(d.pricing)}</span></td>
          <td>${d.tier}</td>
          <td>${d.status === 'dead' ? `<span class="badge dead">Down ${d.httpStatus || ''}</span>` : d.status === 'ok' ? '<span class="badge ok">OK</span>' : '<span class="badge">Unchecked</span>'}
            ${picked.has(d.id) ? '<div><span class="badge written">In launches</span></div>' : ''}</td>
          <td><button class="btn sm" data-hide="${d.id}">${d.hidden ? 'Unhide' : 'Hide'}</button></td>
        </tr>`).join('') || '<tr><td colspan="7" class="empty">No sites match these filters.</td></tr>'}
      </tbody></table></div>
    </div>`;

  const setFilter = (k, v) => { state.filters[k] = v; render(); };
  $('#f-q').addEventListener('change', (e) => setFilter('q', e.target.value));
  for (const k of ['category', 'pricing', 'tier', 'show']) $(`#f-${k}`).addEventListener('change', (e) => setFilter(k, e.target.value));
  $('#sel-all').addEventListener('change', (e) => { list.forEach((d) => (e.target.checked ? state.selected.add(d.id) : state.selected.delete(d.id))); render(); });
  $$('[data-sel]', el).forEach((cb) => cb.addEventListener('change', () => { cb.checked ? state.selected.add(cb.dataset.sel) : state.selected.delete(cb.dataset.sel); render(); }));
  $$('[data-hide]', el).forEach((b) => b.addEventListener('click', async () => {
    const d = dirById(b.dataset.hide);
    await api(`/directories/${d.id}`, { method: 'PATCH', body: { hidden: !d.hidden } });
    await refresh('directories');
    render();
  }));
  $('#add-selected').addEventListener('click', (e) => busy(e.currentTarget, 'Adding…', async () => {
    const created = await api('/submissions', { body: { productId: state.productId, directoryIds: [...state.selected] } });
    state.selected.clear();
    await refresh('submissions');
    toast(`${created.length} sites in your launches`);
    go('launches');
  }));
  $('#add-site').addEventListener('click', (e) => busy(e.currentTarget, 'Reading site…', async () => {
    const d = await api('/directories/from-url', { body: { url: $('#new-site').value } });
    await refresh('directories');
    state.selected.add(d.id);
    toast(`Added ${d.name}`);
    render();
  }));
  $('#check-links').addEventListener('click', (e) => busy(e.currentTarget, 'Checking…', async () => {
    state.directories = await api('/directories/check', { body: {} });
    toast(`${state.directories.filter((d) => d.status === 'dead').length} sites look down`);
    render();
  }));
  $('#discover').addEventListener('click', (e) => {
    const focus = prompt('Any niche to focus on? (e.g. "AI image tools", "developer tools"). Leave blank for general.', product()?.categories?.[0] || '');
    if (focus === null) return;
    busy(e.currentTarget, 'Searching the web…', async () => {
      const { added } = await api('/directories/discover', { body: { focus } });
      await refresh('directories');
      state.filters.show = 'new';
      toast(`Found ${added.length} new listing sites`);
      render();
    });
  });
}

// ------------------------------------------------------------------- Launches
const AUTOPILOT_READY = ['draft', 'written', 'needs_human', 'ready_for_review', 'scheduled'];

function autopilotPanel(subs) {
  const run = state.autopilot || {};
  const todo = subs.filter((s) => AUTOPILOT_READY.includes(s.status));
  const nameOf = (id) => dirById(state.submissions.find((x) => x.id === id)?.directoryId)?.name || '';
  if (run.running) {
    const total = run.done.length + run.queue.length + (run.current ? 1 : 0);
    return `<div class="card stack" style="margin-bottom:16px"><div class="row"><h2 style="margin:0">Autopilot is running</h2><span class="spacer"></span><button class="btn sm danger" id="ap-stop">Stop after this site</button></div>
      <p><span class="spinner"></span>${esc(nameOf(run.current))} · ${run.done.length} of ${total} done</p>
      ${run.done.length ? `<div class="list">${run.done.map((r) => `<div class="list-item clickable" data-open-sub="${r.id}">${badge(r.status)}<b>${esc(nameOf(r.id))}</b><span class="spacer"></span>${r.listingUrl ? `<a class="btn sm" href="${esc(r.listingUrl)}" target="_blank" rel="noopener" data-stop>View listing ↗</a>` : `<span class="muted small">${esc(r.message.slice(0, 80))}</span>`}</div>`).join('')}</div>` : ''}
      <p class="muted small">${state.hosted ? 'Each site runs in a cloud browser. Keep this tab open until it finishes.' : 'A browser window opens for each site.'} If one needs you (CAPTCHA, email link, password), it's skipped and listed under Needs you; the rest keep going.</p></div>`;
  }
  return `<div class="card stack" style="margin-bottom:16px">
    <div class="row"><h2 style="margin:0">Autopilot</h2><span class="spacer"></span>
      <button class="btn primary" id="ap-run" ${todo.length && state.account ? '' : 'disabled'}>Launch on ${todo.length} site${todo.length === 1 ? '' : 's'}</button></div>
    <p class="muted small">For each site: signs in with your launch account (or creates one), finds the submit page, writes the listing with Claude from your fact sheet, fills every field, submits, and saves the listing link and a screenshot. ${state.account ? '' : '<b>Save your launch account on the Dashboard first.</b>'}</p>
    ${run.done?.length ? `<p class="small">Last run: ${run.done.filter((r) => r.status === 'submitted').length} submitted, ${run.done.filter((r) => r.status !== 'submitted').length} need you.</p>` : ''}
    ${subs.some(waitingForLive) ? `<div class="row"><span class="small muted">${subs.filter(waitingForLive).length} submitted listing${subs.filter(waitingForLive).length === 1 ? ' is' : 's are'} waiting to go live.</span><span class="spacer"></span><button class="btn sm" id="find-all">Find live listings</button></div>` : ''}
  </div>`;
}

// Submitted (or found earlier) but not confirmed live yet.
const waitingForLive = (s) => s.status === 'submitted';

function bindAutopilot() {
  $('#ap-run')?.addEventListener('click', (e) => busy(e.currentTarget, 'Starting…', async () => {
    const ids = subsForProduct().filter((s) => AUTOPILOT_READY.includes(s.status)).map((s) => s.id);
    if (state.hosted) return runAutopilotHere(ids);
    state.autopilot = await api('/autopilot/run', { body: { ids } });
    render();
    pollAutopilot();
  }));
  $('#ap-stop')?.addEventListener('click', async () => {
    if (state.hosted) state.autopilot.queue = [];
    else state.autopilot = await api('/autopilot/stop', { body: {} });
    toast('Autopilot stops after the current site');
  });
  $('#find-all')?.addEventListener('click', (e) => { const btn = e.currentTarget; busy(btn, 'Searching…', async () => {
    const subs = subsForProduct().filter(waitingForLive);
    let live = 0;
    for (const [i, s] of subs.entries()) {
      btn.innerHTML = `<span class="spinner"></span>Checking ${i + 1} of ${subs.length}`;
      const r = await api(`/submissions/${s.id}/find-listing`, { body: {} }).catch(() => null);
      if (r?.status === 'live') live++;
    }
    await refresh('submissions', 'activity');
    render();
    toast(live ? `${live} listing${live === 1 ? '' : 's'} live. Links are on each site.` : 'None are live yet. Directories usually publish after review; check again in a few days.', 8000);
  }); });
}

// Hosted: run sites one request at a time from this tab.
async function runAutopilotHere(ids) {
  state.autopilot = { running: true, queue: [...ids], current: null, done: [], startedAt: new Date().toISOString() };
  render();
  const run = state.autopilot;
  while (run.queue.length) {
    run.current = run.queue.shift();
    if (state.view === 'launches' && $('#drawer').classList.contains('hidden')) render();
    try {
      const r = await api(`/submissions/${run.current}/autopilot`, { body: {} });
      run.done.push({ id: run.current, status: r.status, listingUrl: r.listingUrl || '', message: (r.log || []).slice(-1)[0]?.message || '' });
    } catch (e) {
      run.done.push({ id: run.current, status: 'needs_human', message: e.message });
      if (/Daily limit/.test(e.message)) run.queue = [];
    }
    await refresh('submissions', 'activity').catch(() => {});
  }
  Object.assign(run, { running: false, current: null });
  render();
  toast('Autopilot finished');
}

let polling = false;
async function pollAutopilot() {
  if (polling) return;
  polling = true;
  try {
    while (true) {
      await new Promise((r) => setTimeout(r, 2500));
      await refresh('autopilot', 'submissions', 'activity');
      if (state.view === 'launches' && $('#drawer').classList.contains('hidden')) render();
      if (!state.autopilot.running) break;
    }
    toast('Autopilot finished');
  } finally {
    polling = false;
  }
}

function viewLaunches(el) {
  if (!product()) return go('products');
  const subs = subsForProduct();
  const groups = [
    ['To do', ['draft', 'written']],
    ['Needs you', ['needs_human', 'ready_for_review', 'running']],
    ['Scheduled', ['scheduled']],
    ['Done', ['submitted', 'live']],
    ['Closed', ['rejected', 'skipped']],
  ];
  el.innerHTML = `
    <div class="page-head"><div><h1>Launches</h1><p class="muted">Click a site to analyze its form, write the listing, fill it in the browser and schedule it.</p></div>
      <div class="row"><a class="btn" href="/api/export.csv">Export CSV</a><button class="btn" data-go="directories">Add sites</button></div></div>
    ${subs.length ? autopilotPanel(subs) : ''}
    ${subs.length ? groups.map(([title, sts]) => {
      const items = subs.filter((s) => sts.includes(s.status)).map((s) => ({ s, d: dirById(s.directoryId) })).filter((x) => x.d).sort((a, b) => a.d.tier - b.d.tier);
      if (!items.length) return '';
      return `<div class="card" style="margin-bottom:16px"><h2>${title} <span class="muted">(${items.length})</span></h2><div class="list">
        ${items.map(({ s, d }) => `<div class="list-item clickable" data-open-sub="${s.id}">${badge(s.status)}<b>${esc(d.name)}</b>
          ${d.launch ? '<span class="badge warn">Launch day</span>' : ''}<span class="spacer"></span>
          ${s.listingUrl || s.liveUrl ? `<a class="btn sm" href="${esc(s.listingUrl || s.liveUrl)}" target="_blank" rel="noopener" data-stop>View listing ↗</a>` : ''}
          <span class="muted small">${s.needsPassword ? 'Needs your password' : s.accountStatus === 'verify_email' ? 'Verify your email' : s.launchAt ? `Launch ${fmt(s.launchAt)}` : esc(d.pricing)}</span></div>`).join('')}
      </div></div>`;
    }).join('') : '<div class="card empty">No sites yet. <a href="#" data-go="directories">Pick listing sites</a> to start.</div>'}`;
  bindAutopilot();
  if (state.autopilot?.running && !state.hosted) pollAutopilot();
}

function openSubmission(id) {
  const s = state.submissions.find((x) => x.id === id);
  if (!s) return;
  const d = dirById(s.directoryId);
  const p = state.products.find((x) => x.id === s.productId);
  const fields = s.fields || [];
  const job = state.jobs.find((j) => j.submissionId === s.id && j.status === 'scheduled');
  const cred = state.credentials.find((c) => c.directoryId === d.id) || state.credentials.find((c) => c.domain && d.url.includes(c.domain)) || state.credentials.find((c) => c.isDefault);
  const fieldByFid = Object.fromEntries(fields.map((f) => [f.fid, f]));
  const kit = s.kit || [];
  const toLocalInput = (iso) => (iso ? new Date(new Date(iso).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '');

  const panel = $('#drawer-panel');
  panel.innerHTML = `
    <div class="row" style="margin-bottom:12px"><h1 style="margin:0">${esc(d.name)}</h1>${badge(s.status)}<span class="spacer"></span><button class="btn" data-close>Close</button></div>
    <p class="muted"><a href="${esc(s.submitUrl || d.submitUrl)}" target="_blank" rel="noopener">${esc(s.submitUrl || d.submitUrl)}</a> · ${esc(d.pricing)} · tier ${d.tier}</p>
    ${d.launchTips ? `<div class="callout info" style="margin-bottom:14px">${esc(d.launchTips)}</div>` : ''}
    ${d.manualOnly ? '<div class="callout" style="margin-bottom:14px">This platform needs a human to post. LaunchPilot prepares the copy and fills the form; you click the final button.</div>' : ''}
    ${s.suggestedSubmitUrl ? `<div class="callout" style="margin-bottom:14px">This may not be the submit page. Suggested: <a href="#" id="use-suggested">${esc(s.suggestedSubmitUrl)}</a></div>` : ''}
    <div class="card stack" style="margin-bottom:14px">
      <div class="row"><h2 style="margin:0">Autopilot</h2><span class="spacer"></span><button class="btn primary" id="ap-one">${['needs_human', 'ready_for_review'].includes(s.status) ? 'Continue' : 'Run autopilot on this site'}</button></div>
      <p class="muted small">Signs in${state.account ? ` as <b>${esc(state.account.emailMasked)}</b>` : ''} or creates your account, writes and fills the listing, submits it and saves the link.${d.manualOnly ? ' On this platform you click the final button yourself.' : ''}</p>
      ${s.accountStatus ? `<p class="small">Account: <b>${esc({ created: 'created by autopilot', signed_in: 'signed in', verify_email: 'waiting for email verification' }[s.accountStatus] || s.accountStatus)}</b>${s.accountEmail ? ` (${esc(s.accountEmail)})` : ''}</p>` : ''}
      ${s.needsPassword ? `<div class="callout stack"><b>Your ${esc(d.name)} password</b><span class="small">An account for ${esc(s.accountEmail || state.account?.email || 'your email')} already exists on ${esc(d.name)} with a different password. Enter it once; it's saved encrypted for this site.</span>
        <div class="row"><input id="site-pw" type="password" autocomplete="off" style="flex:1;min-width:180px" placeholder="Password for ${esc(d.name)}" /><button class="btn primary" id="site-pw-save">Save and continue</button></div></div>` : ''}
      ${s.liveViewUrl && s.status === 'needs_human' ? `<div class="callout stack"><b>${esc(d.name)} is waiting for you</b><span class="small">Finish the step in the live browser (CAPTCHA or sign-in), then come back and press Continue.</span><div><a class="btn primary" href="${esc(s.liveViewUrl)}" target="_blank" rel="noopener">Open live browser ↗</a></div></div>` : ''}
      ${s.status === 'live' && (s.liveUrl || s.listingUrl) ? `<div class="callout info"><b>Live listing:</b> <a href="${esc(s.liveUrl || s.listingUrl)}" target="_blank" rel="noopener">${esc(s.liveUrl || s.listingUrl)}</a></div>`
        : s.listingUrl ? `<div class="callout info"><b>Listing link:</b> <a href="${esc(s.listingUrl)}" target="_blank" rel="noopener">${esc(s.listingUrl)}</a><div class="small">Many directories review submissions first, so the page may go live later.</div></div>` : ''}
      ${['submitted', 'live'].includes(s.status) ? `<div class="row"><button class="btn sm" id="find-listing">${s.status === 'live' ? 'Check listing again' : 'Find live listing'}</button><span class="muted small">${s.listingCheckedAt ? `Last checked ${fmt(s.listingCheckedAt)}` : 'Searches ' + esc(d.name) + ' for your product page and checks it is up.'}</span></div>` : ''}
      ${s.confirmation ? `<p class="small muted">${esc(d.name)} said: “${esc(s.confirmation)}”</p>` : ''}
      ${s.screenshot ? `<details><summary class="small">Confirmation screenshot</summary><a href="/api/screens/${encodeURIComponent(s.screenshot)}" target="_blank" rel="noopener"><img src="/api/screens/${encodeURIComponent(s.screenshot)}" alt="Confirmation page" style="width:100%;border:1px solid var(--border);border-radius:8px;margin-top:8px" /></a></details>` : ''}
    </div>
    <details style="margin-bottom:14px"><summary class="small">Step by step (manual)</summary>
    <div class="steps" style="margin-top:12px">
      <div class="step"><h3>Read the submission form</h3>
        <p class="muted small">${fields.length ? `${fields.length} fields mapped${s.analyzedAt ? ` · ${fmt(s.analyzedAt)}` : ''}${s.requiresAccount ? ' · needs an account' : ''}${s.captcha ? ' · has CAPTCHA' : ''}` : 'The agent opens the page and works out what each field is for and its character limits.'}</p>
        <div class="row"><button class="btn" id="analyze">${fields.length ? 'Re-analyze form' : 'Analyze form'}</button>
          <input id="submit-url" value="${esc(s.submitUrl || d.submitUrl)}" style="flex:1;min-width:200px" title="Submit page URL" /></div>
        ${fields.length ? `<details style="margin-top:8px"><summary class="small">Field map</summary><div class="small">${fields.map((f) => `<div><b>${esc(f.role)}</b> ← ${esc(f.label || f.name || f.placeholder || f.type)}${f.maxChars ? ` (max ${f.maxChars})` : ''}</div>`).join('')}</div></details>` : ''}
      </div>
      <div class="step"><h3>Write the listing</h3>
        <p class="muted small">Copy tailored to ${esc(d.name)}'s audience and limits, written from ${esc(p?.name)}'s profile.</p>
        <button class="btn primary" id="write">${kit.length ? 'Rewrite' : 'Write listing with AI'}</button>
        ${kit.length ? `<div class="stack" style="margin-top:12px" id="kit">
          ${kit.map((k, i) => {
            const f = fieldByFid[k.key];
            const max = f?.maxChars || f?.maxLength || d.limits?.[k.key] || 0;
            const value = f ? (s.values?.[k.key] ?? k.value) : k.value;
            return `<div class="kit-field"><div class="row"><b>${esc(k.label || k.key)}</b><span class="spacer"></span>${max ? `<span class="counter" data-max="${max}"></span>` : ''}<button class="btn sm" data-copy="${i}">Copy</button></div>
              <textarea data-kit="${i}" style="min-height:${value.length > 200 ? 140 : 60}px">${esc(value)}</textarea></div>`;
          }).join('')}
          <div class="row"><span class="spacer"></span><button class="btn" id="save-kit">Save edits</button></div>
        </div>` : ''}
        ${s.checklist?.length ? `<h3 style="margin-top:12px">Your checklist</h3><ul class="small">${s.checklist.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}
        ${s.notes ? `<p class="muted small">${esc(s.notes)}</p>` : ''}
        ${kit.length ? (s.styleIssues?.length ? `<div class="callout small" style="margin-top:8px"><b>Style check:</b> ${s.styleIssues.map(esc).join(' · ')}</div>` : '<p class="small" style="margin-top:8px"><span class="badge ok">Style check passed</span> <span class="muted">no filler words, dashes or over-limit fields</span></p>') : ''}
        ${!p?.factSheet ? '<div class="callout small" style="margin-top:8px">Crawl your site on the Product profile page first. Listings written from a full crawl are far more specific.</div>' : ''}
      </div>
      <div class="step"><h3>Fill it in the browser</h3>
        <p class="muted small">Opens ${esc(d.name)} in ${state.hosted ? 'a cloud browser' : 'a real Chromium window'}, logs in${cred ? ` as <b>${esc(cred.emailMasked)}</b>` : ' (no saved login: <a href="#" data-go-close="vault">add one</a>)'}, and fills every field. CAPTCHAs, email verification${d.manualOnly ? ' and the final click' : ''} stay with you.</p>
        <div class="stack">
          <label class="check"><input type="checkbox" id="opt-signup" /> Create a new account first with my saved login</label>
          <label class="check"><input type="checkbox" id="opt-auto" ${d.manualOnly ? 'disabled' : ''} /> Click Submit for me when there's no CAPTCHA${d.manualOnly ? ' (not allowed here)' : ''}</label>
          <div class="row"><button class="btn primary" id="run">${['needs_human', 'ready_for_review'].includes(s.status) ? 'Continue' : 'Fill in browser'}</button><button class="btn" id="open-window">Just open the site</button></div>
        </div>
      </div>
      <div class="step"><h3>Schedule the launch</h3>
        ${job ? `<p>Scheduled: <b>${fmt(job.runAt)}</b> (${job.type === 'submit' ? 'agent fills the form' : 'reminder'}${job.autoSubmit ? ', auto-submit' : ''}). <button class="btn sm danger" id="cancel-job">Cancel</button></p>` : ''}
        <div class="form-grid">
          <label>Date &amp; time<input type="datetime-local" id="sched-at" value="${toLocalInput(job?.runAt || s.launchAt)}" /></label>
          <label>At that time<select id="sched-type"><option value="submit">Agent fills the form</option><option value="reminder" ${d.manualOnly ? 'selected' : ''}>Remind me</option></select></label>
        </div>
        ${d.slug === 'product-hunt' ? '<p class="muted small" style="margin-top:8px">Product Hunt tip: their post form has its own "schedule launch" date. Fill the form now and set that date to 12:01 AM PT, or schedule a reminder here.</p>' : ''}
        <div class="row" style="margin-top:10px"><button class="btn" id="schedule">Schedule</button>
          ${!d.manualOnly ? '<label class="check small"><input type="checkbox" id="sched-auto" /> auto-submit</label>' : ''}</div>
      </div>
      <div class="step"><h3>Track it</h3>
        <div class="form-grid">
          <label>Status<select id="status">${Object.entries(STATUS_LABEL).map(([k, v]) => `<option value="${k}" ${s.status === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
          <label>Live listing URL<input id="live-url" value="${esc(s.liveUrl || '')}" placeholder="https://…" /></label>
        </div>
        <div class="row" style="margin-top:10px"><button class="btn" id="save-track">Save</button><span class="spacer"></span><button class="btn danger sm" id="remove-sub">Remove from launches</button></div>
      </div>
    </details>
      ${s.log?.length ? `<div class="step"><h3>Agent log</h3><div class="log">${s.log.slice().reverse().map((l) => `<div><span class="muted">${fmt(l.at)}</span> ${esc(l.message)}</div>`).join('')}</div></div>` : ''}
    </div>`;

  $('#drawer').classList.remove('hidden');
  const reload = async () => { await refresh('submissions', 'jobs', 'activity', 'credentials', 'directories'); openSubmission(id); };
  const counters = () => $$('.counter', panel).forEach((c) => {
    const ta = c.closest('.kit-field').querySelector('textarea');
    c.textContent = `${ta.value.length}/${c.dataset.max}`;
    c.classList.toggle('over', ta.value.length > Number(c.dataset.max));
  });
  counters();
  panel.addEventListener('input', counters);

  const saveSubmitUrl = async () => {
    const url = $('#submit-url').value.trim();
    if (url && url !== (s.submitUrl || d.submitUrl)) await api(`/submissions/${s.id}`, { method: 'PATCH', body: { submitUrl: url } });
  };
  $('#use-suggested')?.addEventListener('click', async (e) => {
    e.preventDefault();
    await api(`/submissions/${s.id}`, { method: 'PATCH', body: { submitUrl: s.suggestedSubmitUrl } });
    reload();
  });
  $('#analyze').addEventListener('click', (e) => busy(e.currentTarget, 'Reading form…', async () => {
    await saveSubmitUrl();
    const r = await api(`/submissions/${s.id}/analyze`, { body: {} });
    toast(r.note, 6000);
    reload();
  }));
  $('#write').addEventListener('click', (e) => busy(e.currentTarget, 'Writing…', async () => {
    await api(`/submissions/${s.id}/write`, { body: {} });
    reload();
  }));
  $$('[data-copy]', panel).forEach((b) => b.addEventListener('click', () => {
    navigator.clipboard.writeText($(`[data-kit="${b.dataset.copy}"]`, panel).value).then(() => toast('Copied'));
  }));
  $('#save-kit')?.addEventListener('click', (e) => busy(e.currentTarget, 'Saving', async () => {
    const values = { ...s.values };
    const newKit = kit.map((k, i) => {
      const value = $(`[data-kit="${i}"]`, panel).value;
      if (fieldByFid[k.key]) values[k.key] = value;
      return { ...k, value };
    });
    await api(`/submissions/${s.id}`, { method: 'PATCH', body: { kit: newKit, values } });
    toast('Saved');
    reload();
  }));
  $('#ap-one').addEventListener('click', (e) => busy(e.currentTarget, 'Autopilot working…', async () => {
    const r = await api(`/submissions/${s.id}/autopilot`, { body: {} });
    toast((r.log || []).slice(-1)[0]?.message || 'Done', 9000);
    reload();
  }));
  $('#site-pw-save')?.addEventListener('click', (e) => busy(e.currentTarget, 'Continuing…', async () => {
    const password = $('#site-pw').value;
    if (!password) throw new Error('Enter the password');
    await api(`/submissions/${s.id}/password`, { body: { password } });
    const r = await api(`/submissions/${s.id}/autopilot`, { body: {} });
    toast((r.log || []).slice(-1)[0]?.message || 'Done', 9000);
    reload();
  }));
  $('#find-listing')?.addEventListener('click', (e) => busy(e.currentTarget, 'Searching…', async () => {
    const r = await api(`/submissions/${s.id}/find-listing`, { body: {} });
    toast(r.note, 9000);
    reload();
  }));
  $('#run').addEventListener('click', (e) => busy(e.currentTarget, 'Agent working…', async () => {
    await saveSubmitUrl();
    const r = await api(`/submissions/${s.id}/run`, { body: { createAccount: $('#opt-signup').checked, autoSubmit: $('#opt-auto').checked } });
    toast((r.log || []).slice(-1)[0]?.message || 'Done', 8000);
    reload();
  }));
  $('#open-window').addEventListener('click', (e) => busy(e.currentTarget, 'Opening…', async () => {
    const r = await api(`/submissions/${s.id}/open`, { body: {} });
    if (r.liveViewUrl) window.open(r.liveViewUrl, '_blank', 'noopener');
    else toast('Opened in the LaunchPilot browser window');
  }));
  $('#schedule').addEventListener('click', (e) => busy(e.currentTarget, 'Scheduling', async () => {
    const at = $('#sched-at').value;
    if (!at) throw new Error('Pick a date and time');
    await api(`/submissions/${s.id}/schedule`, { body: { runAt: new Date(at).toISOString(), type: $('#sched-type').value, autoSubmit: $('#sched-auto')?.checked } });
    toast(state.hosted ? 'Scheduled. The server runs it at its next scheduled check after that time.' : 'Scheduled. Keep LaunchPilot running so it can fire on time.');
    reload();
  }));
  $('#cancel-job')?.addEventListener('click', async () => {
    await api(`/jobs/${job.id}`, { method: 'DELETE' });
    await api(`/submissions/${s.id}`, { method: 'PATCH', body: { status: s.kit?.length ? 'written' : 'draft' } });
    reload();
  });
  $('#save-track').addEventListener('click', (e) => busy(e.currentTarget, 'Saving', async () => {
    await api(`/submissions/${s.id}`, { method: 'PATCH', body: { status: $('#status').value, liveUrl: $('#live-url').value } });
    toast('Saved');
    reload();
  }));
  $('#remove-sub').addEventListener('click', async () => {
    if (!confirm(`Remove ${d.name} from this product's launches?`)) return;
    await api(`/submissions/${s.id}`, { method: 'DELETE' });
    closeDrawer();
    await refresh('submissions', 'jobs');
    render();
  });
}

function closeDrawer() {
  $('#drawer').classList.add('hidden');
  render();
}

// ------------------------------------------------------------------- Schedule
function viewSchedule(el) {
  const jobs = state.jobs.slice().sort((a, b) => a.runAt.localeCompare(b.runAt));
  const upcoming = jobs.filter((j) => j.status === 'scheduled');
  const past = jobs.filter((j) => j.status !== 'scheduled').reverse().slice(0, 50);
  const row = (j) => {
    const s = state.submissions.find((x) => x.id === j.submissionId);
    const p = s && state.products.find((x) => x.id === s.productId);
    return `<tr class="clickable" data-open-sub="${j.submissionId}"><td>${fmt(j.runAt)}</td><td>${esc(j.title)}</td><td class="small">${esc(p?.name || '')}</td><td>${j.type === 'submit' ? 'Agent fills form' : 'Reminder'}${j.autoSubmit ? ' + submit' : ''}</td><td><span class="badge ${esc(j.status)}">${esc(j.status)}</span>${j.error ? `<div class="small muted">${esc(j.error)}</div>` : ''}</td></tr>`;
  };
  el.innerHTML = `
    <div class="page-head"><div><h1>Schedule</h1><p class="muted">Scheduled jobs run while LaunchPilot is open. Anything due while it was closed runs on the next start.</p></div></div>
    <div class="card" style="margin-bottom:16px"><h2>Upcoming</h2>${upcoming.length ? `<div class="table-wrap"><table><thead><tr><th>When</th><th>What</th><th>Product</th><th>Action</th><th>Status</th></tr></thead><tbody>${upcoming.map(row).join('')}</tbody></table></div>` : '<p class="muted">Nothing scheduled. Open a launch and use "Schedule the launch".</p>'}</div>
    <div class="card"><h2>History</h2>${past.length ? `<div class="table-wrap"><table><thead><tr><th>When</th><th>What</th><th>Product</th><th>Action</th><th>Status</th></tr></thead><tbody>${past.map(row).join('')}</tbody></table></div>` : '<p class="muted">No past jobs.</p>'}</div>`;
}

// ---------------------------------------------------------------------- Vault
function viewVault(el) {
  const dirs = state.directories.slice().sort((a, b) => a.name.localeCompare(b.name));
  el.innerHTML = `
    <div class="page-head"><div><h1>Logins vault</h1><p class="muted">Passwords are encrypted with AES-256-GCM on this computer and only decrypted inside the browser automation. They're never shown again or sent to the AI.</p></div></div>
    <form class="card stack" id="cred-form" style="margin-bottom:16px">
      <h2>Add a login</h2>
      <div class="form-grid">
        <label>Email<input name="email" type="email" required autocomplete="off" /></label>
        <label>Password<input name="password" type="password" required autocomplete="new-password" /></label>
        <label>Use for<select name="directoryId"><option value="">Every site (default login)</option>${dirs.map((d) => `<option value="${d.id}">${esc(d.name)}</option>`).join('')}</select></label>
        <label>Label (optional)<input name="label" placeholder="e.g. launch inbox" /></label>
      </div>
      <p class="muted small">Tip: use a dedicated launch email and a unique password per platform. Sites that only offer "Sign in with Google/GitHub" need you to sign in once in the LaunchPilot window; it stays signed in after that.</p>
      <div class="row"><span class="spacer"></span><button class="btn primary" type="submit">Save login</button></div>
    </form>
    <div class="card"><h2>Saved logins</h2>${state.credentials.length ? `<div class="list">${state.credentials.map((c) => `<div class="list-item"><b>${esc(c.emailMasked)}</b>
      <span class="badge">${c.isDefault ? 'Default for all sites' : esc(dirById(c.directoryId)?.name || c.domain || 'Any')}</span><span class="muted small">${esc(c.label || '')}</span><span class="spacer"></span><button class="btn sm danger" data-del-cred="${c.id}">Delete</button></div>`).join('')}</div>` : '<p class="muted">No logins saved.</p>'}</div>`;

  $('#cred-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    data.isDefault = !data.directoryId;
    busy(e.submitter, 'Saving', async () => {
      await api('/credentials', { body: data });
      await refresh('credentials');
      toast('Login saved (encrypted)');
      render();
    });
  });
  $$('[data-del-cred]', el).forEach((b) => b.addEventListener('click', async () => {
    if (!confirm('Delete this login?')) return;
    await api(`/credentials/${b.dataset.delCred}`, { method: 'DELETE' });
    await refresh('credentials');
    render();
  }));
}

// ----------------------------------------------------------------------- Help
function viewHelp(el) {
  el.innerHTML = `
    <div class="page-head"><div><h1>How LaunchPilot works</h1></div></div>
    <div class="grid cols-2">
      <div class="card"><h2>The workflow</h2><ol>
        <li><b>Product profile</b>: paste your URL, the agent drafts everything.</li>
        <li><b>Listing sites</b>: pick from the catalog, paste any site's URL, or let the AI search the web for new ones.</li>
        <li><b>Analyze form</b>: the agent reads the submit page and maps each field.</li>
        <li><b>Write listing</b>: unique, limit-aware copy for that platform.</li>
        <li><b>Fill in browser</b>: a real Chromium window logs in and fills the form.</li>
        <li><b>You review &amp; submit</b>, or schedule it for launch day.</li>
        <li><b>Track</b>: mark submitted / live, add the live URL, export CSV.</li></ol></div>
      <div class="card"><h2>What stays with you</h2>
        <p>LaunchPilot never solves CAPTCHAs or bypasses verification. When a site shows one, the window stays open and the launch moves to <b>Needs you</b>. Solve it, then press <b>Continue</b>.</p>
        <p>Launch platforms with strict rules (Product Hunt, Hacker News, Reddit…) are marked <span class="badge">You post</span>: the agent prepares everything but you click the final button. That protects your accounts from bans.</p>
        <p>Follow each platform's terms. Don't create multiple accounts on one platform or ask for upvotes.</p></div>
      ${state.hosted ? `<div class="card"><h2>Scheduling</h2><p>Scheduled launches run on the server at its next scheduled check after the time you pick, even with this tab closed.</p></div>
      <div class="card"><h2>Your data</h2><p>Your products, listings and launch history are private to your account. Site passwords are encrypted with a key unique to you. Sign-ins to listing sites are kept so autopilot stays logged in.</p></div>`
      : `<div class="card"><h2>Scheduling</h2><p>Scheduled jobs run while the app is open (keep the terminal running, or run it on an always-on machine). If the computer was off, due jobs run on the next start.</p></div>
      <div class="card"><h2>Your data</h2><p>Everything lives in <code>launchpilot/data/</code> on this machine: the database, uploads, encrypted logins and browser profiles. Back up <code>data/.master.key</code> (or your <code>LAUNCHPILOT_MASTER_KEY</code>); without it saved passwords can't be decrypted.</p></div>`}
    </div>`;
}

// ------------------------------------------------------------------ Bootstrap
document.addEventListener('click', (e) => {
  if (e.target.closest('[data-stop]')) return; // plain links inside clickable rows
  const t = e.target.closest('[data-go], [data-go-close], [data-open-sub], [data-close], [data-dismiss], #nav a, #sign-out');
  if (!t) return;
  if (t.matches('#nav a')) return go(t.dataset.view);
  if (t.dataset.go) { e.preventDefault(); return go(t.dataset.go); }
  if (t.dataset.goClose) { e.preventDefault(); $('#drawer').classList.add('hidden'); return go(t.dataset.goClose); }
  if (t.dataset.openSub) return openSubmission(t.dataset.openSub);
  if (t.hasAttribute('data-close')) return closeDrawer();
  if (t.id === 'sign-out') { e.preventDefault(); return api('/auth/logout', { body: {} }).then(() => location.reload()); }
  if (t.dataset.dismiss) return api(`/jobs/${t.dataset.dismiss}/dismiss`, { body: {} }).then(() => refresh('jobs')).then(render);
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#drawer').classList.contains('hidden')) closeDrawer(); });

$('#product-select').addEventListener('change', (e) => {
  if (e.target.value === '__new') {
    state.productId = '__new';
    return go('products');
  }
  state.productId = e.target.value;
  localStorage.setItem('lp.product', state.productId);
  render();
});

$('#login-switch').addEventListener('click', (e) => {
  e.preventDefault();
  state.signup = !state.signup;
  $('#login-error').textContent = '';
  showLogin();
});

$('#login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target;
  try {
    if (state.hosted) {
      state.me = { ...state.me, ...(await api(state.signup ? '/auth/signup' : '/auth/login', { body: { email: f.email.value, password: f.password.value, invite: f.invite.value } })) };
    } else {
      await api('/login', { body: { password: f.password.value } });
    }
    await start();
  } catch (err) {
    $('#login-error').textContent = err.message;
  }
});

async function start() {
  // Hosted (Vercel) build: sign in with an email account first.
  const me = await fetch('/api/auth/me').then((r) => (r.ok ? r.json() : null)).catch(() => null);
  if (me?.hosted) {
    state.hosted = true;
    state.me = me;
    if (!me.email) return showLogin();
  }
  try {
    await refresh();
  } catch {
    return;
  }
  $('#login').classList.add('hidden');
  $('#app').classList.remove('hidden');
  render();
  // Keep "Needs you" and the schedule fresh while scheduled jobs run.
  setInterval(async () => {
    if (!$('#drawer').classList.contains('hidden') || document.activeElement?.matches('input, textarea, select')) return;
    await refresh('submissions', 'jobs', 'activity').catch(() => {});
    if (['dashboard', 'launches', 'schedule'].includes(state.view)) render();
  }, 30000);
}

start();

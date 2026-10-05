// LaunchPilot cloud app. Served at /launchpilot; data and AI via /api/launchpilot/*.

const CATALOG = [{"slug":"product-hunt","name":"Product Hunt","url":"https://www.producthunt.com","submitUrl":"https://www.producthunt.com/posts/new","category":"launch","pricing":"free","tier":1,"launch":true,"manualOnly":true,"launchTips":"Launch Tue-Thu at 12:01 AM PT (the day resets at midnight Pacific). You can schedule up to a month ahead from the post form. Post a maker first comment right after going live. Never ask for upvotes directly."},{"slug":"hacker-news","name":"Hacker News (Show HN)","url":"https://news.ycombinator.com","submitUrl":"https://news.ycombinator.com/submit","category":"launch","pricing":"free","tier":1,"launch":true,"manualOnly":true,"launchTips":"Title starts with \"Show HN:\". Weekdays 8-10 AM US Eastern work well. Link to something people can try without signing up, and stay in the comments."},{"slug":"betalist","name":"BetaList","url":"https://betalist.com","submitUrl":"https://betalist.com/submit","category":"launch","pricing":"freemium","tier":1,"launch":true,"manualOnly":false,"launchTips":"Free queue is weeks long; the paid option jumps it. Submit early, before your main launch."},{"slug":"peerlist-launchpad","name":"Peerlist Launchpad","url":"https://peerlist.io","submitUrl":"https://peerlist.io/launchpad","category":"launch","pricing":"free","tier":2,"launch":true,"manualOnly":false,"launchTips":"Weekly launch cycle starting Monday. Needs a Peerlist profile."},{"slug":"uneed","name":"Uneed","url":"https://www.uneed.best","submitUrl":"https://www.uneed.best/submit-a-tool","category":"launch","pricing":"freemium","tier":2,"launch":true,"manualOnly":false,"launchTips":"Daily launches; free slots book out, paid skips the line."},{"slug":"microlaunch","name":"Microlaunch","url":"https://microlaunch.net","submitUrl":"https://microlaunch.net/submit","category":"launch","pricing":"freemium","tier":2,"launch":true,"manualOnly":false,"launchTips":"Month-long launch window; pick a start week."},{"slug":"fazier","name":"Fazier","url":"https://fazier.com","submitUrl":"https://fazier.com/submit","category":"launch","pricing":"freemium","tier":2,"launch":true,"manualOnly":false},{"slug":"devhunt","name":"DevHunt","url":"https://devhunt.org","submitUrl":"https://devhunt.org/","category":"launch","pricing":"freemium","tier":2,"launch":true,"manualOnly":false,"launchTips":"Developer tools only. Weekly launches."},{"slug":"tinylaunch","name":"TinyLaunch","url":"https://www.tinylaunch.com","submitUrl":"https://www.tinylaunch.com/submit","category":"launch","pricing":"freemium","tier":3,"launch":true,"manualOnly":false},{"slug":"launching-next","name":"Launching Next","url":"https://www.launchingnext.com","submitUrl":"https://www.launchingnext.com/submit/","category":"launch","pricing":"free","tier":3,"launch":false,"manualOnly":false},{"slug":"indie-hackers","name":"Indie Hackers","url":"https://www.indiehackers.com","submitUrl":"https://www.indiehackers.com/products","category":"launch","pricing":"free","tier":2,"launch":false,"manualOnly":true},{"slug":"startupbase","name":"StartupBase","url":"https://startupbase.io","submitUrl":"https://startupbase.io/submit","category":"launch","pricing":"free","tier":3,"launch":false,"manualOnly":false},{"slug":"betapage","name":"BetaPage","url":"https://betapage.co","submitUrl":"https://betapage.co/submit-startup","category":"launch","pricing":"freemium","tier":3,"launch":false,"manualOnly":false},{"slug":"10words","name":"10words","url":"https://10words.io","submitUrl":"https://10words.io/submit","category":"launch","pricing":"free","tier":3,"launch":false,"manualOnly":false},{"slug":"sideprojectors","name":"SideProjectors","url":"https://www.sideprojectors.com","submitUrl":"https://www.sideprojectors.com/project/new","category":"launch","pricing":"free","tier":3,"launch":false,"manualOnly":false},{"slug":"theresanaiforthat","name":"There's An AI For That","url":"https://theresanaiforthat.com","submitUrl":"https://theresanaiforthat.com/submit/","category":"ai","pricing":"paid","tier":1,"launch":false,"manualOnly":false},{"slug":"futurepedia","name":"Futurepedia","url":"https://www.futurepedia.io","submitUrl":"https://www.futurepedia.io/submit-tool","category":"ai","pricing":"paid","tier":1,"launch":false,"manualOnly":false},{"slug":"toolify","name":"Toolify.ai","url":"https://www.toolify.ai","submitUrl":"https://www.toolify.ai/submit","category":"ai","pricing":"freemium","tier":1,"launch":false,"manualOnly":false},{"slug":"futuretools","name":"FutureTools","url":"https://www.futuretools.io","submitUrl":"https://www.futuretools.io/submit-a-tool","category":"ai","pricing":"free","tier":1,"launch":false,"manualOnly":false},{"slug":"topai-tools","name":"TopAI.tools","url":"https://topai.tools","submitUrl":"https://topai.tools/submit","category":"ai","pricing":"freemium","tier":2,"launch":false,"manualOnly":false},{"slug":"aitoolsdirectory","name":"AI Tools Directory","url":"https://aitoolsdirectory.com","submitUrl":"https://aitoolsdirectory.com/submit","category":"ai","pricing":"freemium","tier":2,"launch":false,"manualOnly":false},{"slug":"aitoolhunt","name":"AI Tool Hunt","url":"https://www.aitoolhunt.com","submitUrl":"https://www.aitoolhunt.com/submit-tool","category":"ai","pricing":"freemium","tier":2,"launch":false,"manualOnly":false},{"slug":"easywithai","name":"Easy With AI","url":"https://easywithai.com","submitUrl":"https://easywithai.com/submit-ai-tools/","category":"ai","pricing":"freemium","tier":2,"launch":false,"manualOnly":false},{"slug":"aitoolmall","name":"AI Tool Mall","url":"https://www.aitoolmall.com","submitUrl":"https://www.aitoolmall.com/submit","category":"ai","pricing":"free","tier":3,"launch":false,"manualOnly":false},{"slug":"insidr","name":"Insidr AI Tools","url":"https://www.insidr.ai","submitUrl":"https://www.insidr.ai/submit-tool/","category":"ai","pricing":"free","tier":3,"launch":false,"manualOnly":false},{"slug":"aiscout","name":"AI Scout","url":"https://aiscout.net","submitUrl":"https://aiscout.net/submit-tool/","category":"ai","pricing":"free","tier":3,"launch":false,"manualOnly":false},{"slug":"aicenter","name":"AI Center","url":"https://aicenter.ai","submitUrl":"https://aicenter.ai/submit","category":"ai","pricing":"free","tier":3,"launch":false,"manualOnly":false},{"slug":"allthingsai","name":"AllThingsAI","url":"https://allthingsai.com","submitUrl":"https://allthingsai.com/submit","category":"ai","pricing":"freemium","tier":3,"launch":false,"manualOnly":false},{"slug":"dang-ai","name":"Dang.ai","url":"https://dang.ai","submitUrl":"https://dang.ai/submit","category":"ai","pricing":"freemium","tier":2,"launch":false,"manualOnly":false},{"slug":"aitoptools","name":"AI Top Tools","url":"https://aitoptools.com","submitUrl":"https://aitoptools.com/submit-tool/","category":"ai","pricing":"freemium","tier":3,"launch":false,"manualOnly":false},{"slug":"openfuture","name":"OpenFuture","url":"https://openfuture.ai","submitUrl":"https://openfuture.ai/submit-tool","category":"ai","pricing":"freemium","tier":3,"launch":false,"manualOnly":false},{"slug":"toolpilot","name":"Toolpilot","url":"https://www.toolpilot.ai","submitUrl":"https://www.toolpilot.ai/pages/submit-tool","category":"ai","pricing":"paid","tier":3,"launch":false,"manualOnly":false},{"slug":"aicyclopedia","name":"AIcyclopedia","url":"https://www.aicyclopedia.com","submitUrl":"https://www.aicyclopedia.com/submit-ai-tool/","category":"ai","pricing":"free","tier":3,"launch":false,"manualOnly":false},{"slug":"saasaitools","name":"SaaS AI Tools","url":"https://saasaitools.com","submitUrl":"https://saasaitools.com/submit/","category":"ai","pricing":"freemium","tier":3,"launch":false,"manualOnly":false},{"slug":"ainavigator","name":"AI Navigator","url":"https://ainavigator.com","submitUrl":"https://ainavigator.com/submit","category":"ai","pricing":"free","tier":3,"launch":false,"manualOnly":false},{"slug":"g2","name":"G2","url":"https://www.g2.com","submitUrl":"https://www.g2.com/products/new","category":"review","pricing":"free","tier":1,"launch":false,"manualOnly":false},{"slug":"capterra","name":"Capterra (+ GetApp, Software Advice)","url":"https://www.capterra.com","submitUrl":"https://www.capterra.com/vendors/sign-up","category":"review","pricing":"free","tier":1,"launch":false,"manualOnly":false,"launchTips":"One Gartner Digital Markets vendor account lists you on Capterra, GetApp and Software Advice."},{"slug":"alternativeto","name":"AlternativeTo","url":"https://alternativeto.net","submitUrl":"https://alternativeto.net/manage-app/","category":"review","pricing":"free","tier":1,"launch":false,"manualOnly":false,"launchTips":"List yourself as an alternative to the 3-5 best-known competitors."},{"slug":"saashub","name":"SaaSHub","url":"https://www.saashub.com","submitUrl":"https://www.saashub.com/submit","category":"review","pricing":"freemium","tier":1,"launch":false,"manualOnly":false},{"slug":"saasworthy","name":"SaaSworthy","url":"https://www.saasworthy.com","submitUrl":"https://www.saasworthy.com/submit-product","category":"review","pricing":"free","tier":2,"launch":false,"manualOnly":false},{"slug":"sourceforge","name":"SourceForge","url":"https://sourceforge.net","submitUrl":"https://sourceforge.net/software/vendors/new","category":"review","pricing":"free","tier":1,"launch":false,"manualOnly":false},{"slug":"trustradius","name":"TrustRadius","url":"https://www.trustradius.com","submitUrl":"https://www.trustradius.com/vendors","category":"review","pricing":"free","tier":2,"launch":false,"manualOnly":false},{"slug":"crozdesk","name":"Crozdesk","url":"https://crozdesk.com","submitUrl":"https://vendor.crozdesk.com/","category":"review","pricing":"free","tier":2,"launch":false,"manualOnly":false},{"slug":"slashdot","name":"Slashdot Software","url":"https://slashdot.org/software/","submitUrl":"https://slashdot.org/software/vendors/new","category":"review","pricing":"free","tier":2,"launch":false,"manualOnly":false},{"slug":"stackshare","name":"StackShare","url":"https://stackshare.io","submitUrl":"https://stackshare.io/tools/new","category":"review","pricing":"free","tier":2,"launch":false,"manualOnly":false},{"slug":"softwaresuggest","name":"SoftwareSuggest","url":"https://www.softwaresuggest.com","submitUrl":"https://www.softwaresuggest.com/vendors","category":"review","pricing":"free","tier":2,"launch":false,"manualOnly":false},{"slug":"saasgenius","name":"SaaS Genius","url":"https://www.saasgenius.com","submitUrl":"https://www.saasgenius.com/vendors","category":"review","pricing":"free","tier":3,"launch":false,"manualOnly":false},{"slug":"trustpilot","name":"Trustpilot","url":"https://www.trustpilot.com","submitUrl":"https://business.trustpilot.com/signup","category":"review","pricing":"freemium","tier":1,"launch":false,"manualOnly":false},{"slug":"startup-stash","name":"Startup Stash","url":"https://startupstash.com","submitUrl":"https://startupstash.com/add-listing/","category":"startup","pricing":"freemium","tier":2,"launch":false,"manualOnly":false},{"slug":"crunchbase","name":"Crunchbase","url":"https://www.crunchbase.com","submitUrl":"https://www.crunchbase.com/add-new","category":"startup","pricing":"free","tier":1,"launch":false,"manualOnly":false},{"slug":"wellfound","name":"Wellfound (AngelList)","url":"https://wellfound.com","submitUrl":"https://wellfound.com/recruit/startup/new","category":"startup","pricing":"free","tier":1,"launch":false,"manualOnly":false},{"slug":"f6s","name":"F6S","url":"https://www.f6s.com","submitUrl":"https://www.f6s.com/company/new","category":"startup","pricing":"free","tier":2,"launch":false,"manualOnly":false},{"slug":"startupbuffer","name":"Startup Buffer","url":"https://startupbuffer.com","submitUrl":"https://startupbuffer.com/site/submit","category":"startup","pricing":"freemium","tier":3,"launch":false,"manualOnly":false},{"slug":"startupranking","name":"Startup Ranking","url":"https://www.startupranking.com","submitUrl":"https://www.startupranking.com/startup/create","category":"startup","pricing":"free","tier":3,"launch":false,"manualOnly":false},{"slug":"allstartups","name":"AllStartups","url":"https://allstartups.info","submitUrl":"https://allstartups.info/Startups/Submit","category":"startup","pricing":"free","tier":3,"launch":false,"manualOnly":false},{"slug":"startuplister","name":"StartupLister","url":"https://startuplister.com","submitUrl":"https://startuplister.com","category":"startup","pricing":"paid","tier":3,"launch":false,"manualOnly":false,"launchTips":"Paid service that submits you to ~100 directories; useful as a comparison point."},{"slug":"saas-directory","name":"SaaS Directory","url":"https://saasdirectory.io","submitUrl":"https://saasdirectory.io/submit","category":"startup","pricing":"free","tier":3,"launch":false,"manualOnly":false},{"slug":"launched","name":"Launched","url":"https://launched.io","submitUrl":"https://launched.io/submit","category":"startup","pricing":"free","tier":3,"launch":false,"manualOnly":false},{"slug":"startupinspire","name":"Startup Inspire","url":"https://www.startupinspire.com","submitUrl":"https://www.startupinspire.com/submit","category":"startup","pricing":"free","tier":3,"launch":false,"manualOnly":false},{"slug":"github-awesome","name":"GitHub awesome-lists","url":"https://github.com/topics/awesome","submitUrl":"https://github.com/topics/awesome","category":"dev","pricing":"free","tier":1,"launch":false,"manualOnly":true,"launchTips":"Open small PRs adding your product to relevant awesome-* lists. High-authority links."},{"slug":"devto","name":"DEV Community","url":"https://dev.to","submitUrl":"https://dev.to/new","category":"dev","pricing":"free","tier":2,"launch":false,"manualOnly":true,"launchTips":"Write a build story, not an ad."},{"slug":"hashnode","name":"Hashnode","url":"https://hashnode.com","submitUrl":"https://hashnode.com/onboard","category":"dev","pricing":"free","tier":3,"launch":false,"manualOnly":true},{"slug":"lobsters","name":"Lobsters","url":"https://lobste.rs","submitUrl":"https://lobste.rs/stories/new","category":"dev","pricing":"free","tier":2,"launch":false,"manualOnly":true,"launchTips":"Invite-only; use the \"show\" tag."},{"slug":"reddit-sideproject","name":"Reddit r/SideProject","url":"https://www.reddit.com/r/SideProject/","submitUrl":"https://www.reddit.com/r/SideProject/submit","category":"community","pricing":"free","tier":1,"launch":true,"manualOnly":true,"launchTips":"Read each subreddit's rules first. Also try r/InternetIsBeautiful, r/alphaandbetausers, r/startups (weekly threads)."},{"slug":"reddit-imadethis","name":"Reddit r/IMadeThis","url":"https://www.reddit.com/r/imadethis/","submitUrl":"https://www.reddit.com/r/imadethis/submit","category":"community","pricing":"free","tier":3,"launch":false,"manualOnly":true},{"slug":"quora","name":"Quora","url":"https://www.quora.com","submitUrl":"https://www.quora.com","category":"community","pricing":"free","tier":2,"launch":false,"manualOnly":true,"launchTips":"Answer existing questions where your product genuinely helps."},{"slug":"growthhackers","name":"GrowthHackers","url":"https://growthhackers.com","submitUrl":"https://growthhackers.com","category":"community","pricing":"free","tier":3,"launch":false,"manualOnly":true},{"slug":"google-business","name":"Google Business Profile","url":"https://www.google.com/business/","submitUrl":"https://business.google.com/create","category":"business","pricing":"free","tier":1,"launch":false,"manualOnly":true},{"slug":"bing-places","name":"Bing Places","url":"https://www.bingplaces.com","submitUrl":"https://www.bingplaces.com","category":"business","pricing":"free","tier":2,"launch":false,"manualOnly":true},{"slug":"linkedin-page","name":"LinkedIn Company Page","url":"https://www.linkedin.com","submitUrl":"https://www.linkedin.com/company/setup/new/","category":"business","pricing":"free","tier":1,"launch":false,"manualOnly":true}];
const CATEGORIES = { launch: 'Launch platforms', ai: 'AI tool directories', review: 'Software review sites', startup: 'Startup directories', dev: 'Developer communities', community: 'Communities & forums', business: 'Business profiles' };
const STATUS = { todo: 'Not started', ready: 'Copy ready', scheduled: 'Scheduled', submitted: 'Submitted', live: 'Live', rejected: 'Rejected', skipped: 'Skipped' };
const REPO = 'https://github.com/Jitesh-57/jpt-bg-remover/tree/claude/beautiful-albattani-kfhctl/launchpilot';

// The Pixel Shine profile, offered as a one-click starting point. Built from
// the site's own pages (tools, pricing, FAQ), not guessed.
const STARTER_FACTS = "## What it is\nPixel Shine (sjpt.io) is an online image studio: a set of free browser tools for everyday image jobs, plus paid AI tools for editing and generating photos.\n\n## Who it's for\nCreators, marketers, online sellers, job seekers and anyone who needs a quick image edit. The site has use-case pages for LinkedIn, social media, ecommerce, real estate, photography, creators and weddings.\n\n## Products and tools\nFree tools (no account, no limit, no watermark, run in the browser):\n- Compress: shrink JPG, PNG and WebP files before sharing\n- Convert: switch between image formats\n- Crop and resize: crop for Instagram and other sizes, resize to exact pixels\n- Rotate and flip\n- Blur image: blur or pixelate faces and sensitive info by dragging a box\n- Add watermark, meme text, image to PDF\n- QR code generator: any link or text, download PNG or SVG, custom colours\n- Upscale (normal): free upscaling\n- Watermark remover: paint over a logo, text or timestamp and AI erases it; runs in the browser, nothing is uploaded\n- Invisible watermark and metadata remover: strips EXIF, GPS, XMP, C2PA data and AI prompts from files, and hidden characters from text\n- TikTok watermark remover: paste a TikTok link, download the video in HD without the watermark\n\nAI tools (paid with credits):\n- AI image editor: change a photo by describing the edit in plain English (\"make it a 1980s studio portrait\", \"put me on a beach at golden hour\"); change backgrounds, lighting and style\n- Background remover and background swap\n- AI headshots: LinkedIn-ready studio portraits from one selfie\n- 4x upscale to 4K\n- Batch editor: apply one edit to up to 100 images at once\n- Text to image: type what you imagine and get a finished high-res image\n- 200+ creative apps: each app carries a tuned prompt, so you upload a photo and tap; no prompt writing\n- Prompt library: free image and video prompts for major models (GPT Image, Nano Banana Pro, Seedream, Grok Imagine, Seedance and more), each credited to its author\n\n## Pricing\n- Free tools stay free and unlimited, no account needed.\n- AI tools use credits. Each AI generation costs 2 credits.\n- One-time credit packs, no subscription, nothing auto-renews, credits never expire and stack:\n  - Starter: 5 credits, Rs 166 (about $2), 2 generations\n  - Creator: 20 credits, Rs 415 (about $5), 10 generations\n  - Studio: 50 credits, Rs 830 (about $10), 25 generations\n- Every download is full resolution with no watermark, free and paid.\n\n## What makes it different\n- No watermark on any export, including free tools\n- Free tools need no sign-up and many run entirely in the browser, so images stay on your device\n- Pay once for AI credits instead of a monthly subscription; credits never expire\n- Free and AI tools live in one place\n\n## Proof points\n- 200+ creative AI apps\n- Batch edits of up to 100 images\n- Upscaling to 4K\n\n## Common questions\n- Do credits expire? No, there's no monthly reset and no expiry.\n- Is it a subscription? No, each pack is a one-time payment.\n- What's free? Compress, convert, crop, resize, rotate, blur, watermark, meme text, image to PDF, QR codes and normal upscaling.\n\n## Tone of the site\nCasual and direct. Short sentences, \"you\", plain words like \"no catch\", \"no sign-up\", \"nothing to install\".\n\n## Pages read\nsjpt.io home, /tools, /pricing, /ai-editor, /upscale, /batch-editor, /creative, /ai-headshot, /watermark-remover, /invisible-watermark-remover, /qr-code-generator, /blur-image, /tiktok-watermark-remover, /prompts, /use-cases, /alternatives";

const STARTER = {
  name: 'Pixel Shine', url: 'https://www.sjpt.io', tagline: 'Free image tools and pay-once AI photo editing',
  shortDescription: 'Compress, crop, convert and remove watermarks free in your browser. Edit photos by describing the change, with AI credits that never expire.',
  longDescription: 'Pixel Shine puts the everyday image jobs in one place. Compress, convert, crop, resize, blur faces, make QR codes or strip metadata for free, with no account and no watermark on the download. Most of these run in your browser, so the file never leaves your device.\n\nThe AI side handles the harder edits. Describe what you want in a sentence ("swap the background for a beach at sunset") and the editor does it. You can also turn one selfie into LinkedIn headshots, upscale to 4K, or run one edit across 100 photos at once.\n\nAI tools use credits from one-time packs starting at about $2. There is no subscription and the credits never expire.',
  pricing: 'freemium', pricingDetails: 'Free tools are free and unlimited. AI tools use one-time credit packs: 5 credits for about $2, 20 for $5, 50 for $10. Two credits per generation, no expiry.',
  categories: ['Design Tools', 'Photography', 'Artificial Intelligence', 'Productivity'],
  tags: ['image editor', 'ai photo editor', 'background remover', 'image upscaler', 'image compressor', 'watermark remover', 'ai headshots', 'qr code generator', 'batch image editing', 'no watermark'],
  features: ['AI image editor: edit a photo by describing the change', 'AI headshots: studio portraits from one selfie', 'Batch editor: one edit across up to 100 images', '4x upscale to 4K', 'Watermark remover: paint over it, runs in your browser', 'Metadata remover: strips EXIF, GPS and C2PA data', '200+ one-tap creative apps', 'Free compress, convert, crop, resize and QR tools'],
  competitors: ['Remove.bg', 'Canva', 'PhotoRoom', 'TinyPNG', 'Adobe Express', 'Fotor', 'Pixlr'],
  audience: 'Creators, marketers, online sellers and job seekers who need quick image edits',
  factSheet: STARTER_FACTS,
};

const PROFILE_TEXT = [
  ['name', 'Product name', 0], ['url', 'Website URL', 0], ['tagline', 'Tagline', 60], ['shortDescription', 'Short description', 160],
  ['longDescription', 'Long description', 1000], ['audience', 'Who it\'s for', 0], ['pricingDetails', 'Pricing details', 0],
  ['makerName', 'Maker name', 0], ['makerEmail', 'Contact email', 0], ['twitter', 'X / Twitter URL', 0], ['linkedin', 'LinkedIn URL', 0], ['videoUrl', 'Demo video URL', 0],
];
const PROFILE_LISTS = [['categories', 'Categories'], ['tags', 'Tags'], ['features', 'Key features'], ['competitors', 'Alternative to']];

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '');
const ls = { get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };

const state = {
  tab: ls.get('lp.tab', 'overview'), productId: ls.get('lp.product', null), docs: {}, ready: false, mode: 'local',
  filters: { q: '', category: '', pricing: '', show: 'all' }, selected: new Set(), confirm: null,
};

// ------------------------------------------------------------------ Storage
// Each signed-in user's data is saved on the server. Edits are batched and sent
// a moment after the last change.
const store = {
  timer: null,
  saving: false,
  dirty: false,
  async init() {
    const res = await fetch('/api/launchpilot/state', { credentials: 'same-origin' });
    if (res.status === 401) return false;
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Could not load your data');
    state.docs = data.docs || {};
    state.user = data.user;
    state.aiAvailable = data.aiAvailable;
    return true;
  },
  schedule() {
    this.dirty = true;
    $('#sync').textContent = 'Saving…';
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), 700);
  },
  async flush() {
    if (this.saving) { this.timer = setTimeout(() => this.flush(), 400); return; }
    this.saving = true;
    this.dirty = false;
    try {
      const res = await fetch('/api/launchpilot/state', { method: 'PUT', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ docs: state.docs }) });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Could not save');
      if (!this.dirty) $('#sync').textContent = 'All changes saved';
    } catch (e) {
      $('#sync').textContent = 'Not saved, retrying…';
      toast(e.message);
      this.timer = setTimeout(() => this.flush(), 4000);
    } finally {
      this.saving = false;
    }
  },
  save(doc) {
    doc.updatedAt = new Date().toISOString();
    state.docs[doc.id] = doc;
    this.schedule();
  },
  remove(id) {
    delete state.docs[id];
    this.schedule();
  },
};
window.addEventListener('beforeunload', (e) => { if (store.dirty || store.saving) { e.preventDefault(); e.returnValue = ''; } });

const ofKind = (k) => Object.values(state.docs).filter((d) => d.kind === k);
const products = () => ofKind('product').sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
const product = () => state.docs[state.productId]?.kind === 'product' ? state.docs[state.productId] : null;
const sites = () => [...CATALOG.map((c) => ({ ...c, id: c.slug })), ...ofKind('site')].filter((s) => !s.removed);
const siteById = (id) => sites().find((s) => s.id === id) || CATALOG.find((c) => c.slug === id);
const launches = () => ofKind('launch').filter((l) => l.productId === state.productId);

// --------------------------------------------------------------------- AI
async function ai(action, payload, btn, label) {
  const original = btn?.innerHTML;
  if (btn) { btn.disabled = true; btn.innerHTML = `<span class="thinking">${esc(label)}</span>`; }
  try {
    const res = await fetch('/api/launchpilot/ai', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action, ...payload }) });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) { showSignIn(); throw new Error('Please sign in again.'); }
    if (!res.ok) throw new Error(data.error || 'Something went wrong. Try again.');
    return data;
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = original; }
  }
}

const productPayload = (p) => {
  const { id, kind, plan, crawledPages, ...rest } = p;
  return rest;
};
const sitePayload = (s) => ({ id: s.id, name: s.name, url: s.url, category: s.category, launch: !!s.launch, launchTips: s.launchTips || '' });

// ------------------------------------------------------------------ Render
function toast(msg, ms = 4000) {
  const t = $('#toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => { t.hidden = true; }, ms);
}

async function run(btn, fn) {
  try { await fn(); } catch (e) { toast(e.message || String(e), 7000); }
}

function setTab(tab) {
  state.tab = tab;
  ls.set('lp.tab', tab);
  render();
  window.scrollTo(0, 0);
}

function render() {
  if (!state.ready) return;
  if (state.productId === '__new' && state.tab !== 'profile') state.productId = null;
  if (!product() && state.productId !== '__new' && products().length) state.productId = products()[0].id;
  const sel = $('#product-select');
  sel.innerHTML = products().map((p) => `<option value="${esc(p.id)}" ${p.id === state.productId ? 'selected' : ''}>${esc(p.name || 'Untitled')}</option>`).join('') + '<option value="__new">+ New product</option>';
  if (!product()) sel.value = '__new';
  if (!store.dirty && !store.saving) $('#sync').textContent = 'All changes saved';
  $('#account').innerHTML = state.user ? `${state.user.picture ? `<img src="${esc(state.user.picture)}" alt="" width="26" height="26" style="border-radius:50%">` : ''}<span class="small muted hide-sm">${esc(state.user.email)}</span><button class="btn sm ghost" id="signout">Sign out</button>` : '';
  $('#signout')?.addEventListener('click', () => window.lpSignOut?.());
  $$('.tab').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.tab === state.tab)));
  const views = { overview: viewOverview, profile: viewProfile, sites: viewSites, launches: viewLaunches, calendar: viewCalendar, autopilot: viewAutopilot };
  const main = $('#main');
  if (!product() && !['profile', 'autopilot'].includes(state.tab)) return viewWelcome(main);
  (views[state.tab] || viewOverview)(main);
}

function pill(status) { return `<span class="pill ${esc(status)}">${esc(STATUS[status] || status)}</span>`; }

function viewWelcome(main) {
  main.innerHTML = `
    <div class="stack" style="max-width:720px">
      <h1>Get your product listed everywhere it should be</h1>
      <p class="muted">LaunchPilot keeps ${CATALOG.length}+ launch platforms and directories, writes a listing tailored to each one, and tracks every submission and launch date.</p>
      <div class="grid2">
        <div class="panel stack"><h2>Start with Pixel Shine</h2><p class="muted small">Loads the Pixel Shine profile and its fact sheet, built from the site's tools, pricing and FAQ pages, so every listing uses real details.</p><button class="btn primary" id="start-sjpt">Use the Pixel Shine profile</button></div>
        <div class="panel stack"><h2>Add a different product</h2><p class="muted small">Paste the text of your main pages and the AI builds a fact sheet and profile from them.</p><button class="btn" id="start-blank">Create a product</button></div>
      </div>
    </div>`;
  $('#start-sjpt').onclick = () => createProduct({ ...STARTER });
  $('#start-blank').onclick = () => { state.productId = '__new'; setTab('profile'); };
}

function createProduct(data) {
  const doc = { id: 'p_' + uid(), kind: 'product', createdAt: new Date().toISOString(), ...data };
  store.save(doc);
  state.productId = doc.id;
  ls.set('lp.product', doc.id);
  toast(`${doc.name || 'Product'} created`);
  setTab('sites');
}

// ---------------------------------------------------------------- Overview
function viewOverview(main) {
  const p = product();
  const ls_ = launches();
  const n = (s) => ls_.filter((l) => l.status === s).length;
  const total = ls_.length || 1;
  const upcoming = ls_.filter((l) => l.launchAt && new Date(l.launchAt) > new Date(Date.now() - 864e5) && !['live', 'submitted', 'skipped', 'rejected'].includes(l.status)).sort((a, b) => a.launchAt.localeCompare(b.launchAt));
  const due = ls_.filter((l) => l.launchAt && new Date(l.launchAt) <= new Date() && ['todo', 'ready', 'scheduled'].includes(l.status));
  const next = ls_.filter((l) => ['todo', 'ready'].includes(l.status)).map((l) => ({ l, s: siteById(l.siteId) })).filter((x) => x.s).sort((a, b) => a.s.tier - b.s.tier).slice(0, 6);
  main.innerHTML = `
    <div class="head"><div><h1>${esc(p.name)}</h1><p class="muted">${esc(p.tagline || p.url || '')}</p></div>
      <div class="row"><button class="btn" data-go="sites">Pick listing sites</button><button class="btn primary" data-go="launches">Work on launches</button></div></div>
    <div class="stats">
      <div class="stat"><span class="muted small">Sites picked</span><b>${ls_.length}</b></div>
      <div class="stat"><span class="muted small">Copy ready</span><b>${n('ready') + n('scheduled')}</b></div>
      <div class="stat"><span class="muted small">Submitted</span><b>${n('submitted')}</b></div>
      <div class="stat"><span class="muted small">Live listings</span><b>${n('live')}</b></div>
    </div>
    ${ls_.length ? `<div class="panel" style="margin-bottom:16px"><div class="row" style="justify-content:space-between;margin-bottom:8px"><h3>Progress</h3><span class="small muted mono">${n('live') + n('submitted')}/${ls_.length} submitted or live</span></div>
      <div class="meter" role="img" aria-label="Progress">${[['live', 'var(--good)'], ['submitted', 'color-mix(in srgb, var(--good) 55%, transparent)'], ['scheduled', 'var(--flare)'], ['ready', 'var(--accent)']].map(([s, c]) => `<span style="width:${(n(s) / total) * 100}%;background:${c}"></span>`).join('')}</div></div>` : ''}
    ${due.length ? `<div class="note warn" style="margin-bottom:16px"><b>Due now:</b> ${due.map((l) => `<a href="#" data-open="${esc(l.id)}">${esc(siteById(l.siteId)?.name)}</a>`).join(', ')}</div>` : ''}
    <div class="grid2">
      <div class="panel stack"><h2>Do next</h2>${next.length ? `<div class="list">${next.map(({ l, s }) => `<button class="item" data-open="${esc(l.id)}">${pill(l.status)}<span class="grow"><b>${esc(s.name)}</b></span><span class="tier muted">tier ${s.tier}</span></button>`).join('')}</div>` : '<p class="muted">Nothing waiting. Pick more sites or check your calendar.</p>'}</div>
      <div class="panel stack"><h2>Coming up</h2>${upcoming.length ? `<div class="list">${upcoming.slice(0, 6).map((l) => `<button class="item" data-open="${esc(l.id)}"><span class="pill scheduled mono">${esc(fmtDate(l.launchAt))}</span><span class="grow">${esc(siteById(l.siteId)?.name)}</span></button>`).join('')}</div>` : '<p class="muted">No launch dates yet. Open a site in Launches and pick a date.</p>'}</div>
    </div>`;
}

// ---------------------------------------------------------------- Profile
function viewProfile(main) {
  const p = state.productId === '__new' ? null : product();
  const v = p || {};
  main.innerHTML = `
    <div class="head"><div><h1>${p ? 'Product profile' : 'New product'}</h1><p class="muted">Every listing is written from this profile. The more complete it is, the better the copy.</p></div>
      ${p ? `<button class="btn danger" id="del">Delete product</button>` : ''}</div>
    <div id="del-confirm"></div>
    <div class="panel stack" style="margin-bottom:16px">
      <h2>Crawl your website</h2>
      <p class="muted small">LaunchPilot reads your sitemap and pages (pricing, features, tools and FAQ first), then writes a fact sheet with your real tool names, prices and limits. Every listing is written from it. Takes 1-2 minutes.</p>
      <div class="row"><input id="crawl-url" value="${esc(v.url || '')}" placeholder="https://yourproduct.com" style="flex:1;min-width:200px" aria-label="Website URL">
        <select id="crawl-pages" style="width:auto" aria-label="Pages to read">${[15, 25, 40].map((n) => `<option value="${n}" ${n === 25 ? 'selected' : ''}>${n} pages</option>`).join('')}</select>
        <button class="btn primary" id="crawl" type="button">${v.factSheet ? 'Crawl again' : 'Crawl my site'}</button></div>
      <p class="small muted" id="crawl-status"></p>
      <details><summary class="small">Site blocks crawlers or only loads with JavaScript? Paste pages instead</summary>
        <div class="stack" style="margin-top:10px"><div class="stack" id="pages"></div>
        <div class="row"><button class="btn" id="add-page" type="button">+ Add another page</button><span class="spacer"></span><button class="btn" id="draft" type="button">Build from pasted pages</button></div></div>
      </details>
    </div>
    <form class="panel" id="pform">
      <div class="form">
        ${PROFILE_TEXT.map(([k, label, max]) => {
          const big = k === 'longDescription' || k === 'shortDescription';
          const field = big ? `<textarea id="pf-${k}" name="${k}" style="min-height:${k === 'longDescription' ? 170 : 80}px">${esc(v[k])}</textarea>` : `<input id="pf-${k}" name="${k}" value="${esc(v[k])}">`;
          return `<label class="f ${big ? 'full' : ''}"><span class="lbl">${label}${max ? `<span class="count" data-max="${max}"></span>` : ''}</span>${field}</label>`;
        }).join('')}
        <label class="f">Pricing<select id="pf-pricing" name="pricing">${['free', 'freemium', 'paid', 'free-trial', 'open-source'].map((o) => `<option ${v.pricing === o ? 'selected' : ''}>${o}</option>`).join('')}</select></label>
        <span></span>
        ${PROFILE_LISTS.map(([k, label]) => `<label class="f full">${label} <span class="muted small">one per line</span><textarea id="pf-${k}" name="${k}">${esc((v[k] || []).join('\n'))}</textarea></label>`).join('')}
        <label class="f full">Fact sheet <span class="muted small">every listing is written from this; fix anything that's wrong</span><textarea id="pf-factSheet" name="factSheet" class="mono" style="min-height:${v.factSheet ? 380 : 100}px;font-size:12.5px" placeholder="Build it from your pages above, or write the key facts yourself: tools, prices, limits, who it's for.">${esc(v.factSheet)}</textarea></label>
      </div>
      <div class="row" style="margin-top:16px;justify-content:flex-end"><button class="btn primary" type="submit">${p ? 'Save profile' : 'Create product'}</button></div>
    </form>`;

  const form = $('#pform');
  let pendingCrawl = null;
  const counts = () => $$('.count', form).forEach((c) => {
    const inp = c.closest('label').querySelector('input, textarea');
    c.textContent = `${inp.value.length}/${c.dataset.max}`;
    c.classList.toggle('over', inp.value.length > Number(c.dataset.max));
  });
  form.addEventListener('input', counts);
  counts();

  form.onsubmit = (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    for (const [k] of PROFILE_LISTS) data[k] = data[k].split('\n').map((s) => s.trim()).filter(Boolean);
    if (!data.name) return toast('Give your product a name first');
    if (pendingCrawl) Object.assign(data, pendingCrawl);
    if (p) { store.save({ ...p, ...data }); toast('Profile saved'); render(); } else createProduct(data);
  };

  const pageRow = (url = '', text = '') => {
    const row = document.createElement('div');
    row.className = 'kit';
    const n = $$('#pages .kit').length + 1;
    row.innerHTML = `<div class="row"><input class="pg-url" id="pg-url-${n}" placeholder="Page URL, e.g. https://yourproduct.com/pricing" value="${esc(url)}" style="flex:1;min-width:180px"><button class="btn sm ghost" type="button" data-rm-page>Remove</button></div>
      <textarea class="pg-text" id="pg-text-${n}" placeholder="Paste this page's text">${esc(text)}</textarea>`;
    row.querySelector('[data-rm-page]').onclick = () => row.remove();
    $('#pages').append(row);
  };
  pageRow(v.url || '');
  if (v.crawledPages?.length) $('#crawl-status').textContent = `${v.crawledPages.length} pages read on ${new Date(v.crawledAt).toLocaleDateString()}.`;
  $('#add-page').onclick = () => pageRow();

  const fill = (r) => {
    for (const [k] of PROFILE_TEXT) if (r[k] && form.elements[k]) form.elements[k].value = r[k];
    for (const [k] of PROFILE_LISTS) if (Array.isArray(r[k]) && r[k].length) form.elements[k].value = r[k].join('\n');
    if (r.pricing && [...form.elements.pricing.options].some((o) => o.value === r.pricing)) form.elements.pricing.value = r.pricing;
    if (r.factSheet) { form.elements.factSheet.value = r.factSheet; form.elements.factSheet.style.minHeight = '380px'; }
    if (r.crawledPages) pendingCrawl = { crawledPages: r.crawledPages, crawledAt: r.crawledAt };
    counts();
  };
  $('#crawl').onclick = (e) => run(e.target, async () => {
    const url = $('#crawl-url').value.trim();
    if (!url) throw new Error('Enter your website URL first');
    const status = $('#crawl-status');
    const started = Date.now();
    const tick = setInterval(() => { const s = Math.round((Date.now() - started) / 1000); status.textContent = s < 40 ? `Reading your pages… ${s}s` : `Writing your fact sheet… ${s}s`; }, 1000);
    try {
      const r = await ai('crawl', { url, maxPages: Number($('#crawl-pages').value) }, e.target, 'Crawling…');
      fill(r);
      status.textContent = `Read ${r.crawledPages.length} pages. Review the profile and fact sheet below, then save.`;
      toast('Fact sheet ready. Review it, then save.');
    } catch (err) {
      status.textContent = '';
      throw err;
    } finally {
      clearInterval(tick);
    }
  });

  $('#draft').onclick = (e) => run(e.target, async () => {
    const pages = $$('#pages .kit').map((r) => ({ url: r.querySelector('.pg-url').value.trim(), text: r.querySelector('.pg-text').value.trim() })).filter((x) => x.text);
    if (!pages.length) throw new Error('Paste the text of at least one page first');
    const r = await ai('factsheet', { pages }, e.target, 'Reading your pages…');
    fill(r);
    toast('Fact sheet and profile ready. Review them, then save.');
  });

  $('#del')?.addEventListener('click', () => {
    $('#del-confirm').innerHTML = `<div class="confirm" style="margin-bottom:16px"><span>Delete ${esc(p.name)} and all its launches?</span><button class="btn sm danger" id="del-yes">Delete</button><button class="btn sm" id="del-no">Cancel</button></div>`;
    $('#del-no').onclick = () => { $('#del-confirm').innerHTML = ''; };
    $('#del-yes').onclick = () => {
      launches().forEach((l) => store.remove(l.id));
      store.remove(p.id);
      state.productId = products()[0]?.id || null;
      setTab('overview');
    };
  });
}

// ------------------------------------------------------------------ Sites
function viewSites(main) {
  const f = state.filters;
  const picked = new Set(launches().map((l) => l.siteId));
  const q = f.q.toLowerCase();
  const list = sites()
    .filter((s) => !f.category || s.category === f.category)
    .filter((s) => !f.pricing || s.pricing === f.pricing)
    .filter((s) => f.show !== 'launch' || s.launch)
    .filter((s) => f.show !== 'custom' || s.kind === 'site')
    .filter((s) => f.show !== 'unpicked' || !picked.has(s.id))
    .filter((s) => !q || `${s.name} ${s.url} ${s.launchTips || ''}`.toLowerCase().includes(q))
    .sort((a, b) => a.tier - b.tier || a.name.localeCompare(b.name));
  main.innerHTML = `
    <div class="head"><div><h1>Listing sites</h1><p class="muted">${sites().length} platforms. Tick the ones you want, then add them to ${esc(product().name)}'s launches.</p></div>
      <button class="btn primary" id="discover">Suggest more sites with AI</button></div>
    <div class="grid2" style="margin-bottom:16px">
      <form class="panel stack" id="add-site">
        <h2>Add any listing site</h2>
        <div class="form">
          <label class="f">Site name<input id="as-name" name="name" required placeholder="e.g. SaaSHub"></label>
          <label class="f">Submit page URL<input id="as-url" name="submitUrl" required placeholder="https://…/submit"></label>
        </div>
        <div class="row"><select id="as-cat" name="category" style="width:auto">${Object.entries(CATEGORIES).map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join('')}</select><span class="spacer"></span><button class="btn" type="submit">Add site</button></div>
      </form>
      <div class="panel stack"><h2>How tiers work</h2><p class="small muted"><b class="mono">1</b> high authority and real traffic: do these first. <b class="mono">2</b> solid niche audience. <b class="mono">3</b> long-tail backlinks, quick to submit.</p><p class="small muted"><span class="pill launch">Launch day</span> platforms where the date matters. <span class="pill">You post</span> platforms where you must click the final button yourself.</p></div>
    </div>
    <div class="panel">
      <div class="filters">
        <input id="f-q" placeholder="Search sites" value="${esc(f.q)}" aria-label="Search sites">
        <select id="f-category" aria-label="Type"><option value="">All types</option>${Object.entries(CATEGORIES).map(([k, v]) => `<option value="${k}" ${f.category === k ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select>
        <select id="f-pricing" aria-label="Price"><option value="">Any price</option>${['free', 'freemium', 'paid'].map((o) => `<option ${f.pricing === o ? 'selected' : ''}>${o}</option>`).join('')}</select>
        <select id="f-show" aria-label="Show">${[['all', 'All sites'], ['unpicked', 'Not picked yet'], ['launch', 'Launch-day platforms'], ['custom', 'Added by you / AI']].map(([k, v]) => `<option value="${k}" ${f.show === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
      </div>
      <div class="row" style="margin-bottom:6px"><label class="row small"><input type="checkbox" id="sel-all"> Select all shown (${list.length})</label><span class="spacer"></span><span class="small muted">${state.selected.size} selected</span><button class="btn primary sm" id="add-sel" ${state.selected.size ? '' : 'disabled'}>Add to launches</button></div>
      <div class="table-wrap"><table>
        <thead><tr><th></th><th>Site</th><th class="hide-sm">Type</th><th>Price</th><th>Tier</th></tr></thead>
        <tbody>${list.map((s) => `<tr>
          <td><input type="checkbox" data-sel="${esc(s.id)}" ${state.selected.has(s.id) ? 'checked' : ''} aria-label="Select ${esc(s.name)}"></td>
          <td><a class="name" href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)}</a>
            ${s.launch ? ' <span class="pill launch">Launch day</span>' : ''}${s.manualOnly ? ' <span class="pill">You post</span>' : ''}${s.aiSuggested ? ' <span class="pill ai">AI suggested · verify</span>' : s.kind === 'site' ? ' <span class="pill ai">Yours</span>' : ''}${picked.has(s.id) ? ' <span class="pill ready">In launches</span>' : ''}
            ${s.launchTips ? `<div class="small muted">${esc(s.launchTips)}</div>` : ''}</td>
          <td class="small hide-sm">${esc(CATEGORIES[s.category] || s.category)}</td>
          <td><span class="pill">${esc(s.pricing)}</span></td>
          <td class="tier">${s.tier}</td></tr>`).join('') || '<tr><td colspan="5" class="empty">No sites match these filters.</td></tr>'}</tbody>
      </table></div>
    </div>`;

  const setF = (k, v) => { state.filters[k] = v; render(); };
  $('#f-q').onchange = (e) => setF('q', e.target.value);
  for (const k of ['category', 'pricing', 'show']) $('#f-' + k).onchange = (e) => setF(k, e.target.value);
  $('#sel-all').onchange = (e) => { list.forEach((s) => (e.target.checked ? state.selected.add(s.id) : state.selected.delete(s.id))); render(); };
  $$('[data-sel]').forEach((c) => { c.onchange = () => { c.checked ? state.selected.add(c.dataset.sel) : state.selected.delete(c.dataset.sel); render(); }; });
  $('#add-sel').onclick = () => {
    let n = 0;
    for (const siteId of state.selected) {
      if (launches().some((l) => l.siteId === siteId)) continue;
      store.save({ id: 'l_' + uid(), kind: 'launch', productId: state.productId, siteId, status: 'todo', createdAt: new Date().toISOString() });
      n++;
    }
    state.selected.clear();
    toast(`Added ${n} site${n === 1 ? '' : 's'} to your launches`);
    setTab('launches');
  };
  $('#add-site').onsubmit = (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    let url = d.submitUrl.trim();
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    let home;
    try { home = new URL(url).origin; } catch { return toast('That URL doesn\'t look right'); }
    const doc = { id: 's_' + uid(), kind: 'site', name: d.name.trim(), url: home, submitUrl: url, category: d.category, pricing: 'unknown', tier: 2, launch: d.category === 'launch', createdAt: new Date().toISOString() };
    store.save(doc);
    state.selected.add(doc.id);
    toast(`Added ${doc.name}. It's selected: press "Add to launches".`);
    render();
  };
  $('#discover').onclick = (e) => run(e.target, async () => {
    const existing = sites().map((s) => s.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/.*$/, ''));
    const p = product();
    const r = await ai('discover', { product: productPayload(p), existing }, e.target, 'Searching…');
    let n = 0;
    for (const item of Array.isArray(r) ? r : []) {
      try {
        const url = new URL(/^https?:/i.test(item.url) ? item.url : 'https://' + item.url);
        const host = url.hostname.replace(/^www\./, '');
        if (existing.includes(host)) continue;
        existing.push(host);
        store.save({ id: 's_' + uid(), kind: 'site', aiSuggested: true, name: String(item.name || host).slice(0, 80), url: url.origin, submitUrl: item.submitUrl || url.origin, category: CATEGORIES[item.category] ? item.category : 'startup', pricing: ['free', 'freemium', 'paid'].includes(item.pricing) ? item.pricing : 'unknown', tier: [1, 2, 3].includes(Number(item.tier)) ? Number(item.tier) : 3, launch: item.category === 'launch', launchTips: String(item.launchTips || '').slice(0, 240), createdAt: new Date().toISOString() });
        n++;
      } catch {}
    }
    state.filters.show = 'custom';
    toast(`${n} new sites suggested. Open each link to check it's live before submitting.`, 7000);
    render();
  });
}

// --------------------------------------------------------------- Launches
function viewLaunches(main) {
  const all = launches().map((l) => ({ l, s: siteById(l.siteId) })).filter((x) => x.s);
  const groups = [['To do', ['todo']], ['Copy ready', ['ready']], ['Scheduled', ['scheduled']], ['Submitted & live', ['submitted', 'live']], ['Closed', ['rejected', 'skipped']]];
  main.innerHTML = `
    <div class="head"><div><h1>Launches</h1><p class="muted">Open a site to write its listing, submit it and set a launch date.</p></div>
      <div class="row"><button class="btn" id="csv">Export CSV</button><button class="btn" id="plan">AI launch plan</button><button class="btn primary" data-go="sites">Add sites</button></div></div>
    <div id="plan-out"></div>
    ${all.length ? groups.map(([title, sts]) => {
      const items = all.filter((x) => sts.includes(x.l.status)).sort((a, b) => a.s.tier - b.s.tier || a.s.name.localeCompare(b.s.name));
      if (!items.length) return '';
      return `<div class="group-title"><h2>${title}</h2><span class="muted mono small">${items.length}</span></div><div class="list">
        ${items.map(({ l, s }) => `<button class="item" data-open="${esc(l.id)}">${pill(l.status)}<span class="grow"><b>${esc(s.name)}</b>${s.launch ? ' <span class="pill launch">Launch day</span>' : ''}</span><span class="small muted">${l.launchAt ? esc(fmtDate(l.launchAt)) : l.liveUrl ? 'Live' : `tier ${s.tier} · ${esc(s.pricing)}`}</span></button>`).join('')}</div>`;
    }).join('') : `<div class="panel empty">No sites yet. <a href="#" data-go="sites">Pick listing sites</a> to start.</div>`}`;

  const p = product();
  if (p.plan) $('#plan-out').innerHTML = planHtml(p.plan);
  $('#csv').onclick = () => run(null, exportCsv);
  $('#plan').onclick = (e) => run(e.target, async () => {
    const list = all.length ? all.map((x) => x.s) : sites().filter((s) => s.tier === 1);
    const r = await ai('plan', { product: productPayload(p), sites: list.map(sitePayload) }, e.target, 'Planning…');
    store.save({ ...p, plan: { ...r, createdAt: new Date().toISOString() } });
    render();
  });
}

function planHtml(plan) {
  return `<div class="panel stack" style="margin-bottom:12px"><div class="row" style="justify-content:space-between"><h2>Launch plan</h2><span class="small muted">${esc(fmtDate(plan.createdAt))}</span></div><p>${esc(plan.summary)}</p>
    <div class="table-wrap"><table><thead><tr><th>When</th><th>Where</th><th>What</th></tr></thead><tbody>
    ${(plan.steps || []).map((s) => `<tr><td class="small"><b>${s.week === 0 ? 'Launch week' : s.week < 0 ? `${-s.week} wk before` : `${s.week} wk after`}</b><div class="muted">${esc(s.day)}</div></td><td>${esc(siteById(s.siteId)?.name || s.siteId)}</td><td class="small">${esc(s.action)}<div class="muted">${esc(s.why)}</div></td></tr>`).join('')}
    </tbody></table></div></div>`;
}

// One site: write, submit, schedule, track.
function openLaunch(id) {
  const l = state.docs[id];
  if (!l) return;
  const s = siteById(l.siteId);
  const p = state.docs[l.productId];
  const kit = l.kit || [];
  const toLocal = (iso) => (iso ? new Date(new Date(iso).getTime() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 16) : '');
  const body = $('#sheet-body');
  body.innerHTML = `
    <div class="stack">
      <div class="row"><h1 style="flex:1;min-width:0">${esc(s.name)}</h1>${pill(l.status)}<button class="btn" data-close>Close</button></div>
      <p class="small muted"><a href="${esc(l.submitUrl || s.submitUrl)}" target="_blank" rel="noopener">${esc(l.submitUrl || s.submitUrl)}</a> · ${esc(CATEGORIES[s.category] || s.category)} · ${esc(s.pricing)} · tier ${s.tier}</p>
      ${s.launchTips ? `<div class="note">${esc(s.launchTips)}</div>` : ''}
      ${s.manualOnly ? '<div class="note warn">This platform\'s rules mean you post it yourself. Paste the copy below into their form.</div>' : ''}

      <div class="step">
        <div class="step-h"><span class="step-n">1</span><h3>Write the listing</h3></div>
        <p class="small muted">Optional: open the submit page, copy the form's field labels and any rules, and paste them here so the copy matches their exact fields.</p>
        <textarea id="form-text" placeholder="e.g. Tool name · Tagline (max 60 chars) · Description (min 100 words) · Category · Pricing">${esc(l.formText || '')}</textarea>
        <div class="row"><button class="btn primary" id="write">${kit.length ? 'Rewrite listing' : 'Write listing with AI'}</button><a class="btn" href="${esc(l.submitUrl || s.submitUrl)}" target="_blank" rel="noopener">Open submit page ↗</a></div>
        ${kit.length ? `<div class="stack" id="kit">${kit.map((k, i) => `<div class="kit">
            <div class="row"><b style="flex:1">${esc(k.label)}</b>${k.max ? `<span class="count" data-max="${k.max}"></span>` : ''}<button class="btn sm" data-copy="${i}">Copy</button></div>
            <textarea id="kit-${i}" data-kit="${i}" style="min-height:${String(k.value).length > 220 ? 150 : 60}px">${esc(k.value)}</textarea></div>`).join('')}
          <div class="row" style="justify-content:flex-end"><button class="btn" id="save-kit">Save edits</button></div></div>` : ''}
        ${l.checklist?.length ? `<div><h3 style="margin-bottom:6px">Checklist for ${esc(s.name)}</h3><ul class="small" style="margin:0;padding-left:20px">${l.checklist.map((c) => `<li>${esc(c)}</li>`).join('')}</ul></div>` : ''}
        ${l.notes ? `<p class="small muted">${esc(l.notes)}</p>` : ''}
        ${kit.length ? (l.styleIssues?.length ? `<div class="note warn small"><b>Style check:</b> ${l.styleIssues.map(esc).join(' · ')}</div>` : '<p class="small"><span class="pill ok">Style check passed</span> <span class="muted">no filler words, dashes, exclamation marks or over-limit fields</span></p>') : ''}
        ${!p?.factSheet ? '<div class="note warn small">This product has no fact sheet yet. Build one on the Product profile tab first; listings written from it are far more specific.</div>' : ''}
      </div>

      <div class="step">
        <div class="step-h"><span class="step-n">2</span><h3>Submit it</h3></div>
        <p class="small muted">Open the submit page, sign in or create your account there, and paste each field with its Copy button. Want it typed in for you? The <a href="#" data-go-close="autopilot">autopilot</a> fills forms and logs in automatically.</p>
        <div class="form">
          <label class="f">Account email used here<input id="acct" value="${esc(l.accountEmail || p?.makerEmail || '')}" placeholder="you@example.com"></label>
          <label class="f">Submit page URL<input id="surl" value="${esc(l.submitUrl || s.submitUrl)}"></label>
        </div>
        <div class="row">${kit.length ? '<button class="btn" id="copy-all">Copy all fields</button>' : ''}<button class="btn primary" id="mark-sub">I submitted it</button></div>
      </div>

      <div class="step">
        <div class="step-h"><span class="step-n">3</span><h3>Launch date</h3></div>
        <div class="form">
          <label class="f">Date &amp; time<input type="datetime-local" id="when" value="${esc(toLocal(l.launchAt))}"></label>
          <div class="f"><span>&nbsp;</span><div class="row"><button class="btn" id="schedule">Save date</button>${l.launchAt ? '<button class="btn" id="ics">Add to my calendar</button><button class="btn ghost danger" id="unschedule">Clear</button>' : ''}</div></div>
        </div>
        ${s.id === 'product-hunt' ? '<p class="small muted">Product Hunt: launches reset at 12:01 AM Pacific. Tuesday to Thursday works best. Their post form also has its own "schedule" option, up to a month ahead.</p>' : ''}
        ${s.id === 'hacker-news' ? '<p class="small muted">Show HN: weekday mornings, 8-10 AM US Eastern.</p>' : ''}
      </div>

      <div class="step">
        <div class="step-h"><span class="step-n">4</span><h3>Track it</h3></div>
        <div class="form">
          <label class="f">Status<select id="status">${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${l.status === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
          <label class="f">Live listing URL<input id="live" value="${esc(l.liveUrl || '')}" placeholder="https://…"></label>
        </div>
        <div class="row"><button class="btn" id="save-track">Save</button><span class="spacer"></span><button class="btn ghost danger sm" id="remove">Remove from launches</button></div>
        <div id="remove-confirm"></div>
      </div>
    </div>`;
  $('#sheet').hidden = false;

  const patch = (data) => { const next = { ...state.docs[id], ...data }; store.save(next); return next; };
  const reopen = () => { render(); openLaunch(id); };
  const counts = () => $$('.count', body).forEach((c) => {
    const ta = c.closest('.kit').querySelector('textarea');
    c.textContent = `${ta.value.length}/${c.dataset.max}`;
    c.classList.toggle('over', ta.value.length > Number(c.dataset.max));
  });
  body.oninput = counts;
  counts();
  const kitValues = () => kit.map((k, i) => ({ ...k, value: $('#kit-' + i).value }));

  $('#write').onclick = (e) => run(e.target, async () => {
    const formText = $('#form-text').value.trim();
    const r = await ai('write', { product: productPayload(p), site: sitePayload(s), formText }, e.target, 'Writing…');
    const issues = r.styleIssues || [];
    patch({ formText, kit: (r.fields || []).map((f) => ({ label: String(f.label), value: String(f.value), max: Number(f.max) || 0 })), checklist: r.checklist || [], notes: r.notes || '', styleIssues: issues, status: l.status === 'todo' ? 'ready' : l.status });
    reopen();
  });
  $$('[data-copy]', body).forEach((b) => {
    b.onclick = () => {
      const ta = $('#kit-' + b.dataset.copy);
      navigator.clipboard.writeText(ta.value).then(() => toast('Copied'), () => { ta.select(); toast('Press Ctrl+C to copy'); });
    };
  });
  $('#save-kit')?.addEventListener('click', () => { patch({ kit: kitValues() }); toast('Saved'); });
  $('#copy-all')?.addEventListener('click', () => {
    const text = kitValues().map((k) => `${k.label}:\n${k.value}`).join('\n\n');
    navigator.clipboard.writeText(text).then(() => toast('All fields copied'), () => toast('Copy blocked by the browser'));
  });
  $('#mark-sub').onclick = () => { patch({ status: 'submitted', submittedAt: new Date().toISOString(), accountEmail: $('#acct').value.trim(), submitUrl: $('#surl').value.trim(), ...(kit.length ? { kit: kitValues() } : {}) }); toast('Marked as submitted'); reopen(); };
  $('#schedule').onclick = () => {
    const v = $('#when').value;
    if (!v) return toast('Pick a date and time first');
    patch({ launchAt: new Date(v).toISOString(), status: ['todo', 'ready'].includes(l.status) ? 'scheduled' : l.status });
    toast('Launch date saved');
    reopen();
  };
  $('#unschedule')?.addEventListener('click', () => { patch({ launchAt: null, status: l.status === 'scheduled' ? (kit.length ? 'ready' : 'todo') : l.status }); reopen(); });
  $('#ics')?.addEventListener('click', () => run(null, () => saveIcs([l])));
  $('#save-track').onclick = () => { patch({ status: $('#status').value, liveUrl: $('#live').value.trim(), accountEmail: $('#acct').value.trim(), submitUrl: $('#surl').value.trim() }); toast('Saved'); reopen(); };
  $('#remove').onclick = () => {
    $('#remove-confirm').innerHTML = `<div class="confirm"><span>Remove ${esc(s.name)} from this product's launches?</span><button class="btn sm danger" id="rm-yes">Remove</button><button class="btn sm" id="rm-no">Cancel</button></div>`;
    $('#rm-no').onclick = () => { $('#remove-confirm').innerHTML = ''; };
    $('#rm-yes').onclick = () => { store.remove(id); closeSheet(); };
  };
}

function closeSheet() {
  $('#sheet').hidden = true;
  render();
}

// --------------------------------------------------------------- Calendar
function viewCalendar(main) {
  const dated = launches().filter((l) => l.launchAt).sort((a, b) => a.launchAt.localeCompare(b.launchAt));
  const byDay = new Map();
  for (const l of dated) {
    const k = new Date(l.launchAt).toDateString();
    if (!byDay.has(k)) byDay.set(k, []);
    byDay.get(k).push(l);
  }
  const ph = nextLaunchSlot();
  main.innerHTML = `
    <div class="head"><div><h1>Launch calendar</h1><p class="muted">Every launch date for ${esc(product().name)}. Add them to Google, Outlook or Apple Calendar to get reminders.</p></div>
      ${dated.length ? '<button class="btn primary" id="ics-all">Add all to my calendar</button>' : ''}</div>
    <div class="grid2" style="margin-bottom:16px">
      <div class="panel stack"><h3>Next Product Hunt slot</h3><p><b class="mono">${esc(ph.toLocaleString([], { weekday: 'long', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }))}</b> your time</p><p class="small muted">That's 12:01 AM Pacific on the next Tuesday, Wednesday or Thursday at least 7 days away, so you have a week to prepare.</p></div>
      <div class="panel stack"><h3>How reminders work</h3><p class="small muted">This page can't send notifications by itself. Use "Add to my calendar": your calendar app reminds you 1 hour before, with the submit link in the event.</p></div>
    </div>
    <div class="panel">${dated.length ? [...byDay.entries()].map(([day, ls_]) => {
      const d = new Date(day);
      const past = d < new Date(new Date().toDateString());
      return `<div class="cal-day"><div class="cal-date ${past ? 'muted' : ''}"><b>${d.getDate()}</b>${esc(d.toLocaleDateString([], { month: 'short', weekday: 'short', year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined }))}</div>
        <div class="list">${ls_.map((l) => `<button class="item" data-open="${esc(l.id)}">${pill(l.status)}<span class="grow"><b>${esc(siteById(l.siteId)?.name)}</b></span><span class="mono small muted">${esc(new Date(l.launchAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }))}</span></button>`).join('')}</div></div>`;
    }).join('') : '<div class="empty">No launch dates yet. Open a site in Launches and set its date.</div>'}</div>`;
  $('#ics-all')?.addEventListener('click', () => run(null, () => saveIcs(dated)));
}

function nextLaunchSlot() {
  // 12:01 AM America/Los_Angeles on the next Tue-Thu, at least a week out.
  const start = new Date(Date.now() + 7 * 864e5);
  for (let i = 0; i < 14; i++) {
    const d = new Date(start.getTime() + i * 864e5);
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' }).formatToParts(d).map((p) => [p.type, p.value]));
    if (!['Tue', 'Wed', 'Thu'].includes(parts.weekday)) continue;
    // Find the UTC instant of 00:01 Pacific on that date (offset is -7 or -8).
    for (const off of [7, 8]) {
      const t = new Date(Date.UTC(+parts.year, +parts.month - 1, +parts.day, off, 1));
      const h = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', hour: 'numeric', hourCycle: 'h23' }).format(t);
      if (Number(h) === 0) return t;
    }
  }
  return start;
}

// ------------------------------------------------------------ File exports
function offerFile(filename, data) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([data], { type: filename.endsWith('.ics') ? 'text/calendar' : 'text/csv' }));
  a.download = filename;
  document.body.append(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

function saveIcs(list) {
  const stamp = (d) => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const icsEsc = (s) => String(s || '').replace(/[\\,;]/g, (c) => '\\' + c).replace(/\n/g, '\\n');
  const p = product();
  const events = list.map((l) => {
    const s = siteById(l.siteId);
    const start = new Date(l.launchAt);
    return ['BEGIN:VEVENT', `UID:${l.id}@launchpilot`, `DTSTAMP:${stamp(Date.now())}`, `DTSTART:${stamp(start)}`, `DTEND:${stamp(start.getTime() + 36e5)}`,
      `SUMMARY:${icsEsc(`Launch ${p.name} on ${s?.name}`)}`, `DESCRIPTION:${icsEsc(`Submit page: ${l.submitUrl || s?.submitUrl}\nYour listing copy is in LaunchPilot.`)}`, `URL:${l.submitUrl || s?.submitUrl}`,
      'BEGIN:VALARM', 'TRIGGER:-PT1H', 'ACTION:DISPLAY', `DESCRIPTION:${icsEsc(`${s?.name} launch in 1 hour`)}`, 'END:VALARM', 'END:VEVENT'].join('\r\n');
  });
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//LaunchPilot//EN', 'CALSCALE:GREGORIAN', ...events, 'END:VCALENDAR'].join('\r\n');
  return offerFile(`${(p.name || 'launch').replace(/[^a-z0-9]+/gi, '-')}-launches.ics`, ics);
}

function exportCsv() {
  const rows = [['Site', 'Status', 'Submit URL', 'Account email', 'Launch date', 'Submitted', 'Live URL']];
  for (const l of launches()) {
    const s = siteById(l.siteId);
    rows.push([s?.name, STATUS[l.status], l.submitUrl || s?.submitUrl, l.accountEmail, l.launchAt, l.submittedAt, l.liveUrl]);
  }
  const csv = rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
  return offerFile(`${(product().name || 'launch').replace(/[^a-z0-9]+/gi, '-')}-submissions.csv`, csv);
}

// --------------------------------------------------------------- Autopilot
function viewAutopilot(main) {
  main.innerHTML = `
    <div class="head"><div><h1>Autopilot: fill forms for you</h1><p class="muted">Everything else in LaunchPilot works right here in your browser. Autopilot is an optional extra for people who want the forms typed in for them.</p></div></div>
    <div class="grid2">
      <div class="panel stack">
        <h2>Why it's a separate download</h2>
        <p class="small">To type into another website's form, sign in for you or upload your logo there, software has to run inside a browser on your computer. No website is allowed to control other websites, for good security reasons. So Autopilot runs on your computer and stops for you at CAPTCHAs and email checks.</p>
        <p class="small muted">Without it: open the submit page, then use <b>Copy all fields</b> or each field's Copy button. Most directories take about two minutes this way.</p>
      </div>
      <div class="panel stack">
        <h2>What Autopilot does</h2>
        <ul class="small" style="margin:0;padding-left:20px;display:flex;flex-direction:column;gap:6px">
          <li>Opens each listing site and fills every field, including logo and screenshots.</li>
          <li>Logs in or creates the account with the email and password you save, encrypted on your computer.</li>
          <li>Runs submissions at the times you schedule.</li>
          <li>On Product Hunt, Hacker News and Reddit you still click the final button yourself.</li>
        </ul>
        <a class="btn" href="${REPO}" target="_blank" rel="noopener">Get Autopilot (Windows, Mac, Linux) ↗</a>
      </div>
    </div>`;
}

// --------------------------------------------------------------- Bootstrap
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-go], [data-go-close], [data-open], [data-close], .tab');
  if (!t) return;
  if (t.classList.contains('tab')) return setTab(t.dataset.tab);
  e.preventDefault();
  if (t.dataset.go) return setTab(t.dataset.go);
  if (t.dataset.goClose) { $('#sheet').hidden = true; return setTab(t.dataset.goClose); }
  if (t.dataset.open) return openLaunch(t.dataset.open);
  if (t.hasAttribute('data-close')) return closeSheet();
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#sheet').hidden) closeSheet(); });
$('#product-select').onchange = (e) => {
  if (e.target.value === '__new') { state.productId = '__new'; return setTab('profile'); }
  state.productId = e.target.value;
  ls.set('lp.product', state.productId);
  render();
};

function showSignIn() {
  $('#tabs').hidden = true;
  $('.product-pick').hidden = true;
  $('#main').innerHTML = `
    <div class="stack" style="max-width:640px;margin:40px auto;text-align:center;align-items:center">
      <h1>Get your product listed everywhere it should be</h1>
      <p class="muted">LaunchPilot reads your website, writes a listing for each of ${CATALOG.length}+ launch platforms and directories in that site's own style, and tracks every submission and launch date.</p>
      <button class="btn primary" id="signin" style="padding:12px 22px">Continue with Google</button>
      <p class="small muted">Free to use. Your launches are saved to your account.</p>
    </div>`;
  $('#signin').onclick = () => window.lpSignIn?.();
}

(async () => {
  try {
    if (!(await store.init())) return showSignIn();
  } catch (e) {
    $('#main').innerHTML = `<div class="panel empty">${esc(e.message)}. Refresh to try again.</div>`;
    return;
  }
  $('#tabs').hidden = false;
  $('.product-pick').hidden = false;
  state.ready = true;
  render();
  if (!state.aiAvailable) toast('AI writing is not set up on this server yet.', 8000);
})();

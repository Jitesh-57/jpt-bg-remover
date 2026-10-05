// All Claude calls live here: reading a product's website, understanding a
// directory's submission form, writing listing copy per platform, and
// searching the web for new directories.
import Anthropic from '@anthropic-ai/sdk';
import { WRITING_RULES, lintCopy } from './style.js';

const MODEL = process.env.LAUNCHPILOT_MODEL || 'claude-opus-5-5';
let client;

export function aiConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

function getClient() {
  if (!aiConfigured()) throw new Error('Set ANTHROPIC_API_KEY in .env to use AI features.');
  client ??= new Anthropic();
  return client;
}

const SYSTEM = `You are LaunchPilot, an experienced launch marketer who gets software products listed on directories, review sites and launch platforms.
You write the way a careful human copywriter does: specific, plain, and true to the product's own facts.

${WRITING_RULES}`;

function requestBase(effort) {
  // fallbacks: "default" lets the API re-run a request a safety classifier
  // declines on Anthropic's recommended fallback model instead of failing.
  return { model: MODEL, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default', output_config: { effort } };
}

function textOf(message) {
  if (message.stop_reason === 'refusal') throw new Error('The model declined this request.');
  return message.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n');
}

// Structured JSON response validated against `schema`.
async function askJSON({ prompt, schema, effort = 'medium', maxTokens = 16000 }) {
  const stream = getClient().beta.messages.stream({
    ...requestBase(effort),
    max_tokens: maxTokens,
    system: SYSTEM,
    output_config: { effort, format: { type: 'json_schema', schema } },
    messages: [{ role: 'user', content: prompt }],
  });
  const message = await stream.finalMessage();
  if (message.stop_reason === 'max_tokens') throw new Error('AI response was cut off; try again.');
  return JSON.parse(textOf(message));
}

const str = { type: 'string' };
const strArr = { type: 'array', items: str };
function obj(properties) {
  return { type: 'object', properties, required: Object.keys(properties), additionalProperties: false };
}

const PROFILE_SCHEMA = obj({
  name: str,
  tagline: str,
  shortDescription: str,
  longDescription: str,
  categories: strArr,
  tags: strArr,
  pricing: { type: 'string', enum: ['free', 'freemium', 'paid', 'free-trial', 'open-source', 'unknown'] },
  pricingDetails: str,
  features: strArr,
  useCases: strArr,
  audience: str,
  competitors: strArr,
  factSheet: str,
});

// Reads every crawled page and writes (1) a fact sheet, the single source of
// truth every listing is written from, and (2) a first draft of the profile.
export async function buildFactSheet(url, crawlText, pageCount) {
  const stream = getClient().beta.messages.stream({
    ...requestBase('high'),
    max_tokens: 32000,
    system: SYSTEM,
    output_config: { effort: 'high', format: { type: 'json_schema', schema: PROFILE_SCHEMA } },
    messages: [{
      role: 'user',
      content: `Below are ${pageCount} pages crawled from ${url}, plus an overview of every URL in its sitemaps. Read all of it, then return:

factSheet: a plain-text fact sheet in Markdown with these sections, using only what the pages say (quote numbers, names and prices exactly; write "Not stated" when a section has nothing):
## What it is (2-3 sentences)
## Who it's for
## Products and tools (every distinct tool, app or feature, one line each: name - what it does - any limit or detail, e.g. formats, max size, speed, count. Use the site map overview to cover the whole site: when a section holds many similar pages, such as 200 apps, 600 prompts or 50 converters, give the count and group them with named examples instead of listing every one)
## Pricing (every plan or pack with its exact price, what's included, free tier details, refund or expiry rules)
## What makes it different (only differences the site itself claims or that are obvious from the facts, e.g. no watermark, no sign-up, runs in the browser)
## Proof points (numbers the site states, plus counts you can read off the site map overview, such as number of apps, prompts, tutorials or comparison pages; no invented numbers)
## Common questions (the site's own FAQ answers, shortened)
## Tone of the site (how it talks: casual or formal, words it uses, words it avoids)
## Pages read (the URLs)

Then the profile fields, written from the fact sheet:
- name: the product's current brand name as the site uses it.
- tagline: max 60 characters. shortDescription: max 160 characters. longDescription: 600-1000 characters, 2-3 short paragraphs separated by a blank line.
- categories: 2-4 directory categories. tags: 8-12 lowercase keywords people search for. features: 6-12 items, each "Name: what it does".
- competitors: well-known products it is an alternative to (from the site's own comparison pages if it has them).
- pricingDetails: one or two plain sentences with the real prices.

Crawled pages:
${crawlText}`,
    }],
  });
  const message = await stream.finalMessage();
  if (message.stop_reason === 'max_tokens') throw new Error('The fact sheet was cut off; try crawling fewer pages.');
  return JSON.parse(textOf(message));
}

const FIELD_ROLES = ['product_name', 'website_url', 'tagline', 'short_description', 'long_description', 'category', 'tags', 'pricing',
  'email', 'password', 'maker_name', 'company_name', 'twitter', 'linkedin', 'github', 'logo', 'screenshot', 'video_url',
  'launch_date', 'first_comment', 'alternatives', 'features', 'country', 'founded_year', 'search', 'newsletter_optin', 'terms_checkbox', 'other', 'ignore'];

const SITE_SCHEMA = obj({
  name: str,
  category: { type: 'string', enum: ['launch', 'ai', 'review', 'startup', 'dev', 'community', 'business'] },
  pricing: { type: 'string', enum: ['free', 'freemium', 'paid', 'unknown'] },
  summary: str,
  requiresAccount: { type: 'boolean' },
  isSubmissionForm: { type: 'boolean' },
  betterSubmitUrl: str,
  launchTips: str,
  fields: {
    type: 'array',
    items: obj({ fid: str, role: { type: 'string', enum: FIELD_ROLES }, maxChars: { type: 'integer' }, guidance: str }),
  },
});

// Understands a submission page: what each form field is for and any limits.
export async function analyzeSubmitPage(url, page) {
  const fields = page.fields.map((f) => ({ fid: f.fid, type: f.type, name: f.name, label: f.label, placeholder: f.placeholder, required: f.required, maxLength: f.maxLength, options: f.options?.slice(0, 30) }));
  return askJSON({
    prompt: `Analyze this listing/directory submission page.
For every form field, assign a role from the enum and maxChars (the HTML maxLength, or a limit stated on the page, or 0 if none). guidance = anything the page says about what to enter (e.g. "no marketing speak", "min 100 words").
isSubmissionForm = true only if this page itself is where a product gets submitted. If not, put the most likely submit page link in betterSubmitUrl (from the links below), else "".
requiresAccount = the page says you need to sign in / create an account to submit, or the form is a login form.
launchTips = anything useful on the page about review times, paid fast-track, launch days, or rules. Keep it to 1-2 sentences.

URL: ${url} (landed on ${page.finalUrl})
Title: ${page.title}
Login form detected: ${page.loginWall}. CAPTCHA detected: ${page.captcha}.
Candidate submit links: ${JSON.stringify(page.submitLinks)}

Form fields:
${JSON.stringify(fields, null, 1)}

Page text:
${page.text.slice(0, 10000)}`,
    schema: SITE_SCHEMA,
  });
}

const LISTING_SCHEMA = obj({
  fields: { type: 'array', items: obj({ key: str, label: str, value: str }) },
  checklist: strArr,
  notes: str,
});

const PLATFORM_VOICE = {
  launch: 'Launch platform: written by the maker in first person ("I built", "we added"). Warm and direct, like a post to a community you belong to. Mention what you would like feedback on.',
  ai: 'AI tool directory: readers compare dozens of tools. Say exactly which AI tasks it does, what you upload and what you get back, and what is free.',
  review: 'Software review site: neutral, factual, third person, like a product spec. Buyers want features, pricing and who it fits.',
  startup: 'Startup directory: short company-style summary. What it is, who it serves, pricing model, stage.',
  dev: 'Developer community: plain and technical. How it works, what it runs on, limits. No marketing at all.',
  community: 'Community post: personal and modest, a person sharing something they made and asking for honest feedback.',
  business: 'Business profile: clear, factual company description.',
};

// Writes the actual copy for one platform, checks it against the house style,
// and sends it back for one revision if the checker finds problems.
export async function writeListing(product, directory, formFields = []) {
  const fillable = formFields.filter((f) => !['password', 'ignore', 'logo', 'screenshot', 'search', 'terms_checkbox', 'newsletter_optin'].includes(f.role));
  const target = fillable.length
    ? `Write a value for each of these form fields. Use the field's fid as "key". Respect maxChars (0 = no limit). For selects, the value must be exactly one of the options. For email, name and social fields use the maker details from the profile.
${JSON.stringify(fillable.map((f) => ({ key: f.fid, label: f.label || f.name || f.placeholder, role: f.role, maxChars: f.maxChars || f.maxLength || 0, options: f.options, guidance: f.guidance })), null, 1)}`
    : `There's no captured form, so write a complete listing kit with these keys: name, tagline (max 60), short_description (max 160), long_description (600-1000 characters, short paragraphs), key_features (5-8 lines, each "Name: what it does"), pricing (one or two sentences with real prices), category, tags (comma separated), alternatives${directory.launch ? ', first_comment (the maker\'s launch-day comment: why you built it, what it does, what is free, and one specific thing you want feedback on; 120-200 words, first person)' : ''}.${directory.limits ? ` Platform limits: ${JSON.stringify(directory.limits)}.` : ''}`;

  const prompt = `Write the listing for ${product.name} on ${directory.name} (${directory.url}).
${PLATFORM_VOICE[directory.category] || ''}${directory.launchTips ? `\nPlatform notes: ${directory.launchTips}` : ''}${directory.slug === 'hacker-news' ? '\nThe title must start with "Show HN:" and be plain, no adjectives.' : ''}

${target}

Also return: checklist = concrete steps the user must do on this platform (e.g. upload a 240x240 logo, verify email, pick launch date); notes = 1-2 sentences of advice for this platform.

How to choose what to say:
- First decide the angle for this platform's readers. Pick the 3-5 facts from the fact sheet that matter most to them (AI directories: the AI features and what they produce; review sites: features, pricing and who it fits; launch sites: the story and what's new; startup directories: what it is and the business model).
- Lead with the flagship capability that fits this platform, then show breadth with real counts and 4-6 named examples. Don't list everything.
- Use exact names, numbers and prices from the fact sheet. Never invent a fact.

Fact sheet (the only source of facts):
${product.factSheet || '(no crawl yet; use the profile below)'}

Profile:
${JSON.stringify(productForPrompt(product), null, 1)}`;

  const maxFor = (key) => {
    const f = fillable.find((x) => x.fid === key);
    return f?.maxChars || f?.maxLength || directory.limits?.[key] || { tagline: 60, short_description: 160 }[key] || 0;
  };
  let result = await askJSON({ effort: 'high', prompt, schema: LISTING_SCHEMA });
  let issues = lintCopy(result.fields.map((f) => ({ ...f, max: maxFor(f.key) })));
  if (issues.length) {
    result = await askJSON({
      effort: 'medium',
      schema: LISTING_SCHEMA,
      prompt: `${prompt}

Here is your draft:
${JSON.stringify(result, null, 1)}

An editor flagged these problems. Fix every one, change nothing else, and return the full corrected listing in the same shape:
${issues.map((i) => `- ${i}`).join('\n')}`,
    });
    issues = lintCopy(result.fields.map((f) => ({ ...f, max: maxFor(f.key) })));
  }
  return { ...result, styleIssues: issues };
}

function productForPrompt(p) {
  const { id, createdAt, updatedAt, logoPath, screenshotPaths, factSheet, crawledPages, plan, ...rest } = p;
  return rest;
}

const PLAN_SCHEMA = obj({
  summary: str,
  steps: { type: 'array', items: obj({ week: { type: 'integer' }, day: str, directorySlug: str, action: str, why: str }) },
});

export async function launchPlan(product, directories, launchDate) {
  return askJSON({
    effort: 'high',
    prompt: `Create a launch plan for ${product.name}. Main launch date: ${launchDate || 'not chosen; suggest one'}.
Order the work: pre-launch directories with long queues first (BetaList etc.), then review-site profiles, then the main launch day (Product Hunt / Show HN), then AI directories and long-tail directories after launch.
Use only these directories (use their slug):
${directories.map((d) => `${d.slug}: ${d.name} [${d.category}, ${d.pricing}, tier ${d.tier}]${d.launchTips ? ` - ${d.launchTips}` : ''}`).join('\n')}

Product: ${JSON.stringify(productForPrompt(product))}
week is relative to the main launch (negative = before, 0 = launch week). day = weekday or "launch day".`,
    schema: PLAN_SCHEMA,
  });
}

// Web search for directories that aren't in the list yet. Web search results
// carry citations, which can't be combined with structured outputs, so the
// JSON is requested as a fenced block and parsed.
export async function discoverDirectories({ existing, focus }) {
  const messages = [{
    role: 'user',
    content: `Search the web for currently active websites where a founder can submit or list a software product for free or cheaply: launch platforms (like Product Hunt), startup directories, AI tool directories, SaaS review sites, and niche directories${focus ? `, especially for: ${focus}` : ''}.
Prefer sites that are active in ${new Date().getFullYear()} (recent listings, working submit page). Skip spam link farms and sites that only sell backlinks.
Skip anything already in this list: ${existing.join(', ')}.

Return up to 25 results as a JSON array in a \`\`\`json fenced block, each item:
{"name": "", "url": "homepage", "submitUrl": "direct submit page", "category": "launch|ai|review|startup|dev|community|business", "pricing": "free|freemium|paid", "tier": 1-3, "launchTips": "1 sentence: what it is, review time or cost if known"}`,
  }];

  let message;
  for (let i = 0; i < 5; i++) {
    message = await getClient().beta.messages.stream({
      ...requestBase('medium'),
      max_tokens: 32000,
      system: SYSTEM,
      tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 12 }],
      messages,
    }).finalMessage();
    if (message.stop_reason !== 'pause_turn') break;
    messages.push({ role: 'assistant', content: message.content });
  }
  const text = textOf(message);
  const match = text.match(/```json\s*([\s\S]*?)```/) || text.match(/(\[[\s\S]*\])/);
  if (!match) throw new Error('Could not read the discovery results.');
  const items = JSON.parse(match[1]);
  return Array.isArray(items) ? items : [];
}

// Finds the public page for a product on one directory, using web search.
// Returns { url, note }; url is '' when nothing was found. The caller checks
// the page really shows the product before saving it.
export async function findListing(product, directory) {
  const host = new URL(directory.url).hostname.replace(/^www\./, '');
  const messages = [{
    role: 'user',
    content: `Find the public listing page for the product "${product.name}" (${product.url}) on ${directory.name} (${host}).
Search the web, for example: site:${host} "${product.name}". The listing is the page on ${host} that is about this product (not a search page, category page or the site's homepage). Product pages on directories often contain the product's name in the URL.
If you can't find one, say so; never guess a URL.
Reply with a JSON object in a \`\`\`json fenced block: {"url": "the listing URL or empty string", "note": "one short sentence on what you found"}`,
  }];
  let message;
  for (let i = 0; i < 4; i++) {
    message = await getClient().beta.messages.stream({
      ...requestBase('low'),
      max_tokens: 8000,
      system: SYSTEM,
      tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 5, allowed_domains: [host] }],
      messages,
    }).finalMessage();
    if (message.stop_reason !== 'pause_turn') break;
    messages.push({ role: 'assistant', content: message.content });
  }
  const text = textOf(message);
  const match = text.match(/```json\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/);
  if (!match) return { url: '', note: 'No listing found yet.' };
  try {
    const r = JSON.parse(match[1]);
    const url = String(r.url || '');
    return { url: url && new URL(url).hostname.endsWith(host) ? url : '', note: String(r.note || '') };
  } catch {
    return { url: '', note: 'No listing found yet.' };
  }
}

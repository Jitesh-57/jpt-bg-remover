// All Claude calls live here: reading a product's website, understanding a
// directory's submission form, writing listing copy per platform, and
// searching the web for new directories.
import Anthropic from '@anthropic-ai/sdk';

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

const SYSTEM = `You are LaunchPilot, an expert at launching software products and getting them listed on directories, review sites and launch platforms.
You write listing copy that is specific, benefit-led and honest: no invented features, numbers, awards, reviews or customers. Only use facts from the product profile.
Match each platform's tone and limits exactly (character limits are hard limits). Avoid hype words like "revolutionary" or "game-changing".`;

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
});

export async function profileFromWebsite(url, page) {
  return askJSON({
    prompt: `Build a product profile from this website for directory listings.
- tagline: max 60 chars. shortDescription: max 160 chars. longDescription: 500-900 chars, 2-3 short paragraphs.
- categories: 2-4 broad directory categories (e.g. "Design Tools", "Productivity", "AI"). tags: 6-12 lowercase keywords.
- competitors: well-known products this is an alternative to (only if clear from the site or obvious from the category).
- Use empty strings/arrays when the site doesn't say.

URL: ${url}
Title: ${page.title}
Meta description: ${page.metaDescription}

Visible page text:
${page.text.slice(0, 15000)}`,
    schema: PROFILE_SCHEMA,
  });
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

// Writes the actual copy for one platform. With analyzed form fields the
// values map 1:1 to those fields; without, it writes a standard listing kit.
export async function writeListing(product, directory, formFields = []) {
  const fillable = formFields.filter((f) => !['password', 'ignore', 'logo', 'screenshot', 'search', 'terms_checkbox', 'newsletter_optin'].includes(f.role));
  const target = fillable.length
    ? `Write a value for each of these form fields. Use the field's fid as "key". Respect maxChars (0 = no limit). For selects, the value must be exactly one of the options. For email/name/social fields use the product's maker details.
${JSON.stringify(fillable.map((f) => ({ key: f.fid, label: f.label || f.name || f.placeholder, role: f.role, maxChars: f.maxChars || f.maxLength || 0, options: f.options, guidance: f.guidance })), null, 1)}`
    : `There's no captured form, so write a complete listing kit with these keys: name, tagline, short_description, long_description, category, tags, ${directory.launch ? 'first_comment (the maker\'s launch-day comment: personal story, what it does, an ask for feedback; 120-200 words), ' : ''}alternatives.${directory.limits ? ` Platform limits: ${JSON.stringify(directory.limits)}.` : ''}`;

  return askJSON({
    effort: 'high',
    prompt: `Write the listing for ${product.name} on ${directory.name} (${directory.url}).
Platform type: ${directory.category}. ${directory.launchTips ? `Platform notes: ${directory.launchTips}` : ''}
Tailor tone to the platform: Product Hunt / launch sites = conversational and maker-led; review sites = clear and factual; AI directories = lead with what the AI does; Hacker News = plain, technical, no marketing.
Make the copy different from other directories (paraphrase rather than repeating the same sentences) so listings aren't duplicate content.

${target}

Also return: checklist = concrete steps the user must do themselves on this platform (e.g. upload a 240x240 logo, verify email, pick launch date); notes = 1-3 sentences of advice for this platform.

Product profile:
${JSON.stringify(productForPrompt(product), null, 1)}`,
    schema: LISTING_SCHEMA,
  });
}

function productForPrompt(p) {
  const { id, createdAt, updatedAt, logoPath, screenshotPaths, ...rest } = p;
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

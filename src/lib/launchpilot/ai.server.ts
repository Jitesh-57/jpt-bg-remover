/**
 * ai.server.ts — LaunchPilot's writing jobs. Prompts live here on the server,
 * so the API can't be used as a general-purpose AI proxy.
 *
 * Claude writes when ANTHROPIC_API_KEY is set. If only GEMINI_API_KEY is set
 * (the site's image tools already use it), Gemini writes instead, so the tool
 * works with whichever key the deployment has.
 */
import Anthropic from "@anthropic-ai/sdk";
import { WRITING_RULES, lintCopy } from "./style";

const CLAUDE_MODEL = process.env.LAUNCHPILOT_MODEL || "claude-opus-5-5";
const GEMINI_MODEL = process.env.LAUNCHPILOT_GEMINI_MODEL || "gemini-2.5-flash";

export function aiAvailable(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.GEMINI_API_KEY);
}

const SYSTEM = `You are LaunchPilot, an experienced launch marketer who gets software products listed on directories, review sites and launch platforms.
You write the way a careful human copywriter does: specific, plain, and true to the product's own facts.

${WRITING_RULES}

Always reply with only one JSON value, no prose and no code fences.`;

function parseJson<T>(text: string): T {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.search(/[[{]/);
    const end = Math.max(cleaned.lastIndexOf("}"), cleaned.lastIndexOf("]"));
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1)) as T;
    throw new Error("The AI answer came back malformed. Try again.");
  }
}

async function askClaude(prompt: string, effort: "low" | "medium" | "high", maxTokens: number): Promise<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  // fallbacks: "default" re-runs a request a safety classifier declines on
  // Anthropic's recommended fallback model instead of failing.
  const message = await client.beta.messages.stream({
    model: CLAUDE_MODEL,
    max_tokens: maxTokens,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort },
    system: SYSTEM,
    messages: [{ role: "user", content: prompt }],
  }).finalMessage();
  if (message.stop_reason === "refusal") throw new Error("The AI declined this request. Try editing your fact sheet.");
  if (message.stop_reason === "max_tokens") throw new Error("The AI answer was cut off. Try fewer pages or a shorter fact sheet.");
  return message.content.map((b) => (b.type === "text" ? b.text : "")).join("");
}

async function askGemini(prompt: string, maxTokens: number): Promise<string> {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json", maxOutputTokens: maxTokens, temperature: 0.7 },
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || `AI request failed (${res.status})`);
  return (data?.candidates?.[0]?.content?.parts || []).map((p: { text?: string }) => p.text || "").join("");
}

async function askJson<T>(prompt: string, { effort = "medium", maxTokens = 16000 }: { effort?: "low" | "medium" | "high"; maxTokens?: number } = {}): Promise<T> {
  if (process.env.ANTHROPIC_API_KEY) return parseJson<T>(await askClaude(prompt, effort, maxTokens));
  if (process.env.GEMINI_API_KEY) return parseJson<T>(await askGemini(prompt, maxTokens));
  throw new Error("AI isn't set up on this deployment yet. Add ANTHROPIC_API_KEY in the Vercel project settings.");
}

// ── Fact sheet ────────────────────────────────────────────────────────────────

export interface Profile {
  factSheet: string; name: string; url: string; tagline: string; shortDescription: string; longDescription: string;
  audience: string; pricing: string; pricingDetails: string; categories: string[]; tags: string[]; features: string[]; competitors: string[];
}

export function buildFactSheet(url: string, pagesText: string, pageCount: number): Promise<Profile> {
  return askJson<Profile>(`Below are ${pageCount} pages from ${url || "the product's website"}. Read all of them, then return a JSON object.

factSheet: a plain-text fact sheet in Markdown with these sections, using only what the pages say (quote numbers, names and prices exactly; write "Not stated" when a section has nothing):
## What it is (2-3 sentences)
## Who it's for
## Products and tools (every distinct tool, app or feature, one line each: name: what it does, plus any limit or detail like formats, max size, count)
## Pricing (every plan or pack with its exact price, what's included, free tier, refund or expiry rules)
## What makes it different (only what the pages claim or what is obvious from the facts)
## Proof points (numbers the pages state; never invent numbers)
## Common questions (the pages' own FAQ answers, shortened)
## Tone of the site (casual or formal, words it uses)
## Pages read (the URLs)

Then the profile fields, written from the fact sheet:
- name: the product's current brand name. url: the homepage URL.
- tagline: max 60 characters. shortDescription: max 160 characters. longDescription: 600-1000 characters in 2-3 short paragraphs separated by a blank line.
- categories: 2-4 directory categories. tags: 8-12 lowercase search keywords. features: 6-12 items, each "Name: what it does". competitors: well-known products it's an alternative to.
- pricing: one of free, freemium, paid, free-trial, open-source. pricingDetails: one or two plain sentences with the real prices. audience: one sentence.

Keys: factSheet, name, url, tagline, shortDescription, longDescription, audience, pricing, pricingDetails, categories, tags, features, competitors.

Pages:
${pagesText}`, { effort: "medium", maxTokens: 32000 });
}

// ── Listing copy ──────────────────────────────────────────────────────────────

const PLATFORM_VOICE: Record<string, string> = {
  launch: 'Launch platform: written by the maker in first person ("I built", "we added"). Warm and direct, like a post to a community you belong to. Mention what you would like feedback on.',
  ai: "AI tool directory: readers compare dozens of tools. Say exactly which AI tasks it does, what you upload and what you get back, and what is free.",
  review: "Software review site: neutral, factual, third person, like a product spec. Buyers want features, pricing and who it fits.",
  startup: "Startup directory: short company-style summary. What it is, who it serves, pricing model, stage.",
  dev: "Developer community: plain and technical. How it works, what it runs on, limits. No marketing at all.",
  community: "Community post: personal and modest, a person sharing something they made and asking for honest feedback.",
  business: "Business profile: clear, factual company description.",
};

export interface SiteInfo { id: string; name: string; url: string; category: string; launch?: boolean; launchTips?: string }
export interface Listing { fields: { label: string; value: string; max: number }[]; checklist: string[]; notes: string; styleIssues: string[] }

function profileText(p: Record<string, unknown>): string {
  const keys = ["name", "url", "tagline", "shortDescription", "longDescription", "audience", "pricing", "pricingDetails", "categories", "tags", "features", "competitors", "makerName", "makerEmail", "twitter", "linkedin", "videoUrl"];
  return JSON.stringify(Object.fromEntries(keys.filter((k) => p[k] && (!Array.isArray(p[k]) || (p[k] as unknown[]).length)).map((k) => [k, p[k]])), null, 1);
}

export async function writeListing(product: Record<string, unknown>, site: SiteInfo, formText: string): Promise<Listing> {
  const prompt = `Write the listing for ${product.name} on ${site.name} (${site.url}).
${PLATFORM_VOICE[site.category] || ""}${site.launchTips ? `\nPlatform notes: ${site.launchTips}` : ""}${site.id === "hacker-news" ? '\nThe title must start with "Show HN:" and be plain, no adjectives.' : ""}
${formText ? `Their form, as copied by the user. Write one field per form field, using that field's label and limit:\n${formText.slice(0, 8000)}` : `No form was given. Write these fields: Product name, Tagline (max 60), Short description (max 160), Long description (600-1000 characters, short paragraphs), Key features (5-8 lines, each "Name: what it does"), Pricing (one or two sentences with real prices), Category, Tags (comma separated), Alternative to${site.launch ? ", First comment (the maker's launch-day comment in first person: why you built it, what it does, what is free, and one specific thing you want feedback on; 120-200 words)" : ""}.`}

Fact sheet (the only source of facts):
${String(product.factSheet || "(no fact sheet yet; use the profile)").slice(0, 60000)}

Profile:
${profileText(product)}

Reply with a JSON object: {"fields": [{"label": "", "value": "", "max": 0}], "checklist": ["steps the user must do on this platform, e.g. upload a 240x240 logo, verify email"], "notes": "1-2 sentences of advice"}. max = the character limit, or 0 if none.`;

  let draft = await askJson<Omit<Listing, "styleIssues">>(prompt, { effort: "high" });
  let issues = lintCopy(draft.fields || []);
  if (issues.length) {
    draft = await askJson<Omit<Listing, "styleIssues">>(`${prompt}

Here is your draft:
${JSON.stringify(draft)}

An editor flagged these problems. Fix every one, change nothing else, and reply with the full corrected JSON in the same shape:
${issues.map((i) => `- ${i}`).join("\n")}`, { effort: "medium" });
    issues = lintCopy(draft.fields || []);
  }
  return {
    fields: (draft.fields || []).map((f) => ({ label: String(f.label), value: String(f.value), max: Number(f.max) || 0 })),
    checklist: Array.isArray(draft.checklist) ? draft.checklist.map(String) : [],
    notes: String(draft.notes || ""),
    styleIssues: issues,
  };
}

// ── Discovery and planning ────────────────────────────────────────────────────

export function suggestSites(product: Record<string, unknown>, existing: string[]) {
  return askJson<{ name: string; url: string; submitUrl: string; category: string; pricing: string; tier: number; launchTips: string }[]>(
    `Suggest up to 20 real websites where a founder can list or launch a product like this one, that are NOT in the existing list. Include launch platforms, startup and SaaS directories, AI tool directories, review sites and niche directories that fit the product's category. Only include sites you are confident exist and accept submissions; no link farms or paid-backlink sellers.
Product: ${product.name}: ${product.tagline || ""} (categories: ${((product.categories as string[]) || []).join(", ")})
Existing (skip these domains): ${existing.slice(0, 400).join(", ")}
Reply with a JSON array of objects: {"name": "", "url": "homepage URL", "submitUrl": "submit page URL or homepage", "category": "launch|ai|review|startup|dev|community|business", "pricing": "free|freemium|paid", "tier": 1, "launchTips": "one sentence on what it is"}. tier: 1 = high authority, 3 = long tail.`,
    { effort: "medium" },
  );
}

export function launchPlan(product: Record<string, unknown>, sites: SiteInfo[]) {
  return askJson<{ summary: string; steps: { week: number; day: string; siteId: string; action: string; why: string }[] }>(
    `Create a launch plan for ${product.name}. Order the work: pre-launch platforms with long review queues first (e.g. BetaList), then review-site profiles, then the main launch day (e.g. Product Hunt Tue-Thu 12:01 AM PT, Show HN on a weekday morning US Eastern), then AI and long-tail directories after launch.
Use only these sites (use the id exactly):
${sites.slice(0, 120).map((s) => `${s.id}: ${s.name} [${s.category}]${s.launchTips ? " - " + s.launchTips : ""}`).join("\n")}
Product: ${profileText(product)}
Reply with a JSON object: {"summary": "2 sentences", "steps": [{"week": -2, "day": "Tuesday", "siteId": "", "action": "", "why": ""}]}. week is relative to the main launch week (negative = before, 0 = launch week).`,
    { effort: "medium" },
  );
}

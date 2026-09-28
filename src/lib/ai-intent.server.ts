import Anthropic from "@anthropic-ai/sdk";

/**
 * ai-intent.server.ts — turns what someone types into an edit Pixel Shine can run.
 *
 * Given the request, the tool they're in, what they've already changed this
 * session and (optionally) the photo, it returns:
 *   · understood   — short label/value pairs for the "We understood" card
 *   · prompt       — the full edit instruction sent to the image model, with
 *                    the right "keep this unchanged" rules for the subject
 *   · question     — set only when the request is too vague to act on
 *   · suggestions  — what to try next, specific to this image and tool
 *
 * Claude does the reading when ANTHROPIC_API_KEY is set; otherwise a small
 * keyword fallback keeps the studio working.
 */

export interface IntentInput {
  request: string;
  tool?: string | null;          // e.g. "AI Product Photography"
  history?: string[];            // edits already applied this session, oldest first
  image?: string | null;         // https URL or data URL of the current image
  mode?: "intent" | "analyze";   // analyze: describe the photo and recommend actions
}

export interface IntentResult {
  understood: { label: string; value: string }[];
  prompt: string;
  question?: string;
  options?: string[];
  suggestions: string[];
  detected?: string[];
  recommended?: { label: string; prompt: string }[];
  source: "ai" | "rules";
  /** Why the keyword fallback was used, when it was. Shown to admins only. */
  why?: string;
}

const MODEL = "claude-opus-5";

const SYSTEM = `You are the request interpreter inside Pixel Shine, an AI photo studio. People describe photo edits in plain words; you turn that into a precise instruction for an image-editing model and a short summary the person can check before spending credits.

Rules:
- The edit applies to the CURRENT image, which already includes every earlier edit in the session. Resolve words like "it", "darker", "more" against those earlier edits; never ask the person to repeat themselves.
- Write "prompt" as one self-contained instruction to the image model: what to change, then what must stay the same. Always preserve the person's identity and face for portraits, and the product's shape, labels, logos, text, material and camera angle for products, unless the request is to change exactly that.
- "understood" is 2-5 short pairs such as {"label":"Background","value":"Marble studio"}. Plain words, no jargon, no model names.
- Only set "question" when the request can't be acted on sensibly (e.g. "make it better", "fix it"). Then give 3-5 short "options" the person can tap, and leave "prompt" empty.
- "suggestions" are 4 short next steps (2-5 words each) that fit this image and tool, e.g. "Try a marble background".
- Never mention AI models, prompts or technical settings to the person.
- Reply with JSON only, no prose, matching:
{"understood":[{"label":"","value":""}],"prompt":"","question":"","options":[],"suggestions":[]}`;

const ANALYZE = `You are Pixel Shine's photo reader. Look at the photo and help the person decide what to do with it.
Reply with JSON only:
{"detected":["3-5 short facts, e.g. Product","White background","Soft light"],"recommended":[{"label":"2-4 word action","prompt":"full edit instruction for the image model, including what to keep unchanged"}],"suggestions":["4 short next steps"]}
Give 4 recommended actions that suit this specific photo${""}. Plain words, no jargon.`;

function client(): Anthropic | null {
  return process.env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) : null;
}

type ImageBlock = { type: "image"; source: { type: "url"; url: string } | { type: "base64"; media_type: "image/jpeg" | "image/png" | "image/webp"; data: string } };

function imageBlock(src: string | null | undefined): ImageBlock | null {
  if (!src) return null;
  if (/^https:\/\//.test(src)) return { type: "image", source: { type: "url", url: src } };
  const m = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(src);
  if (!m || m[2].length > 6_500_000) return null; // Claude's per-image limit is ~5 MB of bytes
  return { type: "image", source: { type: "base64", media_type: m[1] as "image/jpeg", data: m[2] } };
}

function parseJson(text: string): Record<string, unknown> | null {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]) as Record<string, unknown>; } catch { return null; }
}

const strs = (v: unknown, max: number, len = 80): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && !!x.trim()).map((x) => x.trim().slice(0, len)).slice(0, max) : [];

async function askClaude(system: string, content: Anthropic.MessageParam["content"]): Promise<Record<string, unknown> | null> {
  const c = client();
  if (!c) return null;
  // Fields newer than this SDK version's types are passed through as-is.
  const params = {
    model: MODEL,
    max_tokens: 4000,
    system,
    messages: [{ role: "user" as const, content }],
    output_config: { effort: "low" },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
  };
  const res = await c.beta.messages.create(params as unknown as Parameters<typeof c.beta.messages.create>[0]) as Anthropic.Beta.BetaMessage;
  if ((res.stop_reason as string) === "refusal") return null;
  const text = res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
  return parseJson(text);
}

export async function readIntent(input: IntentInput): Promise<IntentResult> {
  const request = input.request.trim().slice(0, 2000);
  const history = (input.history || []).slice(-8);
  const img = imageBlock(input.image);
  let why = client() ? "" : "ANTHROPIC_API_KEY is not set on this deployment";

  try {
    if (input.mode === "analyze") {
      const content: Anthropic.MessageParam["content"] = [
        ...(img ? [img as unknown as Anthropic.ImageBlockParam] : []),
        { type: "text", text: `Tool the person is using: ${input.tool || "AI Image Editor"}.` },
      ];
      const j = img ? await askClaude(ANALYZE, content) : null;
      if (j) {
        const rec = Array.isArray(j.recommended) ? j.recommended : [];
        return {
          understood: [], prompt: "", source: "ai",
          detected: strs(j.detected, 5, 40),
          recommended: rec
            .filter((r): r is { label: string; prompt: string } => !!r && typeof (r as { label?: unknown }).label === "string" && typeof (r as { prompt?: unknown }).prompt === "string")
            .slice(0, 4)
            .map((r) => ({ label: r.label.slice(0, 40), prompt: r.prompt.slice(0, 1200) })),
          suggestions: strs(j.suggestions, 4, 40),
        };
      }
      return { ...rulesAnalyze(input.tool), source: "rules", why: why || (img ? "Claude's reply could not be read" : "The image could not be sent") };
    }

    const content: Anthropic.MessageParam["content"] = [
      ...(img ? [img as unknown as Anthropic.ImageBlockParam] : []),
      {
        type: "text",
        text: [
          `Tool: ${input.tool || "AI Image Editor (general edits)"}`,
          history.length ? `Edits already applied, oldest first:\n${history.map((h, i) => `${i + 1}. ${h}`).join("\n")}` : "No edits yet: this is the original photo.",
          `New request: ${request}`,
        ].join("\n\n"),
      },
    ];
    const j = await askClaude(SYSTEM, content);
    if (j) {
      const understood = Array.isArray(j.understood)
        ? j.understood
            .filter((u): u is { label: string; value: string } => !!u && typeof (u as { label?: unknown }).label === "string" && typeof (u as { value?: unknown }).value === "string")
            .slice(0, 5)
            .map((u) => ({ label: u.label.slice(0, 30), value: u.value.slice(0, 60) }))
        : [];
      const question = typeof j.question === "string" && j.question.trim() ? j.question.trim().slice(0, 200) : undefined;
      const prompt = typeof j.prompt === "string" ? j.prompt.trim().slice(0, 2000) : "";
      if (question || prompt) {
        return { understood, prompt: question ? "" : prompt, question, options: question ? strs(j.options, 5, 40) : undefined, suggestions: strs(j.suggestions, 4, 40), source: "ai" };
      }
    }
  } catch (e) {
    why = (e as Error).message.slice(0, 200);
    console.error("[ai-intent]", why);
    if (input.mode === "analyze") return { ...rulesAnalyze(input.tool), source: "rules", why };
  }
  return { ...rulesIntent(request, history, input.tool), source: "rules", why: why || "Claude's reply could not be read" };
}

/* ── Fallback: keyword reading, so the studio works without the AI key ─── */

const VAGUE = /^(make it |)(better|nicer|good|great|pro|professional|fix( it)?|improve( it)?|enhance( it)?)\.?$/i;

const FACETS: [RegExp, string][] = [
  [/background|backdrop|scene|behind/i, "Background"],
  [/light|bright|dark|shadow|glow|sunset|golden hour/i, "Lighting"],
  [/outfit|dress|suit|shirt|clothes|wear/i, "Outfit"],
  [/remove|erase|delete|get rid/i, "Remove"],
  [/colou?r|tone|warm|cool|vivid|black and white/i, "Colour"],
  [/style|cinematic|luxury|premium|minimal|vintage|anime|ghibli|3d|editorial/i, "Style"],
  [/sharp|upscale|restore|quality|detail|4k|hd/i, "Quality"],
];

function rulesIntent(request: string, history: string[], tool?: string | null): Omit<IntentResult, "source"> {
  if (VAGUE.test(request)) {
    return {
      understood: [], prompt: "",
      question: "Sure, what would you like improved?",
      options: ["Lighting", "Background", "Colours", "Sharpness", "Remove distractions"],
      suggestions: [],
    };
  }
  const understood = FACETS.filter(([re]) => re.test(request)).slice(0, 3).map(([, label]) => ({ label, value: request.length > 50 ? `${request.slice(0, 47)}…` : request }));
  if (!understood.length) understood.push({ label: "Change", value: request.length > 50 ? `${request.slice(0, 47)}…` : request });
  understood.push({ label: "Keep", value: "Faces, products and everything else" });
  const context = history.length ? ` The image already has these edits applied, keep them: ${history.join("; ")}.` : "";
  return {
    understood,
    prompt: `${request.replace(/\.$/, "")}.${context} Change only what is asked. Keep every person's face and identity, and any product's shape, labels, logos and text, exactly as they are. Photorealistic, natural result.${tool ? ` (Context: ${tool}.)` : ""}`,
    suggestions: ["Make the lighting softer", "Try a studio background", "Add a subtle shadow", "Sharpen the details"],
  };
}

function rulesAnalyze(tool?: string | null): Omit<IntentResult, "source"> {
  return {
    understood: [], prompt: "", detected: [],
    recommended: [
      { label: "Studio background", prompt: "Replace the background with a clean, softly lit studio backdrop. Keep the subject exactly as is." },
      { label: "Improve lighting", prompt: "Improve the lighting: soft, even, flattering light with natural shadows. Change nothing else." },
      { label: "Remove distractions", prompt: "Remove distracting objects and people from the background. Keep the main subject unchanged." },
      { label: "Sharpen & restore", prompt: "Sharpen and restore fine detail, reduce noise, keep colours natural. Change nothing else." },
    ],
    suggestions: tool ? [`Use ${tool} style`] : [],
  };
}

// House style for listing copy, and a checker that catches the tells that make
// copy read as machine-written. The checker runs after every AI draft; anything
// it flags goes back for one revision pass.

export const WRITING_RULES = `How to write (these rules matter more than anything else):
- Write like the founder describing the product to a smart friend: plain words, concrete details, no sales voice.
- Lead with what the product does and who it's for, in the first sentence. No warm-up, no rhetorical questions.
- Use the specifics from the fact sheet: real tool names, real numbers, real prices, real limits ("upscales to 4K", "edits up to 100 photos at once", "packs start at $2"). One specific fact beats three adjectives.
- Only state facts that are in the fact sheet. Never invent users, ratings, awards, speed claims or integrations.
- Vary sentence length. Keep most sentences under 20 words. One idea per sentence.
- Use "you" for the reader. Contractions are fine (it's, you'll, don't).
- No em dashes or en dashes; use a comma, a period or parentheses instead. No exclamation marks. No emojis. No ALL CAPS.
- Don't stack adjectives, don't list things in threes by reflex, and don't use "not just X, but Y" or "whether you're X or Y".
- Never use these words or phrases: ${'unlock, unleash, elevate, empower, seamless, seamlessly, effortless, effortlessly, revolutionize, revolutionary, game-changer, game-changing, cutting-edge, state-of-the-art, leverage, robust, harness, supercharge, streamline, next level, next-level, take your, look no further, in today\'s, fast-paced, dive in, delve, tapestry, realm, landscape, one-stop, world-class, best-in-class, innovative, stunning, transform your, boost your, ever-evolving, navigate, embark, journey, crucial, comprehensive, furthermore, moreover, additionally, in conclusion, whether you\'re, all your needs, at your fingertips, hassle-free, like never before'}.
- Each directory gets its own wording and its own opening line, so no two listings share sentences.`;

const BANNED = [
  'unlock', 'unleash', 'elevate', 'empower', 'seamless', 'seamlessly', 'effortless', 'effortlessly', 'revolutioni[sz]e', 'revolutionary',
  'game[- ]chang(er|ing)', 'cutting[- ]edge', 'state[- ]of[- ]the[- ]art', 'leverag(e|ing)', 'robust', 'harness', 'supercharge', 'streamline',
  'next[- ]level', 'take your', 'look no further', "in today's", 'fast[- ]paced', 'dive in', 'delve', 'tapestry', 'realm', 'landscape',
  'one[- ]stop', 'world[- ]class', 'best[- ]in[- ]class', 'innovative', 'stunning', 'transform your', 'boost your', 'ever[- ]evolving',
  'navigate', 'embark', 'journey', 'crucial', 'comprehensive', 'furthermore', 'moreover', 'additionally', 'in conclusion',
  "whether you're", 'all your needs', 'at your fingertips', 'hassle[- ]free', 'like never before', 'not just', 'elevating',
];
const BANNED_RE = new RegExp(`\\b(${BANNED.join('|')})\\b`, 'gi');

/**
 * Returns a list of problems in plain words, one per issue.
 * fields: [{label, value, max}]
 */
export function lintCopy(fields) {
  const issues = [];
  const openings = new Map();
  for (const f of fields) {
    const v = String(f.value || '');
    const label = f.label || f.key || 'field';
    const banned = [...new Set((v.match(BANNED_RE) || []).map((w) => w.toLowerCase()))];
    if (banned.length) issues.push(`${label}: remove the words ${banned.map((w) => `"${w}"`).join(', ')}`);
    if (/[—–]/.test(v)) issues.push(`${label}: replace the dashes with a comma or a period`);
    if (/!/.test(v)) issues.push(`${label}: remove the exclamation marks`);
    if (/\p{Extended_Pictographic}/u.test(v) && !/first comment|maker comment/i.test(label)) issues.push(`${label}: remove the emojis`);
    if (f.max && v.length > f.max) issues.push(`${label}: ${v.length} characters, the limit is ${f.max}`);
    const long = v.split(/(?<=[.?])\s+/).filter((s) => s.split(/\s+/).length > 32);
    if (long.length) issues.push(`${label}: split the sentence starting "${long[0].slice(0, 40)}…", it's too long`);
    const first = v.split(/\s+/).slice(0, 3).join(' ').toLowerCase();
    if (v.length > 80 && first) {
      if (openings.has(first)) issues.push(`${label}: starts the same way as ${openings.get(first)}; open differently`);
      else openings.set(first, label);
    }
  }
  return issues;
}

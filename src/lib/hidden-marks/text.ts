// Hidden-character cleaner for text — the "Layer A" of invisible text
// watermarks. Finds zero-width characters, bidirectional controls, Unicode tag
// characters, stray variation selectors and look-alike spaces, which can be
// used to fingerprint copied text or smuggle hidden messages, and removes or
// normalises them. Characters that real writing needs are left alone: emoji
// ZWJ sequences, ZWJ/ZWNJ inside Indic and Arabic-script words, flag tag
// sequences, emoji presentation selectors and CJK ideographic variants.

export type CharClass = "zero-width" | "bidi" | "tag" | "variation" | "space" | "format";

export type TextOptions = Record<CharClass, boolean>;
export const DEFAULT_TEXT_OPTIONS: TextOptions = { "zero-width": true, bidi: true, tag: true, variation: true, space: true, format: true };

export const CLASS_LABELS: Record<CharClass, string> = {
  "zero-width": "Zero-width characters",
  bidi: "Direction controls (bidi)",
  tag: "Unicode tag characters",
  variation: "Stray variation selectors",
  space: "Look-alike spaces",
  format: "Other invisible formatting",
};

export type TextHit = {
  /** UTF-16 index in the original string. */
  index: number;
  length: number;
  cp: number;
  cls: CharClass;
  name: string;
  /** What the cleaner did with it. */
  action: "removed" | "replaced" | "kept";
};

export type TextScan = {
  cleaned: string;
  hits: TextHit[];
  counts: Record<CharClass, number>;
  /** Text decoded from tag-character or variation-selector smuggling. */
  hiddenMessages: string[];
};

const NAMES: Record<number, string> = {
  0x200b: "ZERO WIDTH SPACE", 0x200c: "ZERO WIDTH NON-JOINER", 0x200d: "ZERO WIDTH JOINER", 0x2060: "WORD JOINER",
  0xfeff: "ZERO WIDTH NO-BREAK SPACE (BOM)", 0x180e: "MONGOLIAN VOWEL SEPARATOR",
  0x200e: "LEFT-TO-RIGHT MARK", 0x200f: "RIGHT-TO-LEFT MARK", 0x061c: "ARABIC LETTER MARK",
  0x202a: "LEFT-TO-RIGHT EMBEDDING", 0x202b: "RIGHT-TO-LEFT EMBEDDING", 0x202c: "POP DIRECTIONAL FORMATTING",
  0x202d: "LEFT-TO-RIGHT OVERRIDE", 0x202e: "RIGHT-TO-LEFT OVERRIDE", 0x2066: "LEFT-TO-RIGHT ISOLATE",
  0x2067: "RIGHT-TO-LEFT ISOLATE", 0x2068: "FIRST STRONG ISOLATE", 0x2069: "POP DIRECTIONAL ISOLATE",
  0x00a0: "NO-BREAK SPACE", 0x202f: "NARROW NO-BREAK SPACE", 0x205f: "MEDIUM MATHEMATICAL SPACE",
  0x3000: "IDEOGRAPHIC SPACE", 0x1680: "OGHAM SPACE MARK", 0x2028: "LINE SEPARATOR", 0x2029: "PARAGRAPH SEPARATOR",
  0x00ad: "SOFT HYPHEN", 0x034f: "COMBINING GRAPHEME JOINER", 0x2061: "FUNCTION APPLICATION",
  0x2062: "INVISIBLE TIMES", 0x2063: "INVISIBLE SEPARATOR", 0x2064: "INVISIBLE PLUS",
  0x115f: "HANGUL CHOSEONG FILLER", 0x1160: "HANGUL JUNGSEONG FILLER", 0x3164: "HANGUL FILLER", 0xffa0: "HALFWIDTH HANGUL FILLER",
};

const SPACE_NAMES = ["EN QUAD", "EM QUAD", "EN SPACE", "EM SPACE", "THREE-PER-EM SPACE", "FOUR-PER-EM SPACE", "SIX-PER-EM SPACE", "FIGURE SPACE", "PUNCTUATION SPACE", "THIN SPACE", "HAIR SPACE"];

export function charName(cp: number): string {
  if (NAMES[cp]) return NAMES[cp];
  if (cp >= 0x2000 && cp <= 0x200a) return SPACE_NAMES[cp - 0x2000];
  if (cp >= 0xe0000 && cp <= 0xe007f) return cp >= 0xe0020 && cp <= 0xe007e ? `TAG “${String.fromCharCode(cp - 0xe0000)}”` : cp === 0xe007f ? "CANCEL TAG" : "LANGUAGE TAG";
  if (cp >= 0xfe00 && cp <= 0xfe0f) return `VARIATION SELECTOR-${cp - 0xfe00 + 1}`;
  if (cp >= 0xe0100 && cp <= 0xe01ef) return `VARIATION SELECTOR-${cp - 0xe0100 + 17}`;
  return `U+${cp.toString(16).toUpperCase().padStart(4, "0")}`;
}

function classify(cp: number): CharClass | null {
  if (cp === 0x200b || cp === 0x200c || cp === 0x200d || cp === 0x2060 || cp === 0xfeff || cp === 0x180e) return "zero-width";
  if (cp === 0x200e || cp === 0x200f || cp === 0x061c || (cp >= 0x202a && cp <= 0x202e) || (cp >= 0x2066 && cp <= 0x2069)) return "bidi";
  if (cp >= 0xe0000 && cp <= 0xe007f) return "tag";
  if ((cp >= 0xfe00 && cp <= 0xfe0f) || (cp >= 0xe0100 && cp <= 0xe01ef)) return "variation";
  if (cp === 0x00a0 || (cp >= 0x2000 && cp <= 0x200a) || cp === 0x202f || cp === 0x205f || cp === 0x3000 || cp === 0x1680 || cp === 0x2028 || cp === 0x2029) return "space";
  if (cp === 0x00ad || cp === 0x034f || (cp >= 0x2061 && cp <= 0x2064) || cp === 0x115f || cp === 0x1160 || cp === 0x3164 || cp === 0xffa0) return "format";
  return null;
}

const EMOJI_BEFORE = new RegExp("[\\p{Extended_Pictographic}\\p{Emoji_Modifier}\\u{FE0F}\\u{20E3}]", "u");
const EMOJI = new RegExp("\\p{Extended_Pictographic}", "u");
const NON_LATIN_LETTER = new RegExp("[\\p{L}\\p{M}]", "u");
const LATIN_OR_COMMON = new RegExp("[\\p{Script=Latin}\\p{Script=Common}]", "u");
const HAN = new RegExp("\\p{Script=Han}", "u");
const READABLE = new RegExp("[\\p{L}\\p{N}]", "u");

const isJoinableLetter = (c: string | undefined) => !!c && NON_LATIN_LETTER.test(c) && !LATIN_OR_COMMON.test(c);

/** Decode "emoji smuggling": bytes hidden as variation selectors, 0–15 → FE00+, 16–255 → E0100+. */
function decodeSelectors(cps: number[]): string | null {
  if (cps.length < 2) return null;
  const bytes = cps.map((c) => (c <= 0xfe0f ? c - 0xfe00 : c - 0xe0100 + 16));
  const s = new TextDecoder("utf-8", { fatal: false }).decode(new Uint8Array(bytes));
  return READABLE.test(s) ? s : null;
}

export function scanText(input: string, opts: TextOptions = DEFAULT_TEXT_OPTIONS): TextScan {
  const chars = Array.from(input);
  const hits: TextHit[] = [];
  const counts: Record<CharClass, number> = { "zero-width": 0, bidi: 0, tag: 0, variation: 0, space: 0, format: 0 };
  const hiddenMessages: string[] = [];
  let out = "";
  let index = 0;
  let tagRun = "";
  let selRun: number[] = [];

  const flushRuns = () => {
    if (tagRun.trim()) hiddenMessages.push(tagRun);
    tagRun = "";
    const msg = decodeSelectors(selRun);
    if (msg) hiddenMessages.push(msg);
    selRun = [];
  };

  // Is position i inside a flag tag sequence (🏴 + tags + CANCEL TAG)?
  const inFlagSequence = (i: number) => {
    let s = i;
    while (s > 0 && (chars[s - 1].codePointAt(0)! >= 0xe0020 && chars[s - 1].codePointAt(0)! <= 0xe007e)) s--;
    if (s === 0 || chars[s - 1].codePointAt(0) !== 0x1f3f4) return false;
    let e = i;
    while (e < chars.length && chars[e].codePointAt(0)! >= 0xe0020 && chars[e].codePointAt(0)! <= 0xe007e) e++;
    return chars[e]?.codePointAt(0) === 0xe007f;
  };

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const cp = ch.codePointAt(0)!;
    const cls = classify(cp);
    if (!cls) {
      flushRuns();
      out += ch;
      index += ch.length;
      continue;
    }

    let legit = false;
    const prev = chars[i - 1];
    const next = chars[i + 1];
    if (cp === 0x200d && prev && next && EMOJI_BEFORE.test(prev) && EMOJI.test(next)) legit = true;
    if ((cp === 0x200d || cp === 0x200c) && isJoinableLetter(prev) && isJoinableLetter(next)) legit = true;
    if (cp === 0xfe0e || cp === 0xfe0f || cp === 0x20e3) legit = true;
    if (cp >= 0xe0100 && cp <= 0xe01ef && prev && HAN.test(prev)) legit = true;
    if (cls === "tag" && inFlagSequence(i)) legit = true;
    if (cp === 0xe007f && prev && inFlagSequence(i - 1)) legit = true;

    if (!legit) {
      if (cls === "tag" && cp >= 0xe0020 && cp <= 0xe007e) tagRun += String.fromCharCode(cp - 0xe0000);
      if (cls === "variation") selRun.push(cp);
    }

    let action: TextHit["action"] = "kept";
    if (legit || !opts[cls]) {
      out += ch;
    } else if (cls === "space") {
      out += cp === 0x2028 || cp === 0x2029 ? "\n" : " ";
      action = "replaced";
    } else {
      action = "removed";
    }
    if (!legit) {
      hits.push({ index, length: ch.length, cp, cls, name: charName(cp), action });
      counts[cls]++;
    }
    index += ch.length;
  }
  flushRuns();
  return { cleaned: out, hits, counts, hiddenMessages };
}

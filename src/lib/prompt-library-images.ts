import type { LibraryPrompt } from "@/lib/prompt-library";

/**
 * prompt-library-images.ts — example images for the prompt library.
 *
 * Same arrangement as the 80s gallery: the images live in a Supabase bucket
 * and are matched to prompts by filename at request time, so pictures can be
 * added later without a deploy. A prompt with no image gets a designed
 * placeholder rather than a broken frame, which is also the state the whole
 * grid is in until the bucket is filled.
 *
 * Name a file after the prompt's slug — `corporate-headshot-on-grey.webp` —
 * or after its number, `007.webp`. Both are matched.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

export const LIBRARY_BUCKET = "Prompt library images";

const IMAGE_EXT = /\.(png|jpe?g|webp|avif|gif)$/i;

export function libraryImageUrl(name: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${encodeURIComponent(LIBRARY_BUCKET)}/${encodeURIComponent(name)}`;
}

/** Strip the extension, any leading index, and all punctuation. */
function norm(s: string): string {
  return s
    .replace(IMAGE_EXT, "")
    .toLowerCase()
    .replace(/^\s*\d{1,3}\s*[.)\-_]*\s*/, "")
    .replace(/[^a-z0-9]+/g, "");
}

function leadingNumber(s: string): number | null {
  const m = s.match(/^\s*(\d{1,3})\b/);
  return m ? parseInt(m[1], 10) : null;
}

/**
 * Maps prompt id → image URL.
 *
 * Slug first, because a slug is unambiguous and is what the generator writes;
 * the numeric fallback only helps files someone named by hand. A file is
 * claimed once, so two prompts cannot end up showing the same picture.
 */
export function matchLibraryImages(prompts: LibraryPrompt[], files: string[]): Record<string, string> {
  if (!files.length || !SUPABASE_URL) return {};

  const normed = files.map((f) => ({ file: f, key: norm(f), num: leadingNumber(f) }));
  const taken = new Set<string>();
  const out: Record<string, string> = {};

  for (const p of prompts) {
    const key = norm(p.slug);
    const hit = normed.find((f) => !taken.has(f.file) && f.key === key);
    if (hit) { taken.add(hit.file); out[p.id] = libraryImageUrl(hit.file); }
  }
  for (const p of prompts) {
    if (out[p.id]) continue;
    const n = parseInt(p.id.replace(/\D/g, ""), 10);
    const hit = normed.find((f) => !taken.has(f.file) && f.num === n);
    if (hit) { taken.add(hit.file); out[p.id] = libraryImageUrl(hit.file); }
  }
  return out;
}

/**
 * The text-to-image version of a library prompt, for generating its example.
 *
 * A library prompt is written in the first person about a photo the reader
 * uploads — "keep my face exactly as it is". Sent to a text-to-image model
 * with no photo attached, those clauses are instructions about a person who
 * does not exist, and the model spends its attention on them. So the identity
 * language comes out and the description stays.
 *
 * The result is explicitly a generic model rather than anyone real: these are
 * illustrations of a look, published on a public page, and they should not
 * resemble an identifiable person.
 */
export function examplePromptFor(p: LibraryPrompt): string {
  const body = p.text
    // The two boilerplate sentences, and any first-person identity clause.
    .replace(/Keep my face[^.]*\./gi, "")
    .replace(/The result must read as a real photograph[^.]*\./gi, "")
    .replace(/Preserve (my|every person's|both)[^.]*\./gi, "")
    .replace(/\bmy photo\b/gi, "the photo")
    .replace(/\bmy\b/gi, "the")
    .replace(/\b(me|myself)\b/gi, "the subject")
    // Bare "I" is its own case: it is not matched by the lower-case passes
    // above, and "so I separate from the background" survived one round of
    // this function unchanged.
    .replace(/\bI\b/g, "the subject")
    .replace(/\bthe subject am\b/g, "they are")
    /*
      The rewrite leaves the odd disagreement behind — "so the subject
      separate from the background". Left as is on purpose: an image model is
      not parsing grammar, the meaning survives intact, and chasing every
      conjugation would be a rule per prompt.
    */
    .replace(/\s{2,}/g, " ")
    .trim();

  /*
    The anonymity line is only added when there is a person to be anonymous.
    Appended to a product or interior prompt it introduces a model into a shot
    that should contain a bottle — which is what it did on the first pass.
  */
  const aboutAPerson = /\b(face|facial|skin|hair|expression|portrait|headshot|person|people|wearing|dress(ed)?|posture|shoulders|eyes)\b/i.test(p.text);

  return [
    "A single example photograph demonstrating this look, for a prompt gallery.",
    body,
    aboutAPerson
      ? "The subject is an anonymous model who must not resemble any real, identifiable person."
      : "",
    "Photographic quality, believable light and material. No text, no watermark, no logo, no border.",
  ].filter(Boolean).join(" ");
}

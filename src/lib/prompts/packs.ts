import { ALL, byFacet, byModel } from "./data";
import type { PromptRecord } from "./types";

/**
 * packs.ts — curated collections (spec §5.6).
 *
 * A pack is a rule, not a hand-typed list of ids. The dataset is refreshed
 * from upstream, and a pack pinned to 20 specific records would quietly rot
 * as those records move; a rule re-selects every build and a pack simply gets
 * better as more prompts arrive.
 *
 * The starter set is the one the spec names, minus the two there is no data
 * for. `limit` keeps a pack browsable rather than exhaustive — that is what
 * the category pages are for.
 */

export interface Pack {
  slug: string;
  title: string;
  subtitle: string;
  /** Why this one is worth a page now — shown above the list. */
  featuredReason: string;
  about: {
    why: string;
    included: string;
    how: string;
    useCases: string[];
  };
  select: () => PromptRecord[];
}

const limit = (rs: PromptRecord[], n: number) => rs.slice(0, n);

const matches = (re: RegExp, pool: PromptRecord[] = ALL) =>
  pool.filter((r) => re.test(`${r.title} ${r.description || ""} ${r.prompt.slice(0, 600)}`));

export const PACKS: Pack[] = [
  {
    slug: "youtube-thumbnails",
    title: "YouTube thumbnails",
    subtitle: "Faces that read at 210 pixels, and space left for a headline.",
    featuredReason:
      "A thumbnail is judged at the size of a postage stamp in a list of twenty others. These prompts are the ones in the collection that treat that as the design constraint it is — big face, hard separation from the background, and an empty half where the title goes.",
    about: {
      why: "Thumbnail design is the highest-leverage image most creators make, and the one most often generated at full size and never checked small.",
      included: "Every prompt in the library tagged as a YouTube thumbnail, across all image models.",
      how: "Copy one, replace the headline text with yours, and generate. Then open the result at 210 pixels wide before you use it — if the expression stops reading, make the face bigger.",
      useCases: ["YouTube videos", "Course and webinar covers", "Podcast episode art", "Blog hero images"],
    },
    select: () => limit(byFacet("image", "use-cases", "YouTube Thumbnail"), 24),
  },
  {
    slug: "profile-avatars",
    title: "Profile avatars",
    subtitle: "One photo, a profile picture that survives a circular crop.",
    featuredReason:
      "Every platform crops a profile picture to a circle and shows it at 32 pixels somewhere. These prompts are built around that, rather than producing a beautiful square that loses its subject to the mask.",
    about: {
      why: "A profile picture is the most-viewed image most people own, and usually the least considered.",
      included: "Prompts tagged Profile / Avatar, plus the portrait-shaped ones that suit the same job.",
      how: "Pick a look, fill in any placeholders, and generate. Check it as a small circle before you commit.",
      useCases: ["LinkedIn", "Instagram", "X", "Discord and gaming", "Work directories"],
    },
    select: () => limit(byFacet("image", "use-cases", "Profile / Avatar"), 24),
  },
  {
    slug: "product-infographics",
    title: "Product infographics",
    subtitle: "Exploded views, spec panels and the diagrams that sell a thing.",
    featuredReason:
      "The single most distinctive thing in this dataset: structured, JSON-shaped prompts that lay out a whole poster — callouts, labels, hierarchy — rather than describing a picture. They are worth reading even if you never run them.",
    about: {
      why: "A product diagram does a job a photograph cannot: it explains. These prompts show how to ask a model for layout and legible text at the same time.",
      included: "Prompts tagged Infographic / Edu Visual and Product Marketing, weighted toward the models that handle text best.",
      how: "These almost all carry editable fields. Fill in the product name and the copy, then generate — and expect to run it more than once, because text is where image models are weakest.",
      useCases: ["Launch pages", "Amazon A+ content", "Pitch decks", "Explainer posts"],
    },
    select: () =>
      limit(
        [
          ...byFacet("image", "use-cases", "Infographic / Edu Visual"),
          ...byFacet("image", "use-cases", "Product Marketing"),
        ],
        24
      ),
  },
  {
    slug: "artistic-posters",
    title: "Artistic posters",
    subtitle: "Watercolour, ink, oil and print — the painterly end of the library.",
    featuredReason:
      "The prompts here that ask for a medium rather than a camera. Brush texture, paper tooth, plate registration: the detail that separates a painting from a photograph with a filter on it.",
    about: {
      why: "Style transfer fails when it is asked for by name alone. These prompts name the physical medium instead, which is what makes the result look made rather than processed.",
      included: "Everything tagged Watercolor, Oil Painting, Ink / Chinese Style or Illustration.",
      how: "Copy, and keep the material words when you edit — 'visible brushwork and canvas texture' is doing more work than the style name is.",
      useCases: ["Wall prints", "Album and book covers", "Editorial illustration", "Gifts"],
    },
    select: () =>
      limit(
        [
          ...byFacet("image", "styles", "Watercolor"),
          ...byFacet("image", "styles", "Oil Painting"),
          ...byFacet("image", "styles", "Ink / Chinese Style"),
          ...byFacet("image", "styles", "Illustration"),
        ],
        24
      ),
  },
  {
    slug: "impossible-camera-moves",
    title: "Impossible camera moves",
    subtitle: "Video prompts written shot by shot, for moves no crane can do.",
    featuredReason:
      "The video half of the library is mostly timeline prompts — second by second, with the camera move named in each beat. This pack is the set where the move itself is the idea.",
    about: {
      why: "Video models respond to being told when things happen, not just what. These are the clearest examples of that format in the collection.",
      included: "Video prompts tagged Cinematic Scene Showcase, plus the ones whose text is built as a timeline.",
      how: "Paste the timeline whole rather than splitting it into shots — the model uses the ordering. Judge the result on the first and last second, which is where drift appears.",
      useCases: ["Short-form video", "Title sequences", "Product films", "Music videos"],
    },
    select: () =>
      limit(
        [
          ...byFacet("video", "use-cases", "Cinematic Scene Showcase"),
          ...matches(/\b\d+\s*[–—-]\s*\d+\s*s\s*[:：]/, byModel("seedance-2-0")),
        ],
        24
      ),
  },
  {
    slug: "festival-and-holiday-cards",
    title: "Festival & holiday cards",
    subtitle: "Christmas, greetings and the cards people actually send.",
    featuredReason:
      "A whole upstream collection was devoted to holiday cards, and it is the most seasonal thing in the library — worth surfacing while it is the time of year for it, and worth bookmarking when it is not.",
    about: {
      why: "A generated card is one of the few AI images people print, which raises the bar on composition and on leaving room for a message.",
      included: "Prompts about cards, greetings and holidays, drawn mostly from the Christmas card collection.",
      how: "Most carry editable fields for the greeting. Fill yours in before copying, and leave the empty space where the handwriting goes.",
      useCases: ["Christmas cards", "New year greetings", "Invitations", "Client gifts"],
    },
    select: () => limit(matches(/\b(christmas|holiday|greeting card|new year|festive|santa|xmas)\b/i), 24),
  },
];

export const PACK_BY_SLUG: Record<string, Pack> = Object.fromEntries(PACKS.map((p) => [p.slug, p]));

/** De-duplicates — several rules pull from overlapping pools. */
export function packPrompts(pack: Pack): PromptRecord[] {
  const seen = new Set<string>();
  const out: PromptRecord[] = [];
  for (const r of pack.select()) {
    if (seen.has(r.uid)) continue;
    seen.add(r.uid);
    out.push(r);
  }
  return out;
}

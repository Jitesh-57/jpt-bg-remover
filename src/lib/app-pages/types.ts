import type { PageFAQ } from "@/lib/page-config";

/**
 * An AI app's own page: copy written for that one app, in place of the
 * category text longContentFor() composes for the rest. The shape follows the
 * app-page outline in docs/seo/content-style.md, and every heading is a
 * question or a job a reader would search for, never a slogan.
 *
 * Inside any paragraph, list line or item: **bold** and [words](/path) links.
 */

/** A named thing and a sentence or two about it: a step, a style, an idea. */
export interface AppItem {
  t: string;
  d: string;
}

/** One H2 section of the article under the app. */
export interface AppSection {
  heading: string;
  paragraphs?: string[];
  /** Each one an H3 and its paragraph: the styles, the ideas. */
  items?: AppItem[];
  /** Bullets: tips, limits. */
  list?: string[];
  /** Paragraphs after the items or list. */
  after?: string[];
}

export interface AppPage {
  /** <title>, keyword first; brandedTitle() adds the brand when it fits. */
  title: string;
  h1: string;
  /** ≤ 155 characters. */
  metaDescription: string;
  /** The line under the H1. */
  tagline: string;
  keywords: string;
  /** "How to turn a photo into Ghibli style", not "How to use X". */
  howToHeading: string;
  howTo: [AppItem, AppItem, AppItem];
  /** Under the app's own before and after: what changed, in one sentence. */
  exampleCaption: string;
  sections: AppSection[];
  /** 8–10, the awkward questions included. */
  faq: PageFAQ[];
}

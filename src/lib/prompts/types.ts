/**
 * Types for the prompt library.
 *
 * Deliberately separate from the data module: a client component needs the
 * shape of a card, and importing it from the module that pulls in a 1.8MB
 * JSON would drag the whole dataset into the browser bundle.
 */

export type Media = "image" | "video";

export interface PromptAuthor {
  name: string;
  url: string | null;
}

export interface PromptRecord {
  /** URL key: `{slug}-{shortid}`. Stable across dataset rebuilds. */
  uid: string;
  /** Upstream id, e.g. "gpt-image-2-1". Kept for refresh upserts. */
  id: string;
  title: string;
  description: string | null;
  prompt: string;
  hasVariables: boolean;
  /**
   * The prompt edits a photo the reader supplies, rather than generating one.
   *
   * Decides what Generate does: ask for a photo first, or go straight to the
   * editor. Computed when the dataset is built — see scripts/.
   */
  needsPhoto: boolean;
  model: string;
  modelSlug: string;
  media: Media;
  featured: boolean;
  useCase: string | null;
  styles: string[];
  subjects: string[];
  images: string[];
  videoUrl: string | null;
  videoThumbnail: string | null;
  author: PromptAuthor;
  sourceUrl: string | null;
  publishedAt: string | null;
  languages: string[];
  license: string;
  datasetRepo: string;
  hotScore: number;
}

/**
 * What a card needs, and nothing else.
 *
 * The full record carries a prompt that runs to 22,000 characters at the
 * extreme; a grid of 24 of those is a megabyte of payload for text nobody can
 * see. Cards get a clamped excerpt instead.
 */
export interface PromptCardData {
  uid: string;
  title: string;
  excerpt: string;
  model: string;
  modelSlug: string;
  media: Media;
  featured: boolean;
  image: string | null;
  authorName: string;
  authorUrl: string | null;
  sourceUrl: string | null;
  hasVariables: boolean;
  publishedAt: string | null;
  href: string;
  /** Carried so the client grid can filter without a callback prop. */
  useCase: string | null;
  needsPhoto: boolean;
}

export interface Facet {
  name: string;
  slug: string;
  count: number;
}

export interface ModelInfo {
  name: string;
  slug: string;
  media: Media;
  count: number;
  repo: string;
}

/** A template variable pulled out of a prompt: {argument name="x" default="y"}. */
export interface PromptVariable {
  /** The exact text to replace. */
  token: string;
  name: string;
  value: string;
}

export const LICENSE_URL = "https://creativecommons.org/licenses/by/4.0/";
export const DATASET_CREDIT = "Prompt data adapted from YouMind OpenLab (CC BY 4.0)";
export const DATASET_ORG_URL = "https://github.com/YouMind-OpenLab";

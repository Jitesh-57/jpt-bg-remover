/**
 * placements.ts — every place on the site that shows items from the prompt
 * library, so the admin can choose exactly what appears there (/admin/placements).
 *
 * A placement left alone shows what it always showed (its automatic pick).
 * Once the admin saves a list, that list is shown instead, in that order:
 *
 *   exact  the list is the whole section
 *   pin    the list goes first and the automatic pick fills the rest
 *
 * Client-safe: no server imports here, so the admin page can read it too.
 */

export type PlacementId =
  | "prompts.weekly" | "prompts.hottest"
  | "prompts.image.hottest" | "prompts.image.new"
  | "prompts.video.hottest" | "prompts.video.new"
  | "app.home.community" | "app.create.ideas" | "app.community.top";

export interface Placement {
  id: PlacementId;
  page: string;
  /** Where it is, as the admin would describe it. */
  label: string;
  /** Pages to refresh when it changes. */
  paths: string[];
  size: number;
  mode: "exact" | "pin";
  /** Which items fit: videos cannot go in an image row, and the Create page needs a prompt that runs without a photo. */
  media: "image" | "video" | "any";
  textOnly?: boolean;
}

export const PLACEMENTS: Placement[] = [
  { id: "prompts.weekly", page: "Prompts", label: "Weekly featured (the big card at the top)", paths: ["/prompts"], size: 1, mode: "exact", media: "any" },
  { id: "prompts.hottest", page: "Prompts", label: "🔥 Hottest this week", paths: ["/prompts"], size: 8, mode: "exact", media: "any" },
  { id: "prompts.image.hottest", page: "Image prompts", label: "🔥 Hottest this week", paths: ["/prompts/image"], size: 8, mode: "exact", media: "image" },
  { id: "prompts.image.new", page: "Image prompts", label: "Just added", paths: ["/prompts/image"], size: 8, mode: "exact", media: "image" },
  { id: "prompts.video.hottest", page: "Video prompts", label: "🔥 Hottest this week", paths: ["/prompts/video"], size: 8, mode: "exact", media: "video" },
  { id: "prompts.video.new", page: "Video prompts", label: "Just added", paths: ["/prompts/video"], size: 8, mode: "exact", media: "video" },
  { id: "app.home.community", page: "Dashboard", label: "Trending in Community", paths: ["/app"], size: 13, mode: "exact", media: "image" },
  { id: "app.create.ideas", page: "Create Image", label: "Need an idea?", paths: ["/app/create"], size: 18, mode: "exact", media: "image", textOnly: true },
  { id: "app.community.top", page: "Community", label: "Top of the feed (pinned first, the rest follows)", paths: ["/app/community"], size: 24, mode: "pin", media: "image" },
];

export const PLACEMENT_BY_ID = Object.fromEntries(PLACEMENTS.map((p) => [p.id, p])) as Record<PlacementId, Placement>;

export interface PlacementsDoc { version: 1; updatedAt: string; lists: Partial<Record<PlacementId, string[]>> }
export const EMPTY_PLACEMENTS: PlacementsDoc = { version: 1, updatedAt: "", lists: {} };

export const PLACEMENTS_BUCKET = "landing";
export const PLACEMENTS_PATH = "overrides/placements.json";
export const PLACEMENTS_TAG = "placements";

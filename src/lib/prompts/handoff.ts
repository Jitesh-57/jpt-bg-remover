"use client";

import { savePendingContext } from "@/lib/pending-image";

/**
 * handoff.ts — the one way a prompt leaves the library for Create Image.
 *
 * Every "Generate this" button on the site ends up here, so the behaviour is
 * the same wherever it is pressed. The prompt and its example image (used as
 * the reference) go in sessionStorage; a photo of the reader's own goes in
 * IndexedDB, because a full-resolution data URL does not fit in
 * sessionStorage. Both survive a sign-in round trip in the same tab.
 *
 * A query string is not an option: these prompts run to 22,000 characters.
 */

export const CREATE_PROMPT_KEY = "jpt_create_prompt";
export const CREATE_PHOTO_TOOL = "app-create";
export const CREATE_HREF = "/app/create";

export interface Handoff {
  prompt: string;
  /** The reader's own photo, when they already picked one. */
  image?: string;
  /** The prompt's example image, shown in Create Image as the reference. */
  reference?: string | null;
  /** The prompt was written to edit the reader's own photo. */
  needsPhoto?: boolean;
  /** Where it came from, for analytics only. */
  source?: string;
}

export async function sendToCreate({ prompt, image, reference, needsPhoto }: Handoff): Promise<void> {
  try {
    sessionStorage.setItem(CREATE_PROMPT_KEY, JSON.stringify({ prompt: prompt.trim(), needsPhoto: !!needsPhoto, reference: reference ?? null }));
  } catch { /* private mode: Create opens without the prompt */ }
  if (image) await savePendingContext({ image, tool: CREATE_PHOTO_TOOL, autoRun: false });
  window.location.href = CREATE_HREF;
}

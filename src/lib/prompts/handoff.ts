"use client";

import { savePendingContext } from "@/lib/pending-image";

/**
 * handoff.ts — the one way a prompt leaves the library for the editor.
 *
 * Every "Generate this" button on the site ends up here, so the behaviour is
 * the same wherever it is pressed:
 *
 *   1. The prompt (and the photo, if the prompt needs one) is stashed where it
 *      survives a sign-in round trip — IndexedDB, because a full-resolution
 *      data URL does not fit in sessionStorage.
 *   2. The editor is opened on the AI-edit tool.
 *   3. `run` tells the editor to start the generation itself once it knows who
 *      the user is. The editor already owns that decision tree — signed out
 *      shows the sign-in modal, no credits opens the packs, credits runs it —
 *      and duplicating it here would be a second copy to keep in step.
 *
 * A query string is not an option: these prompts run to 22,000 characters.
 */

export interface Handoff {
  prompt: string;
  /** Omitted for text-to-image prompts, which have nothing to edit. */
  image?: string;
  /** Where it came from, for analytics only. */
  source?: string;
}

export const EDITOR_HREF = "/editor?tool=ai-edit";

export async function sendToEditor({ prompt, image }: Handoff): Promise<void> {
  await savePendingContext({
    prompt: prompt.trim(),
    image,
    tool: "ai-edit",
    // Only auto-run when there is something to run on. A text-to-image prompt
    // arrives in the editor waiting for a photo, and firing a generation with
    // no image would just raise an error the reader cannot act on.
    autoRun: !!image,
  });
  window.location.href = EDITOR_HREF;
}

"use client";

import { savePendingContext, loadPendingContext, clearPendingContext } from "@/lib/pending-image";

export const CREATE_PROMPT_KEY = "jpt_create_prompt";
const EDITOR_TOOL = "app-editor";

export interface CreateHandoff { prompt: string; needsPhoto?: boolean }

/**
 * Opens Create Image with a prompt filled in. sessionStorage, because prompts
 * can be thousands of characters. `needsPhoto` marks a prompt written to edit
 * the reader's own photo, so the page can ask for one.
 */
export function sendToCreate(prompt: string, navigate: (href: string) => void, opts?: { needsPhoto?: boolean }): void {
  try { sessionStorage.setItem(CREATE_PROMPT_KEY, JSON.stringify({ prompt, needsPhoto: !!opts?.needsPhoto } satisfies CreateHandoff)); } catch {}
  navigate("/app/create");
}

export function takeCreatePrompt(): CreateHandoff | null {
  try {
    const raw = sessionStorage.getItem(CREATE_PROMPT_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(CREATE_PROMPT_KEY);
    const v = JSON.parse(raw) as CreateHandoff;
    return typeof v?.prompt === "string" ? v : null;
  } catch {
    return null;
  }
}

/** Opens the dashboard's AI Image Editor with an image (and optionally a prompt) loaded. IndexedDB, because images are large. */
export async function openInEditor(image?: string, prompt = ""): Promise<void> {
  await savePendingContext({ image, prompt, tool: EDITOR_TOOL, autoRun: false });
  window.location.href = "/app/editor";
}

/** What openInEditor left for the editor, consumed once. */
export async function takeEditorHandoff(): Promise<{ image?: string; prompt?: string } | null> {
  const ctx = await loadPendingContext();
  if (!ctx || ctx.tool !== EDITOR_TOOL) return null;
  await clearPendingContext();
  return { image: ctx.image, prompt: ctx.prompt };
}

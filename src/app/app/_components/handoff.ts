"use client";

import { savePendingContext, loadPendingContext, clearPendingContext } from "@/lib/pending-image";

export const CREATE_PROMPT_KEY = "jpt_create_prompt";
const EDITOR_TOOL = "app-editor";

/** Opens Create Image with a prompt filled in. sessionStorage, because prompts can be thousands of characters. */
export function sendToCreate(prompt: string, navigate: (href: string) => void): void {
  try { sessionStorage.setItem(CREATE_PROMPT_KEY, prompt); } catch {}
  navigate("/app/create");
}

export function takeCreatePrompt(): string | null {
  try {
    const p = sessionStorage.getItem(CREATE_PROMPT_KEY);
    if (p) sessionStorage.removeItem(CREATE_PROMPT_KEY);
    return p;
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

"use client";

import { savePendingContext } from "@/lib/pending-image";

export const CREATE_PROMPT_KEY = "jpt_create_prompt";

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

/** Opens the Image Editor's AI-edit tool with an image loaded and nothing run yet. */
export async function openInEditor(image: string, prompt = ""): Promise<void> {
  await savePendingContext({ image, prompt, tool: "ai-edit", autoRun: false });
  window.location.href = "/editor?tool=ai-edit";
}

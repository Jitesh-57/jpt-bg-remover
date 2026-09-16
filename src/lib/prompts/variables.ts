import type { PromptVariable } from "./types";

/**
 * variables.ts — the inline placeholders a prompt can carry.
 *
 *     {argument name="famous_quote" default="Stay Hungry"}
 *
 * 344 of the 871 dataset prompts have at least one. The library renders them
 * as editable chips and copies the filled-in text, which is the difference
 * between a prompt you can use and one you have to hand-edit in a text box
 * first.
 *
 * Kept apart from data.ts on purpose: the editor runs in the browser, and
 * data.ts imports a 1.8MB dataset that must never follow it there.
 */

/** Global, so `matchAll` works; recreated per call because lastIndex is state. */
const ARG = () => /\{argument\s+name="([^"]*)"\s+default="([^"]*)"\s*\}/g;

export function parseVariables(prompt: string): PromptVariable[] {
  const out: PromptVariable[] = [];
  const seen = new Set<string>();
  // Array.from, not a for-of over the iterator: the tsconfig target here
  // predates downlevelIteration, and iterating a matchAll directly does not
  // compile.
  for (const m of Array.from(prompt.matchAll(ARG()))) {
    const [token, name, value] = m;
    // The same placeholder often appears twice; one chip drives both.
    if (seen.has(token)) continue;
    seen.add(token);
    out.push({ token, name, value });
  }
  return out;
}

/** The prompt with every placeholder replaced by its (possibly edited) value. */
export function fillVariables(prompt: string, values: Record<string, string>): string {
  return prompt.replace(ARG(), (token, name: string, def: string) => {
    const v = values[token];
    const chosen = v === undefined || v === "" ? def : v;
    return chosen || def || name;
  });
}

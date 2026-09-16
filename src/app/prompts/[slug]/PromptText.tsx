"use client";

import { useRef } from "react";

/**
 * The prompt itself, rendered to be taken.
 *
 * Clicking selects the whole thing: clipboard access fails in more places than
 * people expect — an insecure origin, a locked-down browser, an in-app webview
 * — and when the Copy button silently does nothing, a selectable block is the
 * difference between a usable page and a dead end.
 */
export default function PromptText({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);

  const selectAll = () => {
    const el = ref.current;
    if (!el) return;
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  };

  return (
    <p
      ref={ref}
      onClick={selectAll}
      title="Click to select the whole prompt"
      style={{
        margin: 0,
        background: "var(--surface-2)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        padding: "18px 20px",
        fontSize: 15,
        lineHeight: 1.75,
        color: "var(--text)",
        whiteSpace: "pre-wrap",
        cursor: "text",
      }}
    >
      {text}
    </p>
  );
}

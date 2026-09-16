"use client";

import { useMemo, useState } from "react";
import type { PromptVariable } from "@/lib/prompts/types";
import { fillVariables, parseVariables } from "@/lib/prompts/variables";
import { trackEvent } from "@/lib/analytics";

/**
 * PromptBlock — the prompt itself, and the controls that make it usable.
 *
 * Two things the plain text cannot do on its own:
 *
 *   1. 344 of these prompts carry `{argument name="x" default="y"}`
 *      placeholders. Copying that raw hands the reader a find-and-replace job.
 *      Here each one is an input, and Copy emits the filled-in text.
 *   2. Video prompts are frequently written as a timeline — "0–2s: …" — which
 *      is unreadable as a wall of text and obvious as rows.
 *
 * Clicking the text selects all of it, because clipboard writes fail in more
 * places than people expect (insecure origin, locked-down browser, in-app
 * webview) and a selectable block is the difference between a usable page and
 * a dead end.
 */

const TIMELINE = /^\s*(\d+\s*[–—-]\s*\d+\s*s|\d+\s*s(ec(onds)?)?)\s*[:：]/i;

function Timeline({ text }: { text: string }) {
  const rows = text.split(/\r?\n/).filter((l) => l.trim());
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {rows.map((line, i) => {
        const m = line.match(/^\s*([^:：]{1,24})\s*[:：]\s*(.*)$/);
        const isRange = TIMELINE.test(line);
        return (
          <div key={i} style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
            {isRange && m ? (
              <>
                <span style={{ flexShrink: 0, minWidth: 74, fontSize: 12, fontWeight: 800, color: "var(--accent-strong)", letterSpacing: "0.02em" }}>
                  {m[1].trim()}
                </span>
                <span style={{ fontSize: 14.5, lineHeight: 1.7, color: "var(--text)" }}>{m[2]}</span>
              </>
            ) : (
              <span style={{ fontSize: 14.5, lineHeight: 1.7, color: "var(--text)" }}>{line}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function PromptBlock({
  uid,
  prompt,
  media,
  generateHref,
}: {
  uid: string;
  prompt: string;
  media: "image" | "video";
  /** Where the primary CTA sends the reader, with the prompt handed over. */
  generateHref: string;
}) {
  const vars = useMemo<PromptVariable[]>(() => parseVariables(prompt), [prompt]);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(vars.map((v) => [v.token, v.value]))
  );
  const [copied, setCopied] = useState(false);

  const filled = useMemo(() => fillVariables(prompt, values), [prompt, values]);

  const isTimeline =
    media === "video" && filled.split(/\r?\n/).filter((l) => TIMELINE.test(l)).length >= 2;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(filled);
      setCopied(true);
      trackEvent("prompt_copied", { uid, edited: vars.length > 0 });
      setTimeout(() => setCopied(false), 1700);
    } catch {
      /* clipboard blocked — the text below is selectable */
    }
  };

  const openInEditor = () => {
    try { sessionStorage.setItem("jpt_pending_prompt", filled); } catch { /* private mode */ }
    trackEvent("prompt_generate_click", { uid, media });
    window.location.href = generateHref;
  };

  const selectAll = (e: React.MouseEvent<HTMLDivElement>) => {
    const range = document.createRange();
    range.selectNodeContents(e.currentTarget);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  };

  return (
    <section>
      {vars.length > 0 && (
        <div
          style={{
            background: "var(--accent-soft)", border: "1px solid var(--accent-border)",
            borderRadius: 14, padding: "14px 16px", marginBottom: 12,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 800, color: "var(--accent-strong)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
            Fill in the blanks — {vars.length} {vars.length === 1 ? "placeholder" : "placeholders"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(210px, 100%), 1fr))", gap: 10 }}>
            {vars.map((v) => (
              <label key={v.token} style={{ display: "block", minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "var(--text-muted)", marginBottom: 4 }}>
                  {v.name}
                </span>
                <input
                  value={values[v.token] ?? ""}
                  onChange={(e) => setValues((s) => ({ ...s, [v.token]: e.target.value }))}
                  placeholder={v.value}
                  style={{
                    width: "100%", padding: "9px 11px", borderRadius: 9, fontFamily: "inherit",
                    fontSize: 13.5, fontWeight: 600, background: "var(--surface)", color: "var(--text)",
                    border: "1px solid var(--border-strong)",
                  }}
                />
              </label>
            ))}
          </div>
          <p style={{ margin: "10px 0 0", fontSize: 12, color: "var(--text-muted)", lineHeight: 1.55 }}>
            Edit any of these and the prompt below updates. Copy gives you the filled-in version.
          </p>
        </div>
      )}

      <div
        onClick={selectAll}
        title="Click to select the whole prompt"
        style={{
          background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 14,
          padding: "18px 20px", cursor: "text", maxHeight: 560, overflow: "auto",
        }}
      >
        {isTimeline ? (
          <Timeline text={filled} />
        ) : (
          <pre style={{
            margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: 13.5, lineHeight: 1.75, color: "var(--text)",
          }}>
            {filled}
          </pre>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 13, flexWrap: "wrap" }}>
        <button
          onClick={copy}
          style={{
            flex: "1 1 200px", cursor: "pointer", fontFamily: "inherit", border: "none", borderRadius: 11,
            padding: "13px 18px", fontSize: 15, fontWeight: 800,
            background: copied ? "var(--success-soft)" : "var(--grad-strong)",
            color: copied ? "var(--success)" : "#fff",
            boxShadow: copied ? "none" : "var(--glow)",
          }}
        >
          {copied ? "✓ Copied" : vars.length ? "Copy filled-in prompt" : "Copy prompt"}
        </button>
        <button
          onClick={openInEditor}
          style={{
            flex: "1 1 200px", cursor: "pointer", fontFamily: "inherit", borderRadius: 11,
            padding: "13px 18px", fontSize: 15, fontWeight: 700,
            background: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border-strong)",
          }}
        >
          {media === "video" ? "Open in the editor →" : "Generate this →"}
        </button>
      </div>
    </section>
  );
}

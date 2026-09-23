"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { sendToCreate } from "@/lib/prompts/handoff";

/**
 * The inline prompt bar on a model landing page.
 *
 * The conversion hook: someone who came for "nano banana pro prompts" can type
 * their own and land in Create Image with it loaded, without hunting for the
 * tool. Handover goes through the shared prompt handoff.
 */
export default function GeneratorBar({ model }: { model: string }) {
  const [value, setValue] = useState("");

  const go = () => {
    const text = value.trim();
    if (!text) return;
    trackEvent("model_page_generate", { model });
    void sendToCreate({ prompt: text, source: "model-page" });
  };

  return (
    <div
      style={{
        display: "flex", gap: 10, flexWrap: "wrap", marginTop: 22,
        background: "var(--surface)", border: "1px solid var(--border-strong)",
        borderRadius: 14, padding: 10,
      }}
    >
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") go(); }}
        aria-label="Write your own prompt"
        placeholder="Or write your own prompt and press Generate…"
        style={{
          flex: "1 1 260px", minWidth: 0, padding: "12px 14px", borderRadius: 10,
          fontFamily: "inherit", fontSize: 14.5, fontWeight: 600,
          background: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border)",
        }}
      />
      <button
        onClick={go}
        disabled={!value.trim()}
        style={{
          cursor: value.trim() ? "pointer" : "not-allowed", fontFamily: "inherit", border: "none",
          borderRadius: 10, padding: "12px 26px", fontSize: 14.5, fontWeight: 800,
          background: value.trim() ? "var(--grad-strong)" : "var(--surface-3)",
          color: value.trim() ? "#fff" : "var(--text-faint)",
          boxShadow: value.trim() ? "var(--glow)" : "none",
        }}
      >
        Generate
      </button>
    </div>
  );
}

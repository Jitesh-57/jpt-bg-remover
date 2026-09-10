"use client";

import { useMemo, useState } from "react";
import { CATEGORIES, MASTER_TEMPLATE, type Prompt } from "@/lib/prompts-80s";
import { trackEvent } from "@/lib/analytics";

function CopyButton({ text, label = "Copy", id }: { text: string; label?: string; id?: string }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      trackEvent("prompt_copied", { prompt_id: id || "master" });
      setTimeout(() => setDone(false), 1600);
    } catch {
      /* clipboard blocked */
    }
  };
  return (
    <button
      onClick={copy}
      style={{
        flexShrink: 0, cursor: "pointer", fontFamily: "inherit",
        background: done ? "var(--success-soft)" : "var(--grad-strong)",
        color: done ? "var(--success)" : "#fff",
        border: done ? "1px solid var(--accent-border)" : "none",
        borderRadius: 10, padding: "9px 16px", fontSize: 13.5, fontWeight: 800,
      }}
    >
      {done ? "✓ Copied" : label}
    </button>
  );
}

export default function PromptBrowser() {
  const [active, setActive] = useState<string>("all");
  const [q, setQ] = useState("");

  const shown = useMemo(() => {
    const cats = active === "all" ? CATEGORIES : CATEGORIES.filter((c) => c.id === active);
    const needle = q.trim().toLowerCase();
    if (!needle) return cats;
    return cats
      .map((c) => ({ ...c, prompts: c.prompts.filter((p) => (p.title + " " + p.text).toLowerCase().includes(needle)) }))
      .filter((c) => c.prompts.length > 0);
  }, [active, q]);

  const total = shown.reduce((n, c) => n + c.prompts.length, 0);

  const chip = (on: boolean): React.CSSProperties => ({
    cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
    background: on ? "var(--accent-soft)" : "var(--surface)",
    color: on ? "var(--accent-strong)" : "var(--text-muted)",
    border: `1px solid ${on ? "var(--accent-border)" : "var(--border)"}`,
    borderRadius: 999, padding: "9px 16px", fontSize: 14, fontWeight: 700,
  });

  return (
    <div>
      {/* Master template */}
      <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 18, padding: "22px 22px 20px", marginBottom: 34 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 12 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "var(--text)" }}>The master template</h3>
            <p style={{ margin: "4px 0 0", fontSize: 14, color: "var(--text-muted)" }}>
              Start here, then swap in any style below. The first line is what keeps your face <em>yours</em>.
            </p>
          </div>
          <CopyButton text={MASTER_TEMPLATE} label="Copy template" />
        </div>
        <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontSize: 13.5, lineHeight: 1.65, color: "var(--text-muted)", fontFamily: "ui-monospace,SFMono-Regular,Menlo,monospace", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px" }}>
          {MASTER_TEMPLATE}
        </pre>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        <button onClick={() => setActive("all")} style={chip(active === "all")}>All 100</button>
        {CATEGORIES.map((c) => (
          <button key={c.id} onClick={() => setActive(c.id)} style={chip(active === c.id)}>
            {c.emoji} {c.name}
          </button>
        ))}
      </div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search prompts — e.g. saree, yearbook, neon, disco…"
        aria-label="Search prompts"
        style={{
          width: "100%", padding: "13px 16px", borderRadius: 12, marginBottom: 8,
          border: "1px solid var(--border)", background: "var(--surface)",
          color: "var(--text)", fontSize: 15, fontFamily: "inherit", outline: "none",
        }}
      />
      <p style={{ fontSize: 13.5, color: "var(--text-faint)", margin: "0 0 26px" }}>
        Showing {total} prompt{total === 1 ? "" : "s"}
      </p>

      {/* Prompts */}
      {shown.map((c) => (
        <section key={c.id} style={{ marginBottom: 40 }}>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", margin: "0 0 4px", letterSpacing: "-0.02em" }}>
            {c.emoji} {c.name}
          </h3>
          <p style={{ fontSize: 14.5, color: "var(--text-muted)", margin: "0 0 16px" }}>{c.blurb}</p>
          <div style={{ display: "grid", gap: 12 }}>
            {c.prompts.map((p: Prompt) => (
              <div key={p.id} className="jpt-hover" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 15.5, fontWeight: 800, color: "var(--text)", marginBottom: 6 }}>{p.title}</div>
                    <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: "var(--text-muted)", whiteSpace: "pre-wrap" }}>{p.text}</p>
                  </div>
                  <CopyButton text={p.text} id={p.id} />
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {shown.length === 0 && (
        <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px 0" }}>
          No prompts match “{q}”. Try a shorter word.
        </p>
      )}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { PROMPTS, GROUPS, imageCandidates, type Prompt, type GroupId } from "@/lib/prompts-80s";
import { trackEvent } from "@/lib/analytics";

const GROUP_META = Object.fromEntries(GROUPS.map((g) => [g.id, g])) as Record<GroupId, (typeof GROUPS)[number]>;

/** Reference image with a designed fallback: probes each candidate filename in
 *  turn, and renders a generated placeholder once they are all exhausted. */
function PromptImage({ p }: { p: Prompt }) {
  const candidates = useMemo(() => imageCandidates(p), [p]);
  const [idx, setIdx] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const exhausted = idx >= candidates.length;
  const g = GROUP_META[p.group];

  // Vary the placeholder across the grid so the page doesn't read as one flat block.
  const hue = (p.n * 37) % 360;
  const placeholder = (
    <div
      aria-hidden
      style={{
        position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 6,
        background: `linear-gradient(145deg, hsl(${hue} 34% 92%), var(--surface-2) 55%, hsl(${(hue + 40) % 360} 30% 90%))`,
      }}
    >
      {/* film-strip perforations */}
      <div style={{ position: "absolute", inset: "0 0 auto 0", height: 14, background: "repeating-linear-gradient(90deg, var(--border-strong) 0 7px, transparent 7px 16px)", opacity: 0.55 }} />
      <div style={{ position: "absolute", inset: "auto 0 0 0", height: 14, background: "repeating-linear-gradient(90deg, var(--border-strong) 0 7px, transparent 7px 16px)", opacity: 0.55 }} />
      <div style={{ fontSize: 30 }}>{g.emoji}</div>
      <div style={{ fontSize: 27, fontWeight: 900, color: "var(--accent-strong)", letterSpacing: "-0.03em", lineHeight: 1 }}>
        {String(p.n).padStart(2, "0")}
      </div>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {g.name}
      </div>
    </div>
  );

  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: "4 / 5", maxWidth: "100%", overflow: "hidden", background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
      {(!loaded || exhausted) && placeholder}
      {!exhausted && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={candidates[idx]}
          alt={`${p.title} — 1980s AI photo reference`}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => { setLoaded(false); setIdx((i) => i + 1); }}
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover", opacity: loaded ? 1 : 0, transition: "opacity .35s var(--ease)",
          }}
        />
      )}
    </div>
  );
}

function CopyButton({ text, id, label = "Copy prompt", full = false }: { text: string; id: string; label?: string; full?: boolean }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      trackEvent("prompt_copied", { prompt_id: id });
      setTimeout(() => setDone(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  };
  return (
    <button
      onClick={copy}
      style={{
        cursor: "pointer", fontFamily: "inherit", width: full ? "100%" : undefined,
        background: done ? "var(--success-soft)" : "var(--grad-strong)",
        color: done ? "var(--accent-strong)" : "#fff",
        border: done ? "1px solid var(--accent-border)" : "1px solid transparent",
        borderRadius: 10, padding: "10px 16px", fontSize: 14, fontWeight: 800,
      }}
    >
      {done ? "✓ Copied" : label}
    </button>
  );
}

function PromptCard({ p }: { p: Prompt }) {
  const [open, setOpen] = useState(false);
  const g = GROUP_META[p.group];
  return (
    <article
      className="jpt-hover"
      style={{
        display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden",
        background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18,
      }}
    >
      <PromptImage p={p} />
      <div style={{ padding: "16px 17px 17px", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, fontWeight: 900, color: "var(--accent-strong)" }}>#{String(p.n).padStart(2, "0")}</span>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-muted)", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 999, padding: "3px 9px" }}>
            {g.emoji} {g.name}
          </span>
        </div>

        <h3 style={{ margin: 0, fontSize: 16.5, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.02em", lineHeight: 1.3 }}>
          {p.title}
        </h3>

        <p
          style={{
            margin: 0, fontSize: 13.5, lineHeight: 1.65, color: "var(--text-muted)",
            whiteSpace: "pre-wrap", overflow: "hidden",
            ...(open ? {} : { display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical" }),
          } as React.CSSProperties}
        >
          {p.text}
        </p>

        <button
          onClick={() => setOpen((o) => !o)}
          style={{ alignSelf: "flex-start", cursor: "pointer", fontFamily: "inherit", background: "none", border: "none", padding: 0, fontSize: 13, fontWeight: 800, color: "var(--accent)" }}
        >
          {open ? "Show less" : "Read full prompt"}
        </button>

        <div style={{ marginTop: "auto", paddingTop: 4 }}>
          <CopyButton text={p.text} id={p.id} full />
        </div>
      </div>
    </article>
  );
}

export default function PromptBrowser() {
  const [active, setActive] = useState<GroupId | "all">("all");
  const [q, setQ] = useState("");

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return PROMPTS.filter(
      (p) =>
        (active === "all" || p.group === active) &&
        (!needle || (p.title + " " + p.text).toLowerCase().includes(needle))
    );
  }, [active, q]);

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    PROMPTS.forEach((p) => { m[p.group] = (m[p.group] || 0) + 1; });
    return m;
  }, []);

  const chip = (on: boolean): React.CSSProperties => ({
    cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
    background: on ? "var(--accent-soft)" : "var(--surface)",
    color: on ? "var(--accent-strong)" : "var(--text-muted)",
    border: `1px solid ${on ? "var(--accent-border)" : "var(--border)"}`,
    borderRadius: 999, padding: "9px 15px", fontSize: 13.5, fontWeight: 700,
  });

  return (
    <div>
      <div style={{ display: "flex", gap: 9, flexWrap: "wrap", marginBottom: 14 }}>
        <button onClick={() => setActive("all")} style={chip(active === "all")}>All {PROMPTS.length}</button>
        {GROUPS.map((g) => (
          <button key={g.id} onClick={() => setActive(g.id)} style={chip(active === g.id)}>
            {g.emoji} {g.name} <span style={{ opacity: 0.6 }}>{counts[g.id] || 0}</span>
          </button>
        ))}
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search prompts — e.g. saree, scooter, wedding, disco…"
        aria-label="Search prompts"
        style={{
          width: "100%", maxWidth: "100%", boxSizing: "border-box",
          padding: "13px 16px", borderRadius: 12, marginBottom: 8,
          border: "1px solid var(--border)", background: "var(--surface)",
          color: "var(--text)", fontSize: 15, fontFamily: "inherit", outline: "none",
        }}
      />

      <p style={{ fontSize: 13.5, color: "var(--text-faint)", margin: "0 0 22px" }}>
        Showing {shown.length} prompt{shown.length === 1 ? "" : "s"}
        {active !== "all" && <> in {GROUP_META[active].name}</>}
      </p>

      {shown.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(280px, 100%), 1fr))", gap: 20 }}>
          {shown.map((p) => <PromptCard key={p.id} p={p} />)}
        </div>
      ) : (
        <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "48px 0" }}>
          No prompts match “{q}”. Try a shorter word.
        </p>
      )}
    </div>
  );
}

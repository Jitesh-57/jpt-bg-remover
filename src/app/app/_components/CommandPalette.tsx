"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { allTools, categoryMeta, type DashboardTool } from "@/lib/dashboard-catalog";
import Icon, { type IconName } from "./Icon";

const STATIC_LINKS: { name: string; blurb: string; href: string; icon: IconName }[] = [
  { name: "Home", blurb: "Your studio dashboard", href: "/app", icon: "home" },
  { name: "Create Image", blurb: "Generate an image from a description", href: "/app/create", icon: "sparkle" },
  { name: "Image Editor", blurb: "Edit, retouch, remove backgrounds, upscale", href: "/editor", icon: "editor" },
  { name: "AI Apps", blurb: "200+ one-tap photo apps", href: "/app/apps", icon: "apps" },
  { name: "Community", blurb: "Prompts and images from creators", href: "/app/community", icon: "community" },
  { name: "My Creations", blurb: "Everything you've generated", href: "/app/library", icon: "folder" },
  { name: "Credits", blurb: "Balance, history and packs", href: "/app/credits", icon: "zap" },
  { name: "Settings", blurb: "Account details", href: "/app/settings", icon: "settings" },
  { name: "Pixel Shine website", blurb: "Back to the homepage", href: "/", icon: "globe" },
];

function matches(q: string, tool: DashboardTool): boolean {
  const hay = `${tool.name} ${tool.blurb} ${categoryMeta(tool.category).label}`.toLowerCase();
  return q.split(/\s+/).filter(Boolean).every((term) => hay.includes(term));
}

/**
 * The ⌘K palette — the thing that keeps a ~200-app catalogue usable. Pure
 * client-side substring match over the already-loaded catalog; no server
 * round trip, no debounce needed at this size.
 */
export default function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (open) { setQ(""); setActive(0); requestAnimationFrame(() => inputRef.current?.focus()); } }, [open]);

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) {
      return { links: STATIC_LINKS, tools: allTools().slice(0, 6) };
    }
    const links = STATIC_LINKS.filter((l) => `${l.name} ${l.blurb}`.toLowerCase().includes(query));
    const tools = allTools().filter((t) => matches(query, t)).slice(0, 30);
    return { links, tools };
  }, [q]);

  const flat = useMemo(
    () => [...results.links.map((l) => ({ kind: "link" as const, href: l.href, name: l.name })), ...results.tools.map((t) => ({ kind: "tool" as const, href: t.href, name: t.name }))],
    [results]
  );

  const go = (href: string) => { onClose(); router.push(href); };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { onClose(); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, flat.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    if (e.key === "Enter") { e.preventDefault(); const it = flat[active]; if (it) go(it.href); }
  };

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "12vh 16px 16px" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
        className="jpt-a-pop"
        style={{ width: "100%", maxWidth: 580, background: "var(--bg-elevated)", border: "1px solid var(--border-strong)", borderRadius: 16, boxShadow: "var(--shadow-lg)", overflow: "hidden", maxHeight: "70vh", display: "flex", flexDirection: "column" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
          <Icon name="search" size={18} style={{ color: "var(--text-faint)" }} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => { setQ(e.target.value); setActive(0); }}
            placeholder="Search apps, tools and pages…"
            aria-label="Search"
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "var(--text)", fontSize: 15, fontFamily: "inherit" }}
          />
          <kbd style={{ fontSize: 11, fontWeight: 700, color: "var(--text-faint)", border: "1px solid var(--border-strong)", borderRadius: 5, padding: "1px 6px" }}>Esc</kbd>
        </div>

        <div style={{ overflowY: "auto", padding: 8 }}>
          {flat.length === 0 && (
            <div style={{ padding: "32px 12px", textAlign: "center", color: "var(--text-faint)", fontSize: 13.5 }}>Nothing matches &ldquo;{q}&rdquo;.</div>
          )}

          {results.links.length > 0 && (
            <>
              <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.08em", padding: "8px 10px 4px" }}>Go to</div>
              {results.links.map((l, i) => {
                const idx = i;
                return (
                  <button key={l.href} onClick={() => go(l.href)} onMouseEnter={() => setActive(idx)}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 9, border: "none", cursor: "pointer", textAlign: "left", background: active === idx ? "var(--accent-soft)" : "transparent", fontFamily: "inherit" }}>
                    <span style={{ width: 30, height: 30, borderRadius: 8, background: "var(--surface-2)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}><Icon name={l.icon} size={16} /></span>
                    <span style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text)" }}>{l.name}</div>
                      <div style={{ fontSize: 11.5, color: "var(--text-faint)" }}>{l.blurb}</div>
                    </span>
                  </button>
                );
              })}
            </>
          )}

          {results.tools.length > 0 && (
            <>
              <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.08em", padding: "10px 10px 4px" }}>Apps & tools</div>
              {results.tools.map((t, i) => {
                const idx = results.links.length + i;
                return (
                  <button key={t.slug} onClick={() => go(t.href)} onMouseEnter={() => setActive(idx)}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 9, border: "none", cursor: "pointer", textAlign: "left", background: active === idx ? "var(--accent-soft)" : "transparent", fontFamily: "inherit" }}>
                    <span style={{ width: 30, height: 30, borderRadius: 8, background: "var(--surface-2)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>{t.emoji}</span>
                    <span style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text)" }}>{t.name}</div>
                      <div style={{ fontSize: 11.5, color: "var(--text-faint)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.blurb}</div>
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: t.credits === 0 ? "var(--success)" : "var(--accent)", flexShrink: 0 }}>
                      {t.credits === 0 ? "Free" : `${t.credits} credits`}
                    </span>
                  </button>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

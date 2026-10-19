"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

const chevron = (open: boolean) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden
    style={{ flexShrink: 0, color: "var(--text-faint)", transition: "transform .15s", transform: open ? "rotate(180deg)" : "none" }}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

/**
 * The model picker: a trigger that opens a list of the models, and nothing else.
 *
 * Drawn by the page rather than the browser, whose own select list ignores the
 * dark theme on Windows and came out white. Opens on the current model, upward
 * when there's no room below; arrows, Enter and Escape work as in a native
 * select. The list is drawn on the page's top layer and pinned to the trigger,
 * since a section that clips its overflow (the home hero does) or the content
 * below would otherwise hide it.
 *
 *   pill   the home hero's compact pill
 *   field  a full-width row, for the studio panels (Recreate)
 */
export default function ModelMenu({ models, value, onChange, variant = "pill" }: {
  models: readonly { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
  variant?: "pill" | "field";
}) {
  const field = variant === "field";
  const uid = useId();
  const listId = `models-${uid}`;
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<React.CSSProperties | null>(null);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const current = models.find((m) => m.id === value) ?? models[0];

  useEffect(() => {
    if (!open) return;
    const away = (e: Event) => {
      const t = e.target as Node;
      if (!root.current?.contains(t) && !list.current?.contains(t)) setOpen(false);
    };
    document.addEventListener("mousedown", away);
    document.addEventListener("touchstart", away);
    return () => { document.removeEventListener("mousedown", away); document.removeEventListener("touchstart", away); };
  }, [open]);

  // Below the pill, or above it when that has more room; follows it while the page scrolls.
  const place = useCallback(() => {
    const r = root.current?.getBoundingClientRect();
    if (!r) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.min(field ? r.width : 270, vw - 32);
    const left = Math.max(16, Math.min(r.left, vw - width - 16));
    const below = vh - r.bottom - 16;
    const above = r.top - 16;
    const up = below < 300 && above > below;
    const maxHeight = Math.max(160, Math.min(320, (up ? above : below) - 6));
    setPos(up ? { left, width, maxHeight, bottom: vh - r.top + 6 } : { left, width, maxHeight, top: r.bottom + 6 });
  }, [field]);

  useEffect(() => {
    if (!open) return;
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => { window.removeEventListener("scroll", place, true); window.removeEventListener("resize", place); };
  }, [open, place]);

  // Keep the highlighted model in view inside the list (not by scrolling the page).
  useEffect(() => {
    const l = list.current;
    const el = l?.querySelector<HTMLElement>(`[data-i="${active}"]`);
    if (!l || !el) return;
    if (el.offsetTop < l.scrollTop) l.scrollTop = el.offsetTop - 6;
    else if (el.offsetTop + el.offsetHeight > l.scrollTop + l.clientHeight) l.scrollTop = el.offsetTop + el.offsetHeight - l.clientHeight + 6;
  }, [open, active, pos]);

  const show = () => {
    setActive(Math.max(0, models.findIndex((m) => m.id === current.id)));
    setOpen(true);
  };
  const pick = (id: string) => { onChange(id); setOpen(false); };

  const onKey = (e: React.KeyboardEvent) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) { e.preventDefault(); show(); }
      return;
    }
    if (e.key === "Escape" || e.key === "Tab") { if (e.key === "Escape") e.preventDefault(); setOpen(false); }
    else if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(models.length - 1, a + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    else if (e.key === "Home") { e.preventDefault(); setActive(0); }
    else if (e.key === "End") { e.preventDefault(); setActive(models.length - 1); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(models[active].id); }
  };

  return (
    <div ref={root} style={{ position: "relative", minWidth: 0, maxWidth: "100%", ...(field ? { width: "100%" } : {}) }}>
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKey}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        aria-label={`Model: ${current.label}`}
        style={field ? {
          display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 12px", borderRadius: 11, textAlign: "left",
          background: "var(--surface)", border: `1px solid ${open ? "var(--accent-border)" : "var(--border)"}`,
          color: "var(--text)", fontFamily: "inherit", cursor: "pointer",
        } : {
          display: "inline-flex", alignItems: "center", gap: 7, maxWidth: "100%", padding: "8px 12px 8px 13px", borderRadius: 999,
          background: open ? "var(--accent-soft)" : "var(--surface-2)", border: `1px solid ${open ? "var(--accent-border)" : "var(--border-strong)"}`,
          color: "var(--text)", fontFamily: "inherit", cursor: "pointer",
        }}
      >
        <span style={field
          ? { fontSize: 11.5, fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.09em" }
          : { fontSize: 11.5, fontWeight: 700, color: "var(--text-faint)" }}>Model</span>
        <span style={{ fontSize: field ? 13.5 : 13, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", ...(field ? { flex: 1, minWidth: 0 } : {}) }}>{current.label}</span>
        {chevron(open)}
      </button>
      {open && pos && createPortal(
        <div
          ref={list}
          id={listId}
          role="listbox"
          aria-label="Model"
          style={{
            position: "fixed", zIndex: 1001, ...pos, overflowY: "auto", overscrollBehavior: "contain", textAlign: "left",
            padding: 6, borderRadius: 14, background: "var(--bg-elevated)", border: "1px solid var(--border-strong)", boxShadow: "var(--shadow-lg)",
          }}
        >
          {models.map((m, i) => {
            const on = m.id === current.id;
            return (
              <div
                key={m.id}
                id={`${listId}-${i}`}
                data-i={i}
                role="option"
                aria-selected={on}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(m.id)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "10px 12px", borderRadius: 9,
                  fontSize: 13.5, fontWeight: on ? 800 : 600, cursor: "pointer",
                  color: on ? "var(--accent)" : "var(--text)", background: i === active ? "var(--surface-2)" : "transparent",
                }}
              >
                <span>{m.label}</span>
                {on && (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ flexShrink: 0 }}>
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                )}
              </div>
            );
          })}
        </div>,
        document.body,
      )}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Icon from "./Icon";
import { AppTile } from "./AppCard";
import type { AppCardData } from "@/lib/dashboard-feed.server";
import type { AppCat } from "@/lib/app-catalog";

interface Cat { id: AppCat; label: string }

/** Category tabs over a horizontally scrolling row of app tiles, with arrow buttons. */
export default function AppCarousel({ apps, categories }: { apps: AppCardData[]; categories: Cat[] }) {
  const [cat, setCat] = useState<AppCat | "all">("all");
  const rowRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const list = useMemo(() => (cat === "all" ? apps : apps.filter((a) => a.category === cat)).slice(0, 18), [apps, cat]);

  const measure = () => {
    const el = rowRef.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 });
  };

  useEffect(() => {
    rowRef.current?.scrollTo({ left: 0 });
    measure();
  }, [cat]);

  const scroll = (dir: 1 | -1) => {
    const el = rowRef.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  const arrow = (dir: 1 | -1, hidden: boolean): React.CSSProperties => ({
    position: "absolute", top: "50%", [dir === 1 ? "right" : "left"]: -14, transform: "translateY(-50%)", zIndex: 2,
    width: 38, height: 38, borderRadius: "50%", border: "1px solid var(--border-strong)", background: "var(--bg-elevated)",
    color: "var(--text)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
    boxShadow: "var(--shadow-md)", opacity: hidden ? 0 : 1, pointerEvents: hidden ? "none" : "auto", transition: "opacity .2s ease",
  });

  return (
    <div>
      <div className="jpt-tabs" style={{ borderBottom: "1px solid var(--border)", marginBottom: 16 }}>
        <button className="jpt-tab" data-active={cat === "all"} onClick={() => setCat("all")}>Trending</button>
        {categories.map((c) => <button key={c.id} className="jpt-tab" data-active={cat === c.id} onClick={() => setCat(c.id)}>{c.label}</button>)}
      </div>
      <div style={{ position: "relative" }}>
        <button aria-label="Scroll left" onClick={() => scroll(-1)} className="jpt-app-hide-sm" style={arrow(-1, edges.start)}><Icon name="chevronRight" size={18} style={{ transform: "rotate(180deg)" }} /></button>
        <div
          key={cat}
          ref={rowRef}
          onScroll={measure}
          style={{ display: "grid", gridAutoFlow: "column", gridAutoColumns: "minmax(180px, 210px)", gap: 14, overflowX: "auto", scrollSnapType: "x mandatory", scrollbarWidth: "none", paddingBottom: 4 }}
        >
          {list.map((a, i) => (
            <div key={a.slug} style={{ scrollSnapAlign: "start" }}>
              <AppTile a={a} delay={Math.min(i, 8) * 45} />
            </div>
          ))}
        </div>
        <button aria-label="Scroll right" onClick={() => scroll(1)} className="jpt-app-hide-sm" style={arrow(1, edges.end)}><Icon name="chevronRight" size={18} /></button>
      </div>
    </div>
  );
}

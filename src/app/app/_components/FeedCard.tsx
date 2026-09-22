"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "./Icon";
import { sendToCreate } from "./handoff";
import { sendToEditor } from "@/lib/prompts/handoff";
import type { FeedItem } from "@/lib/dashboard-feed.server";

export function useRecreate() {
  const router = useRouter();
  return (item: FeedItem) => {
    if (!item.prompt) { window.open(item.href, "_blank", "noopener"); return; }
    if (item.needsPhoto) { void sendToEditor({ prompt: item.prompt, source: "app-community" }); return; }
    sendToCreate(item.prompt, (href) => router.push(href));
  };
}

/** One community image: natural height for masonry, details and Recreate on hover. */
export default function FeedCard({ item, delay = 0, onOpen }: { item: FeedItem; delay?: number; onOpen?: (item: FeedItem) => void }) {
  const [broken, setBroken] = useState(false);
  const recreate = useRecreate();
  if (broken) return null;

  return (
    <div className="jpt-zoom jpt-a-up" style={{ ["--d" as string]: `${delay}ms`, position: "relative", borderRadius: 14, border: "1px solid var(--border)", background: "var(--surface-2)", cursor: "pointer" }} onClick={() => onOpen?.(item)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="jpt-zoom-media" src={item.image} alt={item.title} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setBroken(true)} style={{ display: "block", width: "100%", height: "auto", minHeight: 120 }} />
      <div className="jpt-zoom-reveal" style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(8,8,10,.1) 40%, rgba(8,8,10,.9) 100%)", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{item.title}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 8 }}>
          <span style={{ fontSize: 11.5, color: "rgba(255,255,255,.75)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>by {item.author}</span>
          <button
            onClick={(e) => { e.stopPropagation(); recreate(item); }}
            style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 11px", borderRadius: 999, border: "none", background: "var(--grad-strong)", color: "#fff", fontWeight: 800, fontSize: 12, fontFamily: "inherit", cursor: "pointer", flexShrink: 0 }}
          >
            <Icon name="wand" size={13} /> Recreate
          </button>
        </div>
      </div>
    </div>
  );
}

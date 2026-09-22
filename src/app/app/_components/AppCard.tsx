"use client";

import Link from "next/link";
import SmartImage from "@/app/_components/SmartImage";
import Icon from "./Icon";
import { CREDIT_COST } from "@/lib/plans";
import type { AppCardData } from "@/lib/dashboard-feed.server";

function artwork(a: AppCardData) {
  return { slug: a.slug, name: a.name, emoji: a.emoji, gradient: a.gradient };
}

/** Big image tile with the name over a gradient — the gallery card. */
export function AppTile({ a, delay = 0, eager = false }: { a: AppCardData; delay?: number; eager?: boolean }) {
  return (
    <Link href={a.href} className="jpt-zoom jpt-a-up jpt-lift" style={{ ["--d" as string]: `${delay}ms`, position: "relative", display: "block", aspectRatio: "4 / 5", borderRadius: 16, border: "1px solid var(--border)", background: "var(--surface)", textDecoration: "none" }}>
      <div className="jpt-zoom-media" style={{ position: "absolute", inset: 0 }}>
        <SmartImage sources={a.sources} alt={`${a.name} example`} fallback={`linear-gradient(135deg, ${a.gradient[0]}, ${a.gradient[1]})`} sizes="(max-width: 768px) 50vw, 280px" eager={eager} artwork={artwork(a)} />
      </div>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 45%, rgba(8,8,10,.92) 100%)" }} />
      <span style={{ position: "absolute", top: 10, right: 10, display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 800, color: "#fff", background: "rgba(8,8,10,.6)", backdropFilter: "blur(6px)", borderRadius: 999, padding: "3px 8px" }}>
        <Icon name="zap" size={11} /> {CREDIT_COST}
      </span>
      <div style={{ position: "absolute", left: 14, right: 14, bottom: 12 }}>
        <div style={{ fontSize: 14.5, fontWeight: 800, color: "#fff", lineHeight: 1.25, textShadow: "0 1px 8px rgba(0,0,0,.5)" }}>{a.name}</div>
        <div className="jpt-zoom-reveal" style={{ fontSize: 12, color: "rgba(255,255,255,.78)", marginTop: 4, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{a.blurb}</div>
      </div>
    </Link>
  );
}

/** Thumbnail left, text right — the compact "popular" row card. */
export function AppRow({ a, delay = 0 }: { a: AppCardData; delay?: number }) {
  return (
    <Link href={a.href} className="jpt-zoom jpt-a-up jpt-lift" style={{ ["--d" as string]: `${delay}ms`, display: "flex", alignItems: "center", gap: 14, padding: 10, borderRadius: 16, border: "1px solid var(--border)", background: "var(--surface)", textDecoration: "none", minWidth: 0 }}>
      <div style={{ position: "relative", width: 88, height: 88, borderRadius: 12, overflow: "hidden", flexShrink: 0 }}>
        <div className="jpt-zoom-media" style={{ position: "absolute", inset: 0 }}>
          <SmartImage sources={a.sources} alt={`${a.name} example`} fallback={`linear-gradient(135deg, ${a.gradient[0]}, ${a.gradient[1]})`} sizes="88px" artwork={artwork(a)} />
        </div>
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 14.5, fontWeight: 800, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</div>
        <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 4, lineHeight: 1.45, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{a.blurb}</div>
      </div>
    </Link>
  );
}

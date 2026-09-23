"use client";

import { useState } from "react";
import Link from "next/link";
import SmartImage from "@/app/_components/SmartImage";
import Icon from "./Icon";
import { CREDIT_COST } from "@/lib/plans";
import type { AppCardData } from "@/lib/dashboard-feed.server";

function artwork(a: AppCardData) {
  return { slug: a.slug, name: a.name, emoji: a.emoji, gradient: a.gradient };
}

/**
 * Where to place the published creative so only its "after" half shows in a
 * box of aspect `box` (width / height). Landscape creatives are before|after
 * side by side, so the right half; portrait ones are stacked, so the bottom.
 */
function afterHalfStyle(w: number, h: number, box: number): React.CSSProperties {
  const a = w / h;
  if (a >= 1) {
    const half = a / 2;
    return half >= box
      ? { height: "100%", width: `${(a / box) * 100}%`, left: `${(0.5 - (0.75 * a) / box) * 100}%`, top: 0 }
      : { width: "200%", height: `${((2 * box) / a) * 100}%`, left: "-100%", top: `${((1 - (2 * box) / a) / 2) * 100}%` };
  }
  const half = 2 * a;
  return half >= box
    ? { height: "200%", width: `${((2 * a) / box) * 100}%`, top: "-100%", left: `${((1 - (2 * a) / box) / 2) * 100}%` }
    : { width: "100%", height: `${(box / a) * 100}%`, left: 0, top: `${(0.5 - (0.75 * box) / a) * 100}%` };
}

/** The app's live after image: the after half of its published creative, else its own "after" file. */
export function AfterImage({ a, box, sizes, eager }: { a: AppCardData; box: number; sizes: string; eager?: boolean }) {
  const [mainFailed, setMainFailed] = useState(false);
  if (a.main && !mainFailed) {
    return (
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: `linear-gradient(135deg, ${a.gradient[0]}, ${a.gradient[1]})` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={a.main.url}
          alt={`${a.name} result`}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          onError={() => setMainFailed(true)}
          style={{ position: "absolute", maxWidth: "none", ...afterHalfStyle(a.main.w, a.main.h, box) }}
        />
      </div>
    );
  }
  return <SmartImage sources={a.sources} alt={`${a.name} example`} fallback={`linear-gradient(135deg, ${a.gradient[0]}, ${a.gradient[1]})`} sizes={sizes} eager={eager} artwork={artwork(a)} />;
}

/** Big image tile with the name over a gradient — the gallery card. */
export function AppTile({ a, delay = 0, eager = false }: { a: AppCardData; delay?: number; eager?: boolean }) {
  return (
    <Link href={a.href} className="jpt-zoom jpt-a-up jpt-lift" style={{ ["--d" as string]: `${delay}ms`, position: "relative", display: "block", aspectRatio: "4 / 5", borderRadius: 16, border: "1px solid var(--border)", background: "var(--surface)", textDecoration: "none" }}>
      <div className="jpt-zoom-media" style={{ position: "absolute", inset: 0 }}>
        <AfterImage a={a} box={4 / 5} sizes="(max-width: 768px) 50vw, 280px" eager={eager} />
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
          <AfterImage a={a} box={1} sizes="88px" />
        </div>
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 14.5, fontWeight: 800, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</div>
        <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 4, lineHeight: 1.45, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{a.blurb}</div>
      </div>
    </Link>
  );
}

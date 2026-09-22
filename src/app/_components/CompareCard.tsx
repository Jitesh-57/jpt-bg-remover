"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import ToolArtwork from "./ToolArtwork";

export type CompareMode = "wipe" | "fade" | "drag";

/**
 * CompareCard — an animated before/after, in one of three modes.
 *
 * Needs two separate photos, not the single flattened "main" image the
 * /creative pages use — a flattened image has no seam a program can find, so
 * there is nothing to animate between. `before`/`after` are each a list of
 * candidate URLs (mirroring SmartImage's own fallback chain); nothing on the
 * server knows which of them actually exist, so this tries them in the
 * browser and, when no "before" ever loads, quietly falls back to a plain
 * static "after" card — the same thing a slug with no animation today shows.
 * A slug that only got one photo is never worse off for having this
 * component instead of a plain one.
 */

function preload(sources: string[]): Promise<string | null> {
  return new Promise((resolve) => {
    let i = 0;
    const tryNext = () => {
      if (i >= sources.length) return resolve(null);
      const url = sources[i++];
      const img = new Image();
      img.onload = () => resolve(url);
      img.onerror = tryNext;
      img.src = url;
    };
    tryNext();
  });
}

export default function CompareCard({
  slug, href, before, after, alt, name, emoji, gradient, mode, aspectRatio = "4 / 5",
  duration = 5, tag = true, caption, linkWrapper = true, className,
}: {
  slug: string;
  href: string;
  before: string[];
  after: string[];
  alt: string;
  name: string;
  emoji: string;
  gradient: [string, string];
  mode: CompareMode;
  aspectRatio?: string;
  /** Full sweep cycle, in seconds. */
  duration?: number;
  /** Small "Before"/"After" pills pinned to the corners — skipped for "fade", where there's no left/right to label. */
  tag?: boolean;
  /** A pill pinned to the bottom of the frame, e.g. the app's own name — for callers that don't add their own caption below. */
  caption?: React.ReactNode;
  /**
   * false when the caller already wraps this in its own `<Link>` (e.g. a
   * grid card with text below the image) — an `<a>` cannot nest inside
   * another `<a>`. The drag-vs-navigate guard still works either way: it
   * calls `preventDefault()` on the click, which suppresses whichever
   * anchor the event bubbles into, not just one rendered here.
   */
  linkWrapper?: boolean;
  /** Extra class names, appended after jpt-hover, when linkWrapper is true. */
  className?: string;
}) {
  const [beforeUrl, setBeforeUrl] = useState<string | null>(null);
  const [afterUrl, setAfterUrl] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);

  // Manual drag state — only ever touched in "drag" mode.
  const [dragPct, setDragPct] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  // A drag that actually moved the handle should not also fire the card's
  // own link navigation on release — a pointerup inside the element it
  // started in is a click as far as the browser is concerned.
  const draggedRef = useRef(false);

  useEffect(() => {
    let live = true;
    Promise.all([preload(before), preload(after)]).then(([b, a]) => {
      if (!live) return;
      setBeforeUrl(b);
      setAfterUrl(a);
      setReady(true);
    });
    return () => { live = false; };
  }, [before, after]);

  const setFromPointer = (clientX: number) => {
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setDragPct(Math.max(0, Math.min(100, pct)));
  };

  const dragHandlers = mode === "drag" ? {
    onPointerDown: (e: React.PointerEvent) => {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setDragging(true);
      draggedRef.current = false;
      setFromPointer(e.clientX);
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (!dragging) return;
      draggedRef.current = true;
      setFromPointer(e.clientX);
    },
    onPointerUp: () => setDragging(false),
    onPointerCancel: () => setDragging(false),
    onClickCapture: (e: React.MouseEvent) => {
      if (draggedRef.current) { e.preventDefault(); draggedRef.current = false; }
    },
  } : {};

  const frameStyle: React.CSSProperties = { position: "relative", width: "100%", height: "100%" };

  let inner: React.ReactNode;
  if (!ready || !beforeUrl || !afterUrl) {
    // Not ready yet, or no "before" ever loaded: the plain single-image card
    // — exactly what this slot showed before the compare view existed.
    inner = (
      <div className="cmp-frame" style={frameStyle}>
        {ready && afterUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={afterUrl} alt={alt} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : ready ? (
          <ToolArtwork slug={slug} name={name} emoji={emoji} gradient={gradient} note="Example coming soon" />
        ) : null}
        {caption && <div className="cmp-caption">{caption}</div>}
      </div>
    );
  } else {
    // Animated (wipe/fade) unless a drag has started a manual position; the
    // manual mode's own CSS animation is dropped the instant a value is set
    // so a drag reads as taking over, not fighting the loop.
    const usingDrag = mode === "drag" && dragPct !== null;
    const wipeStyle: React.CSSProperties = usingDrag
      ? { animation: "none", clipPath: `inset(0 ${100 - dragPct!}% 0 0)` }
      : { ["--cmp-duration" as string]: `${duration}s` };
    const handleStyle: React.CSSProperties = usingDrag
      ? { animation: "none", left: `${dragPct}%` }
      : { ["--cmp-duration" as string]: `${duration}s` };

    inner = (
      <div
        className="cmp-frame"
        style={{ ...frameStyle, cursor: mode === "drag" ? "ew-resize" : undefined }}
        ref={frameRef}
        {...dragHandlers}
      >
        <div className="cmp-layer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={afterUrl} alt={alt} draggable={false} />
        </div>
        <div
          className={`cmp-layer ${mode === "fade" ? "cmp-fade-before" : "cmp-wipe-before"}`}
          style={wipeStyle}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={beforeUrl} alt="" draggable={false} />
        </div>
        {mode !== "fade" && <div className="cmp-handle" style={handleStyle} />}
        {tag && mode !== "fade" && (
          <>
            <span className="cmp-tag cmp-tag-before">Before</span>
            <span className="cmp-tag cmp-tag-after">After</span>
          </>
        )}
        {caption && <div className="cmp-caption">{caption}</div>}
      </div>
    );
  }

  if (!linkWrapper) return inner;

  return (
    <Link
      href={href}
      className={className ? `jpt-hover ${className}` : "jpt-hover"}
      style={{ display: "block", position: "relative", aspectRatio, textDecoration: "none", overflow: "hidden" }}
    >
      {inner}
    </Link>
  );
}

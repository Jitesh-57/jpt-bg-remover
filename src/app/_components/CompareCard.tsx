"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import ToolArtwork from "./ToolArtwork";

export type CompareMode = "wipe" | "fade" | "drag";

/**
 * CompareCard — an animated before/after, in one of three modes.
 *
 * Two ways to get the two halves it needs:
 *
 *   1. `main` — the app's own admin-uploaded creative: one image that is
 *      already a before-and-after, side by side (left half before, right
 *      half after — the same layout the reference cards this was designed
 *      from used, before/after pills baked into the corners of each half).
 *      Cropped in half by measuring the photo's real pixel size once it
 *      loads and cover-fitting each half into the card independently —
 *      centred within its own half, same as `object-fit: cover` centres a
 *      normal photo, so a half whose own shape doesn't match the card's
 *      still fills it cleanly with no sliver of the other half bleeding in
 *      at the seam. (An `object-position: left/right` shortcut was tried
 *      first — wrong whenever a half's aspect ratio isn't exactly the
 *      card's own, which in practice it never quite is.) The before photo
 *      here is the one that actually produced this after, not a generic
 *      stand-in.
 *   2. `before`/`after` — two genuinely separate uploads, for the handful of
 *      apps that have them. Used first when both are there: two full-frame
 *      photos beat two crops of one.
 *
 * Nothing on the server knows which of these exist, so this tries them in
 * the browser, in that order, and — when nothing loads — quietly falls back
 * to a plain static card, the same thing this slot showed before any of this
 * existed. A slug with only one photo, or none, is never worse off for
 * having this component instead of a plain one.
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

/** Like `preload`, but also reports the natural pixel size of whichever
 *  candidate loaded — needed to crop a side-by-side composite precisely. */
function preloadWithSize(sources: string[]): Promise<{ url: string; w: number; h: number } | null> {
  return new Promise((resolve) => {
    let i = 0;
    const tryNext = () => {
      if (i >= sources.length) return resolve(null);
      const url = sources[i++];
      const img = new Image();
      img.onload = () => resolve({ url, w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = tryNext;
      img.src = url;
    };
    tryNext();
  });
}

type Resolved =
  | { kind: "separate"; before: string; after: string }
  | { kind: "split"; src: string; w: number; h: number }
  | { kind: "after-only"; after: string }
  | { kind: "none" };

/**
 * Cover-fit crop of one half of a `w`×`h` composite into a `cw`×`ch` box,
 * centred within that half — the CSS `background-size`/`background-position`
 * that lands on exactly (and only) the requested half, how ever its own
 * shape compares to the box it's going into.
 */
function halfCropStyle(w: number, h: number, cw: number, ch: number, side: "left" | "right"): React.CSSProperties {
  const halfW = w / 2;
  const scale = Math.max(cw / halfW, ch / h);
  const renderedW = w * scale;
  const renderedH = h * scale;
  const centerX = side === "left" ? halfW / 2 : halfW + halfW / 2;
  const centerY = h / 2;
  const offsetX = cw / 2 - centerX * scale;
  const offsetY = ch / 2 - centerY * scale;
  return {
    backgroundSize: `${renderedW}px ${renderedH}px`,
    backgroundPosition: `${offsetX}px ${offsetY}px`,
  };
}

export default function CompareCard({
  slug, href, before = [], after = [], main = [], alt, name, emoji, gradient, mode,
  aspectRatio = "4 / 5", duration = 5, tag = true, caption, linkWrapper = true, className,
}: {
  slug: string;
  href: string;
  /** A genuinely separate "before" photo, best first. Optional — most apps only have `main`. */
  before?: string[];
  /** A genuinely separate "after" photo, best first, and the plain-card fallback's own image. */
  after?: string[];
  /** The app's single before+after composite, best first — see the file comment. */
  main?: string[];
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
  const [resolved, setResolved] = useState<Resolved | null>(null);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  // Manual drag state — only ever touched in "drag" mode.
  const [dragPct, setDragPct] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  // A drag that actually moved the handle should not also fire the card's
  // own link navigation on release — a pointerup inside the element it
  // started in is a click as far as the browser is concerned. And a native
  // HTML5 drag (browsers make an <a> draggable by default) would otherwise
  // hijack the same gesture and show a drag-ghost of the link instead of
  // moving the handle — draggable={false} below, plus this guard, stop it.
  const draggedRef = useRef(false);

  useEffect(() => {
    let live = true;
    Promise.all([preload(before), preload(after), preloadWithSize(main)]).then(([b, a, m]) => {
      if (!live) return;
      if (b && a) setResolved({ kind: "separate", before: b, after: a });
      else if (m && m.w > 0 && m.h > 0) setResolved({ kind: "split", src: m.url, w: m.w, h: m.h });
      else if (a) setResolved({ kind: "after-only", after: a });
      else setResolved({ kind: "none" });
    });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [before.join("|"), after.join("|"), main.join("|")]);

  // The crop math needs the frame's actual rendered pixel size — it lives in
  // a responsive grid, so this tracks it rather than reading it once.
  useEffect(() => {
    if (resolved?.kind !== "split" || !frameRef.current) return;
    const el = frameRef.current;
    const update = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [resolved]);

  const setFromPointer = (clientX: number) => {
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setDragPct(Math.max(0, Math.min(100, pct)));
  };

  // Kept in a ref as well as state: pointermove can fire before React has
  // re-rendered with dragging=true, and those first moves must not be lost.
  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const endDrag = () => { draggingRef.current = false; setDragging(false); };

  const dragHandlers = mode === "drag" ? {
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
      draggingRef.current = true;
      setDragging(true);
      draggedRef.current = false;
      startXRef.current = e.clientX;
      setFromPointer(e.clientX);
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (!draggingRef.current) return;
      if (Math.abs(e.clientX - startXRef.current) > 4) draggedRef.current = true;
      setFromPointer(e.clientX);
    },
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
    onLostPointerCapture: endDrag,
    onClickCapture: (e: React.MouseEvent) => {
      if (draggedRef.current) { e.preventDefault(); e.stopPropagation(); draggedRef.current = false; }
    },
    onDragStart: (e: React.DragEvent) => e.preventDefault(),
  } : { onDragStart: (e: React.DragEvent) => e.preventDefault() };

  const frameStyle: React.CSSProperties = { position: "relative", width: "100%", height: "100%" };
  let inner: React.ReactNode;

  if (!resolved || resolved.kind === "none" || resolved.kind === "after-only") {
    // Not ready yet, nothing loaded, or only a plain "after": the same
    // single-image card this slot showed before the compare view existed.
    inner = (
      <div className="cmp-frame" style={frameStyle}>
        {resolved?.kind === "after-only" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={resolved.after} alt={alt} draggable={false} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : resolved?.kind === "none" ? (
          <ToolArtwork slug={slug} name={name} emoji={emoji} gradient={gradient} note="Example coming soon" />
        ) : null}
        {caption && <div className="cmp-caption">{caption}</div>}
      </div>
    );
  } else if (resolved.kind === "split" && !box) {
    // Composite loaded, waiting one frame for the box to measure itself.
    inner = <div className="cmp-frame" style={frameStyle} ref={frameRef} />;
  } else {
    // Animated (wipe/fade) unless a drag has started a manual position; the
    // manual mode's own CSS animation is dropped the instant a value is set
    // so a drag reads as taking over, not fighting the loop.
    const usingDrag = mode === "drag" && dragPct !== null;
    const wipeVars: React.CSSProperties = usingDrag
      ? { animation: "none", clipPath: `inset(0 ${100 - dragPct!}% 0 0)` }
      : { ["--cmp-duration" as string]: `${duration}s` };
    const handleStyle: React.CSSProperties = usingDrag
      ? { animation: "none", left: `${dragPct}%` }
      : { ["--cmp-duration" as string]: `${duration}s` };

    const afterLayer = resolved.kind === "split" && box
      ? <div className="cmp-layer" style={{ backgroundImage: `url(${resolved.src})`, backgroundRepeat: "no-repeat", ...halfCropStyle(resolved.w, resolved.h, box.w, box.h, "right") }} />
      // eslint-disable-next-line @next/next/no-img-element
      : <div className="cmp-layer"><img src={(resolved as { after: string }).after} alt={alt} draggable={false} /></div>;
    const beforeLayer = resolved.kind === "split" && box
      ? <div className="cmp-layer" style={{ backgroundImage: `url(${resolved.src})`, backgroundRepeat: "no-repeat", ...halfCropStyle(resolved.w, resolved.h, box.w, box.h, "left") }} />
      // eslint-disable-next-line @next/next/no-img-element
      : <div className="cmp-layer"><img src={(resolved as { before: string }).before} alt="" draggable={false} /></div>;

    inner = (
      <div
        className={usingDrag ? "cmp-frame cmp-manual" : "cmp-frame"}
        // pan-y: a sideways swipe moves the slider, a vertical one still scrolls the page.
        style={{ ...frameStyle, cursor: mode === "drag" ? "ew-resize" : undefined, touchAction: mode === "drag" ? "pan-y" : undefined, userSelect: "none", WebkitUserSelect: "none" }}
        ref={frameRef}
        draggable={false}
        {...dragHandlers}
      >
        {afterLayer}
        <div
          className={mode === "fade" ? "cmp-fade-before" : "cmp-wipe-before"}
          style={{ position: "absolute", inset: 0, ...wipeVars }}
        >
          {beforeLayer}
        </div>
        {mode !== "fade" && <div className={mode === "drag" ? "cmp-handle cmp-handle-knob" : "cmp-handle"} style={handleStyle} />}
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
      draggable={false}
      className={className ? `jpt-hover ${className}` : "jpt-hover"}
      style={{ display: "block", position: "relative", aspectRatio, textDecoration: "none", overflow: "hidden" }}
    >
      {inner}
    </Link>
  );
}

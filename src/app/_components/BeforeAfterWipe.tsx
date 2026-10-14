"use client";

import { useEffect, useRef, useState } from "react";

/**
 * BeforeAfterWipe — the pricing popup's before/after, as a moving wipe.
 *
 * Two full-frame photos stacked: the "after" on top, clipped to the right of a
 * divider that sweeps back and forth on its own (pure CSS, so it costs no
 * JavaScript per frame). Dragging takes over the divider; letting go hands it
 * back to the animation after a pause. With reduced motion the divider rests
 * in the middle.
 *
 * The Before/After pills are part of the photos (bottom-left of the before,
 * bottom-right of the after), so each one shows exactly while its side does.
 */
export default function BeforeAfterWipe({
  before, after, alt = "Before and after", className, style,
}: {
  before: string; after: string; alt?: string; className?: string; style?: React.CSSProperties;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<number | null>(null); // null → the CSS animation drives it
  const resume = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragging = useRef(false);

  useEffect(() => () => { if (resume.current) clearTimeout(resume.current); }, []);

  const place = (clientX: number) => {
    const r = box.current?.getBoundingClientRect();
    if (!r || !r.width) return;
    setPos(Math.min(96, Math.max(4, ((clientX - r.left) / r.width) * 100)));
  };

  const onDown = (e: React.PointerEvent) => {
    dragging.current = true;
    if (resume.current) clearTimeout(resume.current);
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    place(e.clientX);
  };
  const onMove = (e: React.PointerEvent) => { if (dragging.current) place(e.clientX); };
  const onUp = () => {
    dragging.current = false;
    resume.current = setTimeout(() => setPos(null), 2600);
  };

  const manual = pos !== null;
  const vars = (manual ? { ["--wipe" as string]: `${pos}%` } : {}) as React.CSSProperties;

  return (
    <div
      ref={box}
      className={`jpt-wipe${manual ? " is-manual" : ""}${className ? ` ${className}` : ""}`}
      style={{ ...vars, ...style }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      role="img"
      aria-label={alt}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="jpt-wipe-img" src={before} alt="" draggable={false} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="jpt-wipe-img jpt-wipe-after" src={after} alt="" draggable={false} />
      <span className="jpt-wipe-line" aria-hidden>
        <span className="jpt-wipe-knob">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 6l-6 6 6 6M15 6l6 6-6 6" />
          </svg>
        </span>
      </span>
    </div>
  );
}

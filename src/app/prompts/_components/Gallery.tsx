"use client";

import { useEffect, useState } from "react";

/**
 * The result images for a prompt, with a lightbox.
 *
 * Several records carry two to four results from the same prompt, and the
 * differences between them are the point — showing only the first would hide
 * how much the model varies run to run.
 */
export default function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [open, setOpen] = useState<number | null>(null);
  /*
    A dead source URL should remove its tile, not leave a broken-image icon in
    the grid. These are hotlinked from a third-party CDN until the mirror is
    filled, so this is a real case rather than a defensive one.
  */
  const [broken, setBroken] = useState<Set<string>>(new Set());
  const live = images.filter((src) => !broken.has(src));

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((i) => (i === null ? null : (i + 1) % live.length));
      if (e.key === "ArrowLeft") setOpen((i) => (i === null ? null : (i - 1 + live.length) % live.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, live.length]);

  if (!live.length) return null;

  return (
    <>
      <div style={{
        display: "grid",
        gridTemplateColumns: live.length === 1 ? "1fr" : "repeat(auto-fit, minmax(min(240px, 100%), 1fr))",
        gap: 10,
      }}>
        {live.map((src, i) => (
          <button
            key={src}
            onClick={() => setOpen(i)}
            aria-label={`Open result ${i + 1} of ${live.length}`}
            style={{
              padding: 0, border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden",
              background: "var(--surface-2)", cursor: "zoom-in", display: "block", minWidth: 0,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`${alt} — result ${i + 1}`}
              loading={i === 0 ? "eager" : "lazy"}
              decoding="async"
              onError={() => setBroken((b) => new Set(b).add(src))}
              style={{ width: "100%", display: "block", aspectRatio: live.length === 1 ? undefined : "4 / 3", objectFit: "cover" }}
            />
          </button>
        ))}
      </div>

      {open !== null && (
        <div
          onClick={() => setOpen(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`${alt} — result ${open + 1}`}
          style={{
            position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.88)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 24, cursor: "zoom-out",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={live[open]}
            alt={`${alt} — result ${open + 1}`}
            style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 8 }}
          />
          {live.length > 1 && (
            <div style={{ position: "absolute", bottom: 20, color: "#fff", fontSize: 13, fontWeight: 700, letterSpacing: "0.06em" }}>
              {open + 1} / {live.length} · arrow keys to move, Esc to close
            </div>
          )}
        </div>
      )}
    </>
  );
}

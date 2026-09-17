"use client";

import { useState } from "react";
import Image from "next/image";
import ToolArtwork from "./ToolArtwork";

/**
 * An image slot that degrades gracefully, and does not cost megabytes.
 *
 * Two things were wrong with the plain <img> this replaces.
 *
 * The creatives in the bucket are full-size PNGs, 1 to 2 MB each, and the
 * homepage shows eleven of them — so a cold refresh pulled something like
 * fifteen megabytes and every card sat on its gradient until it arrived,
 * which is exactly what "the images don't load" looked like. next/image
 * resizes each file to the width it is actually displayed at and serves AVIF
 * or WebP, which takes a 1.5 MB card down to tens of kilobytes.
 *
 * And a slot with no file rendered a flat two-stop gradient, so a gallery of
 * missing creatives read as coloured rectangles. Given an `artwork` prop it
 * now draws the tool's own placeholder instead.
 */
export default function SmartImage({
  src, sources, alt, fallback, style, eager = false, sizes = "(max-width: 768px) 50vw, 300px", artwork,
}: {
  src?: string;
  /** Candidate URLs, best first — tried in turn on load failure. */
  sources?: string[];
  alt: string;
  /** CSS background shown while loading and when there is no artwork. */
  fallback: string;
  style?: React.CSSProperties;
  eager?: boolean;
  /** What widths this slot is rendered at, so the optimiser picks one. */
  sizes?: string;
  /** Drawn instead of the bare gradient when the file is missing. */
  artwork?: { slug: string; name: string; emoji?: string; gradient: [string, string]; note?: string };
}) {
  const candidates = (sources?.length ? sources : src ? [src] : []).filter(Boolean);
  const [index, setIndex] = useState(0);
  const current = candidates[index];
  const ok = !!current;
  const [loaded, setLoaded] = useState(false);

  const showArtwork = !ok && !!artwork;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: fallback, overflow: "hidden", ...style }}>
      {showArtwork && <ToolArtwork {...artwork!} />}
      {ok && src && (
        // Invisible until it has actually loaded: otherwise a pending or missing
        // file paints its alt text over the fallback instead of the fallback.
        <Image
          key={current}
          src={current}
          alt={alt}
          fill
          sizes={sizes}
          priority={eager}
          loading={eager ? undefined : "lazy"}
          onLoad={() => setLoaded(true)}
          onError={() => setIndex((i) => i + 1)}
          style={{
            objectFit: "cover",
            opacity: loaded ? 1 : 0,
            transition: "opacity .35s var(--ease)",
          }}
        />
      )}
    </div>
  );
}

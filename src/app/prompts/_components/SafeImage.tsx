"use client";

import { useState } from "react";

/**
 * An image that degrades to a neutral block.
 *
 * These files are hotlinked from a third-party CDN until the mirror is filled,
 * so a dead URL is a real possibility rather than a theoretical one. The
 * browser's default for that is a broken-image icon with the alt text sprawled
 * across the layout, which looks worse than showing nothing.
 */
export default function SafeImage({
  src, alt, style, fill = true,
}: {
  src: string | null;
  alt: string;
  style?: React.CSSProperties;
  /** Absolute-position to fill the parent (the default) or flow inline. */
  fill?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  if (!src || failed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
      style={{
        ...(fill ? { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" } : { width: "100%", display: "block" }),
        opacity: loaded ? 1 : 0,
        transition: "opacity .3s var(--ease)",
        ...style,
      }}
    />
  );
}

"use client";

import { useState } from "react";

/**
 * An image slot that degrades gracefully. Creatives are uploaded to Supabase
 * over time, so a slot may be empty for a while: instead of a broken-image
 * icon it shows the gradient fallback until the file exists.
 */
export default function SmartImage({
  src, alt, fallback, style, eager = false,
}: {
  src: string; alt: string; fallback: string; style?: React.CSSProperties; eager?: boolean;
}) {
  const [ok, setOk] = useState(true);
  const [loaded, setLoaded] = useState(false);
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: fallback, ...style }}>
      {ok && src && (
        // Invisible until it has actually loaded: otherwise a pending or missing
        // file paints its alt text over the fallback instead of the fallback.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setOk(false)}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: loaded ? 1 : 0, transition: "opacity .35s var(--ease)" }}
        />
      )}
    </div>
  );
}

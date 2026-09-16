"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * SafeImage — every picture in the prompt library goes through here.
 *
 * Two jobs.
 *
 * The first is that these files live on a third-party CDN and were arriving
 * blank in production as plain <img> tags. `next/image` fetches them on the
 * server instead, so what the browser requests is a resized AVIF or WebP from
 * our own domain — which sidesteps whatever the source was refusing, and turns
 * a 2MB press JPEG into something a grid of 24 can afford.
 *
 * The second is that a third-party URL can simply die. When one does the tile
 * collapses to the neutral placeholder rather than showing a broken-image icon
 * with the alt text sprawled across the layout.
 */
export default function SafeImage({
  src,
  alt,
  /** CSS `sizes`. Getting this right is most of the saving. */
  sizes = "(max-width: 700px) 100vw, 320px",
  priority = false,
  placeholder,
}: {
  src: string | null;
  alt: string;
  sizes?: string;
  priority?: boolean;
  /** Shown while loading and if the source fails. */
  placeholder?: React.ReactNode;
}) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const fallback = placeholder ?? (
    <div
      aria-hidden
      style={{
        position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(140deg, var(--surface-3), var(--surface-2))",
        color: "var(--text-faint)", fontSize: 22,
      }}
    >
      ◨
    </div>
  );

  return (
    <>
      {(!src || failed || !loaded) && fallback}
      {src && !failed && (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          unoptimized={src.startsWith("data:")}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          style={{ objectFit: "cover", opacity: loaded ? 1 : 0, transition: "opacity .3s var(--ease)" }}
        />
      )}
    </>
  );
}

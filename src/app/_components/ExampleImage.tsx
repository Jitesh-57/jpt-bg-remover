"use client";

import { useState } from "react";
import Image from "next/image";
import ToolArtwork from "./ToolArtwork";

/**
 * An example image that draws the tool when the photo is missing.
 *
 * The comparison panes used a bare <img>, so a slot whose file has not been
 * generated painted the browser's broken-image icon and the alt text across
 * the pane — which is how "The result from AI Polaroid Photo Maker" ended up
 * as the visible content of an AFTER panel.
 *
 * A creative is generated per app and the set fills in over time, so a missing
 * file is a normal state rather than an error. It now renders as the app's own
 * placeholder artwork: its palette, a motif matched to what the tool does, its
 * emoji and its name.
 *
 * The photo itself goes through next/image, because these are full-size PNGs
 * and a 4:5 card does not need 1.5 MB of them.
 */
export default function ExampleImage({
  src,
  alt,
  emoji,
  gradient,
  slug,
  name,
  note = "Example coming soon",
  sizes = "(max-width: 768px) 100vw, 420px",
  eager = false,
}: {
  src: string;
  alt: string;
  /** Shown in the placeholder — the app's own emoji. */
  emoji?: string;
  /** `[from, to]` for the placeholder's background. */
  gradient?: [string, string];
  /** Used to choose the placeholder's motif. */
  slug?: string;
  /** Drawn on the placeholder. Falls back to the alt text. */
  name?: string;
  note?: string;
  sizes?: string;
  eager?: boolean;
}) {
  const [failed, setFailed] = useState(!src);
  const [loaded, setLoaded] = useState(false);

  const bg = gradient
    ? `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`
    : "var(--surface-2)";

  if (failed) {
    if (gradient && slug) {
      return <ToolArtwork slug={slug} name={name || alt} emoji={emoji} gradient={gradient} note={note} />;
    }
    return (
      <div
        style={{
          position: "absolute", inset: 0, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 10, padding: 20,
          textAlign: "center", background: bg,
        }}
      >
        {emoji && <span style={{ fontSize: 34, opacity: 0.9 }}>{emoji}</span>}
        <span style={{ fontSize: 12.5, fontWeight: 700, color: "rgba(255,255,255,0.82)", textShadow: "0 1px 6px rgba(0,0,0,0.35)" }}>
          {note}
        </span>
      </div>
    );
  }

  return (
    <>
      {/* The gradient sits behind while the file decodes, so the pane is never
          an empty grey box mid-load. */}
      <div style={{ position: "absolute", inset: 0, background: bg, opacity: loaded ? 0 : 1, transition: "opacity .3s var(--ease)" }} />
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={eager}
        loading={eager ? undefined : "lazy"}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        style={{
          objectFit: "cover",
          opacity: loaded ? 1 : 0,
          transition: "opacity .3s var(--ease)",
        }}
      />
    </>
  );
}

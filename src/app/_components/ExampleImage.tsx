"use client";

import { useState } from "react";

/**
 * An example image that says so when it is missing.
 *
 * The comparison panes used a bare <img>, so a slot whose file has not been
 * generated yet painted the browser's broken-image icon and the alt text
 * across the pane — which is how "The result from AI Polaroid Photo Maker"
 * ended up as the visible content of an AFTER panel.
 *
 * A creative is generated per app and the set fills in over time, so a missing
 * file is a normal state rather than an error, and this renders it as one: the
 * app's own emoji over its gradient, with a line saying the example is on its
 * way. The tool itself is unaffected and sits directly above.
 */
export default function ExampleImage({
  src,
  alt,
  emoji,
  gradient,
  note = "Example coming soon",
}: {
  src: string;
  alt: string;
  /** Shown in the placeholder — the app's own emoji. */
  emoji?: string;
  /** `[from, to]` for the placeholder's background. */
  gradient?: [string, string];
  note?: string;
}) {
  const [failed, setFailed] = useState(!src);
  const [loaded, setLoaded] = useState(false);

  const bg = gradient
    ? `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`
    : "var(--surface-2)";

  if (failed) {
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
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "cover", display: "block",
          opacity: loaded ? 1 : 0, transition: "opacity .3s var(--ease)",
        }}
      />
    </>
  );
}

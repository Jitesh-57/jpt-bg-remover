"use client";

import { useState } from "react";
import { landingImg } from "@/lib/landing-images";

/**
 * Pixel Shine brand logo.
 *
 * Three exports live in the Supabase `landing` bucket:
 *   logo-wordmark.png  mark + "Pixel Shine", no tagline  → nav bars, tight spots
 *   logo.png           the full lockup incl. the tagline → footer, standalone LPs
 *   logo-mark.png      the square mark on its own        → phones, avatars
 *
 * Each variant falls back to `logo.png`, and `logo.png` falls back to the text
 * lockup, so uploading just the one file already lights up every placement and
 * nothing ever renders a broken image.
 */
type Variant = "wordmark" | "full" | "mark";

const CANDIDATES: Record<Variant, string[]> = {
  wordmark: ["logo-wordmark.png", "logo.png"],
  full: ["logo.png", "logo-wordmark.png"],
  mark: ["logo-mark.png", "logo.png"],
};

export default function BrandLogo({
  height = 30,
  variant = "wordmark",
  dark = false,
}: {
  height?: number;
  /** Which export to prefer. See CANDIDATES. */
  variant?: Variant;
  /** True when the logo sits on a light surface (the mark is built for dark). */
  dark?: boolean;
}) {
  // Index into CANDIDATES: bumped on each load error, so a missing variant
  // silently steps down to the next export rather than showing nothing.
  const [step, setStep] = useState(0);
  // Invisible until it has actually decoded. Without this, each candidate that
  // 404s paints a broken-image icon and the alt text before the next one is
  // tried, so the header visibly flickers on the way to the fallback.
  const [loaded, setLoaded] = useState(false);
  const files = CANDIDATES[variant];
  const src = step < files.length ? landingImg(files[step]) : "";

  if (!src) {
    const gap = Math.round(height * 0.22);
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap }}>
        <span style={{ fontSize: Math.round(height * 0.62), fontWeight: 900, color: "var(--accent)" }}>✦</span>
        {variant !== "mark" && (
          <span style={{ fontSize: Math.round(height * 0.54), fontWeight: 900, letterSpacing: "-0.03em", whiteSpace: "nowrap" }}>
            <span style={{ color: dark ? "#0B0B0E" : "var(--text)" }}>Pixel</span>{" "}
            <span className="jpt-grad-text">Shine</span>
          </span>
        )}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="Pixel Shine"
      width={variant === "mark" ? height : undefined}
      height={height}
      style={{ height, width: "auto", display: "block", objectFit: "contain", flexShrink: 0, opacity: loaded ? 1 : 0 }}
      onLoad={() => setLoaded(true)}
      onError={() => { setLoaded(false); setStep((s) => s + 1); }}
    />
  );
}

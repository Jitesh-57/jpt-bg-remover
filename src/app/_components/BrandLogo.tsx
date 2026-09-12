"use client";

import { useState } from "react";
import { landingImg } from "@/lib/landing-images";

/**
 * Pixel Shine brand logo.
 *
 * Three exports are looked for in the Supabase `landing` bucket:
 *   logo-wordmark.png  mark + "Pixel Shine", no tagline  → nav bars, tight spots
 *   logo.png           the full lockup incl. the tagline → footer, standalone LPs
 *   logo-mark.png      the square mark on its own        → phones, avatars
 *
 * Each variant falls back to `logo.png`, and `logo.png` falls back to the text
 * lockup, so uploading just the one file already lights up every placement and
 * nothing ever renders a broken image.
 *
 * A square file used as a wordmark is handled rather than trusted. Scaling a
 * roughly-square export to a nav bar's 34px height leaves it about 34px wide —
 * a thumbnail where the brand name should be, which is exactly how the header
 * looked. So the file's real proportions are measured on load: anything that is
 * not actually wide is treated as the mark and paired with the typeset name.
 */
type Variant = "wordmark" | "full" | "mark";

const CANDIDATES: Record<Variant, string[]> = {
  wordmark: ["logo-wordmark.png", "logo.png", "logo-mark.png"],
  full: ["logo.png", "logo-wordmark.png", "logo-mark.png"],
  mark: ["logo-mark.png", "logo.png"],
};

/** Below this width:height, a file cannot be carrying the name legibly. */
const WORDMARK_MIN_RATIO = 1.6;

/** The typeset name, used beside the mark and as the last-resort lockup. */
function Wordmark({ height, dark }: { height: number; dark: boolean }) {
  return (
    <span
      style={{
        fontSize: Math.round(height * 0.54),
        fontWeight: 900,
        letterSpacing: "-0.03em",
        whiteSpace: "nowrap",
        lineHeight: 1,
      }}
    >
      <span style={{ color: dark ? "#0B0B0E" : "var(--text)" }}>Pixel</span>{" "}
      <span className="jpt-grad-text">Shine</span>
    </span>
  );
}

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
  // Set once the file's own proportions are known.
  const [ratio, setRatio] = useState<number | null>(null);

  const files = CANDIDATES[variant];
  const src = step < files.length ? landingImg(files[step]) : "";
  const gap = Math.round(height * 0.24);

  if (!src) {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap }}>
        <span style={{ fontSize: Math.round(height * 0.62), fontWeight: 900, color: "var(--accent)", lineHeight: 1 }}>✦</span>
        {variant !== "mark" && <Wordmark height={height} dark={dark} />}
      </span>
    );
  }

  // A square-ish file standing in for a wordmark becomes the mark, and the name
  // is typeset beside it at full size instead of being shrunk into the icon.
  const asMark = variant !== "mark" && ratio !== null && ratio < WORDMARK_MIN_RATIO;

  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="Pixel Shine"
      height={height}
      style={{
        height, width: asMark ? height : "auto", display: "block",
        objectFit: "contain", flexShrink: 0, opacity: loaded ? 1 : 0,
      }}
      onLoad={(e) => {
        const el = e.currentTarget;
        if (el.naturalHeight > 0) setRatio(el.naturalWidth / el.naturalHeight);
        setLoaded(true);
      }}
      onError={() => { setLoaded(false); setRatio(null); setStep((s) => s + 1); }}
    />
  );

  if (!asMark) return img;

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap }}>
      {img}
      <Wordmark height={height} dark={dark} />
    </span>
  );
}

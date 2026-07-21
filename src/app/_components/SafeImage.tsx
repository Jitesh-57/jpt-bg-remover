"use client";

import { useState } from "react";

/**
 * Renders an image that hides itself if the source fails to load (404), so a
 * page referencing a creative that hasn't been uploaded to Supabase yet shows
 * nothing instead of a broken-image icon.
 */
export default function SafeImage({
  src,
  alt,
  style,
  wrapperStyle,
}: {
  src: string;
  alt: string;
  style?: React.CSSProperties;
  wrapperStyle?: React.CSSProperties;
}) {
  const [ok, setOk] = useState(true);
  if (!ok || !src) return null;
  return (
    <div style={wrapperStyle}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} style={style} loading="lazy" onError={() => setOk(false)} />
    </div>
  );
}

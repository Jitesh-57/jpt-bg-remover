"use client";

import { useState } from "react";

const LOGO_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL || ""}/storage/v1/object/public/landing/logo.png`;

/**
 * JPT AI brand logo. Renders the hosted logo (Supabase landing/logo.png) and
 * falls back to the text lockup if the image isn't available yet.
 */
export default function BrandLogo({ height = 30, dark = false }: { height?: number; dark?: boolean }) {
  const [failed, setFailed] = useState(false);

  if (failed || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: Math.round(height * 0.6), fontWeight: 900, color: "#6366F1" }}>✦</span>
        <span style={{ fontSize: Math.round(height * 0.53), fontWeight: 900, color: dark ? "#fff" : "#111", letterSpacing: "-0.02em" }}>JPT AI</span>
      </span>
    );
  }

  // On dark surfaces, sit the logo on a light chip so a dark/blue mark stays visible.
  const wrap: React.CSSProperties = dark
    ? { background: "#fff", borderRadius: 10, padding: "5px 10px", display: "inline-flex", alignItems: "center", lineHeight: 0 }
    : { display: "inline-flex", alignItems: "center", lineHeight: 0 };

  return (
    <span style={wrap}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={LOGO_URL}
        alt="JPT AI"
        style={{ height, width: "auto", display: "block", objectFit: "contain" }}
        onError={() => setFailed(true)}
      />
    </span>
  );
}

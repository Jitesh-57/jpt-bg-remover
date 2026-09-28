"use client";

import { useState } from "react";
import ToolIcon, { iconKeyForHref } from "@/app/editor/ToolIcon";

/**
 * The "AI Tools" mega menu: Spaces (the big workspaces, with a picture each),
 * Features (single-purpose tools) and Popular apps.
 *
 * Lists are written out here rather than read from the app catalogue: this
 * ships with the navbar on every page, and the catalogue is a large module.
 */

const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const thumb = (slug: string) => `${SUPA}/storage/v1/object/public/landing/creative/v2/${slug}.png`;

const SPACES = [
  { label: "Create Image", desc: "Turn a prompt into a stunning photo", href: "/app/create", img: thumb("aesthetic-photo-editor"), grad: "#7C3AED, #DB2777" },
  { label: "AI Image Editor", desc: "Describe the change, get the edit", href: "/app/editor", img: thumb("fashion-photo-editor"), grad: "#0EA5E9, #6366F1" },
  { label: "Recreate", desc: "Any photo's look, with your own face", href: "/app/recreate", img: thumb("dress-photo-editor"), grad: "#F97316, #DB2777", badge: "NEW" },
  { label: "AI Headshot", desc: "Studio portraits from a selfie", href: "/ai-headshot", img: thumb("professional-headshot"), grad: "#10B981, #0EA5E9" },
  { label: "Batch Editor", desc: "One edit on up to 100 images", href: "/batch-editor", img: thumb("ai-photoshoot"), grad: "#F59E0B, #EF4444" },
  { label: "Photo Editor", desc: "Every tool on one canvas", href: "/editor", img: thumb("birthday-photo-editor"), grad: "#A855F7, #EC4899" },
];

const FEATURES = [
  { label: "Remove Background", href: "/remove-bg" },
  { label: "Upscale Image", href: "/upscale" },
  { label: "Prompt to Edit", href: "/ai-editor" },
  { label: "Remove Watermark", href: "/watermark-remover" },
  { label: "Resize Image", href: "/resize-image" },
  { label: "Crop Image", href: "/crop-image" },
  { label: "Compress Image", href: "/compress-image" },
  { label: "Blur Image", href: "/blur-image" },
];

const POPULAR = [
  { label: "Ghibli Style Photo", slug: "ghibli-style" },
  { label: "Professional Headshot", slug: "professional-headshot" },
  { label: "Baby Photoshoot", slug: "baby-photoshoot" },
  { label: "Outfit Generator", slug: "outfit-generator" },
  { label: "Aesthetic Photo Editor", slug: "aesthetic-photo-editor" },
];

function Thumb({ src, grad, size }: { src: string; grad: string; size: number }) {
  const [failed, setFailed] = useState(!SUPA);
  return (
    <span style={{ width: size, height: size, borderRadius: Math.round(size * 0.22), overflow: "hidden", flexShrink: 0, background: `linear-gradient(135deg, ${grad})`, boxShadow: "inset 0 0 0 1px rgba(255,255,255,.08)", display: "block" }}>
      {!failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      )}
    </span>
  );
}

const head: React.CSSProperties = { fontSize: 11, fontWeight: 800, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 12px 10px" };
const hover = {
  onMouseEnter: (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.background = "var(--surface-2)"; },
  onMouseLeave: (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.background = "transparent"; },
};

export default function MegaMenu({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="jpt-a-pop"
      style={{
        position: "absolute", top: "calc(100% + 12px)", left: -8, zIndex: 1000,
        width: "min(900px, calc(100vw - 48px))",
        background: "var(--bg-elevated, var(--surface))", border: "1px solid var(--border)", borderRadius: 18,
        boxShadow: "0 24px 70px rgba(0,0,0,.45)", padding: "22px 10px 18px",
        display: "grid", gridTemplateColumns: "1.15fr 1fr 1fr",
      }}
    >
      {/* Spaces */}
      <div style={{ padding: "0 12px", borderRight: "1px solid var(--border)", minWidth: 0 }}>
        <div style={head}>Spaces</div>
        <div className="jpt-scroll-thin" style={{ maxHeight: 348, overflowY: "auto", paddingRight: 4 }}>
          {SPACES.map((s) => (
            <a key={s.href} href={s.href} onClick={onClose} {...hover}
              style={{ display: "flex", alignItems: "center", gap: 13, padding: "9px 10px", borderRadius: 12, textDecoration: "none", transition: "background .12s" }}>
              <Thumb src={s.img} grad={s.grad} size={50} />
              <span style={{ minWidth: 0 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 14.5, fontWeight: 800, color: "var(--text)" }}>
                  {s.label}
                  {s.badge && <span style={{ fontSize: 9.5, fontWeight: 900, letterSpacing: ".06em", color: "#fff", background: "var(--grad-strong)", borderRadius: 5, padding: "2px 6px" }}>{s.badge}</span>}
                </span>
                <span style={{ display: "block", fontSize: 12.5, color: "var(--text-muted)", marginTop: 3, lineHeight: 1.4 }}>{s.desc}</span>
              </span>
            </a>
          ))}
        </div>
      </div>

      {/* Features */}
      <div style={{ padding: "0 12px", borderRight: "1px solid var(--border)", minWidth: 0 }}>
        <div style={head}>Features</div>
        {FEATURES.map((f) => (
          <a key={f.href} href={f.href} onClick={onClose} {...hover}
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "7px 10px", borderRadius: 10, textDecoration: "none", fontSize: 14, fontWeight: 600, color: "var(--text)", transition: "background .12s" }}>
            <ToolIcon id={iconKeyForHref(f.href)} active={false} size={30} />
            {f.label}
          </a>
        ))}
        <a href="/tools" onClick={onClose} style={{ display: "inline-flex", alignItems: "center", gap: 6, margin: "10px 0 0 10px", fontSize: 13.5, fontWeight: 800, color: "var(--accent)", textDecoration: "none" }}>
          All free tools →
        </a>
      </div>

      {/* Popular apps */}
      <div style={{ padding: "0 12px", minWidth: 0 }}>
        <div style={head}>Popular apps</div>
        {POPULAR.map((p) => (
          <a key={p.slug} href={`/creative/${p.slug}`} onClick={onClose} {...hover}
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "7px 10px", borderRadius: 10, textDecoration: "none", fontSize: 14, fontWeight: 600, color: "var(--text)", transition: "background .12s" }}>
            <Thumb src={thumb(p.slug)} grad="#F97316, #DB2777" size={30} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.label}</span>
          </a>
        ))}
        <a href="/creative" onClick={onClose} style={{ display: "inline-flex", alignItems: "center", gap: 8, margin: "10px 0 0 10px", fontSize: 13.5, fontWeight: 800, color: "var(--accent)", textDecoration: "none" }}>
          <ToolIcon id="apps" size={22} /> See all apps →
        </a>
      </div>
    </div>
  );
}

"use client";

import ToolIcon, { iconKeyForHref } from "@/app/editor/ToolIcon";
import { Mock, type MockKind, type Pic, type ShowFeature } from "@/app/app/_components/FeatureShowcase";
import type { IconName } from "@/app/app/_components/Icon";

/**
 * The "AI Tools" mega menu: Spaces (the big workspaces), Features
 * (single-purpose tools) and Popular apps.
 *
 * Each space is a tiny version of its homepage tool card: the same living
 * mock-up of the tool (the prompt typing, the before/after wipe, the batch
 * ticking through) in a tilted app window on that tool's own glow, built from
 * the same pictures. No two items in the menu share a picture or a person.
 *
 * Lists are written out here rather than read from the app catalogue: this
 * ships with the navbar on every page, and the catalogue is a large module.
 */

const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
/** An app's published before|after creative, as the homepage tool cards use it. */
const creative = (slug: string): Pic => ({ srcs: SUPA ? [`${SUPA}/storage/v1/object/public/landing/creatives/${slug}-main.webp`] : [], split: true });
/** An app's single preview picture. */
const preview = (slug: string): Pic => ({ srcs: SUPA ? [`${SUPA}/storage/v1/object/public/landing/creative/v2/${slug}.png`] : [] });

interface Space { label: string; desc: string; href: string; badge?: string; kind: MockKind; icon: IconName; grad: [string, string]; pics: Pic[]; captions?: string[] }

const SPACES: Space[] = [
  { label: "AI Photo Studio", desc: "Say what you want, then refine it by chatting", href: "/app/studio", badge: "NEW", kind: "studio", icon: "sparkle", grad: ["#F97316", "#DB2777"], pics: [creative("ai-photoshoot")] },
  // The homepage card's own example: a picture made from a prompt alone, with that prompt.
  { label: "AI Image Generator", desc: "Turn a prompt into a stunning photo", href: "/app/create", kind: "create", icon: "create", grad: ["#7C3AED", "#DB2777"],
    pics: [{ srcs: ["https://cms-assets.youmind.com/media/1789195059035_7u5vdf_HR1gCEybIAAooRW.jpg"] }], captions: ["cinematic stormy ocean pier portrait"] },
  { label: "AI Photo Editor", desc: "Describe the change, get the edit", href: "/app/editor", kind: "editor", icon: "editor", grad: ["#0EA5E9", "#6366F1"], pics: [creative("restore-old-photos")] },
  // Someone else's saree photo is the look; the saree photoshoot is you, then you in it.
  { label: "Copy Photo Style", desc: "Any photo's look, with your own face", href: "/app/recreate", kind: "recreate", icon: "copy", grad: ["#F97316", "#EF4444"], pics: [creative("saree-photo-editor"), creative("saree-photoshoot")] },
  { label: "AI Headshot Generator", desc: "Studio portraits from a selfie", href: "/ai-headshot", kind: "headshot", icon: "community", grad: ["#10B981", "#0EA5E9"], pics: [creative("professional-headshot")] },
  { label: "Bulk Photo Editor", desc: "One edit on up to 100 images", href: "/batch-editor", kind: "batch", icon: "folder", grad: ["#F59E0B", "#EF4444"],
    pics: ["doctor-headshot", "ai-product-photography", "muscle-generator", "renaissance-portrait", "house-photo-editor", "ai-vtuber-maker"].map(creative) },
  { label: "Free Photo Editor", desc: "Every tool on one canvas", href: "/editor", kind: "photo", icon: "tools", grad: ["#06B6D4", "#3B82F6"], pics: [creative("coastal-cowgirl")] },
];

const FEATURES = [
  { label: "Remove Background", href: "/remove-bg" },
  { label: "Upscale Image", href: "/upscale" },
  { label: "Prompt to Edit", href: "/app/editor" },
  { label: "AI Image Generator", href: "/app/create" },
  { label: "Remove Watermark", href: "/watermark-remover" },
  { label: "Resize Image", href: "/resize-image" },
  { label: "Crop Image", href: "/crop-image" },
  { label: "Compress Image", href: "/compress-image" },
  { label: "Blur Image", href: "/blur-image" },
];

const POPULAR: { label: string; slug: string; pic: Pic }[] = [
  { label: "Ghibli Style Photo", slug: "ghibli-style", pic: creative("ghibli-style") },
  // Their previews, not the before|afters: those people already appear in the spaces above.
  { label: "Professional Headshot", slug: "professional-headshot", pic: preview("professional-headshot") },
  { label: "Baby Photoshoot", slug: "baby-photoshoot", pic: creative("baby-photoshoot") },
  { label: "Outfit Generator", slug: "outfit-generator", pic: preview("outfit-generator") },
  { label: "3D Figurine", slug: "3d-figurine", pic: creative("3d-figurine") },
];

/** A space's tile: its homepage card's mock-up, in miniature (see .jpt-menu-tile). */
function SpaceTile({ s }: { s: Space }) {
  const f: ShowFeature = { kind: s.kind, title: s.label, tagline: s.desc, sub: s.desc, href: s.href, icon: s.icon, grad: s.grad, pics: s.pics, captions: s.captions };
  return (
    <span aria-hidden className="jpt-menu-tile" style={{ ["--g1" as string]: s.grad[0], ["--g2" as string]: s.grad[1] }}>
      <span className="jpt-menu-stage"><Mock f={f} /></span>
    </span>
  );
}

/**
 * A popular app's thumbnail, drawn as a background so it can be replaced from
 * the visual page editor like any other picture, over a gradient that shows if
 * the picture can't load. A before|after creative is zoomed to its after half,
 * clear of the divider and the "After" label; a single picture is cropped
 * towards the top, where the face usually is, so a portrait still reads small.
 */
function Thumb({ pic, grad, size }: { pic: Pic; grad: string; size: number }) {
  const src = pic.srcs[0];
  return (
    <span
      aria-hidden
      style={{
        width: size, height: size, borderRadius: Math.round(size * 0.24), flexShrink: 0, display: "block",
        backgroundImage: [...(src ? [`url("${src}")`] : []), `linear-gradient(135deg, ${grad})`].join(", "),
        backgroundSize: `${pic.split ? "204% auto" : "cover"}, cover`,
        backgroundPosition: `${pic.split ? "100% 40%" : "center 22%"}, center`,
        backgroundRepeat: "no-repeat",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,.1), 0 4px 12px -4px rgba(0,0,0,.5)",
      }}
    />
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
        display: "grid", gridTemplateColumns: "1.45fr 1fr 1fr",
      }}
    >
      {/* Spaces */}
      <div style={{ padding: "0 12px", borderRight: "1px solid var(--border)", minWidth: 0 }}>
        <div style={head}>Spaces</div>
        <div className="jpt-scroll-thin" style={{ maxHeight: 372, overflowY: "auto", paddingRight: 4 }}>
          {SPACES.map((s) => (
            <a key={s.href} href={s.href} onClick={onClose} {...hover} className="jpt-menu-space"
              style={{ display: "flex", alignItems: "center", gap: 13, padding: "8px 10px", borderRadius: 12, textDecoration: "none", transition: "background .12s" }}>
              <SpaceTile s={s} />
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
            <ToolIcon id={iconKeyForHref(f.href)} size={32} />
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
            <Thumb pic={p.pic} grad="#F97316, #DB2777" size={34} />
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

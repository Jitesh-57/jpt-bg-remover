"use client";

import { useLayoutEffect, useState } from "react";

/**
 * The "Resources" mega menu: learn (blog, docs, guides), prompts, a featured
 * article, and a featured prompt collection in a tinted panel on the right.
 *
 * Written out here rather than read from the blog or prompt data: this ships
 * with the navbar on every page, and those modules are large.
 */

const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const pic = (slug: string) => SUPA
  ? [`url("${SUPA}/storage/v1/object/public/landing/creatives/${slug}-main.webp")`, `url("${SUPA}/storage/v1/object/public/landing/creatives/${slug}-after.webp")`, `url("${SUPA}/storage/v1/object/public/landing/creative/v2/${slug}.png")`]
  : [];

const LEARN = [
  { label: "Blog", desc: "Guides, tips and tutorials", href: "/blog" },
  { label: "Docs", desc: "How Pixel Shine works", href: "/docs" },
  { label: "Use cases", desc: "For shops, creators and teams", href: "/use-cases" },
  { label: "Alternatives", desc: "How we compare", href: "/alternatives" },
  { label: "All free tools", desc: "Edit in your browser, free", href: "/tools" },
];

const PROMPTS = [
  { label: "Prompt library", href: "/prompts" },
  { label: "Video prompts", href: "/prompts/video" },
  { label: "Nano Banana Pro prompts", href: "/nano-banana-pro-prompts" },
  { label: "GPT Image prompts", href: "/gpt-image-2-prompts" },
  { label: "Seedream 4.5 prompts", href: "/seedream-4-5-prompts" },
];

const FEATURED = {
  kicker: "Featured",
  title: "Turn a selfie into a professional headshot with AI",
  href: "/blog/ai-professional-headshot-from-selfie",
  slug: "professional-headshot",
};

const COLLAGE = ["ghibli-style", "old-hollywood-glamour", "saree-photoshoot", "3d-figurine"];

const head: React.CSSProperties = { fontSize: 11, fontWeight: 800, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 14px" };
const hover = {
  onMouseEnter: (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.background = "var(--surface-2)"; },
  onMouseLeave: (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.background = "transparent"; },
};

/** A picture drawn as layered backgrounds, so whichever creative exists shows; ends on a gradient. */
function Pic({ slug, style }: { slug: string; style?: React.CSSProperties }) {
  return (
    <span aria-hidden style={{
      display: "block", backgroundImage: [...pic(slug), "linear-gradient(135deg, #F97316, #DB2777)"].join(", "),
      backgroundSize: "cover", backgroundPosition: "center 25%", backgroundRepeat: "no-repeat", ...style,
    }} />
  );
}

function Pill({ href, label, onClose }: { href: string; label: string; onClose: () => void }) {
  return (
    <a href={href} onClick={onClose}
      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 16, padding: "11px 12px 11px 14px", borderRadius: 12, background: "var(--accent-soft)", border: "1px solid var(--accent-border)", textDecoration: "none", color: "var(--text)", fontSize: 13.5, fontWeight: 700 }}>
      {label}
      <span style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)", fontWeight: 900, flexShrink: 0 }}>›</span>
    </a>
  );
}

/**
 * Where the menu sits: under the Resources button, starting at its left edge,
 * moved left only as far as it must to stay on screen. Measured rather than
 * centred with a transform, because the pop-in animation owns `transform`.
 */
function usePlacement(anchor: HTMLElement | null) {
  const [box, setBox] = useState<{ left: number; top: number; width: number } | null>(null);
  useLayoutEffect(() => {
    const place = () => {
      const vw = document.documentElement.clientWidth;
      const width = Math.min(1080, vw - 32);
      const r = anchor?.getBoundingClientRect();
      const want = r ? r.left - 8 : (vw - width) / 2;
      setBox({ width, top: r ? r.bottom + 10 : 64, left: Math.max(16, Math.min(want, vw - width - 16)) });
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [anchor]);
  return box;
}

export default function ResourcesMenu({ onClose, anchor }: { onClose: () => void; anchor: HTMLElement | null }) {
  const box = usePlacement(anchor);
  if (!box) return null;
  return (
    <div
      className="jpt-a-pop"
      style={{
        position: "fixed", top: box.top, left: box.left, width: box.width, zIndex: 1000,
        background: "var(--bg-elevated, var(--surface))", border: "1px solid var(--border)", borderRadius: 18,
        boxShadow: "0 24px 70px rgba(0,0,0,.45)", overflow: "hidden",
        display: "grid", gridTemplateColumns: "1fr 1fr 1.25fr 1.25fr",
      }}
    >
      {/* Learn */}
      <div style={{ padding: "22px 14px 20px 22px", borderRight: "1px solid var(--border)", minWidth: 0 }}>
        <div style={head}>Learn</div>
        {LEARN.map((l) => (
          <a key={l.href} href={l.href} onClick={onClose} {...hover}
            style={{ display: "block", padding: "8px 10px", margin: "0 0 2px -10px", borderRadius: 10, textDecoration: "none", transition: "background .12s" }}>
            <span style={{ display: "block", fontSize: 14.5, fontWeight: 700, color: "var(--text)" }}>{l.label}</span>
            <span style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{l.desc}</span>
          </a>
        ))}
      </div>

      {/* Prompts */}
      <div style={{ padding: "22px 14px 20px 22px", borderRight: "1px solid var(--border)", minWidth: 0, display: "flex", flexDirection: "column" }}>
        <div style={head}>Prompts</div>
        {PROMPTS.map((p) => (
          <a key={p.href} href={p.href} onClick={onClose} {...hover}
            style={{ display: "block", padding: "9px 10px", margin: "0 0 2px -10px", borderRadius: 10, textDecoration: "none", fontSize: 14.5, fontWeight: 700, color: "var(--text)", transition: "background .12s" }}>
            {p.label}
          </a>
        ))}
        <a href="/prompts" onClick={onClose}
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: "auto", padding: "11px 12px", borderRadius: 12, background: "var(--surface-2)", border: "1px solid var(--border)", textDecoration: "none" }}>
          <span>
            <span style={{ display: "block", fontSize: 13.5, fontWeight: 800, color: "var(--text)" }}>Prompt library</span>
            <span style={{ display: "block", fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>Copy a prompt, get the look</span>
          </span>
          <span style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)", fontWeight: 900, flexShrink: 0 }}>›</span>
        </a>
      </div>

      {/* Featured article */}
      <div style={{ padding: "22px 22px 20px", borderRight: "1px solid var(--border)", minWidth: 0 }}>
        <div style={head}>From the blog</div>
        <a href={FEATURED.href} onClick={onClose} style={{ display: "block", textDecoration: "none" }}>
          <Pic slug={FEATURED.slug} style={{ width: "100%", aspectRatio: "16 / 10", borderRadius: 12, boxShadow: "inset 0 0 0 1px rgba(255,255,255,.08)" }} />
          <span style={{ display: "block", fontSize: 10.5, fontWeight: 800, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 12 }}>{FEATURED.kicker}</span>
          <span style={{ display: "block", fontSize: 15, fontWeight: 800, color: "var(--text)", lineHeight: 1.35, marginTop: 4 }}>{FEATURED.title}</span>
        </a>
        <Pill href="/blog" label="See all articles" onClose={onClose} />
      </div>

      {/* Featured prompts, tinted */}
      <div style={{ padding: "22px 22px 20px", minWidth: 0, background: "linear-gradient(160deg, var(--accent-soft), transparent 70%), var(--surface-2)" }}>
        <div style={head}>Prompt collections</div>
        <a href="/prompts" onClick={onClose} style={{ display: "block", textDecoration: "none" }}>
          <span style={{ position: "relative", display: "block", height: 150 }}>
            {COLLAGE.map((slug, i) => (
              <Pic key={slug} slug={slug} style={{
                position: "absolute", width: "38%", aspectRatio: "4 / 5", borderRadius: 10,
                left: `${[2, 24, 46, 64][i]}%`, top: [14, 0, 20, 4][i], transform: `rotate(${[-6, 3, -2, 6][i]}deg)`,
                boxShadow: "0 10px 24px rgba(0,0,0,.35)", border: "2px solid var(--surface)",
              }} />
            ))}
            <span style={{ position: "absolute", left: 0, bottom: -6, padding: "4px 9px", borderRadius: 999, background: "var(--surface)", fontSize: 11, fontWeight: 800, color: "var(--accent)", boxShadow: "0 4px 12px rgba(0,0,0,.25)" }}>✦ Ready to copy</span>
          </span>
          <span style={{ display: "block", fontSize: 10.5, fontWeight: 800, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 20 }}>Popular</span>
          <span style={{ display: "block", fontSize: 15, fontWeight: 800, color: "var(--text)", lineHeight: 1.35, marginTop: 4 }}>Trending AI photo prompts: Ghibli, vintage glamour, 3D figurines and more</span>
        </a>
        <Pill href="/prompts" label="Browse all prompts" onClose={onClose} />
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import Icon, { type IconName } from "./Icon";

/**
 * "Everything you can make" — one card per workspace, each with a small,
 * living mock-up of the tool in its banner instead of a screenshot: the studio
 * scans a photo and answers, Create types a prompt and fills a grid, the
 * editor wipes between before and after, and so on. Built from the site's
 * own pictures, so a new creative uploaded in /admin shows up here too.
 *
 * The motion is CSS only (see .jpt-mock* in globals.css), loops slowly,
 * speeds into focus on hover, and stops for reduced-motion users.
 */

/** One picture: candidate URLs, best first. `split` = a before|after image, drawn as its two halves. */
export interface Pic { srcs: string[]; split?: boolean }

export type MockKind = "studio" | "create" | "editor" | "recreate" | "headshot" | "batch" | "apps" | "photo";

export interface ShowFeature {
  kind: MockKind;
  title: string;
  /** The line on the banner, under the big title. */
  tagline: string;
  sub: string;
  href: string;
  icon: IconName;
  badge?: string;
  grad: [string, string];
  pics: Pic[];
}

/** An image that walks down its candidates on error, and leaves the gradient showing if none load. */
function Img({ pic, half, style }: { pic?: Pic; half?: "before" | "after"; style?: React.CSSProperties }) {
  const [i, setI] = useState(0);
  const src = pic?.srcs[i];
  if (!src) return null;
  const halfStyle: React.CSSProperties = pic?.split && half
    ? { width: "200%", maxWidth: "none", objectPosition: "center", transform: half === "after" ? "translateX(-50%)" : undefined }
    : {};
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setI((n) => n + 1)}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block", ...halfStyle, ...style }} />
  );
}

/** A picture in its own clipped box. */
function Frame({ pic, half, style, className }: { pic?: Pic; half?: "before" | "after"; style?: React.CSSProperties; className?: string }) {
  return (
    <span className={className} style={{ position: "relative", display: "block", overflow: "hidden", background: "linear-gradient(135deg, #2a2a36, #17171f)", ...style }}>
      <Img pic={pic} half={half} />
    </span>
  );
}

/** The little app window every mock sits in. */
function Window({ children, bar = true }: { children: React.ReactNode; bar?: boolean }) {
  return (
    <span className="jpt-mock-window">
      {bar && (
        <span className="jpt-mock-bar">
          <i style={{ background: "#FF5F57" }} /><i style={{ background: "#FEBC2E" }} /><i style={{ background: "#28C840" }} />
          <b />
        </span>
      )}
      <span style={{ position: "relative", display: "block", flex: 1, minHeight: 0 }}>{children}</span>
    </span>
  );
}

const tag: React.CSSProperties = { position: "absolute", padding: "2px 6px", borderRadius: 5, background: "rgba(10,10,14,.78)", color: "#fff", fontSize: 8, fontWeight: 700, letterSpacing: ".04em", zIndex: 3 };

/** The living mock-up of one tool, sized to its container. Also used by the homepage bento. */
export function Mock({ f }: { f: ShowFeature }) {
  const [a, b, c, d, e, g] = f.pics;
  switch (f.kind) {
    case "studio":
      return (
        <Window>
          <Frame pic={a} half="after" style={{ position: "absolute", inset: 0 }} />
          <span className="jpt-mock-scan" />
          <span className="jpt-mock-bubble" style={{ left: 8, bottom: 30 }}>Make it golden hour ✨</span>
          <span className="jpt-mock-bubble jpt-mock-bubble-ai" style={{ right: 8, bottom: 8 }}>On it, keeping your face as is</span>
        </Window>
      );
    case "create":
      return (
        <Window>
          <span style={{ position: "absolute", inset: 6, display: "flex", flexDirection: "column", gap: 5 }}>
            <span className="jpt-mock-prompt"><span className="jpt-mock-type">a perfume bottle on travertine, soft light</span></span>
            <span style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
              {[a, b, c, d].map((p, i) => <Frame key={i} pic={p} className="jpt-mock-pop" style={{ borderRadius: 5, ["--i" as string]: i }} />)}
            </span>
          </span>
        </Window>
      );
    case "editor":
      return (
        <Window>
          <Frame pic={a} half="before" style={{ position: "absolute", inset: 0 }} />
          <span className="jpt-mock-wipe"><Frame pic={a} half="after" style={{ position: "absolute", inset: 0 }} /></span>
          <span className="jpt-mock-handle" />
          <span style={{ ...tag, left: 6, top: 6 }}>BEFORE</span>
          <span style={{ ...tag, right: 6, top: 6 }}>AFTER</span>
          <span className="jpt-mock-bubble" style={{ left: 8, bottom: 8 }}>Restore and colourise</span>
        </Window>
      );
    case "recreate":
      return (
        <span className="jpt-mock-row">
          <span className="jpt-mock-card" style={{ transform: "rotate(-5deg)" }}><Frame pic={a} half="after" style={{ position: "absolute", inset: 0 }} /><span style={{ ...tag, left: 5, bottom: 5 }}>THE LOOK</span></span>
          <span className="jpt-mock-plus">
            <Frame pic={b} half="before" style={{ width: 34, height: 34, borderRadius: "50%", border: "2px solid #fff" }} />
            <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>→</span>
          </span>
          <span className="jpt-mock-card jpt-mock-glow" style={{ transform: "rotate(4deg)" }}><Frame pic={b} half="after" style={{ position: "absolute", inset: 0 }} /><span style={{ ...tag, left: 5, bottom: 5 }}>YOU</span></span>
        </span>
      );
    case "headshot":
      return (
        <Window>
          <Frame pic={a} half="before" style={{ position: "absolute", inset: 0 }} />
          <span className="jpt-mock-fade"><Frame pic={a} half="after" style={{ position: "absolute", inset: 0 }} /></span>
          <span style={{ ...tag, left: 6, top: 6 }}>SELFIE → STUDIO</span>
        </Window>
      );
    case "batch":
      return (
        <Window>
          <span style={{ position: "absolute", inset: 6, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4 }}>
            {[a, b, c, d, e, g].map((p, i) => (
              <span key={i} style={{ position: "relative", borderRadius: 5, overflow: "hidden" }}>
                <Frame pic={p} half="after" style={{ position: "absolute", inset: 0 }} />
                <span className="jpt-mock-check" style={{ ["--i" as string]: i }}>✓</span>
              </span>
            ))}
          </span>
        </Window>
      );
    case "apps":
      return (
        <span className="jpt-mock-fan">
          {[a, b, c].map((p, i) => (
            <span key={i} className="jpt-mock-card" style={{ ["--r" as string]: `${(i - 1) * 12}deg`, ["--x" as string]: `${(i - 1) * 34}%`, zIndex: i === 1 ? 2 : 1 }}>
              <Frame pic={p} half="after" style={{ position: "absolute", inset: 0 }} />
            </span>
          ))}
        </span>
      );
    case "photo":
      return (
        <Window>
          <Frame pic={a} half="after" style={{ position: "absolute", inset: "0 34% 0 0" }} />
          <span className="jpt-mock-crop" />
          <span style={{ position: "absolute", top: 8, bottom: 8, right: 6, width: "30%", display: "flex", flexDirection: "column", justifyContent: "center", gap: 9 }}>
            {["Bright", "Contrast", "Warmth"].map((l, i) => (
              <span key={l} style={{ display: "block" }}>
                <span style={{ display: "block", fontSize: 7, color: "rgba(255,255,255,.7)", marginBottom: 3 }}>{l}</span>
                <span className="jpt-mock-slider"><i style={{ ["--i" as string]: i }} /></span>
              </span>
            ))}
          </span>
        </Window>
      );
  }
}

export default function FeatureShowcase({ features }: { features: ShowFeature[] }) {
  return (
    <div className="jpt-show-grid">
      {features.map((f, i) => (
        <Link key={f.title} href={f.href} className="jpt-show-card jpt-a-up" style={{ ["--d" as string]: `${220 + i * 50}ms` }}>
          <span className="jpt-show-banner" style={{ ["--g1" as string]: f.grad[0], ["--g2" as string]: f.grad[1] }}>
            <span className="jpt-show-copy">
              <span className="jpt-show-title">{f.title}</span>
              <span className="jpt-show-tagline">{f.tagline}</span>
            </span>
            <span className="jpt-show-mock"><Mock f={f} /></span>
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px" }}>
            <span style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg, ${f.grad[0]}, ${f.grad[1]})`, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "inset 0 1px 0 rgba(255,255,255,.25)" }}>
              <Icon name={f.icon} size={17} />
            </span>
            <span style={{ minWidth: 0, flex: 1 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 14.5, fontWeight: 600, color: "var(--text)" }}>
                {f.title}
                {f.badge && <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: ".06em", color: "var(--accent)", background: "var(--accent-soft)", border: "1px solid var(--accent-border)", borderRadius: 5, padding: "1px 5px" }}>{f.badge}</span>}
              </span>
              <span style={{ display: "block", fontSize: 12.5, color: "var(--text-muted)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.sub}</span>
            </span>
            <Icon name="arrowRight" size={16} style={{ color: "var(--text-faint)" }} />
          </span>
        </Link>
      ))}
    </div>
  );
}

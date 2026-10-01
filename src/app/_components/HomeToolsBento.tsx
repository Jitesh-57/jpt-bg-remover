"use client";

import { useState } from "react";
import Link from "next/link";
import type { Pic, ShowFeature, MockKind } from "@/app/app/_components/FeatureShowcase";

/**
 * The homepage's AI tools, as a bento grid of full-bleed photo tiles.
 *
 * Deliberately not the dashboard's card style: the homepage sells the job to
 * be done, so each tile carries the name people search for ("AI Image
 * Generator", "AI Photo Editor"…) and a line on the problem it solves, and
 * opens the matching workspace in the dashboard. Pictures come from the same
 * live creatives as the dashboard (buildShowFeatures), so they stay current.
 */

const TILES: { kind: MockKind; name: string; line: string; tag: string; size: "hero" | "wide" | "tall" | "small" }[] = [
  { kind: "create",   name: "AI Image Generator",    line: "Type what you imagine and get a finished, high-res image.",  tag: "Text to image",   size: "hero" },
  { kind: "studio",   name: "AI Photo Studio",       line: "Chat your edits into place, step by step, keeping your face.", tag: "New",            size: "tall" },
  { kind: "headshot", name: "AI Headshot Generator", line: "LinkedIn-ready studio portraits from one selfie.",              tag: "Professional",   size: "small" },
  { kind: "recreate", name: "Copy Photo Style",      line: "Recreate any photo's look with your own face in it.",          tag: "Recreate",       size: "small" },
  { kind: "editor",   name: "AI Photo Editor",       line: "Change anything in a photo by describing it in one sentence.", tag: "Before → after", size: "wide" },
  { kind: "apps",     name: "AI Photo Filters",      line: "200+ one-tap looks: Ghibli, vintage, saree and more.",         tag: "One tap",        size: "wide" },
  { kind: "batch",    name: "Bulk Photo Editor",     line: "Apply one edit to up to 100 images at once.",                  tag: "Free",           size: "wide" },
  { kind: "photo",    name: "Free Photo Editor",     line: "Crop, resize, adjust and compress, all in your browser.",      tag: "Free",           size: "wide" },
];

/** An image that walks down its candidates on error, leaving the gradient if none load. */
function Img({ pic }: { pic?: Pic }) {
  const [i, setI] = useState(0);
  const src = pic?.srcs[i];
  if (!src) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setI((n) => n + 1)} className="jpt-bento-img" />;
}

export default function HomeToolsBento({ features }: { features: ShowFeature[] }) {
  const byKind = new Map(features.map((f) => [f.kind, f]));
  return (
    <div className="jpt-bento">
      {TILES.map((t) => {
        const f = byKind.get(t.kind);
        if (!f) return null;
        const pics = f.pics.filter((p) => p.srcs.length);
        return (
          <Link key={t.kind} href={f.href} className={`jpt-bento-tile jpt-bento-${t.size}`} style={{ ["--g1" as string]: f.grad[0], ["--g2" as string]: f.grad[1] }}>
            <span className={`jpt-bento-media${t.kind === "create" && pics.length >= 4 ? " jpt-bento-quad" : ""}`}>
              {t.kind === "create" && pics.length >= 4
                ? pics.slice(0, 4).map((p, i) => <span key={i} className="jpt-bento-cell"><Img pic={p} /></span>)
                : <Img pic={pics[pics.length - 1] ?? pics[0]} />}
            </span>
            <span className="jpt-bento-shade" />
            <span className="jpt-bento-tag">{t.tag}</span>
            <span className="jpt-bento-body">
              <span className="jpt-bento-name">{t.name}</span>
              <span className="jpt-bento-line">{t.line}</span>
              <span className="jpt-bento-cta">Try it <span aria-hidden>→</span></span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}

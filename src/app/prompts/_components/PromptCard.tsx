"use client";

import { useState } from "react";
import Link from "next/link";
import type { PromptCardData } from "@/lib/prompts/types";
import { trackEvent } from "@/lib/analytics";

/**
 * The card used by every grid in the library.
 *
 * Attribution is part of the card, not a decoration on it: the dataset is
 * CC BY 4.0, which makes the author line and the link to their original post
 * a condition of using it at all. There is no variant of this component
 * without them.
 */

function Frame({ src, alt, media }: { src: string | null; alt: string; media: "image" | "video" }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const show = src && !failed;
  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 10", overflow: "hidden", background: "var(--surface-2)" }}>
      {!show || !loaded ? (
        <div
          aria-hidden
          style={{
            position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
            background: "linear-gradient(140deg, var(--surface-3), var(--surface-2))",
            color: "var(--text-faint)", fontSize: 22,
          }}
        >
          {media === "video" ? "▶" : "◨"}
        </div>
      ) : null}
      {show && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover",
            opacity: loaded ? 1 : 0, transition: "opacity .3s var(--ease)",
          }}
        />
      )}
      {media === "video" && (
        <span
          aria-hidden
          style={{
            position: "absolute", left: 10, bottom: 10, background: "rgba(0,0,0,0.72)", color: "#fff",
            fontSize: 10.5, fontWeight: 800, letterSpacing: "0.08em", padding: "3px 8px", borderRadius: 999,
          }}
        >
          VIDEO
        </span>
      )}
    </div>
  );
}

export default function PromptCard({ p }: { p: PromptCardData }) {
  return (
    <article
      style={{
        display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0,
        background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16,
      }}
    >
      <Link href={p.href} style={{ display: "block", textDecoration: "none" }}>
        <Frame src={p.image} alt={p.title} media={p.media} />
      </Link>

      <div style={{ padding: "13px 15px 15px", display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8, alignItems: "center" }}>
          <Link
            href={`/${p.modelSlug}-prompts`}
            style={{
              fontSize: 10.5, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase",
              color: "var(--accent-strong)", background: "var(--accent-soft)", padding: "3px 8px",
              borderRadius: 999, textDecoration: "none",
            }}
          >
            {p.model}
          </Link>
          {p.hasVariables && (
            <span
              title="This prompt has editable placeholders"
              style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-faint)", background: "var(--surface-2)", padding: "3px 8px", borderRadius: 999 }}
            >
              Editable
            </span>
          )}
          {p.featured && (
            <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--warning, #B45309)", background: "var(--warning-soft, rgba(245,158,11,0.14))", padding: "3px 8px", borderRadius: 999 }}>
              Featured
            </span>
          )}
        </div>

        <Link
          href={p.href}
          style={{ textDecoration: "none", color: "var(--text)", fontSize: 15.5, fontWeight: 800, lineHeight: 1.3, letterSpacing: "-0.01em" }}
        >
          {p.title}
        </Link>

        <p style={{
          margin: "7px 0 0", fontSize: 12.8, lineHeight: 1.6, color: "var(--text-muted)",
          display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {p.excerpt}
        </p>

        {/* CC BY 4.0: the credit and the link to the original post are required. */}
        <div style={{ marginTop: "auto", paddingTop: 11, fontSize: 11.5, color: "var(--text-faint)", display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
          <span>Prompt by</span>
          {p.authorUrl ? (
            <a
              href={p.authorUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              onClick={() => trackEvent("prompt_author_click", { uid: p.uid })}
              style={{ color: "var(--text-muted)", fontWeight: 700, textDecoration: "none" }}
            >
              @{p.authorName}
            </a>
          ) : (
            <strong style={{ color: "var(--text-muted)", fontWeight: 700 }}>@{p.authorName}</strong>
          )}
          {p.sourceUrl && (
            <>
              <span aria-hidden>·</span>
              <a
                href={p.sourceUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                style={{ color: "var(--text-muted)", textDecoration: "underline" }}
              >
                source
              </a>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

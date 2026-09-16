"use client";

import Link from "next/link";
import SafeImage from "./SafeImage";
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
  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 10", overflow: "hidden", background: "var(--surface-2)" }}>
      <SafeImage
        src={src}
        alt={alt}
        // Cards sit in a min-270px auto-fill grid, so a card is never wider
        // than about 400px on a phone and 340px in the grid. Telling the
        // optimiser that is the difference between serving a 320px file and a
        // 1920px one.
        sizes="(max-width: 700px) 92vw, 340px"
        placeholder={
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
        }
      />
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

        {/*
          Generate on the card routes to the prompt's own page with ?generate=1
          rather than starting here.

          The card has an excerpt, not the prompt — some of these are 22,000
          characters and a grid of 254 would be a megabyte of invisible text.
          The detour is also the better order: the reader sees the prompt and
          fills in its placeholders before a credit is spent. Video prompts get
          no button; there is no video generation on this site.
        */}
        {p.media === "image" && (
          <Link
            href={`${p.href}?generate=1`}
            onClick={() => trackEvent("prompt_card_generate", { uid: p.uid })}
            style={{
              display: "block", textAlign: "center", marginTop: 11, padding: "8px 12px",
              borderRadius: 9, fontSize: 13, fontWeight: 700, textDecoration: "none",
              background: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border-strong)",
            }}
          >
            Generate this →
          </Link>
        )}

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

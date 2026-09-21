"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  PROMPTS, CATEGORIES, PLATFORMS, CATEGORY_BY_ID, PLATFORM_BY_ID,
  searchPrompts, type LibraryPrompt, type CategoryId, type PlatformId,
} from "@/lib/prompt-library";
import { trackEvent } from "@/lib/analytics";
import GenerateButton from "./_components/GenerateButton";
import Pagination from "./_components/Pagination";

/** Matches the dataset listings — one page size for every listing on the site. */
export const LIBRARY_PAGE_SIZE = 48;

/**
 * PromptLibrary — the browsing half of /prompts.
 *
 * Filtering happens in the browser over an array that ships with the page.
 * At this size that is instant and needs no API, and it means a search result
 * is a real page state rather than a round trip.
 */

type Props = {
  /** prompt id → example image URL, resolved server-side from the bucket. */
  images: Record<string, string>;
  /** The server-computed page for the default, untouched view. */
  page?: number;
};

const ALL = "all" as const;

/** A card's fallback picture. Varied by index so the grid is not one flat block. */
function Placeholder({ p }: { p: LibraryPrompt }) {
  const n = parseInt(p.id.replace(/\D/g, ""), 10) || 1;
  const hue = (n * 47) % 360;
  const cat = CATEGORY_BY_ID[p.category];
  return (
    <div
      aria-hidden
      style={{
        position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 8,
        background: `linear-gradient(150deg, hsl(${hue} 60% 22%), var(--surface-2) 58%, hsl(${(hue + 55) % 360} 55% 20%))`,
      }}
    >
      <div style={{ fontSize: 30 }}>{cat.emoji}</div>
      <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
        {p.ratio}
      </div>
    </div>
  );
}

function CardImage({ p, src }: { p: LibraryPrompt; src?: string }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: "4 / 3", overflow: "hidden", background: "var(--surface-2)" }}>
      {(!loaded || failed || !src) && <Placeholder p={p} />}
      {src && !failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={`${p.title} — example result`}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover",
            opacity: loaded ? 1 : 0, transition: "opacity .35s var(--ease)",
          }}
        />
      )}
    </div>
  );
}

export function CopyPromptButton({
  prompt, full = false, label = "Copy prompt",
}: { prompt: LibraryPrompt; full?: boolean; label?: string }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt.text);
      setDone(true);
      trackEvent("library_prompt_copied", { prompt: prompt.slug, category: prompt.category });
      setTimeout(() => setDone(false), 1600);
    } catch {
      /* clipboard blocked — the text is on the page to select by hand */
    }
  };
  return (
    <button
      onClick={copy}
      aria-live="polite"
      style={{
        cursor: "pointer", fontFamily: "inherit", border: "none", borderRadius: 9,
        width: full ? "100%" : undefined, flex: full ? undefined : 1,
        padding: full ? "13px 16px" : "9px 12px",
        fontSize: full ? 15 : 13, fontWeight: 800,
        background: done ? "var(--success-soft)" : "var(--grad-strong)",
        color: done ? "var(--success)" : "#fff",
        boxShadow: done ? "none" : "var(--glow)",
        transition: "background .2s var(--ease)",
      }}
    >
      {done ? "✓ Copied" : label}
    </button>
  );
}

/**
 * The originals' Generate button.
 *
 * Wraps the same component the licensed library uses, so a reader gets the
 * same flow whichever collection they came from: a photo prompt asks for the
 * photo first, a generation prompt goes straight through, and the editor picks
 * up the sign-in and credit decisions at the other end.
 */
export function UseInEditorButton({ prompt, full = false }: { prompt: LibraryPrompt; full?: boolean }) {
  return (
    <GenerateButton
      uid={prompt.slug}
      prompt={prompt.text}
      needsPhoto={prompt.needsPhoto}
      full={full}
      label="Generate this →"
    />
  );
}

function Chip({
  on, onClick, children, title,
}: { on: boolean; onClick: () => void; children: React.ReactNode; title?: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-pressed={on}
      style={{
        cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
        padding: "8px 14px", borderRadius: 999, fontSize: 13.5, fontWeight: 700,
        background: on ? "var(--accent-soft)" : "var(--surface)",
        color: on ? "var(--accent-strong)" : "var(--text-muted)",
        border: `1px solid ${on ? "var(--accent-border)" : "var(--border)"}`,
      }}
    >
      {children}
    </button>
  );
}

function PromptCard({ p, img }: { p: LibraryPrompt; img?: string }) {
  const cat = CATEGORY_BY_ID[p.category];
  return (
    <article
      style={{
        display: "flex", flexDirection: "column", overflow: "hidden",
        background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16,
      }}
    >
      <Link href={`/prompts/${p.slug}`} style={{ textDecoration: "none", display: "block" }}>
        <CardImage p={p} src={img} />
      </Link>

      <div style={{ padding: "14px 15px 15px", display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 9 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: "var(--accent-strong)", background: "var(--accent-soft)", padding: "3px 8px", borderRadius: 999 }}>
            {cat.emoji} {cat.name}
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-faint)", background: "var(--surface-2)", padding: "3px 8px", borderRadius: 999 }}>
            {p.ratio}
          </span>
          {!p.needsPhoto && (
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-faint)", background: "var(--surface-2)", padding: "3px 8px", borderRadius: 999 }}>
              No photo needed
            </span>
          )}
        </div>

        <Link
          href={`/prompts/${p.slug}`}
          style={{ textDecoration: "none", color: "var(--text)", fontSize: 16, fontWeight: 800, lineHeight: 1.3, letterSpacing: "-0.01em" }}
        >
          {p.title}
        </Link>

        <p style={{
          margin: "8px 0 0", fontSize: 13, lineHeight: 1.6, color: "var(--text-muted)",
          display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {p.text}
        </p>

        {p.platforms.length > 0 && (
          <div style={{ marginTop: 10, fontSize: 11.5, color: "var(--text-faint)", fontWeight: 600 }}>
            {p.platforms.map((id) => PLATFORM_BY_ID[id].name).join(" · ")}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 13 }}>
          <CopyPromptButton prompt={p} />
          <UseInEditorButton prompt={p} />
        </div>
      </div>
    </article>
  );
}

export default function PromptLibrary({ images, page = 1 }: Props) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<CategoryId | typeof ALL>(ALL);
  const [plat, setPlat] = useState<PlatformId | typeof ALL>(ALL);
  /** Grows on "Show more", once a filter is touched. */
  const [shown, setShown] = useState(LIBRARY_PAGE_SIZE);

  // Read the filters back out of the URL so a filtered view can be shared.
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const c = sp.get("c"); const p = sp.get("p"); const s = sp.get("q");
    if (c && CATEGORIES.some((x) => x.id === c)) setCat(c as CategoryId);
    if (p && PLATFORMS.some((x) => x.id === p)) setPlat(p as PlatformId);
    if (s) setQ(s);
  }, []);

  const syncUrl = useCallback((next: { q?: string; c?: string; p?: string }) => {
    const sp = new URLSearchParams(window.location.search);
    for (const [k, v] of Object.entries(next)) {
      if (!v || v === ALL) sp.delete(k); else sp.set(k, v);
    }
    const qs = sp.toString();
    // replaceState, not push: filtering is not a navigation and should not
    // fill the back button with every keystroke.
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, []);

  /*
    Untouched search/filters means this is the default view, which is the one
    that has to match what the server put at this URL — real pagination, real
    hrefs. The moment a filter is touched it is a browse session with no URL
    of its own, so it falls back to the growing "Show more" list over the
    matches, same as it always did.
  */
  const touched = q.trim() !== "" || cat !== ALL || plat !== ALL;

  const filtered = useMemo(() => {
    if (!touched) return PROMPTS;
    let out = searchPrompts(q);
    if (cat !== ALL) out = out.filter((p) => p.category === cat);
    if (plat !== ALL) out = out.filter((p) => p.platforms.includes(plat));
    return out;
  }, [touched, q, cat, plat]);

  useEffect(() => { setShown(LIBRARY_PAGE_SIZE); }, [q, cat, plat]);

  const totalPages = Math.max(1, Math.ceil(PROMPTS.length / LIBRARY_PAGE_SIZE));
  const visible = touched
    ? filtered.slice(0, shown)
    : PROMPTS.slice((page - 1) * LIBRARY_PAGE_SIZE, page * LIBRARY_PAGE_SIZE);
  const results = touched ? filtered : PROMPTS;

  return (
    <>
      {/* ── Controls ─────────────────────────────────────────────────────── */}
      <div style={{ position: "sticky", top: 0, zIndex: 5, background: "var(--bg)", paddingTop: 10, paddingBottom: 14, borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 24px" }}>
          <label htmlFor="prompt-search" className="jpt-sr-only" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
            Search prompts
          </label>
          <input
            id="prompt-search"
            type="search"
            value={q}
            onChange={(e) => { setQ(e.target.value); syncUrl({ q: e.target.value }); }}
            placeholder={`Search ${PROMPTS.length} prompts — "thumbnail", "headshot", "film", "product"…`}
            style={{
              width: "100%", padding: "13px 16px", borderRadius: 12, fontFamily: "inherit",
              fontSize: 15, fontWeight: 600, background: "var(--surface)", color: "var(--text)",
              border: "1px solid var(--border-strong)",
            }}
          />

          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingTop: 12, paddingBottom: 2, scrollbarWidth: "thin" }}>
            <Chip on={cat === ALL} onClick={() => { setCat(ALL); syncUrl({ c: "" }); }}>All</Chip>
            {CATEGORIES.map((c) => (
              <Chip key={c.id} on={cat === c.id} onClick={() => { setCat(c.id); syncUrl({ c: c.id }); }} title={c.blurb}>
                {c.emoji} {c.name}
              </Chip>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingTop: 8, alignItems: "center" }}>
            <span style={{ fontSize: 11.5, fontWeight: 800, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap", paddingRight: 2 }}>
              Made for
            </span>
            <Chip on={plat === ALL} onClick={() => { setPlat(ALL); syncUrl({ p: "" }); }}>Anywhere</Chip>
            {PLATFORMS.map((p) => (
              <Chip key={p.id} on={plat === p.id} onClick={() => { setPlat(p.id); syncUrl({ p: p.id }); }} title={p.note}>
                {p.name}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      {/* ── Results ──────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "22px 24px 60px" }}>
        <div style={{ fontSize: 13.5, color: "var(--text-muted)", fontWeight: 600, marginBottom: 16 }}>
          {results.length === PROMPTS.length
            ? `${PROMPTS.length} prompts`
            : `${results.length} of ${PROMPTS.length} prompts`}
          {plat !== ALL && <> · sized for {PLATFORM_BY_ID[plat].name} ({PLATFORM_BY_ID[plat].note})</>}
        </div>

        {results.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16 }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🔍</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text)", marginBottom: 6 }}>Nothing matches that</div>
            <p style={{ fontSize: 14, color: "var(--text-muted)", margin: "0 0 16px" }}>
              Try a shorter word, or clear the filters.
            </p>
            <button
              onClick={() => { setQ(""); setCat(ALL); setPlat(ALL); syncUrl({ q: "", c: "", p: "" }); }}
              style={{ cursor: "pointer", fontFamily: "inherit", padding: "10px 18px", borderRadius: 999, border: "none", background: "var(--grad-strong)", color: "#fff", fontWeight: 800, fontSize: 14 }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(300px, 100%), 1fr))", gap: 18 }}>
              {visible.map((p) => <PromptCard key={p.id} p={p} img={images[p.id]} />)}
            </div>

            {touched ? (
              shown < results.length && (
                <div style={{ textAlign: "center", marginTop: 28 }}>
                  <button
                    onClick={() => setShown((n) => n + LIBRARY_PAGE_SIZE)}
                    style={{
                      cursor: "pointer", fontFamily: "inherit", padding: "13px 26px", borderRadius: 999,
                      background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border-strong)",
                      fontWeight: 800, fontSize: 14.5,
                    }}
                  >
                    Show {Math.min(LIBRARY_PAGE_SIZE, results.length - shown)} more
                  </button>
                </div>
              )
            ) : (
              <Pagination basePath="/prompts/originals" page={page} totalPages={totalPages} totalItems={PROMPTS.length} itemLabel="prompts" />
            )}
          </>
        )}
      </div>
    </>
  );
}

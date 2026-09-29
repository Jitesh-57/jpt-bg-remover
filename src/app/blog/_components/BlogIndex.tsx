import Link from "next/link";
import { editedPosts } from "@/lib/blog-edits.server";
import BlogCover from "./BlogCover";
import { mainsFrom } from "@/lib/blog-images";
import { readOverrides } from "@/lib/overrides";

// Badge fills sit under white text, so they use --accent-fill (dark enough for
// white) rather than --accent (which is tuned to read as text on near-black).
const CATEGORY_COLORS: Record<string, string> = {
  Tutorial: "var(--accent-fill)",
  Guide: "var(--accent-fill)",
  News: "var(--accent-fill)",
};

/** Posts per page of the blog index. */
export const PER_PAGE = 12;

/** How many pages the blog index has right now (hidden posts don't count). */
export async function blogPageCount(): Promise<number> {
  return Math.max(1, Math.ceil((await editedPosts()).length / PER_PAGE));
}

/** One page of the blog index: /blog is page 1, /blog/page/2 onwards the rest. */
export default async function BlogIndex({ page }: { page: number }) {
  const [overrides, all] = await Promise.all([readOverrides(), editedPosts()]);
  const mains = mainsFrom(overrides.pages);
  const pages = Math.max(1, Math.ceil(all.length / PER_PAGE));
  const POSTS = all.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  return (
    <main style={{ background: "var(--surface-2)", minHeight: "100vh", padding: "60px 24px 80px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: page > 1 ? 40 : 56 }}>
          <div style={{ display: "inline-block", background: "var(--accent-soft)", color: "var(--accent)", border: "1px solid var(--accent-border)", borderRadius: 100, padding: "5px 14px", fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 16 }}>
            Blog
          </div>
          <h1 style={{ margin: "0 0 14px", fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 900, color: "var(--text)", letterSpacing: "-0.8px", lineHeight: 1.15 }}>
            Image Upscaling Tips & Tutorials
          </h1>
          {page > 1 && <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-faint)", margin: "-4px 0 12px" }}>Page {page} of {pages}</div>}
          <p style={{ margin: 0, fontSize: 18, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 540, marginLeft: "auto", marginRight: "auto" }}>
            Step-by-step guides on upscaling images, enhancing photo quality, fixing blurry pictures, and getting print-ready resolution — all free.
          </p>
        </div>

        {/* Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(480px, 100%), 1fr))", gap: 28 }}>
          {POSTS.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} style={{ textDecoration: "none" }}>
              <article className="jpt-hover" style={{ background: "var(--surface)", borderRadius: 18, border: "1px solid #E8EAF0", overflow: "hidden", boxShadow: "0 2px 14px rgba(0,0,0,0.04)", cursor: "pointer" }}>
                <BlogCover post={post} mains={mains} height={200} sizes="(max-width: 768px) 100vw, 540px" />
                <div style={{ padding: "24px 28px 28px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <span style={{ background: CATEGORY_COLORS[post.category] || "var(--accent-fill)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, letterSpacing: 0.5 }}>
                      {post.category}
                    </span>
                  </div>
                  <h2 style={{ margin: "0 0 10px", fontSize: 20, fontWeight: 800, color: "var(--text)", lineHeight: 1.3, letterSpacing: "-0.3px" }}>
                    {post.title}
                  </h2>
                  <p style={{ margin: "0 0 16px", fontSize: 14, color: "var(--text-muted)", lineHeight: 1.65 }}>
                    {post.excerpt}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", gap: 12, fontSize: 12, color: "var(--text-faint)" }}>
                      <span>{new Date(post.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                      <span>·</span>
                      <span>{post.readTime}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>Read more →</span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>

        <Pager page={page} pages={pages} />
      </div>
    </main>
  );
}

const pageHref = (n: number) => (n <= 1 ? "/blog" : `/blog/page/${n}`);

/** Which page numbers to show: always the first and last, and two either side of the current one. */
function pageList(page: number, pages: number): (number | "…")[] {
  const keep = new Set([1, pages, page - 2, page - 1, page, page + 1, page + 2].filter((n) => n >= 1 && n <= pages));
  const sorted = Array.from(keep).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) out.push(n - sorted[i - 1] === 2 ? n - 1 : "…");
    out.push(n);
  });
  return out;
}

function Pager({ page, pages }: { page: number; pages: number }) {
  if (pages <= 1) return null;
  const box: React.CSSProperties = {
    minWidth: 42, height: 42, padding: "0 12px", borderRadius: 12, display: "inline-flex", alignItems: "center", justifyContent: "center",
    fontSize: 14.5, fontWeight: 800, textDecoration: "none", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)",
    fontVariantNumeric: "tabular-nums",
  };
  const on: React.CSSProperties = { background: "var(--grad-strong)", color: "#fff", borderColor: "transparent", boxShadow: "var(--glow)" };
  const off: React.CSSProperties = { opacity: 0.4, pointerEvents: "none" };
  return (
    <nav aria-label="Blog pages" style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 48 }}>
      {page > 1 ? <Link href={pageHref(page - 1)} rel="prev" className="jpt-hover" style={box}>← Prev</Link> : <span style={{ ...box, ...off }}>← Prev</span>}
      {pageList(page, pages).map((n, i) =>
        n === "…" ? (
          <span key={`gap-${i}`} style={{ ...box, border: "none", background: "none", minWidth: 20, padding: 0, color: "var(--text-faint)" }}>…</span>
        ) : (
          <Link key={n} href={pageHref(n)} aria-current={n === page ? "page" : undefined} className={n === page ? undefined : "jpt-hover"} style={{ ...box, ...(n === page ? on : {}) }}>
            {n}
          </Link>
        ),
      )}
      {page < pages ? <Link href={pageHref(page + 1)} rel="next" className="jpt-hover" style={box}>Next →</Link> : <span style={{ ...box, ...off }}>Next →</span>}
    </nav>
  );
}

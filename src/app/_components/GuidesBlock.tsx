import Link from "next/link";
import { guidesForPath } from "@/lib/blog-links";
import { TOPIC_BY_SLUG, topicOf, topicHref } from "@/lib/blog-topics";

/**
 * "Guides" on a tool page: the blog posts written for this tool, so each tool
 * page links into the blog as well as the other way round (lib/blog-links).
 *
 * A server component — it reads the blog data, which must not reach the
 * browser. Client pages such as LandingPage take it as a prop.
 */
export default function GuidesBlock({ path, n = 4 }: { path: string; n?: number }) {
  const posts = guidesForPath(path, n);
  if (!posts.length) return null;
  const topic = TOPIC_BY_SLUG[topicOf(posts[0])];
  return (
    <section style={{ padding: "56px 24px 8px", background: "var(--surface)" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", margin: 0, letterSpacing: "-0.02em" }}>Guides</h2>
          {topic && (
            <Link href={topicHref(topic)} style={{ fontSize: 14, fontWeight: 700, color: "var(--accent)", textDecoration: "none" }}>
              All {topic.name.toLowerCase()} guides →
            </Link>
          )}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))", gap: 14 }}>
          {posts.map((p) => (
            <Link key={p.slug} href={`/blog/${p.slug}`} className="jpt-hover"
              style={{ display: "block", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 16px 14px", textDecoration: "none" }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", lineHeight: 1.35 }}>{p.title}</div>
              <div style={{ fontSize: 12.5, color: "var(--text-faint)", marginTop: 8 }}>{p.readTime}</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

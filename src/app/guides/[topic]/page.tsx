import { brandedTitle } from "@/lib/seo/title";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { editedPosts } from "@/lib/blog-edits.server";
import { BLOG_TOPICS, TOPIC_BY_SLUG, topicOf, topicHref } from "@/lib/blog-topics";
import { blogIndexable } from "@/lib/seo/index-policy";

/**
 * /guides/{topic} — a topic hub: every blog post on one subject, linked from
 * one page that is itself linked from the footer and every post on the topic.
 * See lib/blog-topics.
 */

export const revalidate = 300;

const BASE = "https://www.sjpt.io";

export function generateStaticParams() {
  return BLOG_TOPICS.map((t) => ({ topic: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ topic: string }> }): Promise<Metadata> {
  const { topic } = await params;
  const t = TOPIC_BY_SLUG[topic];
  if (!t) return {};
  const url = `${BASE}${topicHref(t)}`;
  return {
    title: { absolute: brandedTitle(`${t.title} | Pixel Shine`) },
    description: t.description,
    alternates: { canonical: url },
    openGraph: { title: t.title, description: t.description, url, type: "website", siteName: "Pixel Shine" },
  };
}

export default async function TopicHub({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = await params;
  const t = TOPIC_BY_SLUG[topic];
  if (!t) notFound();

  // The longest, most complete guides first; every post on the topic is listed.
  const posts = (await editedPosts())
    .filter((p) => topicOf(p) === t.slug)
    .sort((a, b) => Number(blogIndexable(b)) - Number(blogIndexable(a)) || (a.date < b.date ? 1 : -1));
  const url = `${BASE}${topicHref(t)}`;

  const ld = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: t.title,
      description: t.description,
      url,
      mainEntity: {
        "@type": "ItemList",
        itemListElement: posts.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: `${BASE}/blog/${p.slug}`, name: p.title })),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: BASE },
        { "@type": "ListItem", position: 2, name: "Guides", item: `${BASE}/guides` },
        { "@type": "ListItem", position: 3, name: t.name, item: url },
      ],
    },
  ];

  return (
    <main style={{ background: "var(--surface-2)", minHeight: "100vh", padding: "48px 24px 80px" }}>
      {ld.map((x, i) => <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(x) }} />)}
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <nav aria-label="Breadcrumb" style={{ fontSize: 13, color: "var(--text-faint)", marginBottom: 24 }}>
          <Link href="/" style={{ color: "var(--text-faint)", textDecoration: "none" }}>Home</Link>
          {" / "}
          <Link href="/guides" style={{ color: "var(--text-faint)", textDecoration: "none" }}>Guides</Link>
          {" / "}
          <span style={{ color: "var(--text-muted)" }}>{t.name}</span>
        </nav>

        <h1 style={{ margin: "0 0 14px", fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 900, color: "var(--text)", letterSpacing: "-0.6px", lineHeight: 1.15, textWrap: "balance" }}>
          {t.title}
        </h1>
        <p style={{ margin: "0 0 22px", fontSize: 17, color: "var(--text-muted)", lineHeight: 1.7, maxWidth: 700 }}>{t.intro}</p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 36 }}>
          {t.tools.map((tool) => (
            <Link key={tool.href} href={tool.href}
              style={{ fontSize: 14, fontWeight: 800, color: "#fff", background: "var(--accent-fill)", borderRadius: 999, padding: "10px 18px", textDecoration: "none" }}>
              {tool.label} →
            </Link>
          ))}
        </div>

        <h2 style={{ fontSize: 13, fontWeight: 800, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 14px" }}>
          {posts.length} {posts.length === 1 ? "guide" : "guides"}
        </h2>
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 12 }}>
          {posts.map((p) => (
            <li key={p.slug}>
              <Link href={`/blog/${p.slug}`} className="jpt-hover"
                style={{ display: "block", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 18px", textDecoration: "none" }}>
                <div style={{ fontSize: 16.5, fontWeight: 800, color: "var(--text)", lineHeight: 1.35 }}>{p.title}</div>
                <div style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6, marginTop: 6 }}>{p.excerpt}</div>
                <div style={{ fontSize: 12.5, color: "var(--text-faint)", marginTop: 8 }}>{p.readTime}</div>
              </Link>
            </li>
          ))}
        </ul>

        <div style={{ marginTop: 40, fontSize: 14, color: "var(--text-muted)" }}>
          More topics:{" "}
          {BLOG_TOPICS.filter((x) => x.slug !== t.slug).map((x, i) => (
            <span key={x.slug}>
              {i > 0 && " · "}
              <Link href={topicHref(x)} style={{ color: "var(--accent)", fontWeight: 700, textDecoration: "none" }}>{x.name}</Link>
            </span>
          ))}
        </div>
      </div>
    </main>
  );
}

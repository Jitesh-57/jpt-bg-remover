import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { POSTS, getPost } from "../_data/posts";

export async function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: post.metaTitle,
    description: post.metaDescription,
    keywords: post.keywords,
    alternates: { canonical: `https://www.sjpt.io/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.metaDescription,
      type: "article",
      publishedTime: post.date,
      siteName: "JPT AI",
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.metaDescription,
    },
  };
}

function renderBody(body: string) {
  const lines = body.split("\n").filter(Boolean);
  return lines.map((line, i) => {
    if (line.startsWith("**") && line.endsWith("**")) {
      return <strong key={i} style={{ display: "block", marginTop: 18, marginBottom: 4, color: "#111", fontWeight: 800 }}>{line.replace(/\*\*/g, "")}</strong>;
    }
    // inline bold
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={i} style={{ margin: "0 0 14px", fontSize: 16, color: "#444", lineHeight: 1.75 }}>
        {parts.map((part, j) =>
          part.startsWith("**") && part.endsWith("**")
            ? <strong key={j} style={{ color: "#222", fontWeight: 700 }}>{part.replace(/\*\*/g, "")}</strong>
            : part
        )}
      </p>
    );
  });
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const url = `https://www.sjpt.io/blog/${post.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.metaDescription,
    datePublished: post.date,
    dateModified: post.date,
    image: post.image ? [post.image] : undefined,
    author: { "@type": "Organization", name: "JPT AI", url: "https://www.sjpt.io" },
    publisher: {
      "@type": "Organization",
      name: "JPT AI",
      url: "https://www.sjpt.io",
      logo: { "@type": "ImageObject", url: "https://www.sjpt.io/logo.png" },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    keywords: post.keywords.join(", "),
  };

  // Breadcrumb rich result
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.sjpt.io" },
      { "@type": "ListItem", position: 2, name: "Blog", item: "https://www.sjpt.io/blog" },
      { "@type": "ListItem", position: 3, name: post.title, item: url },
    ],
  };

  // FAQ rich result — parse a "Frequently Asked Questions" section into Q&A pairs.
  // Format in body: lines of "**Question?**\nAnswer" separated by blank lines.
  const faqSection = post.sections.find((s) => /frequently asked questions|faqs?\b/i.test(s.heading || ""));
  const faqPairs: { q: string; a: string }[] = [];
  if (faqSection) {
    const blocks = faqSection.body.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
    for (const block of blocks) {
      const m = block.match(/^\*\*(.+?)\*\*\s*\n?([\s\S]*)$/);
      if (m) {
        const q = m[1].trim();
        const a = m[2].replace(/\*\*/g, "").trim();
        if (q && a) faqPairs.push({ q, a });
      }
    }
  }
  const faqLd = faqPairs.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqPairs.map((p) => ({
          "@type": "Question",
          name: p.q,
          acceptedAnswer: { "@type": "Answer", text: p.a },
        })),
      }
    : null;

  // Related posts — same category first, then fill with others. Internal linking.
  const related = [
    ...POSTS.filter((p) => p.slug !== post.slug && p.category === post.category),
    ...POSTS.filter((p) => p.slug !== post.slug && p.category !== post.category),
  ].slice(0, 3);

  const CATEGORY_COLORS: Record<string, string> = {
    Tutorial: "#6366F1",
    Guide: "#7C3AED",
    News: "#0EA5E9",
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />}

      <main style={{ background: "#F8F9FC", minHeight: "100vh", padding: "48px 24px 80px" }}>
        <div style={{ maxWidth: 780, margin: "0 auto" }}>

          {/* Breadcrumb */}
          <div style={{ fontSize: 13, color: "#999", marginBottom: 28 }}>
            <Link href="/" style={{ color: "#999", textDecoration: "none" }}>Home</Link>
            {" / "}
            <Link href="/blog" style={{ color: "#999", textDecoration: "none" }}>Blog</Link>
            {" / "}
            <span style={{ color: "#555" }}>{post.title}</span>
          </div>

          {/* Article header */}
          <article>
            <div style={{ marginBottom: 20 }}>
              <span style={{ background: CATEGORY_COLORS[post.category] || "#6366F1", color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20, letterSpacing: 0.5 }}>
                {post.category}
              </span>
            </div>
            <h1 style={{ margin: "0 0 18px", fontSize: "clamp(26px, 4vw, 38px)", fontWeight: 900, color: "#111", lineHeight: 1.18, letterSpacing: "-0.6px" }}>
              {post.title}
            </h1>
            <div style={{ display: "flex", gap: 16, fontSize: 13, color: "#888", marginBottom: 36, flexWrap: "wrap" as const }}>
              <span>By JPT AI Team</span>
              <span>·</span>
              <span>{new Date(post.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span>
              <span>·</span>
              <span>{post.readTime}</span>
            </div>

            {/* Hero image */}
            {post.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.image} alt={post.title} style={{ width: "100%", height: 360, objectFit: "cover", borderRadius: 16, marginBottom: 32, display: "block" }} loading="eager" />
            )}

            {/* Intro box */}
            <div style={{ background: "linear-gradient(135deg, #EEF2FF, #F5F3FF)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 14, padding: "20px 24px", marginBottom: 40 }}>
              <p style={{ margin: 0, fontSize: 17, color: "#333", lineHeight: 1.7, fontStyle: "italic" }}>
                {post.excerpt}
              </p>
            </div>

            {/* Content sections */}
            {post.sections.map((section, i) => (
              <div key={i} style={{ marginBottom: 36 }}>
                {section.heading && (
                  <h2 style={{ margin: "0 0 16px", fontSize: 22, fontWeight: 800, color: "#111", letterSpacing: "-0.3px", ...(i > 0 ? { borderTop: "1px solid #EAECF0", paddingTop: 28 } : {}) }}>
                    {section.heading}
                  </h2>
                )}
                {renderBody(section.body)}
              </div>
            ))}
          </article>

          {/* CTA section */}
          <div style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", borderRadius: 20, padding: "40px 36px", textAlign: "center" as const, marginTop: 20 }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#fff", marginBottom: 12, letterSpacing: "-0.4px" }}>
              Ready to try it yourself?
            </div>
            <p style={{ margin: "0 0 24px", fontSize: 16, color: "rgba(255,255,255,0.88)", lineHeight: 1.6 }}>
              Free to start — no credit card required.
            </p>
            <Link href={post.toolHref} style={{ display: "inline-block", background: "#fff", color: "#6366F1", borderRadius: 12, padding: "13px 28px", fontSize: 15, fontWeight: 800, textDecoration: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
              {post.toolLabel}
            </Link>
          </div>

          {/* Related articles — internal linking for SEO + engagement */}
          {related.length > 0 && (
            <div style={{ marginTop: 56 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111", margin: "0 0 24px", letterSpacing: "-0.3px" }}>
                Related articles
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 18 }}>
                {related.map((r) => (
                  <Link key={r.slug} href={`/blog/${r.slug}`} style={{ textDecoration: "none", display: "block", background: "#fff", border: "1px solid #EAECF0", borderRadius: 14, overflow: "hidden" }}>
                    {r.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.image} alt={r.title} style={{ width: "100%", height: 120, objectFit: "cover", display: "block" }} loading="lazy" />
                    )}
                    <div style={{ padding: "14px 16px" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: CATEGORY_COLORS[r.category] || "#6366F1", letterSpacing: 0.4 }}>{r.category}</span>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#111", lineHeight: 1.35, marginTop: 6 }}>{r.title}</div>
                      <div style={{ fontSize: 12, color: "#999", marginTop: 8 }}>{r.readTime}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Back to blog */}
          <div style={{ textAlign: "center" as const, marginTop: 36 }}>
            <Link href="/blog" style={{ color: "#6366F1", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>
              ← Back to all articles
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}

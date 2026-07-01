import type { Metadata } from "next";
import Link from "next/link";
import { POSTS } from "./_data/posts";
import BlogImageFiller from "./BlogImageFiller";

export const metadata: Metadata = {
  title: "AI Image Editing Blog — Tips, Tutorials & Guides | JPT AI",
  description:
    "Learn how to remove backgrounds, upscale images, generate AI headshots, and edit photos with text prompts. Tutorials and guides from the JPT AI team.",
  keywords: [
    "ai image editing",
    "remove background tutorial",
    "ai photo editing guide",
    "image upscaler tips",
    "ai headshot guide",
  ],
  alternates: { canonical: "https://www.sjpt.io/blog" },
  openGraph: {
    title: "AI Image Editing Blog | JPT AI",
    description: "Tutorials, guides and tips for AI-powered image editing.",
    type: "website",
  },
};

const CATEGORY_COLORS: Record<string, string> = {
  Tutorial: "#6366F1",
  Guide: "#7C3AED",
  News: "#0EA5E9",
};

export default function BlogIndexPage() {
  return (
    <main style={{ background: "#F8F9FC", minHeight: "100vh", padding: "60px 24px 80px" }}>
      <BlogImageFiller />
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ display: "inline-block", background: "rgba(99,102,241,0.1)", color: "#6366F1", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 100, padding: "5px 14px", fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 16 }}>
            Blog
          </div>
          <h1 style={{ margin: "0 0 14px", fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 900, color: "#111", letterSpacing: "-0.8px", lineHeight: 1.15 }}>
            AI Image Editing Tips & Tutorials
          </h1>
          <p style={{ margin: 0, fontSize: 18, color: "#555", lineHeight: 1.6, maxWidth: 540, marginLeft: "auto", marginRight: "auto" }}>
            Step-by-step guides on removing backgrounds, upscaling photos, generating headshots, and editing images with AI.
          </p>
        </div>

        {/* Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(480px, 1fr))", gap: 28 }}>
          {POSTS.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} style={{ textDecoration: "none" }}>
              <article style={{ background: "#fff", borderRadius: 18, border: "1px solid #E8EAF0", overflow: "hidden", boxShadow: "0 2px 14px rgba(0,0,0,0.04)", cursor: "pointer" }}>
                {post.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.image} alt={post.title} style={{ width: "100%", height: 200, objectFit: "cover", display: "block" }} loading="lazy" />
                )}
                <div style={{ padding: "24px 28px 28px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <span style={{ background: CATEGORY_COLORS[post.category] || "#6366F1", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, letterSpacing: 0.5 }}>
                      {post.category}
                    </span>
                  </div>
                  <h2 style={{ margin: "0 0 10px", fontSize: 20, fontWeight: 800, color: "#111", lineHeight: 1.3, letterSpacing: "-0.3px" }}>
                    {post.title}
                  </h2>
                  <p style={{ margin: "0 0 16px", fontSize: 14, color: "#555", lineHeight: 1.65 }}>
                    {post.excerpt}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#999" }}>
                      <span>{new Date(post.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                      <span>·</span>
                      <span>{post.readTime}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#6366F1" }}>Read more →</span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

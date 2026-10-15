import { seoMeta } from "@/lib/seo/brand";
import { brandedTitle } from "@/lib/seo/title";
import type { Metadata } from "next";
import Link from "next/link";
import { editedPosts } from "@/lib/blog-edits.server";
import { BLOG_TOPICS, topicOf, topicHref } from "@/lib/blog-topics";
import { blogIndexable } from "@/lib/seo/index-policy";

/** /guides — every topic hub, with its strongest guides. */

export const revalidate = 300;

const BASE = "https://www.sjpt.io";

export const metadata: Metadata = seoMeta({
  title: { absolute: brandedTitle("Photo Editing Guides by Topic | Pixel Shine") },
  description: "Free guides to upscaling, background removal, headshots, restoring old photos, resizing, converting and AI photo effects, grouped by topic.",
  alternates: { canonical: `${BASE}/guides` },
});

export default async function GuidesIndex() {
  const posts = await editedPosts();
  return (
    <main style={{ background: "var(--surface-2)", minHeight: "100vh", padding: "56px 24px 80px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <h1 style={{ margin: "0 0 12px", fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 900, color: "var(--text)", letterSpacing: "-0.8px", lineHeight: 1.15 }}>
          Photo editing guides
        </h1>
        <p style={{ margin: "0 0 36px", fontSize: 17, color: "var(--text-muted)", lineHeight: 1.65, maxWidth: 640 }}>
          Every guide on the blog, grouped by what you are trying to do. Pick a topic to see all of its guides and the tools that go with them.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(300px, 100%), 1fr))", gap: 18 }}>
          {BLOG_TOPICS.map((t) => {
            const mine = posts.filter((p) => topicOf(p) === t.slug);
            const best = mine.filter(blogIndexable).slice(0, 3);
            return (
              <section key={t.slug} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 20px 18px" }}>
                <h2 style={{ margin: "0 0 6px", fontSize: 19, fontWeight: 900 }}>
                  <Link href={topicHref(t)} style={{ color: "var(--text)", textDecoration: "none" }}>{t.name}</Link>
                </h2>
                <p style={{ margin: "0 0 12px", fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.55 }}>{t.description}</p>
                <ul style={{ listStyle: "none", margin: "0 0 12px", padding: 0, display: "grid", gap: 6 }}>
                  {best.map((p) => (
                    <li key={p.slug}><Link href={`/blog/${p.slug}`} style={{ fontSize: 14, color: "var(--text)", textDecoration: "none", fontWeight: 600 }}>{p.title}</Link></li>
                  ))}
                </ul>
                <Link href={topicHref(t)} style={{ fontSize: 13.5, fontWeight: 800, color: "var(--accent)", textDecoration: "none" }}>
                  All {mine.length} guides →
                </Link>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}

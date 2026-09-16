import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DatasetDetail from "@/app/prompts/_components/DatasetDetail";
import { getPrompt, byMedia, excerpt } from "@/lib/prompts/data";
import { mediaResolver } from "@/lib/prompts/media";
import { BRAND } from "@/lib/brand";

export const revalidate = 300;

const BASE = "https://www.sjpt.io";

/**
 * Video prompts live on their own path (spec §3).
 *
 * Not a query parameter on the image route: these are different enough in
 * intent — a different model list, a different set of categories, a different
 * thing to do with the result — that they deserve their own URL space and
 * their own sitemap section.
 */
export function generateStaticParams() {
  return byMedia("video").map((r) => ({ uid: r.uid }));
}

export async function generateMetadata({ params }: { params: Promise<{ uid: string }> }): Promise<Metadata> {
  const { uid } = await params;
  const p = getPrompt(uid);
  if (!p || p.media !== "video") return {};
  const url = `${BASE}/video-prompts/${uid}`;
  const description = p.description || excerpt(p, 155);
  return {
    title: { absolute: `${p.title} — ${p.model} Video Prompt | ${BRAND}` },
    description,
    keywords: [p.model, "ai video prompt", p.useCase, ...p.styles, ...p.subjects].filter(Boolean).join(", "),
    alternates: { canonical: url },
    openGraph: {
      title: p.title, description, url, type: "article", siteName: BRAND,
      ...(p.videoThumbnail ? { images: [p.videoThumbnail] } : {}),
    },
    twitter: { card: "summary_large_image", title: p.title, description },
  };
}

export default async function VideoPromptDetail({ params }: { params: Promise<{ uid: string }> }) {
  const { uid } = await params;
  const p = getPrompt(uid);
  if (!p || p.media !== "video") notFound();

  const resolve = await mediaResolver();
  const url = `${BASE}/video-prompts/${uid}`;

  const breadcrumbLd = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Prompts", item: `${BASE}/prompts` },
      { "@type": "ListItem", position: 2, name: "Video prompts", item: `${BASE}/prompts/video` },
      { "@type": "ListItem", position: 3, name: `${p.model} prompts`, item: `${BASE}/${p.modelSlug}-prompts` },
      { "@type": "ListItem", position: 4, name: p.title, item: url },
    ],
  };
  const workLd = {
    "@context": "https://schema.org", "@type": "CreativeWork",
    name: p.title,
    ...(p.description ? { description: p.description } : {}),
    text: p.prompt.slice(0, 5000),
    url,
    inLanguage: p.languages,
    license: "https://creativecommons.org/licenses/by/4.0/",
    isAccessibleForFree: true,
    author: { "@type": "Person", name: p.author.name, ...(p.author.url ? { url: p.author.url } : {}) },
    ...(p.sourceUrl ? { isBasedOn: p.sourceUrl } : {}),
    ...(p.videoThumbnail ? { image: p.videoThumbnail } : {}),
    publisher: { "@type": "Organization", name: BRAND, url: BASE },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(workLd) }} />
      <div style={{ background: "var(--bg)", color: "var(--text)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "26px 24px 70px" }}>
          {/*
            No Generate button on this page at all — PromptBlock omits it for
            video. There is no video generation here, and sending someone to an
            image editor from a button labelled "generate video" is the kind of
            thing this codebase has had to unwind before.
          */}
          <DatasetDetail p={p} resolve={resolve} />
        </div>
      </div>
    </>
  );
}

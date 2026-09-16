import type { Metadata } from "next";
import CategoryPage from "@/app/prompts/_components/CategoryPage";
import { allFacets, findFacet } from "@/lib/prompts/data";
import { BRAND } from "@/lib/brand";

export const revalidate = 300;

const MEDIA = "video" as const;
const BASE = "https://www.sjpt.io";

export function generateStaticParams() {
  return allFacets(MEDIA).map((f) => ({ facet: f.facet.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ facet: string }> }): Promise<Metadata> {
  const { facet } = await params;
  const found = findFacet(MEDIA, facet);
  if (!found) return {};
  const url = `${BASE}/prompts/${MEDIA}/${facet}`;
  const name = found.facet.name;
  const description = `${found.facet.count} free ${name.toLowerCase()} AI ${MEDIA} prompts, each credited to its author and linked to the original post. Copy, edit the placeholders, generate.`;
  return {
    title: { absolute: `${name} AI Video Prompts (${found.facet.count}) | ${BRAND}` },
    description,
    alternates: { canonical: url },
    openGraph: { title: `${name} AI ${MEDIA} prompts`, description, url, siteName: BRAND },
  };
}

export default async function Page({ params }: { params: Promise<{ facet: string }> }) {
  const { facet } = await params;
  return <CategoryPage media={MEDIA} facetSlug={facet} />;
}

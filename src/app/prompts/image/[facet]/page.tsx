import type { Metadata } from "next";
import CategoryPage from "@/app/prompts/_components/CategoryPage";
import { allFacets, findFacet } from "@/lib/prompts/data";
import { canonicalFor, pageSuffix, parsePage } from "@/lib/prompts/pagination";
import { BRAND } from "@/lib/brand";

export const revalidate = 300;

const MEDIA = "image" as const;
const BASE = "https://www.sjpt.io";

export function generateStaticParams() {
  return allFacets(MEDIA).map((f) => ({ facet: f.facet.slug }));
}

export async function generateMetadata(
  { params, searchParams }: { params: Promise<{ facet: string }>; searchParams: Promise<{ page?: string }> }
): Promise<Metadata> {
  const { facet } = await params;
  const found = findFacet(MEDIA, facet);
  if (!found) return {};
  const page = parsePage(await searchParams);
  const url = canonicalFor(`${BASE}/prompts/${MEDIA}/${facet}`, page);
  const name = found.facet.name;
  const description = `${found.facet.count} free ${name.toLowerCase()} AI ${MEDIA} prompts, each credited to its author and linked to the original post. Copy, edit the placeholders, generate.`;
  return {
    title: { absolute: `${name} AI Image Prompts (${found.facet.count})${pageSuffix(page)} | ${BRAND}` },
    description,
    alternates: { canonical: url },
    openGraph: { title: `${name} AI ${MEDIA} prompts`, description, url, siteName: BRAND },
  };
}

export default async function Page(
  { params, searchParams }: { params: Promise<{ facet: string }>; searchParams: Promise<{ page?: string }> }
) {
  const { facet } = await params;
  const page = parsePage(await searchParams);
  return <CategoryPage media={MEDIA} facetSlug={facet} page={page} />;
}

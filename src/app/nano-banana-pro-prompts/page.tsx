import type { Metadata } from "next";
import ModelLanding from "@/app/prompts/_components/ModelLanding";
import { getModel } from "@/lib/prompts/data";
import { canonicalFor, pageSuffix, parsePage } from "@/lib/prompts/pagination";
import { BRAND } from "@/lib/brand";

export const revalidate = 300;

const SLUG = "nano-banana-pro";
const URL = "https://www.sjpt.io/nano-banana-pro-prompts";

/*
  One route file per model rather than a root-level dynamic segment.

  `/{model}-prompts` is a suffix pattern, and the only way to match it
  dynamically is a catch-all at the root of the app — which would sit in front
  of every future top-level path on the site. Seven small files are the boring
  option and the safe one.
*/
export async function generateMetadata(
  { searchParams }: { searchParams: Promise<{ page?: string }> }
): Promise<Metadata> {
  const m = getModel(SLUG);
  if (!m) return {};
  const page = parsePage(await searchParams);
  const canonical = canonicalFor(URL, page);
  const description = `${m.count} free ${m.name} prompts, each credited to the creator who wrote it and linked to their original post. Copy, fill in the blanks, generate.`;
  return {
    title: { absolute: `${m.name} Prompts — ${m.count} Free, Credited Prompts${pageSuffix(page)} | ${BRAND}` },
    description,
    keywords: `${m.name.toLowerCase()} prompts, ${m.name.toLowerCase()} prompt examples, free ${m.name.toLowerCase()} prompts, ai image prompts`,
    alternates: { canonical },
    openGraph: { title: `${m.name} prompts`, description, url: canonical, siteName: BRAND },
    twitter: { card: "summary_large_image", title: `${m.name} prompts`, description },
  };
}

export default async function Page({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const page = parsePage(await searchParams);
  return <ModelLanding slug={SLUG} page={page} />;
}

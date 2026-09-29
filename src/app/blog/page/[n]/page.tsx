import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import BlogIndex, { blogPageCount } from "../../_components/BlogIndex";

/* /blog/page/2 onwards. Page 1 lives at /blog. */
export const revalidate = 300;

export async function generateStaticParams() {
  const pages = await blogPageCount();
  return Array.from({ length: Math.max(0, pages - 1) }, (_, i) => ({ n: String(i + 2) }));
}

export async function generateMetadata({ params }: { params: Promise<{ n: string }> }): Promise<Metadata> {
  const { n } = await params;
  const url = `https://www.sjpt.io/blog/page/${n}`;
  return {
    title: { absolute: `Image Upscaling Blog — Page ${n} | Pixel Shine` },
    description: `Tips, tutorials and guides for upscaling, enhancing and editing photos with AI — page ${n} of the Pixel Shine blog.`,
    alternates: { canonical: url },
    openGraph: { title: `Pixel Shine Blog — Page ${n}`, type: "website", url },
  };
}

export default async function BlogPage({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params;
  if (!/^\d{1,4}$/.test(n)) notFound();
  const page = Number(n);
  if (page <= 1) permanentRedirect("/blog");
  if (page > (await blogPageCount())) notFound();
  return <BlogIndex page={page} />;
}

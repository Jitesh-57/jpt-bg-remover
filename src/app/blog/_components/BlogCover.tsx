import SmartImage from "@/app/_components/SmartImage";
import { blogCover, type AppMains } from "@/lib/blog-images";

/**
 * A blog post's cover. When it is an app's before-and-after creative it is
 * drawn at that image's own shape, so both halves show whole; otherwise it
 * fills a fixed-height strip.
 */
export default function BlogCover({ post, mains, height, radius = 0, eager = false, sizes }: {
  post: { slug: string; title: string; toolHref: string; image?: string; cover?: { url: string; w: number; h: number } };
  mains: AppMains;
  height: number;
  radius?: number;
  eager?: boolean;
  sizes?: string;
}) {
  const cover = blogCover(post, mains);
  const shape: React.CSSProperties = cover.w && cover.h ? { aspectRatio: `${cover.w} / ${cover.h}` } : { height };
  return (
    // data-blog-*: the live page editor saves a picture clicked here into this post's cover.
    <div data-blog-slug={post.slug} data-blog-image="cover" style={{ ...shape, width: "100%", borderRadius: radius, overflow: "hidden" }}>
      <SmartImage sources={cover.sources} alt={`${post.title}: before and after`} eager={eager} sizes={sizes}
        fallback="linear-gradient(135deg, var(--accent-soft), var(--surface-2))" />
    </div>
  );
}

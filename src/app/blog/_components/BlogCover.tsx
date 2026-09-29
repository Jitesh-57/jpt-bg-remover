import SmartImage from "@/app/_components/SmartImage";
import { blogCoverSources } from "@/lib/blog-images";

/** A blog post's cover: its own picture, else the creative from the app it is about. */
export default function BlogCover({ post, height, radius = 0, eager = false, sizes }: {
  post: { slug: string; title: string; toolHref: string; image?: string };
  height: number;
  radius?: number;
  eager?: boolean;
  sizes?: string;
}) {
  return (
    <div style={{ height, borderRadius: radius, overflow: "hidden" }}>
      <SmartImage sources={blogCoverSources(post)} alt={post.title} eager={eager} sizes={sizes}
        fallback="linear-gradient(135deg, var(--accent-soft), var(--surface-2))" style={{ backgroundPosition: "center" }} />
    </div>
  );
}

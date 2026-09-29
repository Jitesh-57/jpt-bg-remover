import type { BlogPost } from "@/app/blog/_data/posts";

/**
 * Admin edits to blog posts, made in /admin/blog and stored as one JSON
 * document in storage. The posts themselves stay in code; an edit only holds
 * the fields that differ from it, so a later change to a post's code still
 * shows wherever the admin has not overridden it.
 */

export const BLOG_EDITS_BUCKET = "landing";
export const BLOG_EDITS_PATH = "overrides/blog-edits.json";
export const BLOG_EDITS_TAG = "blog-edits";

/** width: how wide the picture is drawn in the post, as a percentage of the column (100, 75 or 50). */
export interface BlogCoverImage { url: string; w: number; h: number; width?: number }
export interface BlogSection { heading?: string; body: string; image?: string; imageWidth?: number }
export const IMAGE_WIDTHS = [100, 75, 50] as const;

export interface BlogPatch {
  title?: string;
  excerpt?: string;
  metaTitle?: string;
  metaDescription?: string;
  toolLabel?: string;
  cover?: BlogCoverImage;
  sections?: BlogSection[];
  hidden?: boolean;
  updatedAt?: string;
}

export interface BlogEdits { version: 1; updatedAt: string; posts: Record<string, BlogPatch> }
export const EMPTY_BLOG_EDITS: BlogEdits = { version: 1, updatedAt: "", posts: {} };

export type EditedPost = BlogPost & { cover?: BlogCoverImage; hidden?: boolean };

export const LIMITS = { title: 200, excerpt: 800, metaTitle: 200, metaDescription: 400, toolLabel: 80, heading: 300, body: 20000, sections: 80 };

export function blogEditsPublicUrl(): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return base ? `${base}/storage/v1/object/public/${BLOG_EDITS_BUCKET}/${BLOG_EDITS_PATH}` : "";
}

/** Only pictures we host ourselves go into a post. */
export function isOurBlogImage(url: unknown): url is string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return typeof url === "string" && !!base && url.length < 1000 && url.startsWith(`${base}/storage/v1/object/public/${BLOG_EDITS_BUCKET}/`);
}

/** A post with its admin edit laid over it. */
export function applyBlogEdit(post: BlogPost, patch?: BlogPatch): EditedPost {
  if (!patch) return post;
  return {
    ...post,
    ...(patch.title ? { title: patch.title } : {}),
    ...(patch.excerpt ? { excerpt: patch.excerpt } : {}),
    ...(patch.metaTitle ? { metaTitle: patch.metaTitle } : {}),
    ...(patch.metaDescription ? { metaDescription: patch.metaDescription } : {}),
    ...(patch.toolLabel ? { toolLabel: patch.toolLabel } : {}),
    ...(patch.sections ? { sections: patch.sections } : {}),
    ...(patch.cover ? { cover: patch.cover, image: patch.cover.url } : {}),
    ...(patch.hidden ? { hidden: true } : {}),
  };
}

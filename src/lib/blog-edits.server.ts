import { BLOG_EDITS_BUCKET, BLOG_EDITS_PATH, BLOG_EDITS_TAG, EMPTY_BLOG_EDITS, applyBlogEdit, blogEditsPublicUrl, type BlogEdits, type EditedPost } from "@/lib/blog-edits";
import { POSTS } from "@/app/blog/_data/posts";

async function read(init: RequestInit, stamp: number): Promise<BlogEdits> {
  const url = blogEditsPublicUrl();
  if (!url) return EMPTY_BLOG_EDITS;
  try {
    const res = await fetch(`${url}?t=${stamp}`, init);
    if (!res.ok) return EMPTY_BLOG_EDITS;
    const json = (await res.json()) as BlogEdits;
    return json && typeof json === "object" && json.posts && typeof json.posts === "object" ? json : EMPTY_BLOG_EDITS;
  } catch {
    return EMPTY_BLOG_EDITS;
  }
}

/**
 * Cached and tagged: a save in /admin/blog calls revalidateTag, so the change
 * shows on the next page load instead of after the five-minute window.
 */
export function readBlogEdits(): Promise<BlogEdits> {
  return read({ next: { revalidate: 300, tags: [BLOG_EDITS_TAG] } }, 0);
}

/** Uncached: for read-modify-write in the admin API. */
export function readBlogEditsNow(): Promise<BlogEdits> {
  return read({ cache: "no-store" }, Date.now());
}

export async function writeBlogEdits(next: BlogEdits): Promise<{ ok: true } | { ok: false; error: string }> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return { ok: false, error: "Storage is not configured on this deployment." };
  try {
    const res = await fetch(`${base}/storage/v1/object/${BLOG_EDITS_BUCKET}/${BLOG_EDITS_PATH}`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", "x-upsert": "true", "Cache-Control": "public, max-age=30" },
      body: JSON.stringify(next),
    });
    if (!res.ok) return { ok: false, error: `Storage refused the write (${res.status}).` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: `Storage could not be reached: ${(e as Error).message}` };
  }
}

/** Every visible post, with admin edits applied, in the blog's usual order. */
export async function editedPosts(): Promise<EditedPost[]> {
  const edits = await readBlogEdits();
  return POSTS.map((p) => applyBlogEdit(p, edits.posts[p.slug])).filter((p) => !p.hidden);
}

/** One post with its edits, or undefined when it doesn't exist or is hidden. */
export async function editedPost(slug: string): Promise<EditedPost | undefined> {
  const post = POSTS.find((p) => p.slug === slug);
  if (!post) return undefined;
  const edited = applyBlogEdit(post, (await readBlogEdits()).posts[slug]);
  return edited.hidden ? undefined : edited;
}

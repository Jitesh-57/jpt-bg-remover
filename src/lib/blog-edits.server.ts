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

/**
 * Stores a blog picture as blog/<name>-<hash>.webp. The name says what it is
 * (post and slot); the short content hash makes each upload its own file, so
 * browsers and the CDN never keep showing the picture it replaced.
 */
export async function uploadBlogImage(name: string, bytes: Buffer): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return { ok: false, error: "Storage is not configured on this deployment." };
  const { createHash } = await import("crypto");
  const safe = name.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120);
  const path = `blog/${safe}-${createHash("sha1").update(bytes).digest("hex").slice(0, 8)}.webp`;
  try {
    const res = await fetch(`${base}/storage/v1/object/${BLOG_EDITS_BUCKET}/${path}`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "image/webp", "x-upsert": "true", "Cache-Control": "public, max-age=31536000, immutable" },
      body: new Uint8Array(bytes),
    });
    if (!res.ok) return { ok: false, error: `Storage refused the upload (${res.status}).` };
    return { ok: true, url: `${base}/storage/v1/object/public/${BLOG_EDITS_BUCKET}/${path}` };
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

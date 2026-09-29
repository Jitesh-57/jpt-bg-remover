import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/admin-token";
import { POSTS } from "@/app/blog/_data/posts";
import { BLOG_EDITS_TAG, LIMITS, isOurBlogImage, type BlogEdits, type BlogPatch, type BlogSection } from "@/lib/blog-edits";
import { readBlogEditsNow, writeBlogEdits } from "@/lib/blog-edits.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * /api/admin/blog-edits — the blog editor's store. ?token= on every call.
 *
 *   GET                                  every post (slug, title, category, date, edited?, hidden?)
 *   GET ?slug=…                          one post as written in code, plus its edit
 *   POST { action: "save",  slug, post } store what differs from the code, live at once
 *   POST { action: "reset", slug }       drop the edit, back to the code version
 *
 * Images are uploaded first through /api/admin/page-edits (action "upload").
 */

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.replace(/\r\n/g, "\n").trim().slice(0, max) : "";
}

function refresh(slug: string) {
  revalidateTag(BLOG_EDITS_TAG);
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
}

export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const edits = await readBlogEditsNow();
  const slug = req.nextUrl.searchParams.get("slug");
  if (slug) {
    const original = POSTS.find((p) => p.slug === slug);
    if (!original) return NextResponse.json({ error: "No post with that address." }, { status: 404 });
    return NextResponse.json({ original, patch: edits.posts[slug] || null });
  }
  return NextResponse.json({
    updatedAt: edits.updatedAt,
    posts: POSTS.map((p) => {
      const e = edits.posts[p.slug];
      return { slug: p.slug, title: e?.title || p.title, category: p.category, date: p.date, edited: !!e, hidden: !!e?.hidden, updatedAt: e?.updatedAt };
    }),
  });
}

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const body = (await req.json().catch(() => null)) as { action?: string; slug?: string; post?: Record<string, unknown> } | null;
  if (!body) return NextResponse.json({ error: "Malformed request." }, { status: 400 });

  const original = POSTS.find((p) => p.slug === body.slug);
  if (!original) return NextResponse.json({ error: "No post with that address." }, { status: 404 });
  const slug = original.slug;

  const current = await readBlogEditsNow();
  const next: BlogEdits = { version: 1, updatedAt: new Date().toISOString(), posts: { ...current.posts } };

  if (body.action === "reset") {
    delete next.posts[slug];
  } else if (body.action === "save" && body.post) {
    const f = body.post;
    const patch: BlogPatch = {};
    // Keep only what differs from the code, so later code edits still show elsewhere.
    for (const k of ["title", "excerpt", "metaTitle", "metaDescription", "toolLabel"] as const) {
      const v = str(f[k], LIMITS[k]);
      if (v && v !== original[k]) patch[k] = v;
    }
    if (f.cover != null) {
      const c = f.cover as { url?: unknown; w?: unknown; h?: unknown };
      if (!isOurBlogImage(c.url)) return NextResponse.json({ error: "Upload the cover image first." }, { status: 400 });
      const w = Math.round(Number(c.w)) || 1600, h = Math.round(Number(c.h)) || 1000;
      patch.cover = { url: c.url, w: Math.max(1, Math.min(w, 10000)), h: Math.max(1, Math.min(h, 10000)) };
    }
    if (Array.isArray(f.sections)) {
      const sections: BlogSection[] = [];
      for (const raw of f.sections.slice(0, LIMITS.sections) as Record<string, unknown>[]) {
        const heading = str(raw?.heading, LIMITS.heading);
        const text = str(raw?.body, LIMITS.body);
        const image = raw?.image;
        if (image != null && image !== "" && !isOurBlogImage(image)) return NextResponse.json({ error: "Upload each section image first." }, { status: 400 });
        if (!heading && !text && !image) continue;
        sections.push({ ...(heading ? { heading } : {}), body: text, ...(image ? { image: image as string } : {}) });
      }
      const same = JSON.stringify(sections) === JSON.stringify(original.sections
        .map((s) => ({ heading: str(s.heading, LIMITS.heading), body: str(s.body, LIMITS.body) }))
        .filter((s) => s.heading || s.body)
        .map((s) => ({ ...(s.heading ? { heading: s.heading } : {}), body: s.body })));
      if (!same) patch.sections = sections;
    }
    if (f.hidden === true) patch.hidden = true;
    if (Object.keys(patch).length) next.posts[slug] = { ...patch, updatedAt: next.updatedAt };
    else delete next.posts[slug];
  } else {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }

  const saved = await writeBlogEdits(next);
  if (!saved.ok) return NextResponse.json({ error: saved.error }, { status: 502 });
  refresh(slug);
  return NextResponse.json({ ok: true, patch: next.posts[slug] || null });
}

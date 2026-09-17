import type { Metadata } from "next";
import { CREATIVE_APPS } from "@/lib/creative-apps";
import AdminShell from "./AdminShell";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * /admin/creatives — the console.
 *
 * The app list is passed from the server as plain data; everything else runs
 * in the browser. The route keeps its old name so the link already in use
 * still works.
 */
export default function AdminPage() {
  const apps = CREATIVE_APPS.map((a) => ({
    slug: a.slug,
    name: a.h1,
    emoji: a.emoji,
    title: a.title,
    metaDescription: a.metaDescription,
    keywords: a.keywords,
    h1: a.h1,
    tagline: a.tagline,
    intro: a.intro,
    badge: a.badge,
  }));
  return <AdminShell apps={apps} />;
}

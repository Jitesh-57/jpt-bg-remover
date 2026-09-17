import type { Metadata } from "next";
import { CREATIVE_APPS } from "@/lib/creative-apps";
import CreativeUploader from "./CreativeUploader";

export const metadata: Metadata = { title: "Creatives", robots: { index: false, follow: false } };

/**
 * /admin/creatives — put a before/after on an app page, without a deploy.
 *
 * The list of apps is passed from the server as plain data. Everything else
 * happens in the browser: the file never leaves the machine until it has been
 * cropped and compressed, which is what makes dropping a 6 MB PNG on it
 * reasonable.
 */
export default function AdminCreativesPage() {
  const apps = CREATIVE_APPS.map((a) => ({ slug: a.slug, name: a.h1, emoji: a.emoji }));
  return <CreativeUploader apps={apps} />;
}

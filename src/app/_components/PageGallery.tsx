"use client";

import { usePathname } from "next/navigation";
import { imageUrlFor, pageKeyFromPath } from "@/lib/page-target";

/**
 * The images an editor added to *this* page, wherever this page is.
 *
 * Mounted once in the root layout, so every URL on the site can hold a gallery
 * without its own route file being edited — which is the whole point: the
 * console now takes a URL, and a URL that silently does nothing would be worse
 * than no feature.
 *
 * It reads the pathname in the browser rather than on the server because a
 * layout cannot know the path without opting every page into dynamic
 * rendering. What it is given instead is the whole index — slots and shapes
 * only, a few bytes per image — and it picks its own entry out of it. Client
 * component, but not a client *fetch*: this renders into the HTML with
 * everything else, so the images are in the markup a crawler sees.
 *
 * A plain <img> on purpose. next/image throws during render for a host that is
 * not in remotePatterns, which takes the whole page down with it — and these
 * files are already capped, cropped WebPs, so there is nothing left for it to
 * optimise.
 */

export interface GalleryEntry {
  slot: string;
  w: number;
  h: number;
}

export default function PageGallery({
  galleries,
  titles,
}: {
  galleries: Record<string, GalleryEntry[]>;
  titles: Record<string, string>;
}) {
  const pathname = usePathname();
  const key = pathname ? pageKeyFromPath(pathname) : "";
  const images = (key && galleries[key]) || [];
  if (!images.length) return null;

  return (
    <section style={{ padding: "0 24px 72px", background: "var(--bg)" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <h2 style={{ fontSize: "clamp(22px, 3.4vw, 30px)", fontWeight: 900, letterSpacing: "-0.02em", margin: "0 0 20px" }}>
          {titles[key] || "Examples"}
        </h2>
        <div style={{ display: "grid", gap: 20 }}>
          {images.map((img, i) => (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              key={img.slot}
              src={imageUrlFor(key, img.slot)}
              // Numbered, so several images on one page are not all one alt text.
              alt={`${titles[key] || "Example"} — ${i + 1}`}
              width={img.w}
              height={img.h}
              loading="lazy"
              decoding="async"
              /*
                The shape is stored with the image so the space is reserved
                before the file arrives. Without it every one of these shoves
                the footer down as it loads.
              */
              style={{
                display: "block", width: "100%", height: "auto",
                aspectRatio: `${img.w} / ${img.h}`,
                borderRadius: 18, border: "1px solid var(--border)", background: "var(--surface-2)",
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

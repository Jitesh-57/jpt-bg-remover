import type { Metadata } from "next";
import Link from "next/link";

const BASE = "https://www.sjpt.io";

export const metadata: Metadata = {
  title: "AI Image Tools & Creative Apps | Pixel Shine",
  description:
    "Explore Pixel Shine's AI image editor, upscaler, background tools, creative apps, restoration tools, and free image utilities in one discoverable hub.",
  alternates: { canonical: "/ai-discovery" },
};

const groups = [
  {
    title: "AI image editing",
    description: "Edit photos with plain-English instructions and transform backgrounds, lighting, styles, and more.",
    links: [
      ["/ai-editor", "AI Image Editor"],
      ["/creative/background-changer", "AI Background Changer"],
      ["/creative/object-remover", "AI Object Remover"],
      ["/creative/photo-retouching", "AI Photo Retouching"],
    ],
  },
  {
    title: "Enhance & restore",
    description: "Improve image quality and restore older or lower-quality photos.",
    links: [
      ["/upscale", "AI Image Upscaler"],
      ["/creative/image-sharpener", "Image Sharpener"],
      ["/creative/colorize-photo", "Photo Colorizer"],
    ],
  },
  {
    title: "Creative AI apps",
    description: "One-click creative workflows for portraits, products, fashion, art, and social content.",
    links: [
      ["/creative/outfit-generator", "AI Outfit Changer"],
      ["/creative/ai-product-photography", "AI Product Photography"],
      ["/creative/aesthetic-photo-editor", "Aesthetic Photo Editor"],
      ["/creative/pixel-art-generator", "Pixel Art Generator"],
    ],
  },
  {
    title: "Free image tools",
    description: "Browser-based utilities for everyday image editing and preparation.",
    links: [
      ["/tools", "Free Image Tools"],
      ["/creative", "All Creative Apps"],
      ["/prompts", "AI Image Prompts"],
    ],
  },
  {
    title: "Learn & explore",
    description: "Guides, answers, use cases, and documentation for image editing workflows.",
    links: [
      ["/blog", "Image & AI Guides"],
      ["/answers", "AI Image Answers"],
      ["/use-cases", "Image Editing Use Cases"],
      ["/docs", "Pixel Shine Documentation"],
    ],
  },
];

const itemListSchema = groups.flatMap((group) =>
  group.links.map(([path, name]) => ({
    "@type": "ListItem",
    position: 0,
    name,
    url: `${BASE}${path}`,
  }))
);

export default function AIDiscoveryPage() {
  return (
    <main style={{ maxWidth: 1120, margin: "0 auto", padding: "72px 24px" }}>
      <header style={{ maxWidth: 820, marginBottom: 56 }}>
        <p>Pixel Shine</p>
        <h1>AI Image Tools & Creative Apps</h1>
        <p>
          A structured guide to Pixel Shine's AI image editor, creative apps,
          enhancement tools, free utilities, prompts, and learning resources.
        </p>
      </header>

      {groups.map((group) => (
        <section key={group.title} style={{ marginBottom: 48 }}>
          <h2>{group.title}</h2>
          <p style={{ maxWidth: 760 }}>{group.description}</p>
          <ul>
            {group.links.map(([path, name]) => (
              <li key={path}>
                <Link href={path}>{name}</Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section>
        <h2>Start with Pixel Shine</h2>
        <p>
          Use the AI editor for prompt-based photo edits, browse creative apps
          for one-click workflows, or use the free browser tools for everyday
          image tasks.
        </p>
        <p>
          <Link href="/">Open Pixel Shine</Link>
        </p>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "AI Image Tools & Creative Apps",
            description: metadata.description,
            url: `${BASE}/ai-discovery`,
            mainEntity: {
              "@type": "ItemList",
              itemListElement: itemListSchema.map((item, index) => ({
                ...item,
                position: index + 1,
              })),
            },
          }),
        }}
      />
    </main>
  );
}

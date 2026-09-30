import Link from "next/link";
import SmartImage from "@/app/_components/SmartImage";
import { USE_CASES } from "@/lib/growth-pages";
import { CREATIVE_APPS, previewUrl } from "@/lib/creative-apps";
import { creativeSources, uploadedCreative } from "@/lib/app-creatives";
import { readOverrides } from "@/lib/overrides";

export const metadata = {
  title: "AI Image Editing Use Cases | Pixel Shine",
  description: "Explore Pixel Shine AI image tools by use case: LinkedIn, social media, ecommerce, real estate, photography, creators and weddings.",
  alternates: { canonical: "https://www.sjpt.io/use-cases" },
};

/* The pictures follow the creatives uploaded in /admin, on the creative gallery's cadence. */
export const revalidate = 300;

const APPS = new Map(CREATIVE_APPS.map((a) => [a.slug, a]));

export default async function UseCases() {
  const overrides = await readOverrides();
  const mains = new Map<string, { w: number; h: number }>();
  for (const [key, page] of Object.entries(overrides.pages)) {
    if (page.main && key.startsWith("creative/")) mains.set(key.slice("creative/".length), { w: page.main.w, h: page.main.h });
  }

  return (
    <main style={{ padding: "70px 24px 90px", background: "var(--bg)", color: "var(--text)" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", maxWidth: 760, margin: "0 auto 50px" }}>
          <h1 style={{ fontSize: "clamp(2.2rem,5vw,3.5rem)", fontWeight: 950, margin: "0 0 16px" }}>AI Image Tools by Use Case</h1>
          <p style={{ fontSize: 18, lineHeight: 1.7, color: "var(--text-muted)", margin: 0 }}>
            Start with what you are trying to create, then choose the Pixel Shine tools built for that job.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(300px, 100%), 1fr))", gap: 20, alignItems: "start" }}>
          {USE_CASES.map((p) => {
            // The use case's picture: its first app with a before-and-after creative, else its first app.
            const slugs = Array.from(new Set(p.appSlugs)).filter((s) => APPS.has(s));
            const slug = slugs.find((s) => mains.has(s)) ?? slugs[0];
            const app = slug ? APPS.get(slug)! : null;
            const main = slug ? mains.get(slug) : undefined;
            const sources = slug ? [...(main ? [uploadedCreative(slug, "main")] : []), ...creativeSources(slug, "after", previewUrl(slug))] : [];
            const more = slugs.filter((s) => s !== slug).slice(0, 3).map((s) => APPS.get(s)!);
            return (
              <Link key={p.slug} href={`/use-cases/${p.slug}`} className="jpt-hover"
                style={{ textDecoration: "none", border: "1px solid var(--border)", borderRadius: 18, background: "var(--surface)", overflow: "hidden", display: "block" }}>
                {app && (
                  <div style={{ position: "relative", aspectRatio: main ? `${main.w} / ${main.h}` : "16 / 10", background: `linear-gradient(135deg, ${app.gradient[0]}, ${app.gradient[1]})` }}>
                    <SmartImage sources={sources} alt={`${app.h1}: before and after`} sizes="(max-width: 768px) 100vw, 360px"
                      fallback={`linear-gradient(135deg, ${app.gradient[0]}, ${app.gradient[1]})`}
                      artwork={{ slug: app.slug, name: app.h1, emoji: app.emoji, gradient: [app.gradient[0], app.gradient[1]] }} />
                    <span style={{ position: "absolute", left: 10, bottom: 10, padding: "5px 11px", borderRadius: 8, background: "rgba(11,11,14,0.82)", color: "#fff", border: "1px solid rgba(255,255,255,.14)", backdropFilter: "blur(6px)", fontSize: 11.5, fontWeight: 800 }}>
                      {app.emoji} {app.h1}
                    </span>
                  </div>
                )}
                <div style={{ padding: "20px 22px 22px" }}>
                  <h2 style={{ margin: "0 0 9px", fontSize: 20, color: "var(--text)", lineHeight: 1.3 }}>{p.h1}</h2>
                  <p style={{ margin: 0, color: "var(--text-muted)", lineHeight: 1.6, fontSize: 14 }}>{p.description}</p>
                  {more.length > 0 && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 14 }}>
                      {more.map((a) => (
                        <span key={a.slug} style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-muted)", padding: "4px 9px", borderRadius: 999, border: "1px solid var(--border)", background: "var(--surface-2)" }}>
                          {a.emoji} {a.h1}
                        </span>
                      ))}
                    </div>
                  )}
                  <div style={{ marginTop: 16, color: "var(--accent)", fontWeight: 800 }}>Explore tools →</div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}

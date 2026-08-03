import Link from "next/link";

export const TOOL_GRAD = "linear-gradient(120deg,#6366F1,#8B5CF6)";

export function ToolFAQ({ faqs }: { faqs: { q: string; a: string }[] }) {
  return (
    <section style={{ padding: "48px 24px", background: "#F9FAFB" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <h2 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 800, color: "#0F172A", margin: "0 0 28px", letterSpacing: "-0.02em", textAlign: "center" }}>Frequently asked questions</h2>
        {faqs.map((f) => (
          <details key={f.q} style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: "14px 18px", marginBottom: 10 }}>
            <summary style={{ fontSize: 15, fontWeight: 700, color: "#111827", cursor: "pointer" }}>{f.q}</summary>
            <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.7, margin: "10px 0 0" }}>{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

const ALL: { href: string; label: string }[] = [
  { href: "/tools/upscale", label: "Image Upscaler" },
  { href: "/tools/compress", label: "Compress Image" },
  { href: "/tools/convert", label: "Convert Image" },
  { href: "/tools/crop", label: "Crop Image" },
  { href: "/tools/rotate", label: "Rotate & Flip" },
  { href: "/watermark-remover", label: "Watermark Remover" },
];

export function ToolRelated({ exclude }: { exclude?: string }) {
  const items = ALL.filter((r) => r.href !== exclude);
  return (
    <section style={{ padding: "48px 24px 72px", background: "#fff" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", margin: "0 0 20px", letterSpacing: "-0.02em" }}>More free image tools</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {items.map((r) => (
            <Link key={r.href} href={r.href} className="jpt-hover" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#F5F6FB", border: "1px solid #EAECF5", borderRadius: 999, padding: "9px 16px", fontSize: 14, fontWeight: 600, color: "#334155", textDecoration: "none" }}>{r.label}</Link>
          ))}
          <Link href="/tools" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#EEF2FF", border: "1px solid #C7D2FE", borderRadius: 999, padding: "9px 16px", fontSize: 14, fontWeight: 700, color: "#6366F1", textDecoration: "none" }}>All tools →</Link>
        </div>
      </div>
    </section>
  );
}

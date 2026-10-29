import { seoMeta } from "@/lib/seo/brand";
import type { Metadata } from "next";
import ObjectRemoverTool from "@/app/object-remover/ObjectRemoverTool";

export const metadata: Metadata = seoMeta({ title: "AI Object Remover", robots: { index: false, follow: false } });

/** The object remover in the dashboard: the same tool as /object-remover, free and in the browser. */
export default function ObjectRemoverPage() {
  return (
    <div style={{ padding: "24px 16px 60px" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto 18px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-0.02em", margin: "0 0 4px" }}>Object Remover</h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)", margin: 0 }}>Select a person, object or anything else, press Remove, and AI fills the gap. Free — it runs in your browser.</p>
      </div>
      <ObjectRemoverTool />
    </div>
  );
}

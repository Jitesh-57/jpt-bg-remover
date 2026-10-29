import { seoMeta } from "@/lib/seo/brand";
import type { Metadata } from "next";
import ObjectRemoverTool from "@/app/object-remover/ObjectRemoverTool";
import { CREDIT_COST } from "@/lib/plans";

export const metadata: Metadata = seoMeta({ title: "AI Object Remover", robots: { index: false, follow: false } });

/** The object remover in the dashboard: the same tool as /object-remover, framed like Create and Recreate. */
export default function ObjectRemoverPage() {
  return (
    <div style={{ padding: "22px 24px 60px" }}>
      <div style={{ maxWidth: 1600 }}>
        <div className="jpt-a-up" style={{ marginBottom: 18 }}>
          <h1 style={{ fontSize: "clamp(1.5rem,2.6vw,1.9rem)", fontWeight: 900, letterSpacing: "-0.03em", margin: 0 }}>Object Remover</h1>
          <p style={{ margin: "5px 0 0", fontSize: 14, color: "var(--text-muted)" }}>Brush over a person, object or anything else, press Remove, and AI fills the gap. {CREDIT_COST} credits per removal.</p>
        </div>
        <ObjectRemoverTool />
      </div>
    </div>
  );
}

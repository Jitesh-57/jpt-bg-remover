"use client";

import { useEffect } from "react";
import { captureUtm, trackEvent, trackToolUse } from "@/lib/analytics";

/** A CTA button for ad landing pages that captures UTM and fires a conversion-funnel event. */
export default function AdLandingCTA({ href, label, tool }: { href: string; label: string; tool: string }) {
  useEffect(() => {
    captureUtm();
    trackEvent("lp_view", { tool });
  }, [tool]);

  return (
    <a
      href={href}
      onClick={() => { trackEvent("lp_cta_click", { tool }); trackToolUse(tool); }}
      style={{
        display: "inline-block",
        padding: "16px 40px",
        background: "#6366F1",
        color: "#fff",
        fontSize: 18,
        fontWeight: 800,
        borderRadius: 12,
        textDecoration: "none",
        boxShadow: "0 8px 30px rgba(99,102,241,0.45)",
      }}
    >
      {label}
    </a>
  );
}

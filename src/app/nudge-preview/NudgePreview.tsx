"use client";

import SignupNudge, { NUDGE_VARIANTS, type NudgeVariant } from "@/app/_components/SignupNudge";

const OPTIONS: [NudgeVariant, string][] = [
  ["center", "1 · Centre card"],
  ["split", "2 · Big split"],
  ["card", "3 · Photo card"],
  ["corner", "Now live · corner"],
];

/** Each design over the homepage, with a bar to switch between them and between the two offers. */
export default function NudgePreview({ v, offer }: { v: string; offer: boolean }) {
  const variant: NudgeVariant = NUDGE_VARIANTS.includes(v as NudgeVariant) ? (v as NudgeVariant) : "center";
  const href = (v: NudgeVariant, o: boolean) => `/nudge-preview?v=${v}${o ? "" : "&offer=0"}`;
  const pill = (on: boolean): React.CSSProperties => ({
    padding: "7px 12px", borderRadius: 999, fontSize: 12.5, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap",
    color: on ? "#fff" : "var(--text)", background: on ? "var(--grad-strong)" : "var(--surface-2)", border: "1px solid var(--border-strong)",
  });
  return (
    <>
      <iframe src="/" title="Homepage" style={{ position: "fixed", inset: 0, width: "100%", height: "100%", border: 0, zIndex: 5000, background: "var(--bg)" }} />
      <nav aria-label="Designs" style={{ position: "fixed", top: 10, left: 10, right: 10, zIndex: 10000, display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
        {OPTIONS.map(([v, label]) => <a key={v} href={href(v, offer)} style={pill(v === variant)}>{label}</a>)}
        <a href={href(variant, !offer)} style={pill(false)}>{offer ? "Show without free trial" : "Show with free trial"}</a>
      </nav>
      <SignupNudge
        key={variant}
        variant={variant}
        offer={offer ? { credits: 2, generations: 1, country: "US" } : null}
        onClose={() => {}}
        onGoogle={() => {}}
        onEmail={() => {}}
      />
    </>
  );
}

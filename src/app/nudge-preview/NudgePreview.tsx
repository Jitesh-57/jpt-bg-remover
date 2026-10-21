"use client";

import SignupNudge, { type NudgeVariant } from "@/app/_components/SignupNudge";

export default function NudgePreview({ variant, offer }: { variant: NudgeVariant; offer: boolean }) {
  return (
    <>
      <iframe src="/" title="Homepage" style={{ position: "fixed", inset: 0, width: "100%", height: "100%", border: 0, zIndex: 5000, background: "var(--bg)" }} />
      <SignupNudge variant={variant} offer={offer ? { credits: 2, generations: 1, country: "US" } : null} onClose={() => {}} onGoogle={() => {}} />
    </>
  );
}

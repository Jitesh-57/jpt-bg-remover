"use client";

import type { TrialOffer } from "@/lib/trial-offer";
import type { PopupDesign, PopupText } from "@/lib/popups";
import PopupView from "./PopupView";

/**
 * SignupNudge — the sign-up popup a signed-out visitor sees a few seconds
 * after landing, with a before|after to show what one generation turns a
 * photo into. Every word, the picture and the design come from /admin/popups
 * ("Sign-up popup" in lib/popups.ts); the defaults are the Big split design.
 *
 * The words follow the visitor's offer: where a free trial is live they lead
 * with the free first generation; anywhere else they never mention a trial,
 * only the free account. When it shows, and how often, is SignupNudgeHost's
 * business.
 */
export default function SignupNudge({ p, offer, design, onClose, onGoogle, onEmail }: {
  p: PopupText;
  offer: TrialOffer | null;
  /** Overrides the design set in admin (the ?nudge= test switch). */
  design?: PopupDesign;
  onClose: () => void;
  onGoogle: () => void;
  onEmail: () => void;
}) {
  const vars: Record<string, number> = offer ? { credits: offer.credits, generations: offer.generations } : {};
  const pre = offer ? "trial" : "";
  const key = (k: string) => (pre ? pre + k[0].toUpperCase() + k.slice(1) : k);
  return (
    <PopupView
      design={design ?? (p.t("design") as PopupDesign)}
      onClose={onClose}
      content={{
        label: "Sign up free",
        badge: p.t(key("badge"), vars),
        title: p.t(key("title"), vars),
        text: p.t(key("text"), vars),
        bullets: p.list(key("bullets"), vars),
        image: p.t("image"),
        caption: p.t("caption"),
        beforeAfter: true,
        primary: { label: p.t("googleButton"), onClick: onGoogle, google: true },
        secondary: { label: p.t("emailButton"), onClick: onEmail },
        dismiss: p.t("laterButton"),
        foot: p.t("foot"),
      }}
    />
  );
}

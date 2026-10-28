"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { beginGoogleSignIn } from "@/lib/auth-return";
import { useTrialOffer } from "@/lib/trial-offer";
import { trackEvent } from "@/lib/analytics";
import { POPUP_DESIGNS, type PopupDesign } from "@/lib/popups";
import { usePopup } from "@/lib/popups.client";
import SignupNudge from "./SignupNudge";
import { popupOnScreen } from "./PopupView";
import SignInModal from "./SignInModal";

/**
 * When the sign-up popup (SignupNudge) shows: to signed-out visitors, a few
 * seconds after they land, once per visit. Closing it snoozes it for a few
 * days; signing in ends it on this browser for good. Never inside the app,
 * admin, sign-in or payment pages, and never on top of another pop-up. The
 * delay, the snooze, the design and the on/off switch are set in /admin/popups.
 *
 * `?nudge=1` shows it after a second whatever the visit, the snooze or the
 * switch, still to signed-out visitors only, so it can be tested without
 * clearing storage; `?nudge=center` (or `split`, `card`, `corner`) does the
 * same in that design.
 */

const SKIP = /^\/(app|admin|auth|invoices|m|pricing|checkout|payment)(\/|$)/;
const DAY_MS = 24 * 60 * 60 * 1000;
const SEEN = "jpt-nudge-seen"; // sessionStorage: shown this visit
const SNOOZED = "jpt-nudge-snoozed"; // localStorage: when it was last closed
const DONE = "jpt-nudge-done"; // localStorage: this browser has signed in

function read(kind: "local" | "session", key: string): string | null {
  try { return (kind === "local" ? localStorage : sessionStorage).getItem(key); } catch { return null; }
}
function write(kind: "local" | "session", key: string, value: string) {
  try { (kind === "local" ? localStorage : sessionStorage).setItem(key, value); } catch { /* private mode */ }
}

export default function SignupNudgeHost() {
  const pathname = usePathname() || "/";
  const offer = useTrialOffer();
  const p = usePopup("signup");
  const [open, setOpen] = useState(false);
  const [forced, setForced] = useState<PopupDesign | undefined>();
  const [emailOpen, setEmailOpen] = useState(false);
  const skip = SKIP.test(pathname);
  const design = forced ?? (p.t("design") as PopupDesign);

  // Signing in, here or on any page, ends the popup for this browser.
  useEffect(() => {
    const done = () => { write("local", DONE, "1"); setOpen(false); };
    window.addEventListener("jpt:signed-in", done);
    return () => window.removeEventListener("jpt:signed-in", done);
  }, []);

  useEffect(() => {
    // Wait for the admin settings; never inside a frame.
    if (skip || !p.ready || window.top !== window.self) return;
    let force = false;
    try {
      const v = new URLSearchParams(window.location.search).get("nudge");
      const asDesign = POPUP_DESIGNS.find(([d]) => d === v)?.[0];
      force = v === "1" || !!asDesign;
      if (asDesign) setForced(asDesign);
    } catch { /* no URL */ }
    if (!force) {
      if (!p.enabled || read("local", DONE) || read("session", SEEN)) return;
      const closedAt = Number(read("local", SNOOZED) || 0);
      if (closedAt && Date.now() - closedAt < Number(p.t("snoozeDays")) * DAY_MS) return;
    }
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const show = async () => {
      // Another pop-up is up: wait for it, rather than stack on top of it.
      if (popupOnScreen()) { timer = setTimeout(show, 3000); return; }
      const me = await fetch("/api/auth/google/me", { cache: "no-store" }).then((r) => r.json()).catch(() => null) as { authenticated?: boolean } | null;
      if (!alive) return;
      if (me?.authenticated) { write("local", DONE, "1"); return; }
      if (!me) return; // couldn't tell: say nothing
      write("session", SEEN, "1");
      setOpen(true);
    };
    timer = setTimeout(show, force ? 1000 : Math.max(0, Number(p.t("delay")) || 0) * 1000);
    return () => { alive = false; clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skip, pathname, p.ready, p.enabled]);

  useEffect(() => {
    if (open) trackEvent("signup_nudge_shown", { path: pathname, trial: !!offer, variant: design });
    // Once per showing, with the offer as it stood then.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const close = () => {
    setOpen(false);
    write("local", SNOOZED, String(Date.now()));
    trackEvent("signup_nudge_dismiss", { path: pathname, trial: !!offer, variant: design });
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Back to this page after signing in, without the testing switch.
  const here = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("nudge");
    return url.pathname + url.search;
  };

  if (emailOpen) return <SignInModal startWithEmail nextPath={here()} onClose={() => setEmailOpen(false)} />;
  if (!open || skip) return null;
  return (
    <SignupNudge
      p={p}
      offer={offer}
      design={design}
      onClose={close}
      onGoogle={() => {
        trackEvent("signup_nudge_google", { path: pathname, trial: !!offer, variant: design });
        void beginGoogleSignIn(here());
      }}
      onEmail={() => {
        trackEvent("signup_nudge_email", { path: pathname, trial: !!offer, variant: design });
        setOpen(false);
        setEmailOpen(true);
      }}
    />
  );
}

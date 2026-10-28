"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { beginGoogleSignIn } from "@/lib/auth-return";
import { useTrialOffer } from "@/lib/trial-offer";
import { trackEvent } from "@/lib/analytics";
import SignupNudge, { NUDGE_VARIANTS, type NudgeVariant } from "./SignupNudge";
import SignInModal from "./SignInModal";

/**
 * When the sign-up card (SignupNudge) shows: to signed-out visitors, five
 * seconds after they land, once per visit. Closing it snoozes it for three
 * days; signing in ends it on this browser for good. Never inside the app,
 * admin, sign-in or payment pages, and never on top of another dialog.
 *
 * `?nudge=1` shows it after a second whatever the visit or the snooze, still
 * to signed-out visitors only, so it can be tested without clearing storage;
 * `?nudge=center` (or `split`, `card`, `corner`) does the same with that design.
 */

/** The design visitors get (SignupNudge has the others). */
const LIVE: NudgeVariant = "corner";

const SKIP = /^\/(app|admin|auth|invoices|m|pricing|checkout|payment|nudge-preview)(\/|$)/;
const DELAY_MS = 5000;
const SNOOZE_MS = 3 * 24 * 60 * 60 * 1000;
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
  const [open, setOpen] = useState(false);
  const [variant, setVariant] = useState<NudgeVariant>(LIVE);
  const [emailOpen, setEmailOpen] = useState(false);
  const skip = SKIP.test(pathname);

  // Signing in, here or on any page, ends the nudge for this browser.
  useEffect(() => {
    const done = () => { write("local", DONE, "1"); setOpen(false); };
    window.addEventListener("jpt:signed-in", done);
    return () => window.removeEventListener("jpt:signed-in", done);
  }, []);

  useEffect(() => {
    // Not inside a frame (the design preview shows the homepage in one).
    if (skip || window.top !== window.self) return;
    let force = false;
    try {
      const v = new URLSearchParams(window.location.search).get("nudge");
      force = v === "1" || NUDGE_VARIANTS.includes(v as NudgeVariant);
      if (force && v !== "1") setVariant(v as NudgeVariant);
    } catch { /* no URL */ }
    if (!force) {
      if (read("local", DONE) || read("session", SEEN)) return;
      const closedAt = Number(read("local", SNOOZED) || 0);
      if (closedAt && Date.now() - closedAt < SNOOZE_MS) return;
    }
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const show = async () => {
      // Another dialog is up: wait for it, rather than stack on top of it.
      if (document.querySelector('[aria-modal="true"]')) { timer = setTimeout(show, 3000); return; }
      const me = await fetch("/api/auth/google/me", { cache: "no-store" }).then((r) => r.json()).catch(() => null) as { authenticated?: boolean } | null;
      if (!alive) return;
      if (me?.authenticated) { write("local", DONE, "1"); return; }
      if (!me) return; // couldn't tell: say nothing
      write("session", SEEN, "1");
      setOpen(true);
    };
    timer = setTimeout(show, force ? 1000 : DELAY_MS);
    return () => { alive = false; clearTimeout(timer); };
  }, [skip, pathname]);

  useEffect(() => {
    if (open) trackEvent("signup_nudge_shown", { path: pathname, trial: !!offer, variant });
    // Once per showing, with the offer as it stood then.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const close = () => {
    setOpen(false);
    write("local", SNOOZED, String(Date.now()));
    trackEvent("signup_nudge_dismiss", { path: pathname, trial: !!offer });
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
      variant={variant}
      offer={offer}
      onClose={close}
      onGoogle={() => {
        trackEvent("signup_nudge_google", { path: pathname, trial: !!offer, variant });
        void beginGoogleSignIn(here());
      }}
      onEmail={() => {
        trackEvent("signup_nudge_email", { path: pathname, trial: !!offer, variant });
        setOpen(false);
        setEmailOpen(true);
      }}
    />
  );
}
